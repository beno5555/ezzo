using aspnetproject.Infrastructure.Dtos.Users;

namespace aspnetproject.Infrastructure.Dtos.Moderation;

// What an administrator sees of a comment under review. Shared by the report list and the moderation queue.
public class CommentSnapshotDto
{
    public int    Id      { get; set; }
    public string Content { get; set; } = string.Empty;

    public MinimalUserDto Author     { get; set; } = null!;
    public int            PostId     { get; set; }
    public string         PostTitle  { get; set; } = string.Empty;
    public DateTime       UploadedAt { get; set; }

    public bool IsHidden { get; set; }
}
