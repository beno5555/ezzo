namespace aspnetproject.Common.ProjectConstants;

// Usernames nobody may take. "mine" and "search" are the routes beside GET api/users/{username}, so a user with either
// name could never be read by name. The other two are the placeholder names shown for unavailable accounts.
public static class ReservedUsernames
{
    private static readonly HashSet<string> Names = new(StringComparer.OrdinalIgnoreCase)
    {
        "mine",
        "search",
        ResponseMessages.AccountDeactivatedUsername,
        ResponseMessages.AccountDeletedUsername
    };

    public static bool IsReserved(string username)
    {
        return Names.Contains(username);
    }
}
