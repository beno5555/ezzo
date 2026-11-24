using aspnetproject.Infrastructure.Dtos.Friendships;

namespace aspnetproject.Infrastructure.Dtos.Users;

/// <summary>
/// A row of the user search. <see cref="Relationship"/> is the signed-in caller's friendship with this user,
/// and is null for a guest, for the caller's own row and for a user the caller has no friendship with.
/// </summary>
public class SearchUserDto
{
    public int              Id           { get; set; }
    public string           Username     { get; set; } = string.Empty;
    public RelationshipDto? Relationship { get; set; }
}
