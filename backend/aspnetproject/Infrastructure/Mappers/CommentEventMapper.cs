using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class CommentEventMapper
{
    /// <summary>
    /// assumes applied .Include() on CommenterUser
    /// </summary>
    public static CommentCreatedEventDto ToCreatedEvent(Comment comment)
    {
        var created = new CommentCreatedEventDto();
        CopyCommentFields(created, comment);

        return created;
    }

    /// <summary>
    /// assumes applied .Include() on CommenterUser
    /// </summary>
    public static CommentEditedEventDto ToEditedEvent(Comment comment)
    {
        var edited = new CommentEditedEventDto();
        CopyCommentFields(edited, comment);

        return edited;
    }

    private static void CopyCommentFields(CommentEventDto eventDto, Comment comment)
    {
        eventDto.CommentId        = comment.Id;
        eventDto.Text             = comment.CommentContent;
        eventDto.PostId           = comment.PostId;
        eventDto.AuthorId         = comment.CommenterUserId;
        eventDto.AuthorUsername   = UsernameMapper.ResolveUsername(comment.CommenterUser, comment.CommenterUserId);
        eventDto.ModerationStatus = comment.ModerationStatus;
    }
}
