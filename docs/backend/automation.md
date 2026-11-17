# WebCity — Automation Events

> Part of the WebCity doc set. See also: `README.md`, `data.md`, `auth.md`, `controllers.md`, `signalr.md`, `background-jobs.md`, `automation.md`.

The backend tells the **automation** (n8n, see `GLOSSARY.md`) what happened by sending it signed events. This page covers the sending side: the publisher, its settings, the envelope, the signature and the events sent so far. The decisions behind it are under "Events" in `.scratch/n8n-automation/spec.md`.

---

## `EventPublisher`

`Infrastructure/Services/Automation/EventPublisher.cs`. It is the only code that sends events, and its interface is one call:

```csharp
await eventPublisher.PublishAsync(EventNames.ExceptionOccurred, data);
```

It wraps `data` in the envelope, writes the JSON, signs the bytes, and posts them to `{BaseUrl}/webhook/{event name}`. The event name is the last segment of the address (`EventNames` holds the names).

- **One awaited attempt.** The caller waits for the answer, up to `Timeout` (3 seconds by default). n8n answers once it has checked the signature, so the wait is normally milliseconds. There is no retry and no stored queue: an event sent while n8n is down is lost.
- **It never throws.** A failure (the address unreachable, the timeout, an answer that is not a success) writes one `Log` row and changes nothing else. The row has `Succeeded = false`, the action `EventPublisher.PublishAsync`, no entity, and details `Event {name} was not delivered: {reason}`, cut to the column's length. It goes through `DatabaseLogger.LogSystemActionAsync`, as background jobs write theirs, in a scope of its own: the caller's `DbContext` may still hold the changes whose save just threw (the global handler's `DbUpdateException`), and saving through it would fail again.
- **No loop.** Every failure inside the publisher is caught there, so a failed delivery never reaches the global handler and never produces another `exception-occurred` event.
- **Off does nothing.** With events off, `PublishAsync` returns at once: nothing is sent and no log row is written.
- **Registered as a typed `HttpClient`** (`services.AddHttpClient<EventPublisher>()`), transient, so it can be resolved from any scope. The test host swaps its HTTP handler (see **Testing** below).

---

## Settings

`AutomationEventsConfiguration`, section `AutomationEvents`. Every key is optional and has its default in the class.

| Key | Default | Meaning |
|---|---|---|
| `Enabled` | `false` | Off by default, so a fresh clone, the test suite and a cloud session run without n8n |
| `BaseUrl` | empty | The automation's address, e.g. `http://localhost:5678` |
| `SigningSecret` | empty | The shared secret the signature is keyed with. A secret: never print or commit it |
| `Timeout` | `00:00:03` | How long the one attempt may take |

The options are validated at startup (`ValidateOnStart`). With `Enabled` true, a missing or blank `BaseUrl` or `SigningSecret` stops the host with an `OptionsValidationException` that names the setting. A `Timeout` of zero or less always does. With events off, the address and the secret are not needed.

---

## The envelope

Every event has the same four fields (`EventEnvelopeDto`):

```json
{
  "id": "7f1c2e8a-…",
  "event": "exception-occurred",
  "occurredAt": "2026-11-17T10:15:30.123Z",
  "data": { }
}
```

`id` is a new GUID per event, `event` the event name, `occurredAt` the UTC time of the thing that happened. The publisher takes it when it sends: every event is published in the same method as the thing it reports, so the two are milliseconds apart. JSON is written the way the API writes it: camelCase, enums as the text their DTOs declare, times marked UTC with `Z` (`UtcDateTimeJsonConverter`, ADR 0005). No event carries a secret (ADR 0008).

---

## The signature

The header `X-WebCity-Signature` holds the lower-case hex of HMAC-SHA256 over the exact bytes of the body, keyed with `SigningSecret` (UTF-8). There is no timestamp. The receiver computes the same value from the raw body it received and answers `401` when they differ.

---

## Events

### `exception-occurred`

Sent when an unhandled exception reaches `GlobalExceptionHandler`, the conflict answer for a `DbUpdateException` included, and when a background job's cycle throws (`PeriodicHostedService.RunOnceAsync`, after the job's own failure row is written). The answer the caller gets is the same with events on or off, and whether or not the delivery succeeds; the handler publishes before it writes the answer.

Data (`ExceptionOccurredEventDto`, built by `ExceptionEventMapper`):

| Field | Value |
|---|---|
| `exceptionType` | The exception's full type name, e.g. `System.InvalidOperationException` |
| `message` | The exception's message |
| `stackTrace` | The first 15 lines of the stack trace, joined with `\n` |
| `placeKind` | `Request` or `Job` |
| `place` | For a request, the HTTP method and the path, e.g. `GET /api/dev/throw`; for a job, its class name, e.g. `OrphanImagesCleanupService` |
| `fingerprint` | The type and where it happened, joined by `\|`, so repeats of one failure can be grouped. For a request that matched a route, the method and the route's template, not the address: `GET /api/posts/5` and `GET /api/posts/6` both give `System.InvalidOperationException\|GET /api/posts/{id:int}`. For a request that matched no route, the method and the path. For a job, its class name, as in `place` |

The route template is read from `IExceptionHandlerFeature.Endpoint`, because the exception middleware clears the request's endpoint before the handler runs. The place never holds the query string (hub connections carry the access token there). The event carries nothing else from the request: no body, no header, no user data.

### The route that throws on purpose

`GET api/dev/throw`, optionally with an id (`api/dev/throw/7`, template `api/dev/throw/{id:int?}`), throws an `InvalidOperationException`. The id is never read; it lets the tests and the demo show two addresses of one route sharing one fingerprint. It is mapped only in Development, as Swagger is (`DevelopmentEndpointsExtensions.MapThrowingEndpoint`), anonymous, rate-limited per IP (`ThrowOnPurpose`, 30 a minute) and left out of the OpenAPI documents. No real route can be made to fail on request, and the tests, the exception workflow's checklist and the demo all need one. In any other environment the route does not exist (`404`).

---

## Testing

`CustomWebApplicationFactory` forces `AutomationEvents:Enabled` to false, and always swaps the HTTP handler behind `EventPublisher` for an `EventRecorder` (`Helpers/EventRecorder.cs`), so no event ever leaves the process. A host made with `recordEvents: true` turns events on, with the address `http://automation.webcity.test` (which does not exist) and the secret `CustomWebApplicationFactory.TestEventsSigningSecret`.

```csharp
var factory = new CustomWebApplicationFactory(dbFixture, recordEvents: true);
// ... act through HTTP, or run a job once ...
var recorded = Assert.Single(factory.EventRecorder.Events);   // Path, Body (the exact bytes), Signature, Envelope, Data
```

Set `EventRecorder.Answer` to `RecorderAnswer.Fail` (the recorder answers `500`) or `RecorderAnswer.TimeOut` (it never answers; pair it with a short `AutomationEvents:Timeout` override) to test a failed delivery. A test checks the signature by computing it again from `recorded.Body` and the test secret.

Tests: `Automation/ExceptionOccurredEventTests` (the route on a Development host, the envelope and data, the signature, the query string left out, the unchanged answer, a failed and a timed-out delivery, events off, the route missing outside Development, and a job built in the test, `ThrowingJob`, run once through `RunOnceAsync`) and `Automation/EventPublisherStartupTests` (the startup checks).
