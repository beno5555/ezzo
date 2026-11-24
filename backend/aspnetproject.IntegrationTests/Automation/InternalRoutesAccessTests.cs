using System.Net;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// Who may call the routes under /api/internal, and how often. Only the automation's key opens them: no key, a wrong key, a
// user's token and an administrator's token all get 401. sandro_beno (1) is the only administrator; alice (2) is an ordinary user.
public class InternalRoutesAccessTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string WrongKey = "not-the-automation-key";

    private const string BirthdaysUrl     = "api/internal/birthdays?date=2026-01-01";
    private const string NotificationsUrl = "api/internal/notifications";

    private const int AliceId = 2;
    private const int DianaId = 5;

    // alice is told that it is diana's birthday.
    private static readonly object BirthdayOfDiana = new
    {
        RecipientIds = new[] { AliceId },
        Kind         = "BIRTHDAY",
        Data         = new { Friends = new[] { new { Id = DianaId, Username = "diana" } } }
    };

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public InternalRoutesAccessTests(DatabaseFixture dbFixture)
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

    private async Task SignInAsync(string username)
    {
        var token = await AuthTestHelper.LoginAsync(_client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
    }

    private Task<HttpResponseMessage> SendAsync(string route, string? apiKey)
    {
        bool isBirthdays = route == BirthdaysUrl;

        return isBirthdays
            ? _client.SendWithApiKeyAsync(HttpMethod.Get, BirthdaysUrl, apiKey: apiKey)
            : _client.SendWithApiKeyAsync(HttpMethod.Post, NotificationsUrl, BirthdayOfDiana, apiKey);
    }

    // ---------- only the key ----------

    [Theory]
    [InlineData(BirthdaysUrl)]
    [InlineData(NotificationsUrl)]
    public async Task InternalRoute_WithTheKey_IsAnswered(string route)
    {
        var response = await SendAsync(route, CustomWebApplicationFactory.TestApiKey);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData(BirthdaysUrl, null)]
    [InlineData(BirthdaysUrl, WrongKey)]
    [InlineData(NotificationsUrl, null)]
    [InlineData(NotificationsUrl, WrongKey)]
    public async Task InternalRoute_WithoutOrWithAWrongKey_ReturnsUnauthorized(string route, string? apiKey)
    {
        var response = await SendAsync(route, apiKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData(BirthdaysUrl, "alice")]
    [InlineData(BirthdaysUrl, "sandro_beno")]
    [InlineData(NotificationsUrl, "alice")]
    [InlineData(NotificationsUrl, "sandro_beno")]
    public async Task InternalRoute_WithAUsersOrAnAdministratorsToken_ReturnsUnauthorized(string route, string username)
    {
        await SignInAsync(username);

        var response = await SendAsync(route, apiKey: null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ---------- each route has its own policy ----------
    // Both count in the automation's bucket, so a shared policy would be used up by either route.

    [Theory]
    [InlineData(BirthdaysUrl, NotificationsUrl)]
    [InlineData(NotificationsUrl, BirthdaysUrl)]
    public async Task InternalRoute_WhenItsLimitIsExhausted_LeavesTheOtherRouteOpen(string exhaustedRoute, string otherRoute)
    {
        var lastResponse = await RateLimitExhaustHelper.ExhaustAsync(
            () => SendAsync(exhaustedRoute, CustomWebApplicationFactory.TestApiKey), HttpStatusCode.OK);

        var otherResponse = await SendAsync(otherRoute, CustomWebApplicationFactory.TestApiKey);

        Assert.Equal(HttpStatusCode.TooManyRequests, lastResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, otherResponse.StatusCode);
    }
}
