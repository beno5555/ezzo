using System.Text.Json.Serialization;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Infrastructure.Dtos.Automation;

// What comment-created and comment-edited both say about a comment. Each event has its own type, so the name and the data stay paired.
public abstract class CommentEventDto
{
    public int    CommentId { get; set; }
    public string Text      { get; set; } = string.Empty;
    public int    PostId    { get; set; }

    // Null only for a comment whose author was purged; a comment that was just written or edited always has one.
    public int?   AuthorId       { get; set; }
    public string AuthorUsername { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter<ModerationStatus>))]
    public ModerationStatus ModerationStatus { get; set; }
}
