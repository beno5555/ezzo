using System.Net;
using System.Net.Http.Json;
using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Controllers;

public class AuthControllerTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthControllerTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
        _factory = new CustomWebApplicationFactory(_dbFixture);
        _client = _factory.CreateClient();
    }

    public Task InitializeAsync() => _dbFixture.ResetAndSeedAsync();
    // Disposing the host releases its settings-file watchers; each one holds an inotify instance, and Linux caps them per user.
    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsAccessTokenAndSetsRefreshCookie()
    {
        var response = await _client.PostAsJsonAsync("api/auth/login", new
        {
            UniqueIdentifier = "alice",
            Password = TestDataSeeder.SharedPlaintextPassword
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out _));

        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.False(string.IsNullOrWhiteSpace(body!.AccessToken));
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsGenericBadRequest()
    {
        var response = await _client.PostAsJsonAsync("api/auth/login", new
        {
            UniqueIdentifier = "alice",
            Password = "wrong-password"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_ForDeactivatedUser_IsRejected()
    {
        var response = await _client.PostAsJsonAsync("api/auth/login", new
        {
            
            UniqueIdentifier = "erin_deactivated",
            Password = TestDataSeeder.SharedPlaintextPassword
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ---------- POST /auth/refresh ----------
    // The refresh cookie is Secure, so the test client (plain http) never sends it back on its own;
    // tests attach the Cookie header by hand.

    [Fact]
    public async Task Refresh_WithoutRefreshCookie_ReturnsUnauthorizedEnvelope()
    {
        var response = await _client.PostAsync("api/auth/refresh", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.NoRefreshTokenProvided, body.Message);
    }

    [Fact]
    public async Task Refresh_WithInvalidRefreshToken_ReturnsUnauthorizedEnvelope()
    {
        var response = await PostRefreshAsync("not-a-real-refresh-token");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.RefreshTokenNotFound, body.Message);
    }

    [Fact]
    public async Task Refresh_WithRevokedRefreshToken_ReturnsUnauthorizedEnvelope()
    {
        var loginResponse = await _client.PostAsJsonAsync("api/auth/login", new
        {
            UniqueIdentifier = "alice",
            Password = TestDataSeeder.SharedPlaintextPassword
        });
        var refreshToken = ReadRefreshTokenCookie(loginResponse);

        var firstRefresh = await PostRefreshAsync(refreshToken); // rotates: the first token is now revoked
        var secondRefresh = await PostRefreshAsync(refreshToken);

        Assert.Equal(HttpStatusCode.OK, firstRefresh.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, secondRefresh.StatusCode);

        var body = await secondRefresh.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.RefreshTokenNotFound, body.Message);
    }

    // ---------- PUT /auth/request-password-reset ----------
    // Requests are for seeded alice@example.com. The test host trusts CustomWebApplicationFactory.TrustedFrontendOrigin and sends no real email.

    [Fact]
    public async Task RequestPasswordReset_WithAllowedRedirectUrl_ReturnsOk()
    {
        var response = await RequestPasswordResetAsync($"{CustomWebApplicationFactory.TrustedFrontendOrigin}/reset-password");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.True(body!.Succeeded);
        Assert.Equal(ResponseMessages.PasswordResetRequested, body.Message);
    }

    [Fact]
    public async Task RequestPasswordReset_WithCaseVariantOfAllowedRedirectUrl_ReturnsOk()
    {
        var response = await RequestPasswordResetAsync($"{CustomWebApplicationFactory.TrustedFrontendOrigin.ToUpperInvariant()}/reset-password");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.True(body!.Succeeded);
        Assert.Equal(ResponseMessages.PasswordResetRequested, body.Message);
    }

    [Theory]
    [InlineData("https://attacker.example/reset-password")]       // untrusted host
    [InlineData("http://frontend.webcity.test:5500/reset-password")]  // trusted host, other port
    [InlineData("https://frontend.webcity.test:4200/reset-password")] // trusted host and port, other scheme
    [InlineData("/reset-password")]                                   // not an absolute URL
    public async Task RequestPasswordReset_WithDisallowedRedirectUrl_ReturnsBadRequest(string redirectUrl)
    {
        var response = await RequestPasswordResetAsync(redirectUrl);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.UrlOriginNotAllowed, body.Message);
    }

    [Fact]
    public async Task RequestPasswordReset_WithoutRedirectUrl_ReturnsOk()
    {
        var response = await RequestPasswordResetAsync(null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.True(body!.Succeeded);
        Assert.Equal(ResponseMessages.PasswordResetRequested, body.Message);
    }

    // ---------- POST /auth/register: reserved usernames ----------

    [Theory]
    [InlineData("mine")]
    [InlineData("search")]
    [InlineData("account_deactivated")]
    [InlineData("account_deleted")]
    [InlineData("MINE")]
    [InlineData("Search")]
    [InlineData("Account_Deactivated")]
    [InlineData("ACCOUNT_DELETED")]
    public async Task Register_WithReservedUsername_ReturnsBadRequestWithUsernameTakenMessage(string username)
    {
        var response = await _client.PostAsJsonAsync("api/auth/register", new
        {
            Username = username,
            Email = "reserved_name_user@example.com",
            Password = "SomeValidPassword1!",
            DateOfBirth = new DateTime(2000, 1, 1)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.UsernameIsAlreadyTaken, body.Message);
    }

    [Theory]
    [InlineData("mine2")]
    [InlineData("searcher")]
    [InlineData("my_mine")]
    [InlineData("account_deleted1")]
    public async Task Register_WithUsernameThatOnlyContainsReservedWord_Succeeds(string username)
    {
        var response = await _client.PostAsJsonAsync("api/auth/register", new
        {
            Username = username,
            Email = $"{username}@example.com",
            Password = "SomeValidPassword1!",
            DateOfBirth = new DateTime(2000, 1, 1)
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    // ---------- POST /auth/register: username characters ----------
    // A username is an address segment (/users/:username); a dot would let it pass for a file name (bob.png).

    [Theory]
    [InlineData("john.doe")]
    [InlineData("bob.png")]
    [InlineData("alice.")]
    public async Task Register_WithDotInUsername_ReturnsBadRequest(string username)
    {
        var response = await _client.PostAsJsonAsync("api/auth/register", new
        {
            Username = username,
            Email = "dotted_name_user@example.com",
            Password = "SomeValidPassword1!",
            DateOfBirth = new DateTime(2000, 1, 1)
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private async Task<HttpResponseMessage> RequestPasswordResetAsync(string? redirectUrl)
    {
        return await _client.PutAsJsonAsync("api/auth/request-password-reset", new
        {
            Email = "alice@example.com",
            RedirectUrl = redirectUrl
        });
    }

    private async Task<HttpResponseMessage> PostRefreshAsync(string refreshToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Post, "api/auth/refresh");
        request.Headers.Add("Cookie", $"refreshToken={refreshToken}");

        return await _client.SendAsync(request);
    }

    private static string ReadRefreshTokenCookie(HttpResponseMessage loginResponse)
    {
        var setCookie = loginResponse.Headers.GetValues("Set-Cookie")
            .Single(header => header.StartsWith("refreshToken="));

        return setCookie["refreshToken=".Length..].Split(';')[0];
    }
}
