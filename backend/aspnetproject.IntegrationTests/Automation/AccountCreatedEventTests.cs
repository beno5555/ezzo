using System.Net;
using System.Net.Http.Json;
using aspnetproject.Infrastructure.Dtos.Users;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// A successful registration, or an administrator creating an account, leaves as a signed account-created event.
// Callers: sandro_beno (1) is the administrator; alice (2) is an ordinary user with the email alice@example.com.
public class AccountCreatedEventTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string EventName = "account-created";

    private const string NewUsername = "newcomer";
    private const string NewEmail    = "newcomer@example.com";

    private static readonly string[] DataFields = ["userId", "username", "email"];

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public AccountCreatedEventTests(DatabaseFixture dbFixture)
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

    // ---------- POST /auth/register ----------

    [Fact]
    public async Task Register_WithNewUsernameAndEmail_SendsAccountCreatedWithIdUsernameAndEmail()
    {
        var before = DateTime.UtcNow;

        var response = await RegisterAsync(_client, NewUsername, NewEmail);
        var user     = await ResponseReader.ReadDataAsync<FullUserDto>(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        EventAssert.IsEnvelopeOf(recorded, EventName, before, DataFields);
        Assert.Equal(user.Id, recorded.Data.GetProperty("userId").GetInt32());
        Assert.Equal(NewUsername, recorded.Data.GetProperty("username").GetString());
        Assert.Equal(NewEmail, recorded.Data.GetProperty("email").GetString());
    }

    [Fact]
    public async Task Register_WithTakenUsername_SendsNoEvent()
    {
        var response = await RegisterAsync(_client, "alice", NewEmail);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Register_WithReservedUsername_SendsNoEvent()
    {
        var response = await RegisterAsync(_client, "search", NewEmail);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // The failed attempt emails the address's owner from the backend (a reset token), and tells the automation nothing.
    [Fact]
    public async Task Register_WithRegisteredEmail_SendsNoEvent()
    {
        var response = await RegisterAsync(_client, NewUsername, "alice@example.com");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Register_WithInvalidBody_SendsNoEvent()
    {
        var response = await _client.PostAsJsonAsync("api/auth/register", new { Username = NewUsername });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- POST /users (administrator creates an account) ----------

    [Fact]
    public async Task CreateUser_ByAdministrator_SendsAccountCreatedWithIdUsernameAndEmail()
    {
        var before = DateTime.UtcNow;
        await SignInAsync(_client, "sandro_beno");

        var response = await RegisterThroughAdminAsync(NewUsername, NewEmail);
        var user     = await ResponseReader.ReadDataAsync<FullUserDto>(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        EventAssert.IsEnvelopeOf(recorded, EventName, before, DataFields);
        Assert.Equal(user.Id, recorded.Data.GetProperty("userId").GetInt32());
        Assert.Equal(NewUsername, recorded.Data.GetProperty("username").GetString());
        Assert.Equal(NewEmail, recorded.Data.GetProperty("email").GetString());
    }

    [Fact]
    public async Task CreateUser_WithTakenUsername_SendsNoEvent()
    {
        await SignInAsync(_client, "sandro_beno");

        var response = await RegisterThroughAdminAsync("alice", NewEmail);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task CreateUser_ByOrdinaryUser_SendsNoEvent()
    {
        await SignInAsync(_client, "alice");

        var response = await RegisterThroughAdminAsync(NewUsername, NewEmail);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- helpers ----------

    private static async Task<HttpResponseMessage> RegisterAsync(HttpClient client, string username, string email)
    {
        return await client.PostAsJsonAsync("api/auth/register", RegistrationBody(username, email));
    }

    private async Task<HttpResponseMessage> RegisterThroughAdminAsync(string username, string email)
    {
        return await _client.PostAsJsonAsync("api/users", RegistrationBody(username, email));
    }

    private static object RegistrationBody(string username, string email)
    {
        return new
        {
            Username    = username,
            Email       = email,
            Password    = TestDataSeeder.SharedPlaintextPassword,
            DateOfBirth = "2000-08-16T10:10:23.546Z"
        };
    }

    private static async Task SignInAsync(HttpClient client, string username)
    {
        var token = await AuthTestHelper.LoginAsync(client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(client, token);
    }
}
