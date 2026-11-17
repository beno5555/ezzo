using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using aspnetproject.Infrastructure.Dtos.Reports;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Automation;

// A report leaves as a signed report-created event with the target as the reports list shows it, and the creation times
// of every report still pending on that target.
// Callers: sandro_beno (1) is the administrator; alice (2), bob (3), charlie (4) and diana (5) are ordinary users.
// Seed state used here (see TestDataSeeder and ReportControllerTests):
//   post 1 is alice's ("Alice Post"), post 2 is bob's ("Bob Post"), post 3 is charlie's
//   comment 4 is bob's, on alice's post 1
//   bob (3) has the bio "Alice's accepted friend"
//   report 1: alice -> post 2 (bob's)  pending
//   report 3: bob   -> user 4 (charlie) resolved, so it is no longer among a target's pending times
public class ReportCreatedEventTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string EventName = "report-created";

    private const string ShortTimeout = "00:00:00.200";

    private static readonly string[] DataFields =
    [
        "reportId", "targetType", "targetId", "reason", "reporterId", "reporterUsername",
        "post", "comment", "user", "pendingReportTimes"
    ];

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public ReportCreatedEventTests(DatabaseFixture dbFixture)
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

    // ---------- POST /reports ----------

    [Fact]
    public async Task Create_ForAPost_SendsReportCreatedWithThePostSnapshotAndTheReason()
    {
        var before = DateTime.UtcNow;
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 2, "Spam"); // bob's post
        var report   = await ResponseReader.ReadDataAsync<StandardReportDto>(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var recorded = Assert.Single(_factory.EventRecorder.Events);
        EventAssert.IsEnvelopeOf(recorded, EventName, before, DataFields);
        var data = recorded.Data;
        Assert.Equal(report.Id, data.GetProperty("reportId").GetInt32());
        Assert.Equal("Post", data.GetProperty("targetType").GetString());
        Assert.Equal(2, data.GetProperty("targetId").GetInt32());
        Assert.Equal("Spam", data.GetProperty("reason").GetString());
        Assert.Equal(4, data.GetProperty("reporterId").GetInt32()); // charlie
        Assert.Equal("charlie", data.GetProperty("reporterUsername").GetString());

        var post = data.GetProperty("post");
        Assert.Equal(2, post.GetProperty("id").GetInt32());
        Assert.Equal("Bob Post", post.GetProperty("title").GetString());
        Assert.Equal("Bob's post should appear in Alice's feed.", post.GetProperty("postContent").GetString());
        Assert.Equal(3, post.GetProperty("author").GetProperty("id").GetInt32());
        Assert.Equal("bob", post.GetProperty("author").GetProperty("username").GetString());
        Assert.False(post.GetProperty("isHidden").GetBoolean());
        Assert.Empty(post.GetProperty("images").EnumerateArray());
        Assert.Equal(JsonValueKind.Null, data.GetProperty("comment").ValueKind);
        Assert.Equal(JsonValueKind.Null, data.GetProperty("user").ValueKind);
    }

    [Fact]
    public async Task Create_ForAComment_SendsReportCreatedWithTheCommentSnapshot()
    {
        await SignInAsync(_client, "charlie");

        await CreateReportAsync(_client, "Comment", 4, "Rude"); // bob's comment on alice's post

        var recorded = Assert.Single(_factory.EventRecorder.Events);
        var data     = recorded.Data;
        Assert.Equal("Comment", data.GetProperty("targetType").GetString());
        Assert.Equal(4, data.GetProperty("targetId").GetInt32());

        var comment = data.GetProperty("comment");
        Assert.Equal(4, comment.GetProperty("id").GetInt32());
        Assert.Equal("Bob comments on Alice's post.", comment.GetProperty("content").GetString());
        Assert.Equal(3, comment.GetProperty("author").GetProperty("id").GetInt32());
        Assert.Equal("bob", comment.GetProperty("author").GetProperty("username").GetString());
        Assert.Equal(1, comment.GetProperty("postId").GetInt32());
        Assert.Equal("Alice Post", comment.GetProperty("postTitle").GetString());
        Assert.False(comment.GetProperty("isHidden").GetBoolean());
        Assert.Equal(JsonValueKind.Null, data.GetProperty("post").ValueKind);
        Assert.Equal(JsonValueKind.Null, data.GetProperty("user").ValueKind);
    }

    [Fact]
    public async Task Create_ForAUser_SendsReportCreatedWithTheUserSnapshot()
    {
        await SignInAsync(_client, "charlie");

        await CreateReportAsync(_client, "User", 3, "Harassment"); // bob

        var recorded = Assert.Single(_factory.EventRecorder.Events);
        var data     = recorded.Data;
        Assert.Equal("User", data.GetProperty("targetType").GetString());
        Assert.Equal(3, data.GetProperty("targetId").GetInt32());

        var user = data.GetProperty("user");
        Assert.Equal(3, user.GetProperty("id").GetInt32());
        Assert.Equal("bob", user.GetProperty("username").GetString());
        Assert.Equal("Alice's accepted friend", user.GetProperty("bio").GetString());
        Assert.Equal(JsonValueKind.Null, data.GetProperty("post").ValueKind);
        Assert.Equal(JsonValueKind.Null, data.GetProperty("comment").ValueKind);
    }

    // ---------- the pending times ----------

    [Fact]
    public async Task Create_AsTheOnlyPendingReportOnATarget_SendsItsOwnTimeAlone()
    {
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 1, "Spam"); // alice's post, never reported
        var report   = await ResponseReader.ReadDataAsync<StandardReportDto>(response);

        var times = PendingTimesOf(Assert.Single(_factory.EventRecorder.Events));
        Assert.Equal([await StoredTimeAsync(report.Id)], times);
    }

    // Report 1 (alice, post 2) is pending; charlie's report on the same post carries both times, oldest first.
    [Fact]
    public async Task Create_BySecondUserOnTheSameTarget_SendsBothPendingTimes()
    {
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 2, "Spam");
        var report   = await ResponseReader.ReadDataAsync<StandardReportDto>(response);

        var times = PendingTimesOf(Assert.Single(_factory.EventRecorder.Events));
        Assert.Equal([await StoredTimeAsync(1), await StoredTimeAsync(report.Id)], times);
        Assert.True(times[0] < times[1]);
    }

    // Report 3 (bob, user 4) is resolved: alice's new report on user 4 does not carry its time.
    [Fact]
    public async Task Create_OnATargetWithADecidedReport_LeavesTheDecidedTimeOut()
    {
        await SignInAsync(_client, "alice");

        var response = await CreateReportAsync(_client, "User", 4, "Spam");
        var report   = await ResponseReader.ReadDataAsync<StandardReportDto>(response);

        var times = PendingTimesOf(Assert.Single(_factory.EventRecorder.Events));
        Assert.Equal([await StoredTimeAsync(report.Id)], times);
        Assert.DoesNotContain(await StoredTimeAsync(3), times);
    }

    // Report 1 (alice, post 2) is pending; an administrator rejects it, then charlie reports the same post.
    [Fact]
    public async Task Create_AfterThePendingReportIsDecided_LeavesTheDecidedTimeOut()
    {
        using var adminClient = _factory.CreateClient();
        await SignInAsync(adminClient, "sandro_beno");
        var decided = await adminClient.PutAsJsonAsync("api/reports/1", new { Decision = "Reject" });
        Assert.Equal(HttpStatusCode.OK, decided.StatusCode);
        var rejectedTime = await StoredTimeAsync(1);
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 2, "Spam");
        var report   = await ResponseReader.ReadDataAsync<StandardReportDto>(response);

        var times = PendingTimesOf(Assert.Single(_factory.EventRecorder.Events));
        Assert.Equal([await StoredTimeAsync(report.Id)], times);
        Assert.DoesNotContain(rejectedTime, times);
    }

    // ---------- refused reports ----------

    [Fact]
    public async Task Create_ForOwnPost_SendsNoEvent()
    {
        await SignInAsync(_client, "alice");

        var response = await CreateReportAsync(_client, "Post", 1, "Spam"); // alice's own post

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_ForOwnComment_SendsNoEvent()
    {
        await SignInAsync(_client, "bob");

        var response = await CreateReportAsync(_client, "Comment", 4, "Spam"); // bob's own comment

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_ForOneself_SendsNoEvent()
    {
        await SignInAsync(_client, "alice");

        var response = await CreateReportAsync(_client, "User", 2, "Spam");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_SecondPendingReportByTheSameUser_SendsNoEvent()
    {
        await SignInAsync(_client, "alice");

        var response = await CreateReportAsync(_client, "Post", 2, "Spam again"); // report 1 is alice's, still pending

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_ForNonexistentTarget_SendsNoEvent()
    {
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 9999, "Spam");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_WithoutReason_SendsNoEvent()
    {
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 2, "");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    [Fact]
    public async Task Create_WithoutToken_SendsNoEvent()
    {
        var response = await CreateReportAsync(_client, "Post", 2, "Spam");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Empty(_factory.EventRecorder.Events);
    }

    // ---------- a delivery that fails never fails the action ----------

    [Fact]
    public async Task Create_WhenDeliveryFails_StillCreatesTheReport()
    {
        _factory.EventRecorder.Answer = RecorderAnswer.Fail;
        await SignInAsync(_client, "charlie");

        var response = await CreateReportAsync(_client, "Post", 2, "Spam");
        var report   = await ResponseReader.ReadDataAsync<StandardReportDto>(response);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single(_factory.EventRecorder.Events);
        Assert.NotEqual(default, await StoredTimeAsync(report.Id));
    }

    [Fact]
    public async Task Create_WhenDeliveryTimesOut_StillCreatesTheReport()
    {
        await using var factory = new CustomWebApplicationFactory(
            _dbFixture,
            new Dictionary<string, string?> { [CustomWebApplicationFactory.EventsTimeoutSetting] = ShortTimeout },
            recordEvents: true);
        factory.EventRecorder.Answer = RecorderAnswer.TimeOut;
        using var client = factory.CreateClient();
        await SignInAsync(client, "charlie");

        var response = await CreateReportAsync(client, "Post", 2, "Spam");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Single(factory.EventRecorder.Events);
    }

    // ---------- helpers ----------

    private static async Task SignInAsync(HttpClient client, string username)
    {
        var token = await AuthTestHelper.LoginAsync(client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(client, token);
    }

    private static async Task<HttpResponseMessage> CreateReportAsync(HttpClient client, string targetType, int targetId, string reason)
    {
        return await client.PostAsJsonAsync("api/reports", new { TargetType = targetType, TargetId = targetId, Reason = reason });
    }

    private static List<DateTime> PendingTimesOf(RecordedEvent recorded)
    {
        return recorded.Data.GetProperty("pendingReportTimes")
            .EnumerateArray()
            .Select(time => time.GetDateTime().ToUniversalTime())
            .ToList();
    }

    // The creation time as the reports list shows it (read by the administrator), which is what is stored: the database
    // keeps milliseconds, so the response to the reporter, which has the full clock reading, is not comparable.
    private async Task<DateTime> StoredTimeAsync(int reportId)
    {
        using var adminClient = _factory.CreateClient();
        await SignInAsync(adminClient, "sandro_beno");

        var reports = new List<AdminReportDto>();
        foreach (string status in new[] { "Pending", "Resolved", "Rejected" })
        {
            var response = await adminClient.GetAsync($"api/reports?status={status}&pageSize=50");
            reports.AddRange(await ResponseReader.ReadListAsync<AdminReportDto>(response));
        }

        return reports.Single(report => report.Id == reportId).CreatedAt.ToUniversalTime();
    }
}
