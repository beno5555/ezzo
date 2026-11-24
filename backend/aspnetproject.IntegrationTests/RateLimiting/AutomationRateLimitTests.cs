using System.Net;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.RateLimiting;

// The automation's requests are counted in one bucket of their own, not by the caller's address. Every request from the test
// client has the same address (see RateLimitPartitionTests), so a request that shared the address bucket would see the other's
// requests. The moderation routes are the ones the key opens, so the tests use post 1's route: AdminModeratePost, per user.
public class AutomationRateLimitTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string ModeratePostUrl = "api/admin/posts/1/moderation";
    private const string WrongKey        = "not-the-automation-key";

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AutomationRateLimitTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
        _factory   = new CustomWebApplicationFactory(_dbFixture);
        _client    = _factory.CreateClient();
    }

    public Task InitializeAsync() => _dbFixture.ResetAndSeedAsync();

    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    private Task<HttpResponseMessage> FlagAsAutomationAsync() =>
        _client.SendWithApiKeyAsync(HttpMethod.Put, ModeratePostUrl, new { Status = nameof(ModerationStatus.Flagged) });

    private Task<HttpResponseMessage> FlagWithKeyAsync(string? apiKey) =>
        _client.SendWithApiKeyAsync(HttpMethod.Put, ModeratePostUrl, new { Status = nameof(ModerationStatus.Flagged) }, apiKey);

    // Callers with no valid key count against the address, so a guest and a wrong key use up the address bucket (and are
    // rejected with 429 once it is empty, even though they would get 401).
    [Theory]
    [InlineData(null)]
    [InlineData(WrongKey)]
    public async Task SetStatus_WhenTheAddressBucketIsExhausted_StillAllowsTheAutomation(string? callerKey)
    {
        var lastCallerResponse = await RateLimitExhaustHelper.ExhaustAsync(() => FlagWithKeyAsync(callerKey), HttpStatusCode.Unauthorized);

        var automationResponse = await FlagAsAutomationAsync();

        Assert.Equal(HttpStatusCode.TooManyRequests, lastCallerResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, automationResponse.StatusCode);
    }

    [Fact]
    public async Task SetStatus_WhenTheAutomationsBucketIsExhausted_StillLetsAnotherCallerFromTheSameAddressBeAnswered()
    {
        var lastAutomationResponse = await RateLimitExhaustHelper.ExhaustAsync(FlagAsAutomationAsync, HttpStatusCode.OK);

        var guestResponse = await FlagWithKeyAsync(null);

        Assert.Equal(HttpStatusCode.TooManyRequests, lastAutomationResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, guestResponse.StatusCode);
    }

    // The bucket is the automation's, not the key's holder's per route: it is one identity, so the same budget applies on any
    // route it calls, and a request made with the key but refused for its content still counts.
    [Fact]
    public async Task SetStatus_ForRequestsTheAutomationIsRefused_CountsThemInItsBucket()
    {
        var lastRefusedResponse = await RateLimitExhaustHelper.ExhaustAsync(
            () => _client.SendWithApiKeyAsync(HttpMethod.Put, ModeratePostUrl, new { Status = nameof(ModerationStatus.Visible) }),
            HttpStatusCode.Forbidden);

        Assert.Equal(HttpStatusCode.TooManyRequests, lastRefusedResponse.StatusCode);
    }
}
