using System.Net;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// What the API key opens, and what it does not. sandro_beno (1) is the only administrator; alice (2) is an ordinary user.
// A request that carries only the key must get 401 on every route that does not name the key's scheme.
// An empty key sent through this host's in-memory transport arrives as a missing header (the transport drops empty values), so
// the empty header itself is covered in Security/AutomationKeyValidatorTests.
public class AutomationApiKeyAuthenticationTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string WrongKey = "not-the-automation-key";

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AutomationApiKeyAuthenticationTests(DatabaseFixture dbFixture)
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

    // ---------- the key alone gets nothing outside the moderation routes ----------
    // Ordinary routes first, then administrator routes, among them the ones that deactivate, delete and promote an account.
    // The ids are alice's (2); a request that got through authorization would act on her.

    [Theory]
    [InlineData("GET",    "api/users/mine")]
    [InlineData("PUT",    "api/users/mine")]
    [InlineData("GET",    "api/posts/feed")]
    [InlineData("POST",   "api/posts")]
    [InlineData("GET",    "api/friendships/accepted")]
    [InlineData("GET",    "api/messages/conversations/unread")]
    [InlineData("DELETE", "api/accounts/mine")]
    [InlineData("PATCH",  "api/accounts/mine/deactivate")]
    public async Task OrdinaryRoute_WithOnlyTheKey_ReturnsUnauthorized(string method, string url)
    {
        var response = await _client.SendWithApiKeyAsync(new HttpMethod(method), url);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("GET",    "api/admin/logs")]
    [InlineData("GET",    "api/admin/statistics")]
    [InlineData("GET",    "api/admin/users")]
    [InlineData("GET",    "api/admin/moderation-queue/posts")]
    [InlineData("GET",    "api/admin/moderation-queue/comments")]
    [InlineData("GET",    "api/reports")]
    [InlineData("POST",   "api/users")]
    [InlineData("PUT",    "api/users/2")]
    [InlineData("PATCH",  "api/accounts/2/deactivate")]
    [InlineData("PATCH",  "api/accounts/2/activate")]
    [InlineData("DELETE", "api/accounts/2")]
    [InlineData("PUT",    "api/accounts/2/assign-administrator")]
    [InlineData("PUT",    "api/accounts/2/remove-administrator")]
    public async Task AdministratorRoute_WithOnlyTheKey_ReturnsUnauthorized(string method, string url)
    {
        var response = await _client.SendWithApiKeyAsync(new HttpMethod(method), url);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // The same requests, with the key on a signed-in ordinary user: the key adds nothing to a token on these routes.
    [Theory]
    [InlineData("PATCH",  "api/accounts/2/deactivate")]
    [InlineData("DELETE", "api/accounts/2")]
    [InlineData("PUT",    "api/accounts/2/assign-administrator")]
    [InlineData("GET",    "api/admin/logs")]
    public async Task AdministratorRoute_WithOrdinaryUsersTokenAndTheKey_ReturnsForbidden(string method, string url)
    {
        await SignInAsync("alice");

        var response = await _client.SendWithApiKeyAsync(new HttpMethod(method), url);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ---------- a key that is wrong, empty or missing is refused on the moderation routes ----------

    [Theory]
    [InlineData("posts",    WrongKey)]
    [InlineData("posts",    "")]
    [InlineData("posts",    null)]
    [InlineData("posts",    CustomWebApplicationFactory.TestApiKey + " ")]
    [InlineData("posts",    "test-automation-api")]
    [InlineData("comments", WrongKey)]
    [InlineData("comments", "")]
    [InlineData("comments", null)]
    public async Task SetStatus_WithWrongEmptyOrMissingKey_ReturnsUnauthorized(string kind, string? apiKey)
    {
        var response = await _client.SendWithApiKeyAsync(
            HttpMethod.Put, $"api/admin/{kind}/1/moderation", new { Status = nameof(ModerationStatus.Hidden) }, apiKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // A wrong key does not change who the caller is: an ordinary user's token still gets 403 here.
    [Fact]
    public async Task SetStatus_WithWrongKeyAndOrdinaryUsersToken_ReturnsForbidden()
    {
        await SignInAsync("alice");

        var response = await _client.SendWithApiKeyAsync(
            HttpMethod.Put, "api/admin/posts/1/moderation", new { Status = nameof(ModerationStatus.Hidden) }, WrongKey);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ---------- a host with no key configured ----------

    [Theory]
    [InlineData("")]
    [InlineData(CustomWebApplicationFactory.TestApiKey)]
    [InlineData(null)]
    public async Task SetStatus_OnHostWithNoKeyConfigured_RefusesEveryKey(string? apiKey)
    {
        var settings = new Dictionary<string, string?> { [CustomWebApplicationFactory.AutomationApiKeySetting] = string.Empty };
        await using var factory = new CustomWebApplicationFactory(_dbFixture, settings);
        using var client        = factory.CreateClient();

        var response = await client.SendWithApiKeyAsync(
            HttpMethod.Put, "api/admin/posts/1/moderation", new { Status = nameof(ModerationStatus.Hidden) }, apiKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task InternalRoute_OnHostWithNoKeyConfigured_RefusesAnEmptyKey()
    {
        var settings = new Dictionary<string, string?> { [CustomWebApplicationFactory.AutomationApiKeySetting] = string.Empty };
        await using var factory = new CustomWebApplicationFactory(_dbFixture, settings);
        using var client        = factory.CreateClient();

        var response = await client.SendWithApiKeyAsync(HttpMethod.Get, AutomationOnlyProbeController.RouteTemplate, apiKey: string.Empty);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ---------- the rule for routes under /api/internal ----------
    // Tested on a route that exists only in the test host (AutomationOnlyProbeController).

    [Fact]
    public async Task InternalRoute_WithTheKey_ReturnsOk()
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, AutomationOnlyProbeController.RouteTemplate);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Theory]
    [InlineData(WrongKey)]
    [InlineData("")]
    [InlineData(null)]
    public async Task InternalRoute_WithWrongEmptyOrMissingKey_ReturnsUnauthorized(string? apiKey)
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, AutomationOnlyProbeController.RouteTemplate, apiKey: apiKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("alice")]
    [InlineData("sandro_beno")]
    public async Task InternalRoute_WithATokenAndNoKey_ReturnsUnauthorized(string username)
    {
        await SignInAsync(username);

        var response = await _client.GetAsync(AutomationOnlyProbeController.RouteTemplate);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // An administrator gets nothing here that the key does not give: no key, no entry.
    [Fact]
    public async Task InternalRoute_WithAdministratorsTokenAndWrongKey_ReturnsUnauthorized()
    {
        await SignInAsync("sandro_beno");

        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, AutomationOnlyProbeController.RouteTemplate, apiKey: WrongKey);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
