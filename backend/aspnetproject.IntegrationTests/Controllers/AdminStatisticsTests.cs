using System.Net;
using System.Net.Http.Json;
using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Data;
using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.DatabaseLogs;
using aspnetproject.Infrastructure.Dtos.Statistics;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Controllers;

// GET api/admin/statistics. sandro_beno (1) is the only administrator; alice (2) is an ordinary user.
// Seeded counts, by what the seeder gives each table:
//   accounts: 1-5, 8 and 9 active, erin_deactivated (6) deactivated, frank_deleted (7) soft-deleted; all created "now"
//   posts 19: ids 1-5 created now, 14-18 hours ago, 6-13 on 2026-09-06 and 19 on 2026-09-01 (more than 30 days ago)
//   comments 6: ids 1-5 created now, id 6 on 2026-09-06
//   messages 5: ids 1-4 created now, id 5 on 2026-09-01
//   likes 22, all on 2026-09-06
//   reports 6: ids 1, 2, 4, 5 pending, id 3 resolved, id 6 rejected
// The seeder cannot put a row 7 to 30 days old (see testing.md §6), so a window test backdates seeded rows itself
// with a time taken at that moment, well away from both window edges.
public class AdminStatisticsTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string StatisticsRoute = "api/admin/statistics";

    private static readonly TimeSpan InsideBothWindows = TimeSpan.FromDays(3);
    private static readonly TimeSpan InsideLongWindow  = TimeSpan.FromDays(15);
    private static readonly TimeSpan OutsideBothWindows = TimeSpan.FromDays(40);

    // Each poll is a request against the endpoint's 30-per-minute policy, so the interval is slow enough that
    // two full waits (10 polls each) and the test's other requests stay under it.
    private static readonly TimeSpan DisconnectTimeout = TimeSpan.FromSeconds(5);
    private static readonly TimeSpan PollInterval      = TimeSpan.FromMilliseconds(500);

    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public AdminStatisticsTests(DatabaseFixture dbFixture)
    {
        _dbFixture = dbFixture;
        _factory   = new CustomWebApplicationFactory(_dbFixture);
        _client    = _factory.CreateClient();
    }

    public Task InitializeAsync() => _dbFixture.ResetAndSeedAsync();

    // Disposing the host releases its settings-file watchers; each one holds an inotify instance, and Linux caps them per user.
    public async Task DisposeAsync()
    {
        _client.Dispose();
        await _factory.DisposeAsync();
    }

    private async Task SignInAsync(string username)
    {
        var token = await AuthTestHelper.LoginAsync(_client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
    }

    private async Task<SystemStatisticsDto> GetStatisticsAsync()
    {
        var response = await _client.GetAsync(StatisticsRoute);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        return await ResponseReader.ReadDataAsync<SystemStatisticsDto>(response);
    }

    // Sets a seeded row's creation time to now minus the age, taken when this runs.
    private async Task BackdateAsync<T>(int id, TimeSpan age) where T : BaseEntity
    {
        using var scope     = _factory.Services.CreateScope();
        var       db        = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var       createdAt = DateTime.UtcNow - age;

        await db.Set<T>()
            .IgnoreQueryFilters()
            .Where(row => row.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(row => row.CreatedAt, createdAt));
    }

    // The server finishes a disconnect after the client has closed, so the count falls a moment later: poll for it.
    private async Task<int> WaitForOnlineUsersAsync(int expected)
    {
        using var timeout = new CancellationTokenSource(DisconnectTimeout);

        var online = (await GetStatisticsAsync()).OnlineUsers;

        while (online != expected && !timeout.IsCancellationRequested)
        {
            await Task.Delay(PollInterval);
            online = (await GetStatisticsAsync()).OnlineUsers;
        }

        return online;
    }

    private async Task<List<int>> GetLogIdsAsync()
    {
        var response = await _client.GetAsync($"api/admin/logs?pageSize={Constants.MaxPageSize}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var logs = await ResponseReader.ReadListAsync<LogDisplayDto>(response);
        return logs.Select(log => log.Id).ToList();
    }

    // ---------- Who may read ----------

    [Fact]
    public async Task GetStatistics_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync(StatisticsRoute);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetStatistics_AsOrdinaryUser_ReturnsForbidden()
    {
        await SignInAsync("alice");

        var response = await _client.GetAsync(StatisticsRoute);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    // ---------- Totals ----------

    [Fact]
    public async Task GetStatistics_AsAdministrator_ReturnsTotalsThatMatchTheSeed()
    {
        await SignInAsync("sandro_beno");

        var statistics = await GetStatisticsAsync();

        Assert.Equal(19, statistics.Totals.Posts);
        Assert.Equal(6, statistics.Totals.Comments);
        Assert.Equal(5, statistics.Totals.Messages);
        Assert.Equal(22, statistics.Totals.Likes);
    }

    [Fact]
    public async Task GetStatistics_CountsDeactivatedAccountsApartFromActiveOnes()
    {
        await SignInAsync("sandro_beno");

        var statistics = await GetStatisticsAsync();

        // The soft-deleted account (7) is in neither count.
        Assert.Equal(7, statistics.Totals.ActiveAccounts);
        Assert.Equal(1, statistics.Totals.DeactivatedAccounts);
    }

    [Fact]
    public async Task GetStatistics_CountsContentOfEveryModerationStatus()
    {
        await SignInAsync("sandro_beno");
        await SetModerationStatusAsync("posts", 1, "Hidden");
        await SetModerationStatusAsync("posts", 2, "Flagged");
        await SetModerationStatusAsync("comments", 1, "Hidden");

        var statistics = await GetStatisticsAsync();

        Assert.Equal(19, statistics.Totals.Posts);
        Assert.Equal(6, statistics.Totals.Comments);
    }

    private async Task SetModerationStatusAsync(string contentPath, int id, string status)
    {
        var response = await _client.PutAsJsonAsync($"api/admin/{contentPath}/{id}/moderation", new { Status = status });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    // ---------- Reports waiting for a decision ----------

    [Fact]
    public async Task GetStatistics_CountsPendingReportsOnly()
    {
        await SignInAsync("sandro_beno");

        var statistics = await GetStatisticsAsync();

        Assert.Equal(4, statistics.Totals.PendingReports);
    }

    [Fact]
    public async Task GetStatistics_AfterAReportIsRejected_CountsOneFewerPendingReport()
    {
        await SignInAsync("sandro_beno");
        var response = await _client.PutAsJsonAsync("api/reports/1", new { Decision = "Reject" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var statistics = await GetStatisticsAsync();

        Assert.Equal(3, statistics.Totals.PendingReports);
    }

    // ---------- Activity windows ----------

    [Fact]
    public async Task GetStatistics_ForRowsCreatedNow_CountsThemInBothWindows()
    {
        await SignInAsync("sandro_beno");

        var statistics = await GetStatisticsAsync();

        // The soft-deleted account (7) is not a counted sign-up; rows with fixed September times are outside both windows.
        // Posts: 1-5 and heidi's 14-18, which are hours old.
        Assert.Equal(8, statistics.Activity.Last7Days.Accounts);
        Assert.Equal(10, statistics.Activity.Last7Days.Posts);
        Assert.Equal(5, statistics.Activity.Last7Days.Comments);
        Assert.Equal(4, statistics.Activity.Last7Days.Messages);
        Assert.Equal(8, statistics.Activity.Last30Days.Accounts);
        Assert.Equal(10, statistics.Activity.Last30Days.Posts);
        Assert.Equal(5, statistics.Activity.Last30Days.Comments);
        Assert.Equal(4, statistics.Activity.Last30Days.Messages);
    }

    [Fact]
    public async Task GetStatistics_ForRowsOfMixedAges_CountsEachInsideItsWindowAndLeavesOutOlderOnes()
    {
        // Each kind gets a different split, so a count read from the wrong table shows.
        await BackdateAsync<Post>(1, InsideLongWindow);
        await BackdateAsync<Post>(2, OutsideBothWindows);
        await BackdateAsync<Post>(3, InsideBothWindows);

        await BackdateAsync<Comment>(1, InsideLongWindow);
        await BackdateAsync<Comment>(2, InsideLongWindow);
        await BackdateAsync<Comment>(3, OutsideBothWindows);

        await BackdateAsync<Message>(1, InsideBothWindows);
        await BackdateAsync<Message>(2, OutsideBothWindows);
        await BackdateAsync<Message>(3, InsideLongWindow);

        await BackdateAsync<User>(2, InsideLongWindow);
        await BackdateAsync<User>(3, OutsideBothWindows);
        await BackdateAsync<User>(4, InsideBothWindows);
        await SignInAsync("sandro_beno");

        var statistics = await GetStatisticsAsync();

        // Posts 3, 4, 5 and 14-18 are inside 7 days and post 1 joins them inside 30; post 2 and the September posts (6-13, 19)
        // are outside both.
        Assert.Equal(8, statistics.Activity.Last7Days.Posts);
        Assert.Equal(9, statistics.Activity.Last30Days.Posts);

        // Comments 4, 5 are inside 7 days; 1 and 2 join them inside 30; comment 3 and comment 6 are outside both.
        Assert.Equal(2, statistics.Activity.Last7Days.Comments);
        Assert.Equal(4, statistics.Activity.Last30Days.Comments);

        // Messages 1, 4 are inside 7 days; 3 joins them inside 30; message 2 and message 5 are outside both.
        Assert.Equal(2, statistics.Activity.Last7Days.Messages);
        Assert.Equal(3, statistics.Activity.Last30Days.Messages);

        // Accounts 1, 4, 5, 6, 8, 9 are inside 7 days; 2 joins them inside 30; account 3 is outside both, account 7 is soft-deleted.
        Assert.Equal(6, statistics.Activity.Last7Days.Accounts);
        Assert.Equal(7, statistics.Activity.Last30Days.Accounts);
    }

    // ---------- Online now ----------

    [Fact]
    public async Task GetStatistics_WithNobodyConnected_ReportsNoOnlineUsers()
    {
        await SignInAsync("sandro_beno");

        var statistics = await GetStatisticsAsync();

        Assert.Equal(0, statistics.OnlineUsers);
    }

    [Fact]
    public async Task GetStatistics_WhenUsersConnectAndDisconnect_RisesAndFalls()
    {
        await SignInAsync("sandro_beno");

        await using var alice = await HubTestClient.ConnectAsync(_factory, "alice");
        Assert.Equal(1, (await GetStatisticsAsync()).OnlineUsers);

        await using var bob = await HubTestClient.ConnectAsync(_factory, "bob");
        Assert.Equal(2, (await GetStatisticsAsync()).OnlineUsers);

        await bob.DisposeAsync();
        Assert.Equal(1, await WaitForOnlineUsersAsync(1));

        await alice.DisposeAsync();
        Assert.Equal(0, await WaitForOnlineUsersAsync(0));
    }

    [Fact]
    public async Task GetStatistics_WhenOneUserHasTwoConnections_CountsThemOnce()
    {
        await SignInAsync("sandro_beno");

        await using var firstTab  = await HubTestClient.ConnectAsync(_factory, "alice");
        await using var secondTab = await HubTestClient.ConnectAsync(_factory, "alice");

        var statistics = await GetStatisticsAsync();

        Assert.Equal(1, statistics.OnlineUsers);
    }

    // ---------- Rate limit and logging ----------

    [Fact]
    public async Task GetStatistics_WhenPolicyIsExhausted_ReturnsTooManyRequestsEnvelope()
    {
        await SignInAsync("sandro_beno");

        var response = await RateLimitExhaustHelper.ExhaustAsync(
            () => _client.GetAsync(StatisticsRoute), HttpStatusCode.OK);

        Assert.Equal(HttpStatusCode.TooManyRequests, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.TooManyRequests, body.Message);
    }

    [Fact]
    public async Task GetStatistics_WhenSuccessful_WritesNoLogRow()
    {
        await SignInAsync("sandro_beno");
        var logsBefore = await GetLogIdsAsync();

        await GetStatisticsAsync();
        await GetStatisticsAsync();
        var logsAfter = await GetLogIdsAsync();

        Assert.Equal(logsBefore, logsAfter);
    }
}
