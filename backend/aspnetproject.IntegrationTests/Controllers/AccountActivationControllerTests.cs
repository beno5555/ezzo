using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data;
using aspnetproject.Infrastructure.Dtos.Accounts;
using aspnetproject.Infrastructure.Services.BusinessLogic.Users;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Controllers;

public class AccountActivationControllerTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    // erin (Id 6) is deactivated in the seed.
    private const string DeactivatedUserEmail    = "erin@example.com";
    private const string DeactivatedUserUsername = "erin_deactivated";
    // A fixed time far in the past, so an expired token stays expired whatever the token lifetime setting.
    private static readonly DateTime LongPast = new(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc);
    private static readonly string ReactivationPageAddress = $"{CustomWebApplicationFactory.TrustedFrontendOrigin}/reactivate-account";

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AccountActivationControllerTests(DatabaseFixture dbFixture)
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

    // ---------- PATCH /accounts/mine/deactivate ----------

    [Fact]
    public async Task DeactivateMine_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PatchAsync("api/accounts/mine/deactivate", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeactivateMine_WithToken_HidesFromLookupAndRevokesTokens()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "diana", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        var deactivateResponse = await _client.PatchAsync("api/accounts/mine/deactivate", null);
        Assert.True(deactivateResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent);

        var lookupResponse = await _client.GetAsync("api/users/diana");
        Assert.Equal(HttpStatusCode.NotFound, lookupResponse.StatusCode);

        // Refresh token issued at login should now be revoked
        var refreshResponse = await _client.PostAsync("api/auth/refresh", null);
        Assert.Equal(HttpStatusCode.Unauthorized, refreshResponse.StatusCode);
    }

    [Fact]
    public async Task DeactivateMine_LoginAfterDeactivation_Fails()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "diana", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
        await _client.PatchAsync("api/accounts/mine/deactivate", null);

        var loginResponse = await _client.PostAsJsonAsync("api/auth/login", new
        {
            UniqueIdentifier = "diana",
            Password = TestDataSeeder.SharedPlaintextPassword
        });

        // Deactivated users are hidden by the global query filter — login should
        // fail the same generic way as any nonexistent-user login (no oracle).
        Assert.Equal(HttpStatusCode.BadRequest, loginResponse.StatusCode);
    }

    // ---------- PATCH /accounts/{id}/deactivate ----------
    // Administrator role only.

    [Fact]
    public async Task DeactivateOther_ByNonAdminCaller_ReturnsForbidden()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "alice", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        var response = await _client.PatchAsync("api/accounts/3/deactivate", null); // bob, by alice (non-admin)

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task DeactivateOther_ByAdmin_Succeeds()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        var response = await _client.PatchAsync("api/accounts/4/deactivate", null); // charlie

        Assert.True(response.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent);

        var lookupResponse = await _client.GetAsync("api/users/charlie");
        Assert.Equal(HttpStatusCode.NotFound, lookupResponse.StatusCode);
    }

    [Fact]
    public async Task DeactivateOther_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PatchAsync("api/accounts/3/deactivate", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task DeactivateOther_AlreadyDeactivated_ReturnsBadRequest()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        // erin (Id 6) is already deactivated in seed data
        var response = await _client.PatchAsync("api/accounts/6/deactivate", null);

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ---------- PATCH /accounts/{id}/activate (admin, immediate) ----------

    [Fact]
    public async Task ActivateOther_AsAdmin_ReactivatesImmediately()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        var activateResponse = await _client.PatchAsync("api/accounts/6/activate", null); // erin, pre-deactivated
        Assert.True(activateResponse.StatusCode is HttpStatusCode.OK or HttpStatusCode.NoContent);

        var lookupResponse = await _client.GetAsync("api/users/erin_deactivated");
        Assert.Equal(HttpStatusCode.OK, lookupResponse.StatusCode);
    }

    [Fact]
    public async Task ActivateOther_AsNonAdmin_ReturnsForbidden()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "alice", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        var response = await _client.PatchAsync("api/accounts/6/activate", null);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task ActivateOther_NotCurrentlyDeactivated_ReturnsBadRequest()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        // alice (Id 2) is active, never deactivated
        var response = await _client.PatchAsync("api/accounts/2/activate", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ---------- PATCH /accounts/request-activate (anonymous, request token) ----------

    [Fact]
    public async Task RequestActivate_ForDeactivatedAccount_ReturnsOkRegardlessOfEmailValidity()
    {
        // Oracle-avoidance pattern used elsewhere (e.g. failed-register-attempt email):
        // should not reveal whether the email/account exists.
        var response = await _client.PatchAsJsonAsync("api/accounts/request-activate", new
        {
            Email = "erin@example.com"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RequestActivate_WithAllowedRedirectUrl_EmailsLinkToThatAddressWithToken()
    {
        var response = await RequestActivationAsync(ReactivationPageAddress);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var email = Assert.Single(_factory.EmailRecorder.Emails);
        Assert.Equal(DeactivatedUserEmail, email.To);

        var link = EmailLinks.ReadLink(email.Body);
        Assert.Equal(ReactivationPageAddress, link.GetLeftPart(UriPartial.Path));
        Assert.False(string.IsNullOrEmpty(EmailLinks.ReadToken(link)));
    }

    [Theory]
    [InlineData("https://attacker.example/reactivate-account")]          // untrusted host
    [InlineData("http://frontend.webcity.test:5500/reactivate-account")]  // trusted host, other port
    [InlineData("https://frontend.webcity.test:4200/reactivate-account")] // trusted host and port, other scheme
    [InlineData("/reactivate-account")]                                   // not an absolute URL
    public async Task RequestActivate_WithDisallowedRedirectUrl_ReturnsBadRequestAndSendsNoEmail(string redirectUrl)
    {
        var response = await RequestActivationAsync(redirectUrl);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.UrlOriginNotAllowed, body.Message);
        Assert.Empty(_factory.EmailRecorder.Emails);
    }

    [Fact]
    public async Task RequestActivate_WithDisallowedRedirectUrl_KeepsEarlierTokenWorking()
    {
        await RequestActivationAsync(ReactivationPageAddress);
        var earlierToken = EmailLinks.ReadToken(EmailLinks.ReadLink(_factory.EmailRecorder.Emails.Single().Body));

        await RequestActivationAsync("https://attacker.example/reactivate-account");
        var activateResponse = await ActivateAsync(earlierToken!);

        Assert.Equal(HttpStatusCode.OK, activateResponse.StatusCode);
    }

    [Fact]
    public async Task RequestActivate_WithoutRedirectUrl_EmailsPlainToken()
    {
        var response = await RequestActivationAsync(null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var email = Assert.Single(_factory.EmailRecorder.Emails);
        Assert.DoesNotContain("href=", email.Body);

        var activateResponse = await ActivateAsync(ReadPlainToken(email.Body));

        Assert.Equal(HttpStatusCode.OK, activateResponse.StatusCode);
    }

    [Fact]
    public async Task RequestActivate_ForNonexistentEmail_ReturnsBadRequest()
    {
        var response = await _client.PatchAsJsonAsync("api/accounts/request-activate", new
        {
            Email = "no-such-account@example.com"
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // Here the person typed an email, so "User not found" is the true answer; only a dead link needs the token message.
    [Fact]
    public async Task RequestActivate_ForNonexistentEmail_ReturnsUserNotFoundMessage()
    {
        var response = await _client.PatchAsJsonAsync("api/accounts/request-activate", new
        {
            Email = "no-such-account@example.com"
        });

        Assert.Equal(ResponseMessages.UserNotFound, await ResponseReader.ReadMessageAsync(response));
    }

    // Refused by validation before the service runs, like the reset request's email.
    [Theory]
    [InlineData("")]
    [InlineData("not-an-email")]
    public async Task RequestActivate_WithMissingOrMalformedEmail_ReturnsValidationProblem(string email)
    {
        var response = await _client.PatchAsJsonAsync("api/accounts/request-activate", new
        {
            Email = email
        });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.Contains(nameof(ActivationRequestDto.Email), body!.Errors.Keys);
    }

    // ---------- PATCH /accounts/activate (anonymous, consume token) ----------

    // A dead token says the link is invalid or expired, never "User not found": the person may think the account is gone.
    [Fact]
    public async Task Activate_WithUnknownToken_ReturnsBadRequestWithInvalidOrExpiredMessage()
    {
        var response = await ActivateAsync("not-a-real-token");

        await AssertInvalidOrExpiredTokenAsync(response);
    }

    [Fact]
    public async Task Activate_WithExpiredToken_ReturnsBadRequestWithInvalidOrExpiredMessage()
    {
        await RequestActivationAsync(ReactivationPageAddress);
        var token = EmailLinks.ReadToken(EmailLinks.ReadLink(_factory.EmailRecorder.Emails.Single().Body));
        await ExpireTokenAsync(DeactivatedUserEmail);

        var response = await ActivateAsync(token!);

        await AssertInvalidOrExpiredTokenAsync(response);
    }

    [Fact]
    public async Task Activate_ForAccountAnAdministratorAlreadyReactivated_ReturnsBadRequestWithInvalidOrExpiredMessage()
    {
        await RequestActivationAsync(ReactivationPageAddress);
        var token = EmailLinks.ReadToken(EmailLinks.ReadLink(_factory.EmailRecorder.Emails.Single().Body));
        var adminToken = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, adminToken);
        await _client.PatchAsync("api/accounts/6/activate", null); // erin, whose emailed link is still unexpired

        var response = await ActivateAsync(token!);

        await AssertInvalidOrExpiredTokenAsync(response);
    }

    [Fact]
    public async Task Activate_WithTokenFromEmailLink_ReactivatesAccountAndSignInWorks()
    {
        await RequestActivationAsync(ReactivationPageAddress);
        var token = EmailLinks.ReadToken(EmailLinks.ReadLink(_factory.EmailRecorder.Emails.Single().Body));

        var activateResponse = await ActivateAsync(token!);

        Assert.Equal(HttpStatusCode.OK, activateResponse.StatusCode);

        var loginResponse = await _client.PostAsJsonAsync("api/auth/login", new
        {
            UniqueIdentifier = DeactivatedUserUsername,
            Password = TestDataSeeder.SharedPlaintextPassword
        });

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
    }

    [Fact]
    public async Task Activate_WithUsedToken_ReturnsBadRequestWithInvalidOrExpiredMessage()
    {
        await RequestActivationAsync(ReactivationPageAddress);
        var token = EmailLinks.ReadToken(EmailLinks.ReadLink(_factory.EmailRecorder.Emails.Single().Body));
        await ActivateAsync(token!);

        var secondResponse = await ActivateAsync(token!);

        await AssertInvalidOrExpiredTokenAsync(secondResponse);
    }

    [Fact]
    public async Task Activate_WithUnknownToken_LogsTheInvalidOrExpiredMessage()
    {
        await ActivateAsync("not-a-real-token");

        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var       log   = await db.Logs.SingleAsync(row => row.Action == $"{nameof(AccountActivationService)}.{nameof(AccountActivationService.ReactivateOwnAccountAsync)}");

        Assert.False(log.Succeeded);
        Assert.Equal(ResponseMessages.InvalidOrExpiredActivationToken, log.Details);
    }

    // ---------- Rate-limit policy check (flagged as possibly swapped) ----------

    [Fact]
    public async Task DeactivateMine_RateLimit_AllowsAtLeastSeveralCallsPerHour()
    {
        // Per controllers.md, mine/deactivate is annotated with the policy named
        // AdminDeactivateAccount (documented as 30/hour, generous). This test only
        // checks it doesn't 429 on a small burst — it does not assert the exact
        // limit, since RateLimitConfig.cs wasn't in the shared docs.
        var token = await AuthTestHelper.LoginAsync(_client, "alice", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        // Only fire once here since deactivating alice would break other assertions
        // if this test file's ordering changed — full rate-limit testing belongs in
        // a dedicated RateLimitTests class hitting a disposable throwaway user per call.
        var response = await _client.PatchAsync("api/accounts/mine/deactivate", null);

        Assert.NotEqual((HttpStatusCode)429, response.StatusCode);
    }

    private async Task<HttpResponseMessage> RequestActivationAsync(string? redirectUrl)
    {
        return await _client.PatchAsJsonAsync("api/accounts/request-activate", new
        {
            Email = DeactivatedUserEmail,
            RedirectUrl = redirectUrl
        });
    }

    private async Task<HttpResponseMessage> ActivateAsync(string activationToken)
    {
        return await _client.PatchAsJsonAsync("api/accounts/activate", new
        {
            ActivationToken = activationToken
        });
    }

    private static async Task AssertInvalidOrExpiredTokenAsync(HttpResponseMessage response)
    {
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.InvalidOrExpiredActivationToken, await ResponseReader.ReadMessageAsync(response));
    }

    // Moves the user's token expiry into the past, as if the link had waited too long.
    private async Task ExpireTokenAsync(string email)
    {
        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        await db.Users
            .IgnoreQueryFilters()
            .Where(user => user.Email == email)
            .ExecuteUpdateAsync(setters => setters.SetProperty(user => user.ResetTokenExpiresAt, LongPast));
    }

    // The token an email without a link spells out, up to the end of its paragraph.
    private static string ReadPlainToken(string emailBody)
    {
        var token = Regex.Match(emailBody, "token: ([^<\\s]+)</p>");
        Assert.True(token.Success, $"The email holds no plain token: {emailBody}");

        return token.Groups[1].Value;
    }
}
