using System.Net;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Infrastructure.Dtos.Posts;
using aspnetproject.Infrastructure.Dtos.Reports;
using aspnetproject.Infrastructure.Services.BackgroundJobs;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.BackgroundJobs;

// Runs one sweep of the job directly, resolved from the host's services: the test host removes hosted services, so no
// timer ever fires here. A failed sweep is logged, not thrown, so each test checks what the sweep left behind.
public class SoftDeletedUsersCleanupServiceTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public SoftDeletedUsersCleanupServiceTests(DatabaseFixture dbFixture)
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

    // ---------- one sweep ----------
    // frank_deleted (7) was soft-deleted on 2026-08-12, past the default 20-day retention, so the sweep purges him.
    // Report 5 is frank's own pending report; report 6 is alice's rejected report that frank reviewed.
    // sandro_beno (1) is the administrator who reads the reports.

    [Fact]
    public async Task Sweep_ForPurgedUsersReports_DeletesThem()
    {
        await SweepAsync();

        var pending = await GetReportsAsync("status=Pending");

        Assert.DoesNotContain(pending, report => report.Id == 5);
        Assert.Equal([4, 2, 1], pending.Select(report => report.Id));
    }

    [Fact]
    public async Task Sweep_ForReportsThePurgedUserReviewed_KeepsThemWithoutReviewer()
    {
        await SweepAsync();

        var report = (await GetReportsAsync("status=Rejected")).Single();

        Assert.Equal(6, report.Id);
        Assert.Null(report.ReviewedBy!.Id);
        Assert.Equal(ResponseMessages.AccountDeletedUsername, report.ReviewedBy.Username);
        Assert.NotNull(report.ReviewedAt);
    }

    // ---------- photo files ----------
    // A host with no retention purges an account as soon as it is soft-deleted, so a test can delete one through the API.
    // diana (5) posts photos and deletes her account; alice (2) posts photos and stays.

    [Fact]
    public async Task Sweep_ForPurgedUsersPosts_RemovesTheirPhotoFilesAndKeepsOthers()
    {
        await using var factory = new CustomWebApplicationFactory(_dbFixture, new Dictionary<string, string?>
        {
            [RetentionDaysSetting] = "0"
        });
        using var client = factory.CreateClient();

        var dianasPost = await CreatePhotoPostAsync(client, "diana");
        var alicesPost = await CreatePhotoPostAsync(client, "alice");
        await LoginAsync(client, "diana");
        Assert.Equal(HttpStatusCode.OK, (await client.DeleteAsync("api/accounts/mine")).StatusCode);

        await factory.Services.GetRequiredService<SoftDeletedUsersCleanupService>().RunOnceAsync(CancellationToken.None);

        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync($"api/posts/{dianasPost.Id}")).StatusCode);
        foreach (var image in dianasPost.Images)
        {
            Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(image.Address)).StatusCode);
        }
        foreach (var image in alicesPost.Images)
        {
            Assert.Equal(HttpStatusCode.OK, (await client.GetAsync(image.Address)).StatusCode);
        }
    }

    private const string RetentionDaysSetting = "CleanupConfiguration:SoftDeletedUsers:RetentionDays";

    private static async Task<StandardPostDisplayDto> CreatePhotoPostAsync(HttpClient client, string username)
    {
        await LoginAsync(client, username);
        var response = await client.PostAsync("api/posts", PostForm.Create($"{username}'s photos", null, ImageFormFiles.Jpeg(1), ImageFormFiles.Png(2)));

        return await ResponseReader.ReadDataAsync<StandardPostDisplayDto>(response);
    }

    private static async Task LoginAsync(HttpClient client, string username)
    {
        var token = await AuthTestHelper.LoginAsync(client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(client, token);
    }

    private async Task SweepAsync()
    {
        await _factory.Services.GetRequiredService<SoftDeletedUsersCleanupService>().RunOnceAsync(CancellationToken.None);
    }

    private async Task<List<AdminReportDto>> GetReportsAsync(string query)
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        return await ResponseReader.ReadListAsync<AdminReportDto>(await _client.GetAsync($"api/reports?{query}"));
    }
}
