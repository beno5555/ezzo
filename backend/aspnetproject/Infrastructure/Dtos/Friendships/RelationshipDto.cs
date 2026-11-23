namespace aspnetproject.Infrastructure.Dtos.Friendships;

/// <summary>
/// Where the caller stands with another person: the friendship's status, and who sent the request.
/// A person the caller has no friendship with has no such object at all.
/// </summary>
public class RelationshipDto
{
    public string Status      { get; set; } = string.Empty;

    /// <summary>True when the caller sent the request, so the other person received it.</summary>
    public bool   IsRequester { get; set; }
}
