namespace aspnetproject.Infrastructure.Dtos.Automation;

// One row of GET /api/internal/digest: who gets a digest email and what it says. Only the automation reads it,
// so it carries the email address, which no user-facing shape does.
public class DigestRecipientDto
{
    public int    Id       { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;

    public int UnreadConversationCount   { get; set; }
    public int PendingFriendRequestCount { get; set; }

    public List<DigestPostDto> Posts { get; set; } = [];
}
