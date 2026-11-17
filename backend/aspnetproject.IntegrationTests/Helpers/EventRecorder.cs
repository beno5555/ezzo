using System.Collections.Concurrent;
using System.Net;

namespace aspnetproject.IntegrationTests.Helpers;

// Stands in for the network behind the backend's event publisher: every request the publisher sends is recorded here and
// never leaves the process. A test reads Events, and sets Answer to make the next deliveries fail or time out.
public sealed class EventRecorder : HttpMessageHandler
{
    // The header the spec names, pinned as a literal so a renamed Constants.EventSignatureHeader fails the signature tests.
    public const string SignatureHeader = "X-WebCity-Signature";

    private readonly ConcurrentQueue<RecordedEvent> _events = new();

    public RecorderAnswer Answer { get; set; } = RecorderAnswer.Accept;

    public IReadOnlyList<RecordedEvent> Events => _events.ToList();

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        byte[] body = request.Content is null ? [] : await request.Content.ReadAsByteArrayAsync(cancellationToken);

        _events.Enqueue(new RecordedEvent
        {
            Path      = request.RequestUri!.AbsolutePath,
            Body      = body,
            Signature = request.Headers.TryGetValues(SignatureHeader, out var values) ? values.Single() : null
        });

        if (Answer == RecorderAnswer.TimeOut)
        {
            // Waits until the publisher's timeout cancels the request.
            await Task.Delay(Timeout.InfiniteTimeSpan, cancellationToken);
        }

        var status = Answer == RecorderAnswer.Fail ? HttpStatusCode.InternalServerError : HttpStatusCode.OK;
        return new HttpResponseMessage(status);
    }

    // The client factory disposes handlers whose lifetime ran out; the recorder outlives them, so a test can still read it.
    protected override void Dispose(bool disposing)
    {
    }
}
