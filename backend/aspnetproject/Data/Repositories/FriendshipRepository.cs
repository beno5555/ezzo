using System.Linq.Expressions;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories.Base;
using aspnetproject.Data.Repositories.Dtos;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.Data.Repositories;

public class FriendshipRepository : BaseRepository<Friendship>
{
    public FriendshipRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
        
    }

    protected override IQueryable<Friendship> Query(bool track = true)
    {
        var query = _dbSet
            .Include(friendShip => friendShip.RequesterUser)
            .Include(friendship => friendship.AddresseeUser);

        return track ? query : query.AsNoTracking();
    }

    // Without an order, SQL Server may return rows in a different order for each page, so a row could show on two pages or on none.
    private static IOrderedQueryable<Friendship> ById(IQueryable<Friendship> query) =>
        query.OrderBy(friendship => friendship.Id);

    // Request and friendship lists bypass the User query filter to load users whose accounts are deactivated or soft-deleted.
    public async Task<List<Friendship>> GetPendingRequestsAsync(int userId, int? pageNumber = null, int? pageSize = null)
    {
        return await GetAsync(userId, FriendshipStatus.Pending, pageNumber, pageSize);
    }

    public async Task<List<Friendship>> GetSentRequestsAsync(int userId, int? pageNumber = null, int? pageSize = null)
    {
        return await GetWhereAsync(friendship =>
            friendship.RequesterUserId == userId && friendship.FriendshipStatus == FriendshipStatus.Pending,
            pageNumber, pageSize, ById, ignoreQueryFilters: true);
    }
    
    private async Task<List<Friendship>> GetAsync(
        int userId,
        FriendshipStatus? status,
        int? pageNumber = null,
        int? pageSize = null
        )
    {
        return await GetWhereAsync(friendship => 
            friendship.AddresseeUserId == userId && (!status.HasValue || friendship.FriendshipStatus == status),
            pageNumber,
            pageSize,
            ById,
            ignoreQueryFilters: true);
    }

    public async Task<List<Friendship>> GetFriendshipsAsync(int userId, int? pageNumber = null, int? pageSize = null)
    {
        return await GetWhereAsync(friendship =>
            (friendship.RequesterUserId == userId || friendship.AddresseeUserId == userId) &&
            friendship.FriendshipStatus == FriendshipStatus.Accepted,
            pageNumber, pageSize, ById, ignoreQueryFilters: true);
    }

    // User search loads relationships in any status in one query for the entire results page.
    public async Task<List<Friendship>> GetFriendshipsWithAsync(int userId, List<int> otherUserIds)
    {
        return await _dbSet
            .AsNoTracking()
            .Where(friendship =>
                (friendship.RequesterUserId == userId && otherUserIds.Contains(friendship.AddresseeUserId)) ||
                (friendship.AddresseeUserId == userId && otherUserIds.Contains(friendship.RequesterUserId)))
            .ToListAsync();
    }

    public async Task<List<int>> GetFriendIdsAsync(int userId)
    {
        return await _dbSet
            .Where(friendship =>
                (friendship.RequesterUserId == userId || friendship.AddresseeUserId == userId) &&
                friendship.FriendshipStatus == FriendshipStatus.Accepted)
            .Select(friendship =>
                friendship.RequesterUserId == userId ? friendship.AddresseeUserId : friendship.RequesterUserId)
            .ToListAsync();
    }
    
    // The page of recipients first, then every birthday friend of those recipients, so a recipient's friends are never split
    // across two pages. Both read the same pairs, so they agree on who is listed.
    public async Task<List<int>> GetBirthdayRecipientIdsAsync(
        int month,
        IReadOnlyCollection<int> days,
        int pageNumber,
        int pageSize)
    {
        return await BirthdayFriendPairs(month, days)
            .Select(pair => pair.RecipientId)
            .Distinct()
            .OrderBy(recipientId => recipientId)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<BirthdayFriendProjection>> GetBirthdayFriendsAsync(int month, IReadOnlyCollection<int> days, List<int> recipientIds)
    {
        return await BirthdayFriendPairs(month, days)
            .Where(pair => recipientIds.Contains(pair.RecipientId))
            .OrderBy(pair => pair.RecipientId)
            .ThenBy(pair => pair.FriendId)
            .ToListAsync();
    }

    // Each accepted friendship seen from both sides, whoever sent the request, kept when the friend is born on one of the days
    // of the month. The joins go through Users, so its global filter leaves out deactivated and deleted accounts on either side.
    private IQueryable<BirthdayFriendProjection> BirthdayFriendPairs(int month, IReadOnlyCollection<int> days)
    {
        var accepted = _dbSet.Where(friendship => friendship.FriendshipStatus == FriendshipStatus.Accepted);

        var bothSides = accepted
            .Select(friendship => new { RecipientId = friendship.RequesterUserId, FriendId = friendship.AddresseeUserId })
            .Concat(accepted.Select(friendship => new { RecipientId = friendship.AddresseeUserId, FriendId = friendship.RequesterUserId }));

        return
            from side in bothSides
            join recipient in _dbContext.Users on side.RecipientId equals recipient.Id
            join friend in _dbContext.Users on side.FriendId equals friend.Id
            where friend.DateOfBirth.Month == month && days.Contains(friend.DateOfBirth.Day)
            select new BirthdayFriendProjection
            {
                RecipientId       = recipient.Id,
                RecipientUsername = recipient.Username,
                RecipientEmail    = recipient.Email,
                FriendId          = friend.Id,
                FriendUsername    = friend.Username
            };
    }

    public async Task<Friendship?> GetRelationshipAsync(int requesterId, int addresseeId, bool orderMatters = false)
    {
        return await GetFirstAsync(MatchRelationship(requesterId, addresseeId, orderMatters));
    }

    public async Task<Friendship?> GetAcceptedFriendshipAsync(int requesterId, int addresseeId, bool orderMatters = false)
    {
        return await GetFirstAsync(MatchRelationship(requesterId, addresseeId, orderMatters, FriendshipStatus.Accepted));
    }

    public async Task<bool> ExistsAsync(int userIdA, int userIdB, FriendshipStatus? status)
    {
        return await ExistsAsync(MatchRelationship(userIdA, userIdB, orderMatters: false, status: status));
    }

    private Expression<Func<Friendship, bool>> MatchRelationship(
        int requesterId,
        int addresseeId,
        bool orderMatters,
        FriendshipStatus? status = null
        )
    {
        return friendship => (!status.HasValue || friendship.FriendshipStatus == status) &&
            (orderMatters
                ? friendship.RequesterUserId == requesterId && friendship.AddresseeUserId == addresseeId
                : (friendship.RequesterUserId == requesterId || friendship.RequesterUserId == addresseeId) &&
                  (friendship.AddresseeUserId == requesterId || friendship.AddresseeUserId == addresseeId));
    }
}