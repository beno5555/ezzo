namespace aspnetproject.Infrastructure.Services.Automation.Configuration;

// Section AutomationApi. Key is the one secret the automation (n8n) sends in the X-Api-Key header. It has no default and
// startup does not require it: with no key configured, the API-key scheme refuses every caller.
public class AutomationApiConfiguration
{
    public const string SectionName = "AutomationApi";

    public string Key { get; set; } = string.Empty;

    public bool HasKey()
    {
        return !string.IsNullOrWhiteSpace(Key);
    }
}
