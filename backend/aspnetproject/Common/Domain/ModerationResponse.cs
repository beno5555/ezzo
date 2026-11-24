using System.Text.Json.Serialization;

namespace aspnetproject.Common.Domain;

// A moderation change that can fail in two ways a caller tells apart: the content is not there (404), or the caller may not
// make this change (403, the automation asking for something it may not do).
public class ModerationResponse : ApplicationResponse
{
    // For the controller only, to choose 403 over 404. Not written to the body: a client reads the status code, and the body
    // stays the plain envelope.
    [JsonIgnore]
    public bool Refused { get; private set; }

    public void Refuse(string? message = null)
    {
        Fail(message);
        Refused = true;
    }
}
