namespace aspnetproject.Common.Domain;

// A moderation change that can fail in two ways a caller tells apart: the content is not there (404), or the caller may not
// make this change (403, the automation asking for something it may not do).
public class ModerationResponse : ApplicationResponse
{
    public bool Refused { get; private set; }

    public void Refuse(string? message = null)
    {
        Fail(message);
        Refused = true;
    }
}
