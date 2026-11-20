using System.Net;
using System.Net.Http.Json;
using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data;
using aspnetproject.Data.Models;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Automation;

// The two moderation routes, called with the automation's API key. sandro_beno (1) is the only administrator.
// Post 1 and comment 1 are visible at the start; each test sets the status it needs straight in the database,
// because the client that holds an administrator's token would send it along with the key.
public class AutomationModerationTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string Posts    = "posts";
    private const string Comments = "comments";

    private const int ExistingId    = 1;
    private const int NonexistentId = 999;

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AutomationModerationTests(DatabaseFixture dbFixture)
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

    private static string RouteFor(string kind, int id) => $"api/admin/{kind}/{id}/moderation";

    private async Task SetStatusInDatabaseAsync(string kind, int id, ModerationStatus status)
    {
        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        if (kind == Posts)
        {
            await db.Set<Post>().IgnoreQueryFilters().Where(post => post.Id == id)
                .ExecuteUpdateAsync(setters => setters.SetProperty(post => post.ModerationStatus, status));
        }
        else
        {
            await db.Set<Comment>().IgnoreQueryFilters().Where(comment => comment.Id == id)
                .ExecuteUpdateAsync(setters => setters.SetProperty(comment => comment.ModerationStatus, status));
        }
    }

    private async Task<ModerationStatus> GetStatusFromDatabaseAsync(string kind, int id)
    {
        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        ModerationStatus status;

        if (kind == Posts)
        {
            status = await db.Set<Post>().IgnoreQueryFilters().Where(post => post.Id == id).Select(post => post.ModerationStatus).SingleAsync();
        }
        else
        {
            status = await db.Set<Comment>().IgnoreQueryFilters().Where(comment => comment.Id == id).Select(comment => comment.ModerationStatus).SingleAsync();
        }

        return status;
    }

    // ---------- the key raises a status ----------

    // The table of the automation's rule: what it sends for content in each status, and what comes back.
    // It may set Flagged or Hidden, and the status the content already has; Visible is always refused, and so is
    // Flagged for Hidden content.
    public static IEnumerable<object[]> AutomationTransitions()
    {
        var transitions = new (ModerationStatus From, ModerationStatus To, bool Allowed)[]
        {
            (ModerationStatus.Visible, ModerationStatus.Flagged, true),
            (ModerationStatus.Visible, ModerationStatus.Hidden,  true),
            (ModerationStatus.Flagged, ModerationStatus.Hidden,  true),
            (ModerationStatus.Flagged, ModerationStatus.Flagged, true),
            (ModerationStatus.Hidden,  ModerationStatus.Hidden,  true),
            (ModerationStatus.Visible, ModerationStatus.Visible, false),
            (ModerationStatus.Flagged, ModerationStatus.Visible, false),
            (ModerationStatus.Hidden,  ModerationStatus.Visible, false),
            (ModerationStatus.Hidden,  ModerationStatus.Flagged, false)
        };

        foreach (var kind in new[] { Posts, Comments })
        {
            foreach (var transition in transitions)
            {
                yield return [kind, transition.From, transition.To, transition.Allowed];
            }
        }
    }

    [Theory]
    [MemberData(nameof(AutomationTransitions))]
    public async Task SetStatus_WithApiKey_FollowsTheRaiseOnlyRule(string kind, ModerationStatus from, ModerationStatus to, bool allowed)
    {
        await SetStatusInDatabaseAsync(kind, ExistingId, from);

        var response = await _client.SendWithApiKeyAsync(HttpMethod.Put, RouteFor(kind, ExistingId), new { Status = to.ToString() });

        var expectedStatus      = allowed ? to : from;
        var expectedHttpStatus  = allowed ? HttpStatusCode.OK : HttpStatusCode.Forbidden;

        Assert.Equal(expectedHttpStatus, response.StatusCode);
        Assert.Equal(expectedStatus, await GetStatusFromDatabaseAsync(kind, ExistingId));
    }

    // ---------- an administrator is not narrowed by the rule ----------

    private async Task SignInAsync(string username)
    {
        var token = await AuthTestHelper.LoginAsync(_client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
    }

    // Every status from every status, on both routes: the administrator's table has no refusals.
    public static IEnumerable<object[]> EveryTransition()
    {
        var statuses = new[] { ModerationStatus.Visible, ModerationStatus.Flagged, ModerationStatus.Hidden };

        foreach (var kind in new[] { Posts, Comments })
        {
            foreach (var from in statuses)
            {
                foreach (var to in statuses)
                {
                    yield return [kind, from, to];
                }
            }
        }
    }

    [Theory]
    [MemberData(nameof(EveryTransition))]
    public async Task SetStatus_AsAdministrator_SetsAnyStatusFromAnyStatus(string kind, ModerationStatus from, ModerationStatus to)
    {
        await SetStatusInDatabaseAsync(kind, ExistingId, from);
        await SignInAsync("sandro_beno");

        var response = await _client.PutAsJsonAsync(RouteFor(kind, ExistingId), new { Status = to.ToString() });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(to, await GetStatusFromDatabaseAsync(kind, ExistingId));
    }

    // A request with an administrator's token and the key is the administrator's: the key does not take the power away.
    [Theory]
    [InlineData(Posts)]
    [InlineData(Comments)]
    public async Task SetStatus_AsAdministratorWhoAlsoSendsTheKey_MayStillSetVisible(string kind)
    {
        await SetStatusInDatabaseAsync(kind, ExistingId, ModerationStatus.Hidden);
        await SignInAsync("sandro_beno");

        var response = await _client.SendWithApiKeyAsync(HttpMethod.Put, RouteFor(kind, ExistingId), new { Status = nameof(ModerationStatus.Visible) });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(ModerationStatus.Visible, await GetStatusFromDatabaseAsync(kind, ExistingId));
    }

    // An ordinary user and a guest are refused as before; AdminControllerTests covers the guest and the ordinary user's 403.
    // This one also shows that nothing changed in the database.
    [Theory]
    [InlineData(Posts)]
    [InlineData(Comments)]
    public async Task SetStatus_AsOrdinaryUserWithoutKey_ReturnsForbiddenAndChangesNothing(string kind)
    {
        await SignInAsync("alice");

        var response = await _client.PutAsJsonAsync(RouteFor(kind, ExistingId), new { Status = nameof(ModerationStatus.Hidden) });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.Equal(ModerationStatus.Visible, await GetStatusFromDatabaseAsync(kind, ExistingId));
    }

    [Theory]
    [InlineData(Posts)]
    [InlineData(Comments)]
    public async Task SetStatus_WithApiKeyToVisible_ReturnsTheFailureEnvelope(string kind)
    {
        await SetStatusInDatabaseAsync(kind, ExistingId, ModerationStatus.Flagged);

        var response = await _client.SendWithApiKeyAsync(HttpMethod.Put, RouteFor(kind, ExistingId), new { Status = nameof(ModerationStatus.Visible) });

        var body = await response.Content.ReadFromJsonAsync<ApplicationResponse>();
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.False(body!.Succeeded);
        Assert.Equal(ResponseMessages.AutomationMayOnlyRaiseModerationStatus, body.Message);
    }

    [Theory]
    [InlineData(Posts,    ResponseMessages.PostNotFound)]
    [InlineData(Comments, ResponseMessages.CommentNotFound)]
    public async Task SetStatus_WithApiKeyForNonexistentContent_ReturnsNotFound(string kind, string expectedMessage)
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Put, RouteFor(kind, NonexistentId), new { Status = nameof(ModerationStatus.Hidden) });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(expectedMessage, await ResponseReader.ReadMessageAsync(response));
    }

    // Content that does not exist answers 404 before the rule is looked at, whatever the automation sends.
    [Theory]
    [InlineData(Posts)]
    [InlineData(Comments)]
    public async Task SetStatus_WithApiKeyToVisibleForNonexistentContent_ReturnsNotFound(string kind)
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Put, RouteFor(kind, NonexistentId), new { Status = nameof(ModerationStatus.Visible) });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
