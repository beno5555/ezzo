using System.Net;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data;
using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.Friendships;
using aspnetproject.Infrastructure.Dtos.Messages;
using Microsoft.EntityFrameworkCore;
using aspnetproject.IntegrationTests.Fixtures;
using aspnetproject.IntegrationTests.Helpers;

namespace aspnetproject.IntegrationTests.Controllers;

public class FriendshipControllerTests : IClassFixture<DatabaseFixture>, IAsyncLifetime
{
    private readonly DatabaseFixture             _dbFixture;
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient                  _client;

    public FriendshipControllerTests(DatabaseFixture dbFixture)
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


    // Seed state for every test below, unless a test says otherwise. The caller is alice (2), who signs in first.
    // Users: 1 sandro_beno (a stranger to everyone), 2 alice, 3 bob, 4 charlie, 5 diana, 6 erin_deactivated, 7 frank_deleted.
    // Friendships: #1 alice -> bob Accepted, #2 alice -> diana Pending, #3 charlie -> alice Pending,
    //              #4 bob -> charlie Declined, #5 bob -> diana Accepted.
    // So alice has friend bob, one waiting request sent to diana, one waiting request from charlie; bob has friends alice and diana.

    private const int NonexistentUserId    = 999;
    private const int SeededFriendshipCount = 5;

    // ---------- every endpoint ----------

