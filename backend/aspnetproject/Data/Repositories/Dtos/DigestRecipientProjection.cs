namespace aspnetproject.Data.Repositories.Dtos;

// One user who gets the weekly digest, with what it reports, read in one query (UserRepository.GetDigestRecipientsAsync).
public class DigestRecipientProjection
{
    public int    Id       { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;

    public int UnreadConversationCount   { get; set; }
    public int PendingFriendRequestCount { get; set; }

    public List<DigestPostProjection> Posts { get; set; } = [];
}
