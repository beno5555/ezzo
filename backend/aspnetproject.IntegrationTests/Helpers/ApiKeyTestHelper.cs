using System.Net.Http.Json;

namespace aspnetproject.IntegrationTests.Helpers;

// Sends a request as the automation does: the key in the X-Api-Key header, no token.
public static class ApiKeyTestHelper
{
    // A literal on purpose, not Constants.AutomationApiKeyHeader: the tests pin the name n8n sends on the wire.
    public const string ApiKeyHeader = "X-Api-Key";

    // apiKey is the test host's key unless the test passes another one; null leaves the header out, "" sends it empty.
    // The client's own default headers still apply, so a test that signed in sends the token as well.
    public static async Task<HttpResponseMessage> SendWithApiKeyAsync(
        this HttpClient client,
        HttpMethod      method,
        string          url,
        object?         body   = null,
        string?         apiKey = CustomWebApplicationFactory.TestApiKey
        )
    {
        using var request = new HttpRequestMessage(method, url);

        if (apiKey is not null)
        {
            request.Headers.TryAddWithoutValidation(ApiKeyHeader, apiKey);
        }

        if (body is not null)
        {
            request.Content = JsonContent.Create(body);
        }

        return await client.SendAsync(request);
    }
}
