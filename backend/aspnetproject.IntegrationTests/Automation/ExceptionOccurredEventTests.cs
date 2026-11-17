using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using aspnetproject.Common.Domain;
using aspnetproject.Infrastructure.Dtos.DatabaseLogs;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Automation;

// An unhandled exception, in a request or in a background job's cycle, leaves as a signed exception-occurred event.
// The route that throws on purpose is mapped only in Development, so its tests run a Development host. Seeded users sign
// in only on Testing hosts, so the administrator reads Log rows through a second, Testing host on the same database; that
// host also runs the test's job.
public class ExceptionOccurredEventTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    // Literals, not the backend's constants, so a changed name or address fails here.
    private const string ThrowingRoute     = "api/dev/throw";
    private const string EventPath         = "/webhook/exception-occurred";
    private const string EventName         = "exception-occurred";
    private const string ExceptionType     = "System.InvalidOperationException";
    private const string RequestPlace      = "GET /api/dev/throw";
    // The fingerprint names the route's template, not the address, so one failure at many ids groups as one.
    private const string RequestFingerprintPlace = "GET /api/dev/throw/{id:int?}";
    private const string JobPlace          = nameof(ThrowingJob);
    private const int    MaxStackLines     = 15;

    private const string PublisherLogsQuery = "api/admin/logs?pageSize=100&action=EventPublisher";
    private const string JobLogsQuery       = $"api/admin/logs?pageSize=100&action={nameof(ThrowingJob)}";

    // The test's own timeout for a delivery that never answers, so the test does not wait the default 3 seconds.
    private const string ShortTimeout = "00:00:00.200";

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _development;
    private readonly CustomWebApplicationFactory _testing;
    private readonly HttpClient                  _client;

    public ExceptionOccurredEventTests(DatabaseFixture dbFixture)
    {
        _dbFixture   = dbFixture;
        _development = new CustomWebApplicationFactory(
            _dbFixture, environmentName: CustomWebApplicationFactory.DevelopmentEnvironment, recordEvents: true);
        _testing     = new CustomWebApplicationFactory(_dbFixture, recordEvents: true);
        _client      = _development.CreateClient();
    }

    public Task InitializeAsync() => _dbFixture.ResetAndSeedAsync();

    // Disposing the host releases its settings-file watchers; each one holds an inotify instance, and Linux caps them per user.
    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _development.DisposeAsync();
        await _testing.DisposeAsync();
    }

    // ---------- GET /api/dev/throw ----------
    // Throws an InvalidOperationException from GET /api/dev/throw. sandro_beno (1) is the administrator who reads Log rows.

    [Fact]
    public async Task ThrowingRoute_InDevelopment_SendsOneExceptionEventWithTheEnvelopeAndData()
    {
        var before = DateTime.UtcNow;

        await _client.GetAsync(ThrowingRoute);

        var recorded = Assert.Single(_development.EventRecorder.Events);
        Assert.Equal(EventPath, recorded.Path);

        var envelope = recorded.Envelope;
        Assert.True(Guid.TryParse(envelope.GetProperty("id").GetString(), out var id));
        Assert.NotEqual(Guid.Empty, id);
        Assert.Equal(EventName, envelope.GetProperty("event").GetString());
        string occurredAt = envelope.GetProperty("occurredAt").GetString()!;
        Assert.EndsWith("Z", occurredAt);
        Assert.InRange(envelope.GetProperty("occurredAt").GetDateTime().ToUniversalTime(), before.AddSeconds(-1), DateTime.UtcNow);

        var data = recorded.Data;
        Assert.Equal(ExceptionType, data.GetProperty("exceptionType").GetString());
        Assert.Equal("Thrown on purpose, to test what an unhandled exception does", data.GetProperty("message").GetString());
        Assert.Equal("Request", data.GetProperty("placeKind").GetString());
        Assert.Equal(RequestPlace, data.GetProperty("place").GetString());
        Assert.Equal($"{ExceptionType}|{RequestFingerprintPlace}", data.GetProperty("fingerprint").GetString());

        string[] stackLines = data.GetProperty("stackTrace").GetString()!.Split('\n');
        Assert.InRange(stackLines.Length, 1, MaxStackLines);
        Assert.StartsWith("at ", stackLines[0].Trim());
    }

    [Fact]
    public async Task ThrowingRoute_InDevelopment_SendsOnlyTheEnvelopeFields()
    {
        await _client.GetAsync(ThrowingRoute);

        var recorded = Assert.Single(_development.EventRecorder.Events);
        var envelopeFields = recorded.Envelope.EnumerateObject().Select(property => property.Name);
        var dataFields     = recorded.Data.EnumerateObject().Select(property => property.Name);

        Assert.Equal(["id", "event", "occurredAt", "data"], envelopeFields);
        Assert.Equal(["exceptionType", "message", "stackTrace", "placeKind", "place", "fingerprint"], dataFields);
    }

    [Fact]
    public async Task ThrowingRoute_InDevelopment_SignsTheExactBodyWithTheSecret()
    {
        await _client.GetAsync(ThrowingRoute);

        var recorded = Assert.Single(_development.EventRecorder.Events);
        byte[] key   = Encoding.UTF8.GetBytes(CustomWebApplicationFactory.TestEventsSigningSecret);
        string expected = Convert.ToHexString(HMACSHA256.HashData(key, recorded.Body)).ToLowerInvariant();

        Assert.Equal(expected, recorded.Signature);
    }

    [Fact]
    public async Task ThrowingRoute_WithQueryString_SendsThePathWithoutIt()
    {
        await _client.GetAsync($"{ThrowingRoute}?access_token=secret-value&page=2");

        var recorded = Assert.Single(_development.EventRecorder.Events);
        Assert.Equal(RequestPlace, recorded.Data.GetProperty("place").GetString());
        Assert.DoesNotContain("access_token", Encoding.UTF8.GetString(recorded.Body));
        Assert.DoesNotContain("secret-value", Encoding.UTF8.GetString(recorded.Body));
    }

    [Fact]
    public async Task ThrowingRoute_AtTwoIdsOfOneRoute_SendsEachAddressWithOneFingerprint()
    {
        await _client.GetAsync($"{ThrowingRoute}/1");
        await _client.GetAsync($"{ThrowingRoute}/2");

        var events = _development.EventRecorder.Events;
        Assert.Equal(2, events.Count);
        Assert.Equal($"{RequestPlace}/1", events[0].Data.GetProperty("place").GetString());
        Assert.Equal($"{RequestPlace}/2", events[1].Data.GetProperty("place").GetString());
        Assert.All(events, recorded => Assert.Equal(
            $"{ExceptionType}|{RequestFingerprintPlace}", recorded.Data.GetProperty("fingerprint").GetString()));
    }

    [Fact]
    public async Task ThrowingRoute_WithEventsOn_AnswersAsWithEventsOff()
    {
        var (offStatus, offBody) = await GetThrowingRouteAnswerAsync(eventsEnabled: false);

        var response = await _client.GetAsync(ThrowingRoute);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Equal(offStatus, response.StatusCode);
        Assert.Equal(offBody, await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ThrowingRoute_WhenDeliveryFails_AnswersAsUsualAndLogsOneFailedDelivery()
    {
        var (offStatus, offBody) = await GetThrowingRouteAnswerAsync(eventsEnabled: false);
        _development.EventRecorder.Answer = RecorderAnswer.Fail;

        var response = await _client.GetAsync(ThrowingRoute);

        Assert.Equal(offStatus, response.StatusCode);
        Assert.Equal(offBody, await response.Content.ReadAsStringAsync());
        Assert.Single(_development.EventRecorder.Events);
        var log = Assert.Single(await GetLogsAsync(PublisherLogsQuery));
        Assert.False(log.Succeeded);
        Assert.Contains(EventName, log.Details);
    }

    [Fact]
    public async Task ThrowingRoute_WhenDeliveryTimesOut_AnswersAsUsualAndLogsOneFailedDelivery()
    {
        var (offStatus, offBody) = await GetThrowingRouteAnswerAsync(eventsEnabled: false);
        await using var factory = new CustomWebApplicationFactory(
            _dbFixture,
            new Dictionary<string, string?> { [CustomWebApplicationFactory.EventsTimeoutSetting] = ShortTimeout },
            CustomWebApplicationFactory.DevelopmentEnvironment,
            recordEvents: true);
        factory.EventRecorder.Answer = RecorderAnswer.TimeOut;
        using var client = factory.CreateClient();

        var response = await client.GetAsync(ThrowingRoute);

        Assert.Equal(offStatus, response.StatusCode);
        Assert.Equal(offBody, await response.Content.ReadAsStringAsync());
        Assert.Single(factory.EventRecorder.Events);
        var log = Assert.Single(await GetLogsAsync(PublisherLogsQuery));
        Assert.False(log.Succeeded);
        Assert.Contains(EventName, log.Details);
    }

    [Fact]
    public async Task ThrowingRoute_WhenDeliverySucceeds_WritesNoPublisherLog()
    {
        await _client.GetAsync(ThrowingRoute);

        Assert.Single(_development.EventRecorder.Events);
        Assert.Empty(await GetLogsAsync(PublisherLogsQuery));
    }

    [Fact]
    public async Task ThrowingRoute_WithEventsOff_RecordsNothingAndLogsNothing()
    {
        await using var factory = CreateDevelopmentHost(eventsEnabled: false);
        using var client = factory.CreateClient();

        var response = await client.GetAsync(ThrowingRoute);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
        Assert.Empty(factory.EventRecorder.Events);
        Assert.Empty(await GetLogsAsync(PublisherLogsQuery));
    }

    [Theory]
    [InlineData(CustomWebApplicationFactory.TestingEnvironment)]
    [InlineData(CustomWebApplicationFactory.ProductionEnvironment)]
    public async Task ThrowingRoute_OutsideDevelopment_IsNotFoundAndSendsNothing(string environmentName)
    {
        await using var factory = new CustomWebApplicationFactory(_dbFixture, environmentName: environmentName, recordEvents: true);
        using var client = factory.CreateClient();

        var response = await client.GetAsync(ThrowingRoute);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Empty(factory.EventRecorder.Events);
    }

    // ---------- a background job's failed cycle ----------

    [Fact]
    public async Task FailedJobCycle_SendsOneExceptionEventWithTheJobsName()
    {
        await RunThrowingJobOnceAsync();

        var recorded = Assert.Single(_testing.EventRecorder.Events);
        Assert.Equal(EventPath, recorded.Path);
        Assert.Equal(EventName, recorded.Envelope.GetProperty("event").GetString());

        var data = recorded.Data;
        Assert.Equal(ExceptionType, data.GetProperty("exceptionType").GetString());
        Assert.Equal(ThrowingJob.FailureMessage, data.GetProperty("message").GetString());
        Assert.Equal("Job", data.GetProperty("placeKind").GetString());
        Assert.Equal(JobPlace, data.GetProperty("place").GetString());
        Assert.Equal($"{ExceptionType}|{JobPlace}", data.GetProperty("fingerprint").GetString());
    }

    [Fact]
    public async Task FailedJobCycle_StillWritesTheJobsFailureLog()
    {
        await RunThrowingJobOnceAsync();

        var log = Assert.Single(await GetLogsAsync(JobLogsQuery));
        Assert.False(log.Succeeded);
        Assert.Equal($"{nameof(ThrowingJob)}.RunCycleAsync", log.Action);
        Assert.Equal(ThrowingJob.FailureMessage, log.Details);
    }

    [Fact]
    public async Task FailedJobCycle_WhenDeliveryFails_LogsOneFailedDeliveryAndSendsNoSecondEvent()
    {
        _testing.EventRecorder.Answer = RecorderAnswer.Fail;

        await RunThrowingJobOnceAsync();

        Assert.Single(_testing.EventRecorder.Events);
        Assert.Single(await GetLogsAsync(JobLogsQuery));
        var log = Assert.Single(await GetLogsAsync(PublisherLogsQuery));
        Assert.False(log.Succeeded);
    }

    // ---------- helpers ----------

    private CustomWebApplicationFactory CreateDevelopmentHost(bool eventsEnabled)
    {
        return new CustomWebApplicationFactory(
            _dbFixture,
            new Dictionary<string, string?> { [CustomWebApplicationFactory.EventsEnabledSetting] = eventsEnabled.ToString() },
            CustomWebApplicationFactory.DevelopmentEnvironment,
            recordEvents: true);
    }

    // The status and body a Development host answers the throwing route with.
    private async Task<(HttpStatusCode Status, string Body)> GetThrowingRouteAnswerAsync(bool eventsEnabled)
    {
        await using var factory = CreateDevelopmentHost(eventsEnabled);
        using var client = factory.CreateClient();

        var response = await client.GetAsync(ThrowingRoute);

        return (response.StatusCode, await response.Content.ReadAsStringAsync());
    }

    private async Task RunThrowingJobOnceAsync()
    {
        var job = new ThrowingJob(_testing.Services.GetRequiredService<IServiceScopeFactory>());
        await job.RunOnceAsync(CancellationToken.None);
    }

    // Read by the administrator on the Testing host, which shares the database with the Development host.
    private async Task<List<LogDisplayDto>> GetLogsAsync(string query)
    {
        using var adminClient = _testing.CreateClient();
        var token = await AuthTestHelper.LoginAsync(adminClient, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(adminClient, token);

        var response = await adminClient.GetAsync(query);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ListResponse<LogDisplayDto>>();
        return body!.Data;
    }
}
