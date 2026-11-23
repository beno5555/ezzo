using aspnetproject.Infrastructure.Dtos.Users;

namespace aspnetproject.Infrastructure.Dtos.Friendships;

public class StandardFriendshipDto
{
    public MinimalUserDto OtherUser     { get; set; } = null!;
    public string         Status        { get; set; } = string.Empty;
    public DateTime       SentAt        { get; set; }
    public DateTime?      LastUpdatedAt { get; set; }

    /// <summary>
    /// True when the user the row is read for sent the request, so <see cref="OtherUser"/> received it.
    /// That user is the caller, except on <c>api/friendships/user/{userId}</c>, which reads for that user.
    /// </summary>
    public bool           IsRequester   { get; set; }
}