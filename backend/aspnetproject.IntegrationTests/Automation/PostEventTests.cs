using System.Net;
using System.Net.Http.Json;
using aspnetproject.Data;
using aspnetproject.Infrastructure.Dtos.Posts;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.IntegrationTests.Automation;

// Creating a post leaves as post-created, and changing its title or text as post-edited.
// Callers: alice (2), bob (3) and diana (5) are ordinary users. Post 2 is bob's ("Bob Post").
public class PostEventTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string CreatedEventName = "post-created";
    private const string EditedEventName  = "post-edited";

    // The test's own timeout for a delivery that never answers, so the test does not wait the default 3 seconds.
    private const string ShortTimeout = "00:00:00.200";

    private static readonly string[] DataFields =
        ["postId", "title", "text", "photoAddresses", "authorId", "authorUsername", "moderationStatus"];

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public PostEventTests(DatabaseFixture dbFixture)
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

    // ---------- POST /posts ----------

    [Fact]
    public async Task Create_WithTitleTextAndPhotos_SendsPostCreatedWithEveryField()
    {
        var before = DateTime.UtcNow;
        await SignInAsync("diana");

        var response = await _client.PostAsync("api/posts", PostForm.Create("Diana's Album", "Two photos",
            ImageFormFiles.Png(1), ImageFormFiles.Jpeg(2)));
        var post = await ResponseReader.ReadDataAsync<StandardPostDisplayDto>(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        EventAssert.IsEnvelopeOf(recorded, CreatedEventName, before, DataFields);
        var data = recorded.Data;
        Assert.Equal(post.Id, data.GetProperty("postId").GetInt32());
        Assert.Equal("Diana's Album", data.GetProperty("title").GetString());
        Assert.Equal("Two photos", data.GetProperty("text").GetString());
        Assert.Equal(5, data.GetProperty("authorId").GetInt32()); // diana
        Assert.Equal("diana", data.GetProperty("authorUsername").GetString());
        Assert.Equal("Visible", data.GetProperty("moderationStatus").GetString());

        var addresses = data.GetProperty("photoAddresses").EnumerateArray().Select(address => address.GetString()).ToList();
        Assert.Equal(2, addresses.Count);
        Assert.Equal(post.Images.Select(image => image.Address), addresses);
        Assert.All(addresses, address => Assert.StartsWith("/api/images/", address));
    }

    [Fact]
    public async Task Create_WithoutPhotos_SendsAnEmptyPhotoList()
    {
        await SignInAsync("diana");

        await _client.PostAsync("api/posts", PostForm.Create("Plain post", "Only text"));

        var recorded = Assert.Single(_factory.EventRecorder.Events);
        Assert.Empty(recorded.Data.GetProperty("photoAddresses").EnumerateArray());
    }

    [Fact]
    public async Task Create_WithoutTitle_SendsNoEvent()
    {
        await SignInAsync("diana");

        var response = await _client.PostAsync("api/posts", PostForm.Create(null, "Text without a title"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_WithoutTextOrPhoto_SendsNoEvent()
    {
        await SignInAsync("diana");

        var response = await _client.PostAsync("api/posts", PostForm.Create("Title only", null));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_WithoutToken_SendsNoEvent()
    {
        var response = await _client.PostAsync("api/posts", PostForm.Create("Anonymous", "No token"));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- PUT /posts/{id} ----------

    [Fact]
    public async Task Update_OwnPost_SendsPostEditedWithTheNewTitleAndText()
    {
        await SignInAsync("diana");
        var created = await CreatePostWithPhotosAsync();
        var before  = DateTime.UtcNow;

        var response = await UpdatePostAsync(created.Id, "Diana's Album, renamed", "New text");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var events = _factory.EventRecorder.Events;
        Assert.Equal(2, events.Count); // post-created, then post-edited
        var recorded = events[1];
        EventAssert.IsEnvelopeOf(recorded, EditedEventName, before, DataFields);
        var data = recorded.Data;
        Assert.Equal(created.Id, data.GetProperty("postId").GetInt32());
        Assert.Equal("Diana's Album, renamed", data.GetProperty("title").GetString());
        Assert.Equal("New text", data.GetProperty("text").GetString());
        Assert.Equal(5, data.GetProperty("authorId").GetInt32());
        Assert.Equal("diana", data.GetProperty("authorUsername").GetString());
        Assert.Equal("Visible", data.GetProperty("moderationStatus").GetString());
        Assert.Equal(
            created.Images.Select(image => image.Address),
            data.GetProperty("photoAddresses").EnumerateArray().Select(address => address.GetString()));
    }

    // Post 1 is alice's ("Alice Post", "Alice owns this post.") and has never been edited.
    [Theory]
    [InlineData("Alice Post, renamed", "Alice owns this post.")]
    [InlineData("Alice Post", "Alice owns this post, reworded.")]
    public async Task Update_ChangingTheTitleOrTheText_SendsPostEditedAndStampsLastUpdatedAt(string title, string content)
    {
        await SignInAsync("alice");

        var response = await UpdatePostAsync(1, title, content);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        Assert.Equal("/webhook/post-edited", recorded.Path);
        Assert.NotNull(await GetLastUpdatedAtAsync(1));
    }

    [Fact]
    public async Task Update_WithTheSameTitleAndText_SendsNoEventAndLeavesLastUpdatedAtEmpty()
    {
        await SignInAsync("alice");

        var response = await UpdatePostAsync(1, "Alice Post", "Alice owns this post.");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
        Assert.Null(await GetLastUpdatedAtAsync(1));
    }

    [Fact]
    public async Task Update_SomeoneElsesPost_SendsNoEvent()
    {
        await SignInAsync("alice");

        var response = await UpdatePostAsync(2, "Hijacked", "Hijacked text"); // bob's post

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Update_OfNonexistentPost_SendsNoEvent()
    {
        await SignInAsync("alice");

        var response = await UpdatePostAsync(9999, "Title", "Text");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Update_WithoutToken_SendsNoEvent()
    {
        var response = await UpdatePostAsync(1, "Title", "Text");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- a delivery that fails never fails the action ----------

    [Fact]
    public async Task Create_WhenDeliveryFails_StillCreatesThePost()
    {
        _factory.EventRecorder.Answer = RecorderAnswer.Fail;
        await SignInAsync("diana");

        var response = await _client.PostAsync("api/posts", PostForm.Create("Diana's Album", "Still created"));
        var post     = await ResponseReader.ReadDataAsync<StandardPostDisplayDto>(response);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Single(_factory.EventRecorder.Events);
        var readBack = await _client.GetAsync($"api/posts/{post.Id}");
        Assert.Equal(HttpStatusCode.OK, readBack.StatusCode);
    }

    [Fact]
    public async Task Create_WhenDeliveryTimesOut_StillCreatesThePost()
    {
        await using var factory = new CustomWebApplicationFactory(
            _dbFixture,
            new Dictionary<string, string?> { [CustomWebApplicationFactory.EventsTimeoutSetting] = ShortTimeout },
            recordEvents: true);
        factory.EventRecorder.Answer = RecorderAnswer.TimeOut;
        using var client = factory.CreateClient();
        var token = await AuthTestHelper.LoginAsync(client, "diana", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(client, token);

        var response = await client.PostAsync("api/posts", PostForm.Create("Diana's Album", "Still created"));

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.Single(factory.EventRecorder.Events);
    }

    // ---------- helpers ----------

    private async Task SignInAsync(string username)
    {
        var token = await AuthTestHelper.LoginAsync(_client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
    }

    private async Task<StandardPostDisplayDto> CreatePostWithPhotosAsync()
    {
        var response = await _client.PostAsync("api/posts", PostForm.Create("Diana's Album", "Two photos",
            ImageFormFiles.Png(1), ImageFormFiles.Jpeg(2)));

        return await ResponseReader.ReadDataAsync<StandardPostDisplayDto>(response);
    }

    private async Task<DateTime?> GetLastUpdatedAtAsync(int postId)
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());

        return await db.Posts.IgnoreQueryFilters().Where(post => post.Id == postId).Select(post => post.LastUpdatedAt).SingleAsync();
    }

    private async Task<HttpResponseMessage> UpdatePostAsync(int id, string title, string content)
    {
        return await _client.PutAsJsonAsync($"api/posts/{id}", new { Title = title, Content = content });
    }
}
