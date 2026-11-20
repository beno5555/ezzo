namespace aspnetproject.IntegrationTests.Helpers;

// One email the backend sent: the recipient, the subject and the HTML body, as they would have left.
public sealed class RecordedEmail
{
    public required string To      { get; init; }
    public required string Subject { get; init; }
    public required string Body    { get; init; }
}
