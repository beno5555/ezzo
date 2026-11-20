using aspnetproject.Common.Domain;
using aspnetproject.Common.ProjectConstants;
using aspnetproject.Common.ProjectConstants.Enums;
using aspnetproject.Data.Models;
using aspnetproject.Data.Repositories;
using aspnetproject.Infrastructure.Dtos.Moderation;
using aspnetproject.Infrastructure.Mappers;
using aspnetproject.Infrastructure.Queries;
using aspnetproject.Infrastructure.Services.BusinessLogic.Base;
using aspnetproject.Infrastructure.Services.Logging;

namespace aspnetproject.Infrastructure.Services.BusinessLogic.Content;

// A direct status change by an administrator or by the automation, and the queue of flagged content to decide on.
// Every read applies the resulting visibility rule; this class only stores it.
public class ModerationService : BaseService
{
    private readonly PostRepository    _postRepository;
    private readonly CommentRepository _commentRepository;

    public ModerationService(
        PostRepository postRepository,
        CommentRepository commentRepository,
        DatabaseLogger dbLogger
        ) : base(dbLogger)
    {
        _postRepository    = postRepository;
        _commentRepository = commentRepository;
    }

    // isAutomation: the caller is the automation, which may only raise a status (AutomationMayRaise). An administrator may set any.
    public async Task<ModerationResponse> SetPostStatusAsync(int id, ModerationStatus status, bool isAutomation)
    {
        var response = new ModerationResponse();
        var post     = await _postRepository.GetByIdAsync(id);

        if (post is not null)
        {
            var previousStatus = post.ModerationStatus;
            bool isAllowed     = !isAutomation || AutomationMayRaise(previousStatus, status);

            if (isAllowed)
            {
                post.ModerationStatus = status;
                await _postRepository.SaveChangesAsync();

                response.Ok(ResponseMessages.ModerationStatusUpdated);
                await LogResultAsync(response.Succeeded, nameof(SetPostStatusAsync), nameof(Post), StatusChangeDetails(previousStatus, status), id);
            }
            else
            {
                response.Refuse(ResponseMessages.AutomationMayOnlyRaiseModerationStatus);
                await LogResultAsync(response.Succeeded, nameof(SetPostStatusAsync), nameof(Post), RefusedDetails(previousStatus, status), id);
            }
        }
        else
        {
            response.Fail(ResponseMessages.PostNotFound);
            await LogResultAsync(response.Succeeded, nameof(SetPostStatusAsync), nameof(Post), response.Message, id);
        }

        return response;
    }

    public async Task<ModerationResponse> SetCommentStatusAsync(int id, ModerationStatus status, bool isAutomation)
    {
        var response = new ModerationResponse();
        var comment  = await _commentRepository.GetByIdAsync(id);

        if (comment is not null)
        {
            var previousStatus = comment.ModerationStatus;
            bool isAllowed     = !isAutomation || AutomationMayRaise(previousStatus, status);

            if (isAllowed)
            {
                comment.ModerationStatus = status;
                await _commentRepository.SaveChangesAsync();

                response.Ok(ResponseMessages.ModerationStatusUpdated);
                await LogResultAsync(response.Succeeded, nameof(SetCommentStatusAsync), nameof(Comment), StatusChangeDetails(previousStatus, status), id);
            }
            else
            {
                response.Refuse(ResponseMessages.AutomationMayOnlyRaiseModerationStatus);
                await LogResultAsync(response.Succeeded, nameof(SetCommentStatusAsync), nameof(Comment), RefusedDetails(previousStatus, status), id);
            }
        }
        else
        {
            response.Fail(ResponseMessages.CommentNotFound);
            await LogResultAsync(response.Succeeded, nameof(SetCommentStatusAsync), nameof(Comment), response.Message, id);
        }

        return response;
    }

    // The two queue reads write no Log row: a successful read never does.
    public async Task<ListResponse<PostSnapshotDto>> GetFlaggedPostsAsync(PageQuery pageQuery)
    {
        var response = new ListResponse<PostSnapshotDto>();

        var posts     = await _postRepository.GetFlaggedAsync(pageQuery.PageNumber, pageQuery.PageSize);
        var snapshots = posts.Select(SnapshotMapper.ToPostSnapshot).ToList();

        response.Ok(snapshots, ResponseMessages.ModerationQueueRetrieved);

        return response;
    }

    public async Task<ListResponse<CommentSnapshotDto>> GetFlaggedCommentsAsync(PageQuery pageQuery)
    {
        var response = new ListResponse<CommentSnapshotDto>();

        var comments  = await _commentRepository.GetFlaggedAsync(pageQuery.PageNumber, pageQuery.PageSize);
        var snapshots = comments.Select(SnapshotMapper.ToCommentSnapshot).ToList();

        response.Ok(snapshots, ResponseMessages.ModerationQueueRetrieved);

        return response;
    }

    // The automation may set Flagged or Hidden, and the status the content already has, but never Visible, and never Flagged
    // on Hidden content: a human decides what is shown again.
    private bool AutomationMayRaise(ModerationStatus previousStatus, ModerationStatus status)
    {
        bool setsVisible        = status == ModerationStatus.Visible;
        bool flagsHiddenContent = status == ModerationStatus.Flagged && previousStatus == ModerationStatus.Hidden;

        return !setsVisible && !flagsHiddenContent;
    }

    private string StatusChangeDetails(ModerationStatus previousStatus, ModerationStatus status)
    {
        return $"Moderation status changed from {previousStatus} to {status}";
    }

    private string RefusedDetails(ModerationStatus previousStatus, ModerationStatus status)
    {
        return $"{ResponseMessages.AutomationMayOnlyRaiseModerationStatus}: {previousStatus} to {status}";
    }
}
