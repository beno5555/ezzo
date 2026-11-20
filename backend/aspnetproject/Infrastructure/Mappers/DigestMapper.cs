using aspnetproject.Data.Repositories.Dtos;
using aspnetproject.Infrastructure.Dtos.Automation;

namespace aspnetproject.Infrastructure.Mappers;

public static class DigestMapper
{
    public static DigestRecipientDto ToDigestRecipient(DigestRecipientProjection recipient)
    {
        return new DigestRecipientDto
        {
            Id                        = recipient.Id,
            Username                  = recipient.Username,
            Email                     = recipient.Email,
            UnreadConversationCount   = recipient.UnreadConversationCount,
            PendingFriendRequestCount = recipient.PendingFriendRequestCount,
            Posts                     = recipient.Posts.Select(ToDigestPost).ToList()
        };
    }

    public static DigestPostDto ToDigestPost(DigestPostProjection post)
    {
        return new DigestPostDto
        {
            Id             = post.Id,
            Title          = post.Title,
            AuthorUsername = post.AuthorUsername,
            LikeCount      = post.LikeCount
        };
    }
}
