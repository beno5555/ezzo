using System.Net;
using System.Net.Http.Json;
using aspnetproject.Infrastructure.Dtos.Automation;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// GET /api/internal/digest, called with the automation's API key. Every seeded user has the switch on. Rows, by user id:
//   alice (2):  1 unread conversation (bob's messages 1 and 4), 1 pending request (from charlie), post 2 (bob, 3 likes)
//   bob (3):    1 unread conversation (alice's message 3), no pending request, post 1 (alice, 1 like); diana's post 7 is old
//   diana (5):  no unread message, 1 pending request (from alice), post 2 (bob)
//   grace (8):  nothing unread or pending; heidi's posts (see TestDataSeeder): 18 (4 likes), 14 (3), then the tie 15 and 16,
//               newer first; 17 (no likes) is fourth; 19 is older than 7 days; erin's post 4 (4 likes) is by a deactivated
//               friend; bob's post 2 (3 likes) is by someone who is not her friend
// No row: sandro_beno (1), charlie (4) and heidi (9) have nothing to report; erin (6) and frank (7) are deactivated or deleted.
public class DigestTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string DigestRoute = "api/internal/digest";

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public DigestTests(DatabaseFixture dbFixture)
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

    private async Task<List<DigestRecipientDto>> GetDigestAsync(string query = "")
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, DigestRoute + query);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        return await ResponseReader.ReadListAsync<DigestRecipientDto>(response);
    }

    // On a client of its own, so the test's client never sends a token along with the key.
    private async Task<HttpClient> SignedInClientAsync(string username)
    {
        var client = _factory.CreateClient();
        var token  = await AuthTestHelper.LoginAsync(client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(client, token);

        return client;
    }

    // ---------- Who gets a row ----------

    [Fact]
    public async Task GetDigest_WithKey_ListsTheUsersWithSomethingToReportByUserId()
    {
        var rows = await GetDigestAsync();

        Assert.Equal([2, 3, 5, 8], rows.Select(row => row.Id));
    }

    [Fact]
    public async Task GetDigest_WithKey_RowsCarryTheUsersIdentityAndCounts()
    {
        var rows = await GetDigestAsync();

        var alice = rows.Single(row => row.Id == 2);
        Assert.Equal("alice", alice.Username);
        Assert.Equal("alice@example.com", alice.Email);
        Assert.Equal(1, alice.UnreadConversationCount);
        Assert.Equal(1, alice.PendingFriendRequestCount);

        var bob = rows.Single(row => row.Id == 3);
        Assert.Equal(1, bob.UnreadConversationCount);
        Assert.Equal(0, bob.PendingFriendRequestCount);
        Assert.Equal([1], bob.Posts.Select(post => post.Id)); // alice's post 1

        var diana = rows.Single(row => row.Id == 5);
        Assert.Equal(0, diana.UnreadConversationCount);
        Assert.Equal(1, diana.PendingFriendRequestCount);
    }

    [Fact]
    public async Task GetDigest_UserWithOnlyFriendsPosts_GetsARow()
    {
        var rows = await GetDigestAsync();

        var grace = rows.Single(row => row.Id == 8);
        Assert.Equal(0, grace.UnreadConversationCount);
        Assert.Equal(0, grace.PendingFriendRequestCount);
        Assert.NotEmpty(grace.Posts);
    }

    [Fact]
    public async Task GetDigest_UserWithTheSwitchOff_GetsNoRow()
    {
        using var alice = await SignedInClientAsync("alice");
        var off = await alice.PutAsJsonAsync("api/users/mine/digest-email", new { Enabled = false });
        Assert.Equal(HttpStatusCode.OK, off.StatusCode);

        var rows = await GetDigestAsync();

        Assert.DoesNotContain(rows, row => row.Id == 2);
    }

    [Fact]
    public async Task GetDigest_UserWhoDeactivatedTheirAccount_GetsNoRow()
    {
        using var alice = await SignedInClientAsync("alice");
        await alice.PatchAsync("api/accounts/mine/deactivate", null);

        var rows = await GetDigestAsync();

        Assert.DoesNotContain(rows, row => row.Id == 2);
    }

    [Fact]
    public async Task GetDigest_UsersWithNothingToReportOrNoActiveAccount_GetNoRow()
    {
        var rows = await GetDigestAsync();

        Assert.DoesNotContain(rows, row => row.Id is 1 or 4 or 9); // sandro_beno, charlie, heidi: nothing to report
        Assert.DoesNotContain(rows, row => row.Id is 6 or 7);      // erin deactivated, frank soft-deleted
    }

    [Fact]
    public async Task GetDigest_AfterTheConversationIsRead_CountsNoUnreadConversation()
    {
        // The route marks a conversation only when its latest message is the other side's, and the seeded ones share a time,
        // so bob writes last first.
        using var bob = await SignedInClientAsync("bob");
        var sent = await bob.PostAsync("api/messages/2", MessageForm.Create("One more"));
        Assert.Equal(HttpStatusCode.Created, sent.StatusCode);

        using var alice = await SignedInClientAsync("alice");
        var read = await alice.PutAsync("api/messages/conversation/3/mark-as-read", null); // all of bob's messages to her
        Assert.Equal(HttpStatusCode.NoContent, read.StatusCode);

        var rows = await GetDigestAsync();

        var aliceRow = rows.Single(row => row.Id == 2); // charlie's request and bob's post 2 still keep the row
        Assert.Equal(0, aliceRow.UnreadConversationCount);
    }

    // ---------- The posts ----------

    [Fact]
    public async Task GetDigest_UserWithFriendsPosts_GetsTheThreeMostLikedThisWeekNewestFirstOnATie()
    {
        var rows = await GetDigestAsync();

        var grace = rows.Single(row => row.Id == 8);
        Assert.Equal([18, 14, 15], grace.Posts.Select(post => post.Id));
    }

    [Fact]
    public async Task GetDigest_HiddenPost_IsLeftOut()
    {
        var hide = await _client.SendWithApiKeyAsync(HttpMethod.Put, "api/admin/posts/18/moderation", new { Status = "Hidden" });
        Assert.Equal(HttpStatusCode.OK, hide.StatusCode);

        var rows = await GetDigestAsync();

        var grace = rows.Single(row => row.Id == 8);
        Assert.Equal([14, 15, 16], grace.Posts.Select(post => post.Id));
    }

    [Fact]
    public async Task GetDigest_UserWithFriendsPosts_EachPostCarriesItsTitleAuthorAndLikeCount()
    {
        var rows = await GetDigestAsync();

        var top = rows.Single(row => row.Id == 8).Posts.First();
        Assert.Equal(18, top.Id);
        Assert.Equal("Heidi Popular Post", top.Title);
        Assert.Equal("heidi", top.AuthorUsername);
        Assert.Equal(4, top.LikeCount);
    }

    [Fact]
    public async Task GetDigest_FriendWhoDeactivatedTheirAccount_TheirPostsAreLeftOut()
    {
        using var heidi = await SignedInClientAsync("heidi");
        await heidi.PatchAsync("api/accounts/mine/deactivate", null);

        var rows = await GetDigestAsync();

        Assert.DoesNotContain(rows, row => row.Id == 8); // erin's post 4 does not take the place of heidi's
    }

    // ---------- Paging ----------

    [Fact]
    public async Task GetDigest_TwoPages_ContinueTheOrderWithoutOverlap()
    {
        var firstPage  = await GetDigestAsync("?pageNumber=1&pageSize=2");
        var secondPage = await GetDigestAsync("?pageNumber=2&pageSize=2");
        var thirdPage  = await GetDigestAsync("?pageNumber=3&pageSize=2");

        Assert.Equal([2, 3], firstPage.Select(row => row.Id));
        Assert.Equal([5, 8], secondPage.Select(row => row.Id));
        Assert.Empty(thirdPage);
    }

    [Theory]
    [InlineData("?pageNumber=0")]
    [InlineData("?pageSize=0")]
    [InlineData("?pageSize=101")]
    public async Task GetDigest_PagingOutOfRange_ReturnsBadRequest(string query)
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, DigestRoute + query);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ---------- Who may call it ----------

    [Fact]
    public async Task GetDigest_WithoutKey_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync(DigestRoute);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetDigest_WithWrongKey_ReturnsUnauthorized()
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, DigestRoute, apiKey: "not-the-key");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("alice")]
    [InlineData("sandro_beno")] // an administrator
    public async Task GetDigest_WithAUsersToken_ReturnsUnauthorized(string username)
    {
        using var client = await SignedInClientAsync(username);

        var response = await client.GetAsync(DigestRoute);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}
