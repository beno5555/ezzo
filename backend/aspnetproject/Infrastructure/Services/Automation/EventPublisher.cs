using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using aspnetproject.Common.Json;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Infrastructure.Dtos.Automation;
using aspnetproject.Infrastructure.Dtos.DatabaseLogs;
using aspnetproject.Infrastructure.Services.Automation.Configuration;
using aspnetproject.Infrastructure.Services.Logging;
using Microsoft.Extensions.Options;

namespace aspnetproject.Infrastructure.Services.Automation;

/// <summary>
/// Tells the automation that something happened: one signed POST to {BaseUrl}/webhook/{event name}, attempted once and
/// awaited (docs/backend/automation.md). It never throws, so a caller needs no guard. A delivery that fails is written to
/// the Log table and nothing else happens; in particular it never sends another event, so an n8n outage cannot loop.
/// With events off it does nothing at all.
/// </summary>
public class EventPublisher
{
    private const string JsonMediaType = "application/json";
    private const string Utf8CharSet   = "utf-8";

    // The way the API writes JSON: camelCase, enums as the text their DTOs declare, times marked UTC (ADR 0005).
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        Converters = { new UtcDateTimeJsonConverter() }
    };

    private readonly string _serviceName;

    private readonly HttpClient                    _httpClient;
    private readonly AutomationEventsConfiguration _config;
    private readonly IServiceScopeFactory          _scopeFactory;

    public EventPublisher(HttpClient httpClient, IOptions<AutomationEventsConfiguration> config, IServiceScopeFactory scopeFactory)
    {
        _serviceName = GetType().Name;

        _httpClient   = httpClient;
        _config       = config.Value;
        _scopeFactory = scopeFactory;

        _httpClient.Timeout = _config.Timeout;
    }

    public async Task PublishAsync(string eventName, object data)
    {
        if (_config.Enabled)
        {
            string? failure = await SendAsync(eventName, data);

            bool failed = failure is not null;
            if (failed)
            {
                await LogFailedDeliveryAsync(eventName, failure!);
            }
        }
    }

    // Returns why the event was not delivered, or null when the automation accepted it.
    private async Task<string?> SendAsync(string eventName, object data)
    {
        string? failure = null;

        try
        {
            var envelope = new EventEnvelopeDto
            {
                Id         = Guid.NewGuid(),
                Event      = eventName,
                // Every event is published in the method where its thing happened, so the send time stands for it.
                OccurredAt = DateTime.UtcNow,
                Data       = data
            };

            byte[] body = JsonSerializer.SerializeToUtf8Bytes(envelope, JsonOptions);

            using var request = new HttpRequestMessage(HttpMethod.Post, AddressFor(eventName));
            request.Content = new ByteArrayContent(body);
            request.Content.Headers.ContentType = new MediaTypeHeaderValue(JsonMediaType) { CharSet = Utf8CharSet };
            request.Headers.Add(Constants.EventSignatureHeader, Sign(body));

            using var response = await _httpClient.SendAsync(request);

            bool accepted = response.IsSuccessStatusCode;
            failure = accepted ? null : ResponseMessages.EventRefused((int)response.StatusCode);
        }
        catch (TaskCanceledException ex) when (ex.InnerException is TimeoutException)
        {
            failure = ResponseMessages.EventTimedOut;
        }
        catch (Exception ex)
        {
            failure = ex.Message;
        }

        return failure;
    }

    private string AddressFor(string eventName)
    {
        return $"{_config.BaseUrl.TrimEnd('/')}/{Constants.EventWebhookPathSegment}/{eventName}";
    }

    // Lower-case hex of HMAC-SHA256 over the exact bytes sent, keyed with the shared secret.
    private string Sign(byte[] body)
    {
        byte[] key = Encoding.UTF8.GetBytes(_config.SigningSecret);

        return Convert.ToHexStringLower(HMACSHA256.HashData(key, body));
    }

    // Written through a scope of its own: a caller's DbContext may still hold the changes whose save just threw (the
    // global handler's DbUpdateException), and saving the log row through it would try them again and fail.
    private async Task LogFailedDeliveryAsync(string eventName, string failure)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var dbLogger    = scope.ServiceProvider.GetRequiredService<DatabaseLogger>();

            var log = new CreateLogDto
            {
                Succeeded  = false,
                Action     = $"{_serviceName}.{nameof(PublishAsync)}",
                EntityName = null,
                EntityId   = null,
                Details    = LogDetails.FitToColumn(ResponseMessages.EventNotDelivered(eventName, failure))
            };

            await dbLogger.LogSystemActionAsync(log);
        }
        catch (Exception)
        {
            // ignored: DatabaseLogger already falls back to SystemLogger, and publishing must never throw.
        }
    }
}
