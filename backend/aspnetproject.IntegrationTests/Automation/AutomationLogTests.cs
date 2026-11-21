using System.Net;
using System.Net.Http.Json;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data;
using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Services.BusinessLogic.Content;
using aspnetproject.Infrastructure.Services.BusinessLogic.Users;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Automation;

// The Log row for something the automation did: no user id, marked as an authorized request, and the automation named in its
// details. Rows for users, guests and background jobs are written as before. sandro_beno (1) is the only administrator.
public class AutomationLogTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string SetPostStatusAction = $"{nameof(ModerationService)}.{nameof(ModerationService.SetPostStatusAsync)}";

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AutomationLogTests(DatabaseFixture dbFixture)
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

    private async Task<List<Log>> ReadLogsAsync(string action)
    {
        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        return await db.Logs.Where(log => log.Action == action).ToListAsync();
    }

    private Task<HttpResponseMessage> SetPostStatusAsAutomationAsync(ModerationStatus status) =>
        _client.SendWithApiKeyAsync(HttpMethod.Put, "api/admin/posts/1/moderation", new { Status = status.ToString() });

    [Fact]
    public async Task SetStatus_ByTheAutomation_WritesAnAuthorizedRowWithNoUserThatNamesTheAutomation()
    {
        await SetPostStatusAsAutomationAsync(ModerationStatus.Hidden);

        var log = Assert.Single(await ReadLogsAsync(SetPostStatusAction));
        Assert.Null(log.UserId);
        Assert.True(log.AuthorizedRequest);
        Assert.True(log.Succeeded);
        Assert.StartsWith(Constants.AutomationActorName, log.Details);
        Assert.Equal(nameof(Post), log.EntityName);
        Assert.Equal(1, log.EntityId);
    }

    [Fact]
    public async Task SetStatus_ByTheAutomationRefusedToRaise_WritesAFailedRowThatNamesTheAutomation()
    {
        var response = await SetPostStatusAsAutomationAsync(ModerationStatus.Visible);

        var log = Assert.Single(await ReadLogsAsync(SetPostStatusAction));
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Null(log.UserId);
        Assert.True(log.AuthorizedRequest);
        Assert.False(log.Succeeded);
        Assert.StartsWith(Constants.AutomationActorName, log.Details);
    }

    [Fact]
    public async Task SetStatus_ByTheAutomationForNonexistentPost_WritesAFailedRowThatNamesTheAutomation()
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Put, "api/admin/posts/999/moderation", new { Status = nameof(ModerationStatus.Hidden) });

        var log = Assert.Single(await ReadLogsAsync(SetPostStatusAction));
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Null(log.UserId);
        Assert.True(log.AuthorizedRequest);
        Assert.False(log.Succeeded);
        Assert.StartsWith(Constants.AutomationActorName, log.Details);
    }

    [Fact]
    public async Task SetStatus_ByAnAdministrator_WritesTheRowAsBefore()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        await _client.PutAsJsonAsync("api/admin/posts/1/moderation", new { Status = nameof(ModerationStatus.Hidden) });

        var log = Assert.Single(await ReadLogsAsync(SetPostStatusAction));
        Assert.Equal(1, log.UserId);
        Assert.True(log.AuthorizedRequest);
        Assert.DoesNotContain(Constants.AutomationActorName, log.Details);
    }

    // A caller with a token and the key at once is the administrator, so the row names the administrator.
    [Fact]
    public async Task SetStatus_ByAnAdministratorWhoAlsoSendsTheKey_WritesTheRowForTheAdministrator()
    {
        var token = await AuthTestHelper.LoginAsync(_client, "sandro_beno", TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);

        await _client.SendWithApiKeyAsync(HttpMethod.Put, "api/admin/posts/1/moderation", new { Status = nameof(ModerationStatus.Hidden) });

        var log = Assert.Single(await ReadLogsAsync(SetPostStatusAction));
        Assert.Equal(1, log.UserId);
        Assert.DoesNotContain(Constants.AutomationActorName, log.Details);
    }

    // A background job's row is still written through the system path: no user, unauthorized, and not the automation's.
    [Fact]
    public async Task RunCycle_ByABackgroundJob_WritesAnUnauthorizedRowWithNoUser()
    {
        var job = new ThrowingJob(_factory.Services.GetRequiredService<IServiceScopeFactory>());

        await job.RunOnceAsync(CancellationToken.None);

        var log = Assert.Single(await ReadLogsAsync($"{nameof(ThrowingJob)}.RunCycleAsync"));
        Assert.Null(log.UserId);
        Assert.False(log.AuthorizedRequest);
        Assert.False(log.Succeeded);
        Assert.Equal(ThrowingJob.FailureMessage, log.Details);
    }

    // A guest's failed request is still an unauthorized row with no user, as before.
    [Fact]
    public async Task Login_ByAGuestWithWrongPassword_WritesAnUnauthorizedRowWithNoUser()
    {
        await _client.PostAsJsonAsync("api/auth/login", new { UniqueIdentifier = "alice", Password = "not-her-password" });

        var logs = await ReadLogsAsync($"{nameof(AuthService)}.{nameof(AuthService.LoginAsync)}");
        var log  = logs.OrderByDescending(row => row.Id).First();
        Assert.Null(log.UserId);
        Assert.False(log.AuthorizedRequest);
        Assert.DoesNotContain(Constants.AutomationActorName, log.Details);
    }
}
