using System.Net;
using System.Text.Json;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// ---------- POST /api/internal/notifications ----------
// The automation names the recipients; the backend pushes ReceiveNotification to each one's hub group and stores nothing.
// alice (2), bob (3) and charlie (4) connect as real SignalR clients; diana (5) never connects.
public class InternalNotificationsTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string NotificationsUrl = "api/internal/notifications";
    private const string Birthday         = "BIRTHDAY";

    private const int AliceId       = 2;
    private const int BobId         = 3;
    private const int CharlieId     = 4;
    private const int DianaId       = 5;
    private const int NonexistentId = 999;

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public InternalNotificationsTests(DatabaseFixture dbFixture)
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

    // diana (5) is the friend whose birthday it is.
    private static object BirthdayOfDiana(params int[] recipientIds) => new
    {
        RecipientIds = recipientIds,
        Kind         = Birthday,
        Data         = new { Friends = new[] { new { Id = DianaId, Username = "diana" } } }
    };

    private Task<HttpResponseMessage> SendAsync(object body) =>
        _client.SendWithApiKeyAsync(HttpMethod.Post, NotificationsUrl, body);

    private static void AssertIsBirthdayOfDiana(JsonElement pushed)
    {
        Assert.Equal(Birthday, pushed.GetProperty("kind").GetString());

        var friend = Assert.Single(pushed.GetProperty("data").GetProperty("friends").EnumerateArray());
        Assert.Equal(DianaId, friend.GetProperty("id").GetInt32());
        Assert.Equal("diana", friend.GetProperty("username").GetString());
    }

    [Fact]
    public async Task Send_BirthdayToTwoConnectedUsers_DeliversItToBothAndNobodyElse()
    {
        await using var alice   = await HubTestClient.ConnectAsync(_factory, "alice");
        await using var bob     = await HubTestClient.ConnectAsync(_factory, "bob");
        await using var charlie = await HubTestClient.ConnectAsync(_factory, "charlie");

        var response = await SendAsync(BirthdayOfDiana(AliceId, BobId));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertIsBirthdayOfDiana(await alice.WaitForEventAsync<JsonElement>(HubEvents.ReceiveNotification));
        AssertIsBirthdayOfDiana(await bob.WaitForEventAsync<JsonElement>(HubEvents.ReceiveNotification));
        await charlie.AssertNoEventAsync(HubEvents.ReceiveNotification);
    }

    // Each recipient gets it once, even when the automation names them twice.
    [Fact]
    public async Task Send_WithARecipientNamedTwice_DeliversItOnce()
    {
        await using var alice = await HubTestClient.ConnectAsync(_factory, "alice");

        var response = await SendAsync(BirthdayOfDiana(AliceId, AliceId));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        await alice.WaitForEventAsync<JsonElement>(HubEvents.ReceiveNotification);
        await alice.AssertNoEventAsync(HubEvents.ReceiveNotification);
    }

    // diana (5) is not connected and 999 does not exist; alice still gets hers.
    [Fact]
    public async Task Send_ToUnknownAndDisconnectedRecipients_CausesNoFailure()
    {
        await using var alice = await HubTestClient.ConnectAsync(_factory, "alice");

        var response = await SendAsync(BirthdayOfDiana(NonexistentId, DianaId, AliceId));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        AssertIsBirthdayOfDiana(await alice.WaitForEventAsync<JsonElement>(HubEvents.ReceiveNotification));
    }

    public static IEnumerable<object[]> InvalidBodies()
    {
        var friends = new { Friends = new[] { new { Id = DianaId, Username = "diana" } } };

        yield return ["unknown kind",    new { RecipientIds = new[] { AliceId }, Kind = "POKE", Data = friends }];
        yield return ["numeric kind",    new { RecipientIds = new[] { AliceId }, Kind = "0", Data = friends }];
        yield return ["no kind",         new { RecipientIds = new[] { AliceId }, Data = friends }];
        yield return ["no recipients",   new { RecipientIds = Array.Empty<int>(), Kind = Birthday, Data = friends }];
        yield return ["101 recipients",  new { RecipientIds = Enumerable.Range(1, 101).ToArray(), Kind = Birthday, Data = friends }];
        yield return ["no data",         new { RecipientIds = new[] { AliceId }, Kind = Birthday }];
        yield return ["no friends",      new { RecipientIds = new[] { AliceId }, Kind = Birthday, Data = new { Friends = Array.Empty<object>() } }];
    }

    [Theory]
    [MemberData(nameof(InvalidBodies))]
    public async Task Send_WithInvalidBody_ReturnsValidationProblemAndPushesNothing(string _, object body)
    {
        await using var alice = await HubTestClient.ConnectAsync(_factory, "alice");

        var response = await SendAsync(body);

        var responseBody = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("\"errors\"", responseBody); // the framework's validation ProblemDetails, not the envelope
        await alice.AssertNoEventAsync(HubEvents.ReceiveNotification);
    }

    [Fact]
    public async Task Send_With100Recipients_IsAccepted()
    {
        var response = await SendAsync(BirthdayOfDiana(Enumerable.Range(1, 100).ToArray()));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
