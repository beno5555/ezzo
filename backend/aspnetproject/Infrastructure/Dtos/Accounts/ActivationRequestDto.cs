namespace aspnetproject.Infrastructure.Dtos.Accounts;

public class ActivationRequestDto
{
    public string Email { get; set; } = string.Empty;

    // The page the email's link opens, with ?token=… added. Accepted only from an origin in Cors:AllowedOrigins;
    // without it, the email holds the plain token.
    public string? RedirectUrl { get; set; }
}
