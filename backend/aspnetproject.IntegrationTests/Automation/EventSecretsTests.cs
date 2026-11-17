using System.Net;
using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using aspnetproject.Data;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.IntegrationTests.Automation;

// No event carries a secret (ADR 0008). The registration, password reset and reactivation flows issue tokens, and the
// content and report actions run beside them; every body recorded after all of them is then searched.
// The tokens themselves are emailed, and email is off in tests, so a raw token cannot be read back. A token has a shape
// instead (64 random bytes as URL-safe text: 86 characters, as is a JWT's signature), and so do the stored hashes, which
// are read from the database.
public class EventSecretsTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    // Shorter than any token, longer than any text a body should hold, and cut at "/" so an image address does not count.
    private static readonly Regex TokenShape = new("[A-Za-z0-9_-]{40,}", RegexOptions.Compiled);

    private const string JwtPrefix = "eyJ";

    private const string NewPassword = "AnotherSecret123!";

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public EventSecretsTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
        _factory   = new CustomWebApplicationFactory(_dbFixture, recordEvents: true);
        _client    = _factory.CreateClient();
    }

    public Task InitializeAsync() => _dbFixture.ResetAndSeedAsync();

    // Disposing the host releases its settings-file watchers; each one holds an inotify instance, and Linux caps them per user.
    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    [Fact]
    public void TokenShape_ForARealTokenAndALongString_Matches()
    {
        string token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        Assert.Matches(TokenShape, token);
        Assert.Matches(TokenShape, new string('a', 86));
    }

    [Fact]
    public async Task Events_AfterRegistrationResetAndReactivationFlows_ContainNoTokenHashOrPassword()
    {
        // Registration: a new account, then an attempt with a registered email (which issues a reset token and emails it).
        var registered = await _client.PostAsJsonAsync("api/auth/register", Registration("newcomer", "newcomer@example.com"));
        Assert.Equal(HttpStatusCode.Created, registered.StatusCode);
        var taken = await _client.PostAsJsonAsync("api/auth/register", Registration("another", "alice@example.com"));
        Assert.Equal(HttpStatusCode.BadRequest, taken.StatusCode);

        // Password reset: a token is issued for alice (email is off, so the token is not readable and is never consumed here).
        var reset = await _client.PutAsJsonAsync("api/auth/request-password-reset", new { Email = "alice@example.com" });
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);

        // Reactivation: erin asks for a token, then the administrator reactivates her.
        var activation = await _client.PatchAsJsonAsync("api/accounts/request-activate", new { Email = "erin@example.com" });
        Assert.Equal(HttpStatusCode.OK, activation.StatusCode);

        string adminToken = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, adminToken);
        var reactivated = await _client.PatchAsync("api/accounts/6/activate", null); // erin_deactivated
        Assert.True(reactivated.IsSuccessStatusCode);
        var created = await _client.PostAsJsonAsync("api/users", Registration("madebyadmin", "madebyadmin@example.com"));
        Assert.Equal(HttpStatusCode.OK, created.StatusCode);

        // Content and a report, sent as a user who is signed in with a token of their own.
        string userToken = await AuthTestHelper.LoginAsync(_client, "diana", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, userToken);
        await _client.PostAsync("api/posts", PostForm.Create("Diana's Album", "Photos", ImageFormFiles.Png(1)));
        await _client.PostAsJsonAsync("api/comments/posts/2", new { Content = "A comment" }); // on bob's post 2
        await _client.PostAsJsonAsync("api/reports", new { TargetType = "User", TargetId = 3, Reason = "Spam" }); // bob

        var events = _factory.EventRecorder.Events;
        string[] expectedPaths =
        [
            "/webhook/account-created", "/webhook/account-created", "/webhook/post-created",
            "/webhook/comment-created", "/webhook/report-created"
        ];
        Assert.Equal(expectedPaths, events.Select(recorded => recorded.Path));

        var bodies = events.Select(recorded => Encoding.UTF8.GetString(recorded.Body)).ToList();
        var secrets = await StoredSecretsAsync();
        secrets.Add(TestDataSeeder.SharedPlaintextPassword);
        secrets.Add(NewPassword);
        secrets.Add(adminToken);
        secrets.Add(userToken);

        Assert.All(bodies, body =>
        {
            Assert.DoesNotMatch(TokenShape, body);
            Assert.DoesNotContain(JwtPrefix, body);
            Assert.DoesNotContain("password", body, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("token", body, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("hash", body, StringComparison.OrdinalIgnoreCase);
            Assert.All(secrets, secret => Assert.DoesNotContain(secret, body));
        });
    }

    // ---------- helpers ----------

    private static object Registration(string username, string email)
    {
        return new
        {
            Username    = username,
            Email       = email,
            Password    = NewPassword,
            DateOfBirth = "2000-08-16T10:10:23.546Z"
        };
    }

    // Every password hash, salt and reset-token hash in the database, accounts in any state.
    private async Task<List<string>> StoredSecretsAsync()
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());

        var users = await db.Users.IgnoreQueryFilters().AsNoTracking().ToListAsync();

        return users
            .SelectMany(user => new[] { user.PasswordHash, user.PasswordSalt, user.ResetTokenHash })
            .Where(secret => !string.IsNullOrEmpty(secret))
            .Select(secret => secret!)
            .Distinct()
            .ToList();
    }
}
