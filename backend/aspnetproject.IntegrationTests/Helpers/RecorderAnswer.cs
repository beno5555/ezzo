namespace aspnetproject.IntegrationTests.Helpers;

// What EventRecorder does with the events it records: accept them as n8n would, refuse them, or never answer.
public enum RecorderAnswer
{
    Accept,
    Fail,
    TimeOut
}
