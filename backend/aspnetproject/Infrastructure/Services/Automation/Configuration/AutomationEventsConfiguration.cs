namespace aspnetproject.Infrastructure.Services.Automation.Configuration;

// Section AutomationEvents. Events are off by default, so a fresh clone, the test suite and a cloud session run without
// n8n. With events on, startup fails without BaseUrl or SigningSecret, because every event would otherwise be lost.
// Timeout bounds the one attempt each event gets; it must be positive, as HttpClient refuses anything else.
public class AutomationEventsConfiguration
{
    public const string SectionName = "AutomationEvents";

    public const string BaseUrlMissingMessage =
        "AutomationEvents:BaseUrl is required when AutomationEvents:Enabled is true.";
    public const string SigningSecretMissingMessage =
        "AutomationEvents:SigningSecret is required when AutomationEvents:Enabled is true.";
    public const string TimeoutNotPositiveMessage =
        "AutomationEvents:Timeout must be longer than zero.";

    public bool     Enabled       { get; set; } = false;
    public string   BaseUrl       { get; set; } = string.Empty;
    public string   SigningSecret { get; set; } = string.Empty;
    public TimeSpan Timeout       { get; set; } = TimeSpan.FromSeconds(3);

    public bool HasBaseUrlIfEnabled()
    {
        return !Enabled || !string.IsNullOrWhiteSpace(BaseUrl);
    }

    public bool HasSigningSecretIfEnabled()
    {
        return !Enabled || !string.IsNullOrWhiteSpace(SigningSecret);
    }

    public bool HasPositiveTimeout()
    {
        return Timeout > TimeSpan.Zero;
    }
}
