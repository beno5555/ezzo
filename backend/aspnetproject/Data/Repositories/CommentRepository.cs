using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories.Base;
using aspnetproject.Data.Repositories.Visibility;
using Microsoft.EntityFrameworkCore;

namespace aspnetproject.Data.Repositories;

// Every read takes the caller, so a comment the caller may not read (or one on a post they may not read) is never returned.
public class CommentRepository : BaseEntityRepository<Comment>
{
    public CommentRepository(ApplicationDbContext dbContext) : base(dbContext)
    {

    }

    public async Task<Comment> AddCommentAsync(Comment comment)
    {
        await AddAsync(comment);
        return (await GetFirstAsync(commentFromDb => commentFromDb.Id == comment.Id))!;
    }

    // callerId is null for a guest.
    public async Task<Comment?> GetCommentByIdAsync(int id, int? callerId, bool isAdmin)
    {
        return await Query()
            .Where(comment => comment.Id == id)
            .Where(ModerationVisibility.CommentAndPostReadableBy(callerId, isAdmin))
            .FirstOrDefaultAsync();
    }

    public async Task<Comment?> GetCommentWithCommenterUserAndPostById(int id, int callerId, bool isAdmin)
    {
        return await _dbSet
            .Include(comment => comment.CommenterUser)
            .Include(comment => comment.Post)
            .Include(comment => comment.Post)
            .Where(comment => comment.Id == id)
            .Where(ModerationVisibility.CommentAndPostReadableBy(callerId, isAdmin))
            .FirstOrDefaultAsync();
    }

    // For an administrator's review: hidden comments included, and authors in any account state, so the mapper can name that state.
    public async Task<List<Comment>> GetSnapshotsByIdsAsync(IReadOnlyCollection<int> ids)
    {
        return await _dbSet
            .IgnoreQueryFilters()
            .AsNoTracking()
            .Include(comment => comment.CommenterUser)
            .Include(comment => comment.Post)
            .Where(comment => ids.Contains(comment.Id))
            .ToListAsync();
    }

    // The caller must already be allowed to read the post; this filters only the comments themselves.
    // The order is the caller's own comments first, newest first, then everyone else's, oldest first. A guest
    // has no comments of their own, so they get everyone's oldest first. Id breaks ties between comments
    // written in the same millisecond, so paging is deterministic.
    public async Task<List<Comment>> GetByPostIdAsync(int postId, int? callerId, bool isAdmin, int? pageNumber, int? pageSize)
    {
        // A comment with no author (an account the purge removed) has a null owner, and a guest has a null id:
        // without this check the two would count as equal and the orphaned comments would come first.
        var hasCaller = callerId.HasValue;

        var query = Query()
            .Where(comment => comment.PostId == postId)
            .Where(ModerationVisibility.CommentReadableBy(callerId, isAdmin))
            .OrderBy(comment => hasCaller && comment.CommenterUserId == callerId ? 0 : 1)
            .ThenByDescending(comment => hasCaller && comment.CommenterUserId == callerId ? comment.CreatedAt : DateTime.MinValue)
            .ThenBy(comment => comment.CreatedAt)
            .ThenBy(comment => comment.Id);

        return await Page(query, pageNumber, pageSize).ToListAsync();
    }

    // The caller's own comments, so only a hidden post can take one away.
    public async Task<List<Comment>> GetByUserIdAsync(int userId, bool isAdmin, int? pageNumber, int? pageSize)
    {
        var query = Query()
            .Where(comment => comment.CommenterUserId == userId)
            .Where(ModerationVisibility.CommentAndPostReadableBy(userId, isAdmin));

        return await Page(query, pageNumber, pageSize).ToListAsync();
    }

    // The moderation queue: every flagged comment with its post, oldest first.
    // Id breaks ties between comments written in the same millisecond.
    public async Task<List<Comment>> GetFlaggedAsync(int pageNumber, int pageSize)
    {
        var query = Query(track: false)
            .Include(comment => comment.Post)
            .Where(comment => comment.ModerationStatus == ModerationStatus.Flagged)
            .OrderBy(comment => comment.CreatedAt)
            .ThenBy(comment => comment.Id);

        return await Page(query, pageNumber, pageSize).ToListAsync();
    }

    // Set-based for the same reason as PostRepository.SetModerationStatusAsync. False when the comment does not exist.
    public async Task<bool> SetModerationStatusAsync(int id, ModerationStatus status)
    {
        int updatedCount = await _dbSet
            .Where(comment => comment.Id == id)
            .ExecuteUpdateAsync(setters => setters.SetProperty(comment => comment.ModerationStatus, status));

        return updatedCount > 0;
    }

    public async Task DeletePostCommentsAsync(int postId)
    {
        await DeleteWhereAsync(comment => comment.PostId == postId);
    }

    protected override IQueryable<Comment> Query(bool track = true)
    {
        var query = _dbSet
            .Include(comment => comment.CommenterUser);

        return track ? query : query.AsNoTracking();
    }
}
