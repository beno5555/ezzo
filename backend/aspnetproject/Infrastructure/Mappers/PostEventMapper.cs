using aspnetproject.Data.Models;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class PostEventMapper
{
    /// <summary>
    /// assumes applied .Include() on User and Images
    /// </summary>
    public static PostCreatedEventDto ToCreatedEvent(Post post)
    {
        var created = new PostCreatedEventDto();
        CopyPostFields(created, post);

        return created;
    }

    /// <summary>
    /// assumes applied .Include() on User and Images
    /// </summary>
    public static PostEditedEventDto ToEditedEvent(Post post)
    {
        var edited = new PostEditedEventDto();
        CopyPostFields(edited, post);

        return edited;
    }

    private static void CopyPostFields(PostEventDto eventDto, Post post)
    {
        eventDto.PostId           = post.Id;
        eventDto.Title            = post.PostTitle;
        eventDto.Text             = post.PostContent;
        eventDto.PhotoAddresses   = ImageMapper.ToImageDtos(post.Images).Select(image => image.Address).ToList();
        eventDto.AuthorId         = post.UserId;
        eventDto.AuthorUsername   = UsernameMapper.ResolveUsername(post.User, post.UserId);
        eventDto.ModerationStatus = post.ModerationStatus;
    }
}
