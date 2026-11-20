using System.Net;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data;
using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.Internal;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;
using Microsoft.Extensions.DependencyInjection;

namespace aspnetproject.IntegrationTests.Automation;

// ---------- GET /api/internal/birthdays ----------
// Seed: alice (2), bob (3), charlie (4), diana (5), erin_deactivated (6) and frank_deleted (7) are all born on 1 January;
// sandro_beno (1) on 16 August. Accepted: alice -> bob (1) and bob -> diana (5). Pending: alice -> diana (2) and
// charlie -> alice (3). Declined: bob -> charlie (4). So on 1 January alice is told about bob, bob about alice and diana,
// and diana about bob; charlie is nobody's accepted friend and gets no row.
// The rows a test needs beyond the seed (a 29 February birthday, a friendship with a deactivated account) are added by the
// test itself and wiped by the next reset, so the shared seed and the counts other classes rely on stay as they are.
public class InternalBirthdaysTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private const string BirthdaysUrl = "api/internal/birthdays";

    private const int AliceId   = 2;
    private const int BobId     = 3;
    private const int CharlieId = 4;
    private const int DianaId   = 5;
    private const int ErinId    = 6;
    private const int FrankId   = 7;

    private const string NewYear         = "2026-01-01"; // the seed's birthday
    private const string NobodysDay      = "2026-03-15";
    private const string LeapDay         = "2028-02-29";
    private const string LeapYear28Feb   = "2028-02-28";
    private const string CommonYear28Feb = "2027-02-28";

    private readonly DatabaseFixture _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public InternalBirthdaysTests(DatabaseFixture dbFixture)
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

    private async Task<List<BirthdayRecipientDto>> GetBirthdaysAsync(string query = "")
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, $"{BirthdaysUrl}{query}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        return await ResponseReader.ReadListAsync<BirthdayRecipientDto>(response);
    }

    private static List<int> FriendIdsOf(List<BirthdayRecipientDto> rows, int recipientId) =>
        rows.Single(row => row.Id == recipientId).Friends.Select(friend => friend.Id!.Value).Order().ToList();

    private async Task<int> AddUserAsync(string username, DateTime dateOfBirth)
    {
        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var user = new User
        {
            Username = username, Email = $"{username}@example.com", DateOfBirth = dateOfBirth,
            PasswordHash = "unused", PasswordSalt = "unused", CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return user.Id;
    }

    private async Task AddFriendshipAsync(int requesterId, int addresseeId, FriendshipStatus status)
    {
        using var scope = _factory.Services.CreateScope();
        var       db    = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        db.Friendships.Add(new Friendship
        {
            RequesterUserId = requesterId, AddresseeUserId = addresseeId, FriendshipStatus = status, SentAt = DateTime.UtcNow
        });

        await db.SaveChangesAsync();
    }

    // charlie (4) gets a friend born on 29 February, so charlie's row shows whether that birthday matched.
    private async Task<int> AddLeapDayFriendOfCharlieAsync()
    {
        int leapId = await AddUserAsync("leap_day", new DateTime(2000, 2, 29));
        await AddFriendshipAsync(leapId, CharlieId, FriendshipStatus.Accepted);

        return leapId;
    }

    [Fact]
    public async Task GetBirthdays_WithDate_ReturnsOneRowPerUserWithAFriendBornThatDay()
    {
        var rows = await GetBirthdaysAsync($"?date={NewYear}");

        Assert.Equal([AliceId, BobId, DianaId], rows.Select(row => row.Id));

        var alice = rows[0];
        Assert.Equal("alice", alice.Username);
        Assert.Equal("alice@example.com", alice.Email);
        Assert.Equal("bob", Assert.Single(alice.Friends).Username);
    }

    [Fact]
    public async Task GetBirthdays_ForUserWithSeveralSuchFriends_NamesThemAllInOneRow()
    {
        var rows = await GetBirthdaysAsync($"?date={NewYear}");

        Assert.Single(rows, row => row.Id == BobId);
        Assert.Equal([AliceId, DianaId], FriendIdsOf(rows, BobId));
    }

    // alice sent the request to bob, and bob sent it to diana: each side of an accepted friendship is told about the other.
    [Fact]
    public async Task GetBirthdays_CountsAFriendshipWhoeverSentTheRequest()
    {
        var rows = await GetBirthdaysAsync($"?date={NewYear}");

        Assert.Equal([BobId], FriendIdsOf(rows, AliceId));   // alice is the requester
        Assert.Contains(AliceId, FriendIdsOf(rows, BobId));  // bob is the addressee
        Assert.Equal([BobId], FriendIdsOf(rows, DianaId));   // diana is the addressee
    }

    // alice -> diana and charlie -> alice are pending, bob -> charlie is declined; everyone involved is born on 1 January.
    [Fact]
    public async Task GetBirthdays_IgnoresPendingAndDeclinedFriendships()
    {
        var rows = await GetBirthdaysAsync($"?date={NewYear}");

        Assert.DoesNotContain(rows, row => row.Id == CharlieId);
        Assert.DoesNotContain(rows.SelectMany(row => row.Friends), friend => friend.Id == CharlieId);
        Assert.DoesNotContain(DianaId, FriendIdsOf(rows, AliceId));
    }

    [Fact]
    public async Task GetBirthdays_OnADayWithNoFriendsBirthday_ReturnsAnEmptyList()
    {
        var rows = await GetBirthdaysAsync($"?date={NobodysDay}");

        Assert.Empty(rows);
    }

    [Fact]
    public async Task GetBirthdays_On29FebruaryOfALeapYear_ListsA29FebruaryBirthday()
    {
        int leapId = await AddLeapDayFriendOfCharlieAsync();

        var rows = await GetBirthdaysAsync($"?date={LeapDay}");

        var charlie = Assert.Single(rows);
        Assert.Equal(CharlieId, charlie.Id);
        Assert.Equal(leapId, Assert.Single(charlie.Friends).Id);
    }

    [Fact]
    public async Task GetBirthdays_On28FebruaryOfACommonYear_ListsA29FebruaryBirthday()
    {
        int leapId = await AddLeapDayFriendOfCharlieAsync();

        var rows = await GetBirthdaysAsync($"?date={CommonYear28Feb}");

        var charlie = Assert.Single(rows);
        Assert.Equal(CharlieId, charlie.Id);
        Assert.Equal(leapId, Assert.Single(charlie.Friends).Id);
    }

    [Fact]
    public async Task GetBirthdays_On28FebruaryOfALeapYear_DoesNotListA29FebruaryBirthday()
    {
        await AddLeapDayFriendOfCharlieAsync();

        var rows = await GetBirthdaysAsync($"?date={LeapYear28Feb}");

        Assert.Empty(rows);
    }

    // erin (6) is deactivated and frank (7) soft-deleted; both are born on 1 January and get an accepted friendship here.
    [Fact]
    public async Task GetBirthdays_LeavesOutDeactivatedAndDeletedAccountsAsRecipientsAndAsFriends()
    {
        await AddFriendshipAsync(BobId, ErinId, FriendshipStatus.Accepted);
        await AddFriendshipAsync(FrankId, AliceId, FriendshipStatus.Accepted);

        var rows = await GetBirthdaysAsync($"?date={NewYear}");

        Assert.Equal([AliceId, BobId, DianaId], rows.Select(row => row.Id));
        Assert.Equal([BobId], FriendIdsOf(rows, AliceId));
        Assert.Equal([AliceId, DianaId], FriendIdsOf(rows, BobId));
    }

    // charlie (4) gets a friend born on today's month and day. charlie has no accepted friend in the seed, so whatever day the
    // test runs, the friend is listed only if today's date was used. 2000 is a leap year, so even 29 February has a birth date.
    [Fact]
    public async Task GetBirthdays_WithoutDate_UsesTodaysUtcDate()
    {
        var today    = DateTime.UtcNow.Date;
        int friendId = await AddUserAsync("born_today", new DateTime(2000, today.Month, today.Day));
        await AddFriendshipAsync(CharlieId, friendId, FriendshipStatus.Accepted);

        var rows = await GetBirthdaysAsync();

        Assert.Equal([friendId], FriendIdsOf(rows, CharlieId));
    }

    [Fact]
    public async Task GetBirthdays_WithPaging_SplitsTheRowsInAStableOrder()
    {
        var firstPage  = await GetBirthdaysAsync($"?date={NewYear}&pageNumber=1&pageSize=2");
        var secondPage = await GetBirthdaysAsync($"?date={NewYear}&pageNumber=2&pageSize=2");

        Assert.Equal([AliceId, BobId], firstPage.Select(row => row.Id));
        Assert.Equal([DianaId], secondPage.Select(row => row.Id));
        Assert.Equal([AliceId, DianaId], FriendIdsOf(firstPage, BobId)); // a row is never split across pages
    }

    [Theory]
    [InlineData("?date=2026-13-01")]
    [InlineData("?date=not-a-date")]
    [InlineData("?pageSize=0")]
    public async Task GetBirthdays_WithInvalidQuery_ReturnsValidationProblem(string query)
    {
        var response = await _client.SendWithApiKeyAsync(HttpMethod.Get, $"{BirthdaysUrl}{query}");

        var body = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Contains("\"errors\"", body); // the framework's validation ProblemDetails, not the envelope
    }
}
