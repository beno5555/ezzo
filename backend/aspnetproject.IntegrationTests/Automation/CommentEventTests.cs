using System.Net;
using System.Net.Http.Json;
using aspnetproject.Infrastructure.Dtos.Comments;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// Creating a comment leaves as comment-created, and changing its text as comment-edited.
// Callers: alice (2), bob (3) and diana (5) are ordinary users.
// Seed state used here: post 2 is bob's; comment 1 is alice's (on post 2) and comment 2 is bob's (on post 2).
public class CommentEventTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string CreatedEventName = "comment-created";
    private const string EditedEventName  = "comment-edited";

    private static readonly string[] DataFields =
        ["commentId", "text", "postId", "authorId", "authorUsername", "moderationStatus"];

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public CommentEventTests(DatabaseFixture dbFixture)
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

    // ---------- POST /comments/posts/{postId} ----------

    [Fact]
    public async Task Create_OnExistingPost_SendsCommentCreatedWithEveryField()
    {
        var before = DateTime.UtcNow;
        await SignInAsync("diana");

        var response = await _client.PostAsJsonAsync("api/comments/posts/2", new { Content = "Diana's new comment" });
        var comment  = await ResponseReader.ReadDataAsync<FullCommentDto>(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        EventAssert.IsEnvelopeOf(recorded, CreatedEventName, before, DataFields);
        var data = recorded.Data;
        Assert.Equal(comment.Id, data.GetProperty("commentId").GetInt32());
        Assert.Equal("Diana's new comment", data.GetProperty("text").GetString());
        Assert.Equal(2, data.GetProperty("postId").GetInt32());
        Assert.Equal(5, data.GetProperty("authorId").GetInt32()); // diana
        Assert.Equal("diana", data.GetProperty("authorUsername").GetString());
        Assert.Equal("Visible", data.GetProperty("moderationStatus").GetString());
    }

    [Fact]
    public async Task Create_OnOwnPost_StillSendsCommentCreated()
    {
        await SignInAsync("bob");

        await _client.PostAsJsonAsync("api/comments/posts/2", new { Content = "Bob answers himself" });

        var recorded = Assert.Single(_factory.EventRecorder.Events);
        Assert.Equal("/webhook/comment-created", recorded.Path);
        Assert.Equal(3, recorded.Data.GetProperty("authorId").GetInt32());
    }

    [Fact]
    public async Task Create_OnNonexistentPost_SendsNoEvent()
    {
        await SignInAsync("diana");

        var response = await _client.PostAsJsonAsync("api/comments/posts/9999", new { Content = "Nowhere to go" });

        Assert.False(response.IsSuccessStatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_WithoutContent_SendsNoEvent()
    {
        await SignInAsync("diana");

        var response = await _client.PostAsJsonAsync("api/comments/posts/2", new { Content = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_WithoutToken_SendsNoEvent()
    {
        var response = await _client.PostAsJsonAsync("api/comments/posts/2", new { Content = "Anonymous" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- PUT /comments/{id} ----------

    [Fact]
    public async Task Update_OwnComment_SendsCommentEditedWithTheNewText()
    {
        var before = DateTime.UtcNow;
        await SignInAsync("alice");

        var response = await _client.PutAsJsonAsync("api/comments/1", new { Content = "Alice's edited comment" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        EventAssert.IsEnvelopeOf(recorded, EditedEventName, before, DataFields);
        var data = recorded.Data;
        Assert.Equal(1, data.GetProperty("commentId").GetInt32());
        Assert.Equal("Alice's edited comment", data.GetProperty("text").GetString());
        Assert.Equal(2, data.GetProperty("postId").GetInt32());
        Assert.Equal(2, data.GetProperty("authorId").GetInt32()); // alice
        Assert.Equal("alice", data.GetProperty("authorUsername").GetString());
        Assert.Equal("Visible", data.GetProperty("moderationStatus").GetString());
    }

    [Fact]
    public async Task Update_SomeoneElsesComment_SendsNoEvent()
    {
        await SignInAsync("alice");

        var response = await _client.PutAsJsonAsync("api/comments/2", new { Content = "Hijacked" }); // bob's comment

        Assert.False(response.IsSuccessStatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Update_OfNonexistentComment_SendsNoEvent()
    {
        await SignInAsync("alice");

        var response = await _client.PutAsJsonAsync("api/comments/9999", new { Content = "Nothing here" });

        Assert.False(response.IsSuccessStatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Update_WithoutToken_SendsNoEvent()
    {
        var response = await _client.PutAsJsonAsync("api/comments/1", new { Content = "Anonymous" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- helpers ----------

    private async Task SignInAsync(string username)
    {
        var token = await AuthTestHelper.LoginAsync(_client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
    }
}
