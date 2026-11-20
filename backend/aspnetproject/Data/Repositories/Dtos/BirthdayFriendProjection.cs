namespace aspnetproject.Data.Repositories.Dtos;

// One side of an accepted friendship: the recipient, and a friend of theirs whose birthday it is.
public class BirthdayFriendProjection
{
    public int    RecipientId       { get; set; }
    public string RecipientUsername { get; set; } = string.Empty;
    public string RecipientEmail    { get; set; } = string.Empty;

    public int    FriendId       { get; set; }
    public string FriendUsername { get; set; } = string.Empty;
}
