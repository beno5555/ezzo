using System.Security.Claims;

namespace aspnetproject.Infrastructure.Services.Automation.Authentication;

// The names of the API-key scheme and of the policies built on it, and the one test of who counts as the automation.
public static class AutomationAuth
{
    public const string Scheme = "ApiKey";

    public static class Policies
    {
        // For routes under /api/internal: only the key. An administrator's token does not open them.
        public const string AutomationOnly = "AutomationOnly";

        // For the two moderation routes: an administrator, or the key.
        public const string AdministratorOrAutomation = "AdministratorOrAutomation";
    }

    // The automation is the identity the API-key scheme made. It is told apart by how it was authenticated, not by a claim,
    // so no token can claim to be it.
    public static bool IsAutomation(ClaimsPrincipal? user)
    {
        bool hasIdentity = user is not null;

        return hasIdentity && user!.Identities.Any(identity => identity.IsAuthenticated && identity.AuthenticationType == Scheme);
    }
}