    [Theory]
    [InlineData("POST", "api/friendships/3")]
    [InlineData("GET", "api/friendships/3")]
    [InlineData("GET", "api/friendships/accepted/3")]
    [InlineData("GET", "api/friendships/accepted")]
    [InlineData("GET", "api/friendships/pending")]
    [InlineData("GET", "api/friendships/sent")]
    [InlineData("GET", "api/friendships/user/3")]
    [InlineData("PUT", "api/friendships/4/accept")]
    [InlineData("PUT", "api/friendships/4/decline")]
    [InlineData("DELETE", "api/friendships/3")]
    public async Task AllEndpoints_WithoutToken_ReturnUnauthorized(string method, string url)
    {
        var response = await _client.SendAsync(new HttpRequestMessage(new HttpMethod(method), url));

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    public static TheoryData<string, string> ListsAndOutOfRangePaging()
    {
        var data = new TheoryData<string, string>();
        foreach (var list in new[] { "accepted", "pending", "sent", "user/3" })
        {
            foreach (var query in new[] { "pageNumber=0", "pageSize=0", "pageSize=" + (Constants.MaxPageSize + 1) })
            {
                data.Add(list, query);
            }
        }

        return data;
    }

    [Theory]
    [MemberData(nameof(ListsAndOutOfRangePaging))]
    public async Task ListEndpoints_WithPagingOutOfRange_ReturnBadRequest(string list, string query)
    {
        await SignInAsync("alice");

        var response = await _client.GetAsync($"api/friendships/{list}?{query}");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ---------- POST /friendships/{addresseeId} ----------

    [Fact]
    public async Task SendRequest_ToUserWithNoRelationship_CreatesAPendingRequest()
    {
        await SignInAsync("alice");

        var response = await _client.PostAsync("api/friendships/1", null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.EndsWith("api/friendships/1", response.Headers.Location!.AbsolutePath);
        var friendship = await ResponseReader.ReadDataAsync<MinimalFriendshipDto>(response);
        Assert.Equal(2, friendship.RequesterId);
        Assert.Equal(1, friendship.AddresseeId);
        Assert.Equal(nameof(FriendshipStatus.Pending), friendship.Status);
        Assert.Equal(new[] { 5, 1 }, await OtherUserIdsAsync("api/friendships/sent"));
    }

    [Fact]
    public async Task SendRequest_ToOneself_ReturnsBadRequest()
    {
        await SignInAsync("alice");

        var response = await _client.PostAsync("api/friendships/2", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.FriendRequestCannotBeSentToOneself, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
    }

    [Theory]
    [InlineData(NonexistentUserId)]
    [InlineData(6)] // deactivated
    [InlineData(7)] // soft-deleted
    public async Task SendRequest_ToUserWhoIsNotAvailable_ReturnsBadRequest(int addresseeId)
    {
        await SignInAsync("alice");

        var response = await _client.PostAsync($"api/friendships/{addresseeId}", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.AddresseeNotFound, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
    }

    [Theory]
    [InlineData(5)] // alice already asked diana
    [InlineData(4)] // charlie already asked alice
    public async Task SendRequest_WhenARequestIsAlreadyWaiting_ReturnsBadRequest(int addresseeId)
    {
        await SignInAsync("alice");

        var response = await _client.PostAsync($"api/friendships/{addresseeId}", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.PendingRequestAlreadyExists, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
    }

    [Fact]
    public async Task SendRequest_ToAnAcceptedFriend_ReturnsBadRequest()
    {
        await SignInAsync("alice");

        var response = await _client.PostAsync("api/friendships/3", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.AlreadyFriends, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
    }

    [Fact]
    public async Task SendRequest_AgainAfterTheSameSenderWasDeclined_ReopensTheSameRow()
    {
        await SignInAsync("bob"); // bob's request to charlie (#4) was declined
        var declinedRow = await FindFriendshipAsync(requesterId: 3, addresseeId: 4);

        var response = await _client.PostAsync("api/friendships/4", null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<MinimalFriendshipDto>(response);
        Assert.Equal(3, friendship.RequesterId);
        Assert.Equal(4, friendship.AddresseeId);
        Assert.Equal(nameof(FriendshipStatus.Pending), friendship.Status);
        var reopenedRow = await FindFriendshipAsync(requesterId: 3, addresseeId: 4);
        Assert.Equal(declinedRow!.Id, reopenedRow!.Id);
        Assert.True(reopenedRow.SentAt > declinedRow.SentAt);
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
        Assert.Contains(4, await OtherUserIdsAsync("api/friendships/sent"));
        await SignInAsync("charlie");
        Assert.Contains(3, await OtherUserIdsAsync("api/friendships/pending"));
    }

    [Fact]
    public async Task SendRequest_BackToTheSenderWhoseRequestWasDeclined_ReplacesTheRowWithTheRolesReversed()
    {
        await SignInAsync("charlie"); // charlie declined bob's request (#4) and now asks bob

        var response = await _client.PostAsync("api/friendships/3", null);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<MinimalFriendshipDto>(response);
        Assert.Equal(4, friendship.RequesterId);
        Assert.Equal(3, friendship.AddresseeId);
        Assert.Equal(nameof(FriendshipStatus.Pending), friendship.Status);
        Assert.Null(await FindFriendshipAsync(requesterId: 3, addresseeId: 4));
        Assert.NotEqual(4, (await FindFriendshipAsync(requesterId: 4, addresseeId: 3))!.Id);
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
        await SignInAsync("bob");
        Assert.Contains(4, await OtherUserIdsAsync("api/friendships/pending"));
        Assert.DoesNotContain(4, await OtherUserIdsAsync("api/friendships/sent"));
    }

    // ---------- GET /friendships/{friendId} ----------

    [Theory]
    [InlineData("alice", 3, "bob", nameof(FriendshipStatus.Accepted))]
    [InlineData("bob", 2, "alice", nameof(FriendshipStatus.Accepted))]
    [InlineData("alice", 5, "diana", nameof(FriendshipStatus.Pending))]   // a request alice sent
    [InlineData("diana", 2, "alice", nameof(FriendshipStatus.Pending))]   // the same request, seen by its addressee
    [InlineData("alice", 4, "charlie", nameof(FriendshipStatus.Pending))] // a request alice received
    [InlineData("bob", 4, "charlie", nameof(FriendshipStatus.Declined))]
    [InlineData("charlie", 3, "bob", nameof(FriendshipStatus.Declined))]
    public async Task GetRelationship_WithAUserInAnyState_ReturnsTheOtherUserAndTheStatus(
        string caller, int friendId, string expectedUsername, string expectedStatus)
    {
        await SignInAsync(caller);

        var response = await _client.GetAsync($"api/friendships/{friendId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<StandardFriendshipDto>(response);
        Assert.Equal(friendId, friendship.OtherUser.Id);
        Assert.Equal(expectedUsername, friendship.OtherUser.Username);
        Assert.Equal(expectedStatus, friendship.Status);
    }

    [Theory]
    [InlineData(1)]                 // a stranger
    [InlineData(2)]                 // oneself
    [InlineData(NonexistentUserId)]
    public async Task GetRelationship_WithoutARelationship_ReturnsNotFound(int friendId)
    {
        await SignInAsync("alice");

        var response = await _client.GetAsync($"api/friendships/{friendId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ResponseMessages.RelationshipNotFound, await ResponseReader.ReadMessageAsync(response));
    }

    // ---------- GET /friendships/accepted/{friendId} ----------

    [Theory]
    [InlineData("alice", 3, "bob")]
    [InlineData("bob", 2, "alice")]
    public async Task GetAcceptedFriendship_WithAnAcceptedFriend_ReturnsTheFriend(string caller, int friendId, string expectedUsername)
    {
        await SignInAsync(caller);

        var response = await _client.GetAsync($"api/friendships/accepted/{friendId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<AcceptedFriendshipDto>(response);
        Assert.Equal(friendId, friendship.OtherUser.Id);
        Assert.Equal(expectedUsername, friendship.OtherUser.Username);
        Assert.Equal(nameof(FriendshipStatus.Accepted), friendship.Status);
    }

    [Theory]
    [InlineData("alice", 5)] // waiting, sent by alice
    [InlineData("alice", 4)] // waiting, sent to alice
    [InlineData("bob", 4)]   // declined
    [InlineData("alice", 1)] // a stranger
    [InlineData("alice", 2)] // oneself
    [InlineData("alice", NonexistentUserId)]
    public async Task GetAcceptedFriendship_WithoutAnAcceptedFriendship_ReturnsNotFound(string caller, int friendId)
    {
        await SignInAsync(caller);

        var response = await _client.GetAsync($"api/friendships/accepted/{friendId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ResponseMessages.FriendshipNotFound, await ResponseReader.ReadMessageAsync(response));
    }

    [Fact]
    public async Task GetAcceptedFriendship_WithAFriendWhoDeactivatedTheirAccount_ReturnsThemUnderTheDeactivatedName()
    {
        await DeactivateAsync(userId: 3);
        await SignInAsync("alice");

        var response = await _client.GetAsync("api/friendships/accepted/3");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<AcceptedFriendshipDto>(response);
        Assert.Equal(3, friendship.OtherUser.Id);
        Assert.Equal(ResponseMessages.AccountDeactivatedUsername, friendship.OtherUser.Username);
    }

    [Fact]
    public async Task GetAcceptedFriendship_WithAFriendWhoseAccountWasDeleted_ReturnsThemUnderTheDeletedName()
    {
        await SoftDeleteAsync(userId: 5);
        await SignInAsync("bob"); // bob and diana are friends (#5)

        var response = await _client.GetAsync("api/friendships/accepted/5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<AcceptedFriendshipDto>(response);
        Assert.Equal(ResponseMessages.AccountDeletedUsername, friendship.OtherUser.Username);
    }

    // ---------- GET /friendships/accepted ----------

    [Theory]
    [InlineData("alice", new[] { 3 })]
    [InlineData("bob", new[] { 2, 5 })]
    [InlineData("diana", new[] { 3 })]
    [InlineData("charlie", new int[0])] // a declined request is not a friendship
    public async Task GetFriendships_ForTheCaller_ListsOnlyAcceptedFriends(string caller, int[] expectedFriendIds)
    {
        await SignInAsync(caller);

        var friendships = await GetFriendshipListAsync("api/friendships/accepted");

        Assert.Equal(expectedFriendIds, friendships.Select(friendship => friendship.OtherUser.Id!.Value));
        Assert.All(friendships, friendship => Assert.Equal(nameof(FriendshipStatus.Accepted), friendship.Status));
    }

    [Fact]
    public async Task GetFriendships_WithFriendsWhoseAccountsAreNotAvailable_ListsThemUnderThePlaceholderNames()
    {
        await DeactivateAsync(userId: 2);
        await SoftDeleteAsync(userId: 5);
        await SignInAsync("bob"); // friends: alice (deactivated), then diana (deleted)

        var friendships = await GetFriendshipListAsync("api/friendships/accepted");

        Assert.Equal(new[] { 2, 5 }, friendships.Select(friendship => friendship.OtherUser.Id!.Value));
        Assert.Equal(
            new[] { ResponseMessages.AccountDeactivatedUsername, ResponseMessages.AccountDeletedUsername },
            friendships.Select(friendship => friendship.OtherUser.Username));
    }

    [Fact]
    public async Task GetFriendships_WithPageSizeOne_ReturnsOneFriendPerPageAndThenNothing()
    {
        await SignInAsync("bob"); // friends: alice, then diana

        var firstPage  = await OtherUserIdsAsync("api/friendships/accepted?pageNumber=1&pageSize=1");
        var secondPage = await OtherUserIdsAsync("api/friendships/accepted?pageNumber=2&pageSize=1");
        var thirdPage  = await OtherUserIdsAsync("api/friendships/accepted?pageNumber=3&pageSize=1");

        Assert.Equal(new[] { 2 }, firstPage);
        Assert.Equal(new[] { 5 }, secondPage);
        Assert.Empty(thirdPage);
    }

    // ---------- GET /friendships/pending ----------

    [Theory]
    [InlineData("alice", new[] { 4 })]
    [InlineData("diana", new[] { 2 })]
    [InlineData("bob", new int[0])]     // bob has no waiting request: friendship #4 was declined
    [InlineData("charlie", new int[0])] // charlie's only request is one he sent
    public async Task GetPendingRequests_ForTheCaller_ListsOnlyWaitingRequestsSentToThem(string caller, int[] expectedRequesterIds)
    {
        await SignInAsync(caller);

        var requests = await GetFriendshipListAsync("api/friendships/pending");

        Assert.Equal(expectedRequesterIds, requests.Select(request => request.OtherUser.Id!.Value));
        Assert.All(requests, request => Assert.Equal(nameof(FriendshipStatus.Pending), request.Status));
    }

    [Fact]
    public async Task GetPendingRequests_WithPageSizeTwo_PagesThroughRequestsInTheOrderTheRowsWereCreated()
    {
        // diana already has alice's request; charlie and sandro_beno now ask her too.
        await SendRequestAsync("charlie", addresseeId: 5);
        await SendRequestAsync("sandro_beno", addresseeId: 5);
        await SignInAsync("diana");

        var firstPage  = await OtherUserIdsAsync("api/friendships/pending?pageNumber=1&pageSize=2");
        var secondPage = await OtherUserIdsAsync("api/friendships/pending?pageNumber=2&pageSize=2");
        var thirdPage  = await OtherUserIdsAsync("api/friendships/pending?pageNumber=3&pageSize=2");

        Assert.Equal(new[] { 2, 4 }, firstPage);
        Assert.Equal(new[] { 1 }, secondPage);
        Assert.Empty(thirdPage);
    }

    // ---------- GET /friendships/sent ----------

    [Theory]
    [InlineData("alice", new[] { 5 })]
    [InlineData("charlie", new[] { 2 })]
    [InlineData("bob", new int[0])]   // bob's request to charlie was declined, so it no longer waits
    [InlineData("diana", new int[0])] // diana only received a request
    public async Task GetSentRequests_ForTheCaller_ListsOnlyWaitingRequestsTheyMade(string caller, int[] expectedAddresseeIds)
    {
        await SignInAsync(caller);

        var requests = await GetFriendshipListAsync("api/friendships/sent");

        Assert.Equal(expectedAddresseeIds, requests.Select(request => request.OtherUser.Id!.Value));
        Assert.All(requests, request => Assert.Equal(nameof(FriendshipStatus.Pending), request.Status));
    }

    [Fact]
    public async Task GetSentRequests_WithPageSizeOne_ReturnsOneRequestPerPageAndThenNothing()
    {
        await SendRequestAsync("alice", addresseeId: 1); // alice's sent requests: diana, then sandro_beno

        var firstPage  = await OtherUserIdsAsync("api/friendships/sent?pageNumber=1&pageSize=1");
        var secondPage = await OtherUserIdsAsync("api/friendships/sent?pageNumber=2&pageSize=1");
        var thirdPage  = await OtherUserIdsAsync("api/friendships/sent?pageNumber=3&pageSize=1");

        Assert.Equal(new[] { 5 }, firstPage);
        Assert.Equal(new[] { 1 }, secondPage);
        Assert.Empty(thirdPage);
    }

    // ---------- GET /friendships/user/{userId} ----------

    [Fact]
    public async Task GetFriendsOf_AnotherUser_ListsThatUsersFriendsNotTheCallers()
    {
        await SignInAsync("alice");

        var friendships = await GetFriendshipListAsync("api/friendships/user/3"); // bob: alice and diana

        Assert.Equal(new[] { 2, 5 }, friendships.Select(friendship => friendship.OtherUser.Id!.Value));
        Assert.Equal(new[] { "alice", "diana" }, friendships.Select(friendship => friendship.OtherUser.Username));
    }

    [Fact]
    public async Task GetFriendsOf_UserWithNoAcceptedFriends_ReturnsAnEmptyList()
    {
        await SignInAsync("alice");

        var response = await _client.GetAsync("api/friendships/user/4"); // charlie: one declined, one waiting request

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(await ResponseReader.ReadListAsync<StandardFriendshipDto>(response));
    }

    [Fact]
    public async Task GetFriendsOf_WithPageSizeOne_ReturnsOneFriendPerPageAndThenNothing()
    {
        await SignInAsync("alice");

        var firstPage  = await OtherUserIdsAsync("api/friendships/user/3?pageNumber=1&pageSize=1");
        var secondPage = await OtherUserIdsAsync("api/friendships/user/3?pageNumber=2&pageSize=1");
        var thirdPage  = await OtherUserIdsAsync("api/friendships/user/3?pageNumber=3&pageSize=1");

        Assert.Equal(new[] { 2 }, firstPage);
        Assert.Equal(new[] { 5 }, secondPage);
        Assert.Empty(thirdPage);
    }

    [Theory]
    [InlineData(NonexistentUserId)]
    [InlineData(6)] // deactivated
    [InlineData(7)] // soft-deleted
    public async Task GetFriendsOf_UserWhoIsNotAvailable_ReturnsNotFound(int userId)
    {
        await SignInAsync("alice");

        var response = await _client.GetAsync($"api/friendships/user/{userId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ResponseMessages.UserNotFound, await ResponseReader.ReadMessageAsync(response));
    }

    // ---------- PUT /friendships/{requesterId}/accept ----------

    [Fact]
    public async Task AcceptRequest_ByTheAddressee_MakesThemFriendsOnBothLists()
    {
        await SignInAsync("alice"); // accepts charlie's request (#3)

        var response = await _client.PutAsync("api/friendships/4/accept", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<StandardFriendshipDto>(response);
        Assert.Equal(4, friendship.OtherUser.Id);
        Assert.Equal(nameof(FriendshipStatus.Accepted), friendship.Status);
        Assert.NotNull(friendship.LastUpdatedAt);
        Assert.Empty(await OtherUserIdsAsync("api/friendships/pending"));
        Assert.Equal(new[] { 3, 4 }, await OtherUserIdsAsync("api/friendships/accepted"));
        await SignInAsync("charlie");
        Assert.Empty(await OtherUserIdsAsync("api/friendships/sent"));
        Assert.Equal(new[] { 2 }, await OtherUserIdsAsync("api/friendships/accepted"));
    }

    [Theory]
    [InlineData("alice", 5)]   // alice sent this request herself: the sender cannot accept it
    [InlineData("bob", 4)]     // bob is not the addressee of charlie's request
    [InlineData("alice", 1)]   // no relationship
    [InlineData("alice", 2)]   // oneself
    [InlineData("alice", NonexistentUserId)]
    public async Task AcceptRequest_ByAnyoneButTheAddressee_ReturnsBadRequestAndChangesNothing(string caller, int requesterId)
    {
        await SignInAsync(caller);

        var response = await _client.PutAsync($"api/friendships/{requesterId}/accept", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.PendingRequestNotFound, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(new[] { 4 }, await OtherUserIdsAsync("api/friendships/pending", asUser: "alice"));
        Assert.Equal(new[] { 3 }, await OtherUserIdsAsync("api/friendships/accepted", asUser: "alice"));
    }

    [Theory]
    [InlineData("bob", 2)]     // already accepted (#1, alice -> bob)
    [InlineData("charlie", 3)] // already declined (#4, bob -> charlie)
    public async Task AcceptRequest_WhenTheRequestIsNotWaiting_ReturnsBadRequest(string caller, int requesterId)
    {
        await SignInAsync(caller);

        var response = await _client.PutAsync($"api/friendships/{requesterId}/accept", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.PendingRequestNotFound, await ResponseReader.ReadMessageAsync(response));
    }

    [Fact]
    public async Task AcceptRequest_ASecondTime_ReturnsBadRequest()
    {
        await SignInAsync("alice");
        var firstResponse = await _client.PutAsync("api/friendships/4/accept", null);

        var response = await _client.PutAsync("api/friendships/4/accept", null);

        Assert.Equal(HttpStatusCode.OK, firstResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.PendingRequestNotFound, await ResponseReader.ReadMessageAsync(response));
    }

    // ---------- PUT /friendships/{requesterId}/decline ----------

    [Fact]
    public async Task DeclineRequest_ByTheAddressee_RemovesItFromBothWaitingLists()
    {
        await SignInAsync("alice"); // declines charlie's request (#3)

        var response = await _client.PutAsync("api/friendships/4/decline", null);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var friendship = await ResponseReader.ReadDataAsync<StandardFriendshipDto>(response);
        Assert.Equal(4, friendship.OtherUser.Id);
        Assert.Equal(nameof(FriendshipStatus.Declined), friendship.Status);
        Assert.Empty(await OtherUserIdsAsync("api/friendships/pending"));
        Assert.Equal(new[] { 3 }, await OtherUserIdsAsync("api/friendships/accepted"));
        Assert.Equal(nameof(FriendshipStatus.Declined), (await GetRelationshipAsync(4)).Status);
        await SignInAsync("charlie");
        Assert.Empty(await OtherUserIdsAsync("api/friendships/sent"));
        Assert.Empty(await OtherUserIdsAsync("api/friendships/accepted"));
    }

    [Theory]
    [InlineData("alice", 5)]   // alice sent this request herself: the sender cannot decline it
    [InlineData("bob", 4)]     // bob is not the addressee of charlie's request
    [InlineData("alice", 1)]   // no relationship
    [InlineData("alice", 2)]   // oneself
    [InlineData("alice", NonexistentUserId)]
    public async Task DeclineRequest_ByAnyoneButTheAddressee_ReturnsBadRequestAndChangesNothing(string caller, int requesterId)
    {
        await SignInAsync(caller);

        var response = await _client.PutAsync($"api/friendships/{requesterId}/decline", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.PendingRequestNotFound, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(new[] { 4 }, await OtherUserIdsAsync("api/friendships/pending", asUser: "alice"));
        Assert.Equal(new[] { 5 }, await OtherUserIdsAsync("api/friendships/sent", asUser: "alice"));
    }

    [Theory]
    [InlineData("bob", 2)]     // already accepted (#1, alice -> bob): a decline must not end a friendship
    [InlineData("charlie", 3)] // already declined (#4, bob -> charlie)
    public async Task DeclineRequest_WhenTheRequestIsNotWaiting_ReturnsBadRequestAndChangesNothing(string caller, int requesterId)
    {
        await SignInAsync(caller);
        var before = (await GetRelationshipAsync(requesterId)).Status;

        var response = await _client.PutAsync($"api/friendships/{requesterId}/decline", null);

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(ResponseMessages.PendingRequestNotFound, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(before, (await GetRelationshipAsync(requesterId)).Status);
    }

    // ---------- DELETE /friendships/{friendId} ----------
    // alice (2) and bob (3) are accepted friends with a seeded conversation. Removing the friendship deletes it.

    [Fact]
    public async Task RemoveRelationship_AcceptedFriend_RemovesThemFromBothFriendLists()
    {
        await SignInAsync("alice");
        var messagesBefore = await ConversationMessageCountAsync(userId: 2, otherUserId: 3);

        var response = await _client.DeleteAsync("api/friendships/3");

        Assert.True(messagesBefore > 0);
        Assert.Equal(0, await ConversationMessageCountAsync(userId: 2, otherUserId: 3));
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(ResponseMessages.RelationshipRemoved, await ResponseReader.ReadMessageAsync(response));
        Assert.Empty(await OtherUserIdsAsync("api/friendships/accepted"));
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync("api/friendships/3")).StatusCode);
        await SignInAsync("bob");
        Assert.Equal(new[] { 5 }, await OtherUserIdsAsync("api/friendships/accepted"));
    }

    [Fact]
    public async Task RemoveRelationship_AWaitingRequestByItsSender_CancelsItAndAllowsANewOne()
    {
        await SignInAsync("alice"); // cancels the request she sent to diana (#2)

        var response = await _client.DeleteAsync("api/friendships/5");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(await OtherUserIdsAsync("api/friendships/sent"));
        await SignInAsync("diana");
        Assert.Empty(await OtherUserIdsAsync("api/friendships/pending"));
        await SignInAsync("alice");
        Assert.Equal(HttpStatusCode.Created, (await _client.PostAsync("api/friendships/5", null)).StatusCode);
    }

    [Fact]
    public async Task RemoveRelationship_AWaitingRequestByItsAddressee_RemovesItFromTheSendersSentList()
    {
        await SignInAsync("alice"); // removes the request charlie sent her (#3)

        var response = await _client.DeleteAsync("api/friendships/4");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Empty(await OtherUserIdsAsync("api/friendships/pending"));
        await SignInAsync("charlie");
        Assert.Empty(await OtherUserIdsAsync("api/friendships/sent"));
    }

    [Fact]
    public async Task RemoveRelationship_ADeclinedRequest_RemovesTheRow()
    {
        await SignInAsync("bob"); // removes the declined request to charlie (#4)

        var response = await _client.DeleteAsync("api/friendships/4");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync("api/friendships/4")).StatusCode);
        Assert.Equal(SeededFriendshipCount - 1, await FriendshipCountAsync());
    }

    [Theory]
    [InlineData(1)] // a stranger
    [InlineData(2)] // oneself
    [InlineData(NonexistentUserId)]
    public async Task RemoveRelationship_WithoutARelationship_ReturnsNotFound(int friendId)
    {
        await SignInAsync("alice");

        var response = await _client.DeleteAsync($"api/friendships/{friendId}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        Assert.Equal(ResponseMessages.RelationshipNotFound, await ResponseReader.ReadMessageAsync(response));
        Assert.Equal(SeededFriendshipCount, await FriendshipCountAsync());
    }

    [Fact]
    public async Task RemoveRelationship_ConversationWithPhotos_RemovesTheirFiles()
    {
        var fromAlice = await SendPhotoMessageAsync("alice", receiverId: 3, TestImages.Jpeg(1));
        var fromBob   = await SendPhotoMessageAsync("bob", receiverId: 2, TestImages.Png(2));

        var response = await _client.DeleteAsync("api/friendships/2"); // bob removes alice

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        foreach (var address in fromAlice.Images.Concat(fromBob.Images).Select(image => image.Address))
        {
            Assert.Equal(HttpStatusCode.NotFound, (await _client.GetAsync(address)).StatusCode);
        }
        Assert.Empty(Directory.EnumerateFiles(_factory.UploadFolder));
    }

    // ---------- helpers ----------

    // Signs in as the user, who stays signed in on the shared client until the next call.
    private async Task SignInAsync(string username)
    {
        var token = await AuthTestHelper.LoginAsync(_client, username, TestDataSeeder.SharedPlaintextPassword);
        AuthTestHelper.AttachToken(_client, token);
    }

    private async Task SendRequestAsync(string sender, int addresseeId)
    {
        await SignInAsync(sender);
        var response = await _client.PostAsync($"api/friendships/{addresseeId}", null);
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task<List<StandardFriendshipDto>> GetFriendshipListAsync(string url)
    {
        var response = await _client.GetAsync(url);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ResponseReader.ReadListAsync<StandardFriendshipDto>(response);
    }

    // The ids of the other users on a list, in list order. asUser signs in as that user first.
    private async Task<int[]> OtherUserIdsAsync(string url, string? asUser = null)
    {
        if (asUser is not null)
        {
            await SignInAsync(asUser);
        }

        var friendships = await GetFriendshipListAsync(url);
        return friendships.Select(friendship => friendship.OtherUser.Id!.Value).ToArray();
    }

    private async Task<StandardFriendshipDto> GetRelationshipAsync(int friendId)
    {
        var response = await _client.GetAsync($"api/friendships/{friendId}");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return await ResponseReader.ReadDataAsync<StandardFriendshipDto>(response);
    }

    private async Task DeactivateAsync(int userId)
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());
        await db.Users.Where(user => user.Id == userId).ExecuteUpdateAsync(setters =>
            setters.SetProperty(user => user.AccountDeactivatedAt, DateTime.UtcNow));
    }

    private async Task SoftDeleteAsync(int userId)
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());
        await db.Users.Where(user => user.Id == userId).ExecuteUpdateAsync(setters =>
            setters.SetProperty(user => user.AccountDeletedAt, DateTime.UtcNow));
    }

    private async Task<Friendship?> FindFriendshipAsync(int requesterId, int addresseeId)
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());
        return await db.Friendships.AsNoTracking().SingleOrDefaultAsync(friendship =>
            friendship.RequesterUserId == requesterId && friendship.AddresseeUserId == addresseeId);
    }

    private async Task<int> ConversationMessageCountAsync(int userId, int otherUserId)
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());
        return await db.Messages.CountAsync(message =>
            (message.SenderUserId == userId && message.ReceiverUserId == otherUserId) ||
            (message.SenderUserId == otherUserId && message.ReceiverUserId == userId));
    }

    private async Task<int> FriendshipCountAsync()
    {
        await using var db = new ApplicationDbContext(_dbFixture.GetOptions());
        return await db.Friendships.CountAsync();
    }

    // Signs in as the sender, who stays signed in, and sends one photo.
    private async Task<SentMessageDto> SendPhotoMessageAsync(string sender, int receiverId, byte[] photo)
    {
        await SignInAsync(sender);

        var file     = new ImageFormFile(photo, "photo", TestImages.JpegContentType);
        var response = await _client.PostAsync($"api/messages/{receiverId}", MessageForm.Create(null, file));

        return await ResponseReader.ReadDataAsync<SentMessageDto>(response);
    }
}
