using System.Linq.Expressions;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories.Base;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.Data.Repositories;

public class MessageRepository : BaseEntityRepository<Message>
{
    public MessageRepository(ApplicationDbContext dbContext) : base(dbContext)
    {
        
    }

    public async Task<Message?> GetMessageByIdAsync(int id)
    {
        return await GetFirstAsync(message => message.Id == id);
    }

    public async Task<Message> AddMessageAsync(Message messageToAdd)
    {
        await AddAsync(messageToAdd);
        return (await _dbSet
            .Include(message => message.SenderUser)
            .Include(message => message.Images)
            .FirstOrDefaultAsync(message => message.Id == messageToAdd.Id))!;
    }

    protected override IQueryable<Message> Query(bool track = true)
    {
        var query = _dbSet
            .Include(message => message.SenderUser)
            .Include(message => message.ReceiverUser)
            .Include(message => message.Images);

        return track ? query : query.AsNoTracking();
    }

    public async Task<List<Message>> GetConversationAsync(
        int userA,
        int userB,
        int? pageNumber = null,
        int? pageSize = null )
    {
        return await GetWhereAsync(
            InConversation(userA, userB),
            pageNumber,
            pageSize,
            orderBy: query => query.OrderByDescending(message => message.CreatedAt),
            ignoreQueryFilters: true);
    }

    public async Task<List<string>> GetConversationImageAddressesAsync(int userA, int userB)
    {
        return await _dbSet
            .Where(InConversation(userA, userB))
            .SelectMany(message => message.Images)
            .Select(image => image.Address)
            .ToListAsync();
    }

    public async Task DeleteConversationAsync(int userA, int userB)
    {
        await DeleteWhereAsync(InConversation(userA, userB));
    }

    // Marks every unread message from otherUserId to readerId as seen, wherever it sits in the conversation.
    // marked is false when there was none, so reopening a read conversation sends no MessageSeen.
    public async Task<(bool marked, DateTime seenAt)> MarkConversationAsReadAsync(int readerId, int otherUserId)
    {
        var seenAt = DateTime.UtcNow;

        // LastUpdatedAt stays as it is: it marks an edit (Message.IsEdited), and reading is not one.
        int markedCount = await _dbSet
            .Where(message =>
                message.SenderUserId   == otherUserId &&
                message.ReceiverUserId == readerId &&
                !message.Seen
            )
            .ExecuteUpdateAsync(setter => setter
                .SetProperty(message => message.Seen,   true)
                .SetProperty(message => message.SeenAt, seenAt));

        bool marked = markedCount > 0;

        return (marked, seenAt);
    }

    public async Task<int> GetUnreadConversationsCount(int userId)
    {
        return await _dbSet
            .Where(message => message.ReceiverUserId == userId && !message.Seen)
            .Select(message => message.SenderUserId)
            .Distinct()
            .CountAsync();
    }

    // Either direction between the two users.
    private Expression<Func<Message, bool>> InConversation(int userA, int userB)
    {
        return message => (message.SenderUserId == userA && message.ReceiverUserId == userB) ||
                          (message.SenderUserId == userB && message.ReceiverUserId == userA);
    }
}