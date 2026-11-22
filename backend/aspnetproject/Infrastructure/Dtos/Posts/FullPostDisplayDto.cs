using aspnetproject.Infrastructure.Dtos.Comments;
using aspnetproject.Infrastructure.Dtos.Images;
using aspnetproject.Infrastructure.Dtos.Users;

namespace aspnetproject.Infrastructure.Dtos.Posts;

public class FullPostDisplayDto
{
    public int    Id    { get; set; }
    public string Title { get; set; } = string.Empty;

    public MinimalUserDto Author { get; set; } = null!;
    
    public string   PostContent { get; set; } = string.Empty;
    public DateTime UploadedAt  { get; set; }

    // In upload order.
    public List<ImageDto> Images { get; set; } = [];

    public int  LikeCount    { get; set; }
    public int  CommentCount { get; set; }

    // False for a guest.
    public bool LikedByCaller { get; set; }

    // True only for the author or an administrator: nobody else is ever sent hidden content.
    public bool IsHidden { get; set; }

    // The post's comments are not part of it: a post can have thousands, so they are read by pages from
    // GET api/comments/post/{postId}. CommentCount says how many the caller may read.
}