using System.Text.Json;

namespace aspnetproject.IntegrationTests.Helpers;

// One event the backend sent: the address path, the exact body bytes and the signature header, as they left.
public sealed class RecordedEvent
{
    public required string  Path      { get; init; }
    public required byte[]  Body      { get; init; }
    public required string? Signature { get; init; }

    public JsonElement Envelope => JsonDocument.Parse(Body).RootElement;

    public JsonElement Data => Envelope.GetProperty("data");
}
