namespace aspnetproject.Infrastructure.Dtos.Automation;

// A friend's post as the digest email shows it: enough for a line and a link, no content.
public class DigestPostDto
{
    public int    Id             { get; set; }
    public string Title          { get; set; } = string.Empty;
    public string AuthorUsername { get; set; } = string.Empty;
    public int    LikeCount      { get; set; }
}
