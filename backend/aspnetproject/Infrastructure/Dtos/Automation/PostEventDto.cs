using System.Text.Json.Serialization;
using aspnetproject.Common.ProjectConstants.Enums;

namespace aspnetproject.Infrastructure.Dtos.Automation;

// What post-created and post-edited both say about a post. Each event has its own type, so the name and the data stay paired.
public abstract class PostEventDto
{
    public int    PostId { get; set; }
    public string Title  { get; set; } = string.Empty;
    public string Text   { get; set; } = string.Empty;

    // The relative addresses the API returns, in upload order.
    public List<string> PhotoAddresses { get; set; } = [];

    public int    AuthorId       { get; set; }
    public string AuthorUsername { get; set; } = string.Empty;

    [JsonConverter(typeof(JsonStringEnumConverter<ModerationStatus>))]
    public ModerationStatus ModerationStatus { get; set; }
}
