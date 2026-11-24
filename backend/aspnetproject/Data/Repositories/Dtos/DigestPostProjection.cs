namespace aspnetproject.Data.Repositories.Dtos;

// One friend's post in a digest row, with its like count computed in the same query.
public class DigestPostProjection
{
    public int    Id             { get; set; }
    public string Title          { get; set; } = string.Empty;
    public string AuthorUsername { get; set; } = string.Empty;
    public int    LikeCount      { get; set; }
}
