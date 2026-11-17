namespace aspnetproject.Infrastructure.Dtos.Automation;

// The data of account-created. No password, no hash, no token: nothing secret leaves with an event (ADR 0008).
public class AccountCreatedEventDto
{
    public int    UserId   { get; set; }
    public string Username { get; set; } = string.Empty;
    public string Email    { get; set; } = string.Empty;
}
