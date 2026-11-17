using System.Security.Cryptography;
using System.Text;

namespace aspnetproject.IntegrationTests.Helpers;

// What every recorded event must satisfy, whatever its data: the address, the envelope, the time and the signature.
// A test then asserts the data's fields itself. Names and addresses are literals, not the backend's constants, so a
// changed name fails here.
public static class EventAssert
{
    private static readonly string[] EnvelopeFields = ["id", "event", "occurredAt", "data"];

    // dataFields are the names the event's data must have, no more and no fewer, in any order.
    public static void IsEnvelopeOf(RecordedEvent recorded, string eventName, DateTime notBefore, params string[] dataFields)
    {
        Assert.Equal($"/webhook/{eventName}", recorded.Path);

        var envelope = recorded.Envelope;
        Assert.Equal(EnvelopeFields, envelope.EnumerateObject().Select(property => property.Name));
        Assert.True(Guid.TryParse(envelope.GetProperty("id").GetString(), out var id));
        Assert.NotEqual(Guid.Empty, id);
        Assert.Equal(eventName, envelope.GetProperty("event").GetString());

        Assert.EndsWith("Z", envelope.GetProperty("occurredAt").GetString());
        Assert.InRange(envelope.GetProperty("occurredAt").GetDateTime().ToUniversalTime(), notBefore.AddSeconds(-1), DateTime.UtcNow);

        Assert.Equal(dataFields.Order(), recorded.Data.EnumerateObject().Select(property => property.Name).Order());

        IsSignedWithTheTestSecret(recorded);
    }

    public static void IsSignedWithTheTestSecret(RecordedEvent recorded)
    {
        byte[] key      = Encoding.UTF8.GetBytes(CustomWebApplicationFactory.TestEventsSigningSecret);
        string expected = Convert.ToHexString(HMACSHA256.HashData(key, recorded.Body)).ToLowerInvariant();

        Assert.Equal(expected, recorded.Signature);
    }
}
