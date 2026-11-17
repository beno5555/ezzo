using aspnetproject.Infrastructure.Dtos.Users.Friends;
using aspnetproject.Infrastructure.Services.Websockets;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Hubs;

// Runs the startup reset directly, resolved from the host's services: the test host removes hosted services, so it
// never runs on its own here. Presence is read the way a client reads it, from alice's conversation list.
public class PresenceResetServiceTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public PresenceResetServiceTests(DatabaseFixture dbFixture)
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

    // ---------- reset at startup ----------
    // The seed leaves every user's LastOnlineAt empty, which reads as online. bob (3) is alice's (2) accepted friend,
    // and they have a conversation, so bob is a row in alice's conversation list.

    [Fact]
    public async Task Reset_ForUserMarkedOnline_MarksOfflineAtResetTime()
    {
        var before = DateTime.UtcNow;
        await ResetAsync();
        var after = DateTime.UtcNow;

        var bob = await GetBobAsSeenByAliceAsync();

        Assert.False(bob.IsActive);
        Assert.InRange(bob.LastActiveAt!.Value, before.AddSeconds(-1), after.AddSeconds(1));
    }

    [Fact]
    public async Task Reset_ForUserAlreadyOffline_KeepsLastActiveTime()
    {
        await ResetAsync();
        var firstLastActiveAt = (await GetBobAsSeenByAliceAsync()).LastActiveAt;

        await ResetAsync();
        var secondLastActiveAt = (await GetBobAsSeenByAliceAsync()).LastActiveAt;

        Assert.NotNull(firstLastActiveAt);
        Assert.Equal(firstLastActiveAt, secondLastActiveAt);
    }

    [Fact]
    public async Task Reset_ThenUserConnects_ShowsOnline()
    {
        await ResetAsync();

        await using var bobConnection = await HubTestClient.ConnectAsync(_factory, "bob");
        var bob = await GetBobAsSeenByAliceAsync();

        Assert.True(bob.IsActive);
        Assert.Null(bob.LastActiveAt);
    }

    private async Task ResetAsync()
    {
        await _factory.Services.GetRequiredService<PresenceResetService>().ResetAsync(CancellationToken.None);
    }

    private async Task<DisplayFriendDto> GetBobAsSeenByAliceAsync()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "alice", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        var rows = await ResponseReader.ReadListAsync<ConversationFriendDto>(
            await _client.GetAsync("api/messages/friends/conversation?pageNumber=1&pageSize=100"));

        return rows.Single(row => row.ConversationFriend.Id == 3).ConversationFriend;
    }
}
