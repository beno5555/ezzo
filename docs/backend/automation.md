# WebCity — Automation Events

> Part of the WebCity doc set. See also: `README.md`, `data.md`, `auth.md`, `controllers.md`, `signalr.md`, `background-jobs.md`, `automation.md`.

The backend tells the **automation** (n8n, see `GLOSSARY.md`) what happened by sending it signed events. This page covers the sending side: the publisher, its settings, the envelope, the signature and the events. The decisions behind it are under "Events" in `.scratch/n8n-automation/spec.md`.

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

### Account, content and report events

Six more events, each sent by the service in the method that changed the data, right after the change is committed (never inside a transaction delegate, so a change that is rolled back sends nothing). Each has a data DTO of its own in `Infrastructure/Dtos/Automation`, built by a mapper (`AccountEventMapper`, `PostEventMapper`, `CommentEventMapper`, `ReportEventMapper`). Enums leave as their names. Nothing is sent when the action is refused, and no event carries a token, a password or a hash (ADR 0008); the six emails the backend sends itself are not touched.

| Event | Sent by | When | Data |
|---|---|---|---|
| `account-created` | `AuthService.RegisterAsync` | A registration succeeds, or an administrator creates an account (`POST api/users` goes through the same method). A taken username, a reserved one or an already registered email sends nothing; the registered-email case keeps its email from the backend | `userId`, `username`, `email` |
| `post-created` | `PostService.UploadPost` | A post is created | `postId`, `title`, `text`, `photoAddresses`, `authorId`, `authorUsername`, `moderationStatus` |
| `post-edited` | `PostService.UpdatePost` | The owner's edit changes the title or the text. Saving the same title and text again is not an edit: it stamps nothing and sends nothing | The same as `post-created`, the post as it is after the edit |
| `comment-created` | `CommentService.AddCommentAsync` | A comment is created, after the push to the post's author | `commentId`, `text`, `postId`, `authorId`, `authorUsername`, `moderationStatus` |
| `comment-edited` | `CommentService.EditCommentAsync` | The commenter's edit changes the text. Saving the same text again is not an edit: it stamps nothing and sends nothing | The same as `comment-created`, the comment as it is after the edit |
| `report-created` | `ReportService.CreateReportAsync` | A report is created. Own content, a second pending report by the same user and a missing target send nothing | `reportId`, `targetType`, `targetId`, `reason`, `reporterId`, `reporterUsername`, `post` / `comment` / `user` (the target snapshot the reports list shows, only the one matching `targetType` is set, the others are `null`), `pendingReportTimes` |

- **One DTO per event.** `post-created` and `post-edited` share their fields through the abstract `PostEventDto`, and the comment events through `CommentEventDto`; each event still has a type of its own (`PostCreatedEventDto`, `PostEditedEventDto`, ...), so a name and its data are paired in the code that sends it.
- **`photoAddresses`** are the relative addresses the API returns (`/api/images/{name}`), in upload order. n8n prefixes the backend's address itself.
- **`moderationStatus`** is `Visible`, `Flagged` or `Hidden`. A new post or comment is `Visible`.
- **`authorUsername` and `reporterUsername`** are the names the API shows, so a deactivated or deleted account reads as its placeholder. `authorId` of a comment is `null` only for a comment whose author was purged, which a comment just written or edited never is.
- **The snapshot** is the same shape as in the reports list (`PostSnapshotDto`, `CommentSnapshotDto`, `UserSnapshotDto`), loaded the same way (`GetSnapshotsByIdsAsync`).
- **`pendingReportTimes`** are the creation times of every report still pending on the same target, the new one included, oldest first. They are read after the report is committed, so a decided report's time is not among them. A report by a deactivated or soft-deleted reporter counts, as it does in the pending count.
- **A hung n8n slows the action.** Each event is one awaited attempt inside the user's request, up to `AutomationEvents:Timeout` (3 seconds by default). The action still succeeds (`Create_WhenDeliveryFails_StillCreatesThePost`, `..._WhenDeliveryTimesOut_...`).

### The route that throws on purpose

`GET api/dev/throw`, optionally with an id (`api/dev/throw/7`, template `api/dev/throw/{id:int?}`), throws an `InvalidOperationException`. The id is never read; it lets the tests and the demo show two addresses of one route sharing one fingerprint. It is mapped only in Development, as Swagger is (`DevelopmentEndpointsExtensions.MapThrowingEndpoint`), anonymous, rate-limited per IP (`ThrowOnPurpose`, 30 a minute) and left out of the OpenAPI documents. No real route can be made to fail on request, and the tests, the exception workflow's checklist and the demo all need one. In any other environment the route does not exist (`404`).

---

## The automation calling the backend

The other direction: n8n calls the backend with its own API key. The key, the second authentication scheme, what it opens, its rate-limit bucket and its `Log` rows are in `auth.md` ("The automation's API key"). The decisions are under "The automation's identity" and "Moderation by the automation" in the spec.

- **The setting** is `AutomationApi:Key` (`AutomationApiConfiguration`, section `AutomationApi`). It has no default, and startup does not require it: with no key configured the backend refuses every caller that sends one, so a clone that never runs n8n needs nothing. The n8n setup script writes the generated value into `appsettings.Development.json` under this name, and the same value is n8n's API-key credential.
- **What the key reaches:** the two moderation routes (`ModerationController`) and every route under `/api/internal` (`InternalController`). Nothing else: any other route ignores the key and answers `401`.
- **The weekly digest list.** `GET /api/internal/digest` pages through the users who get this week's digest email: those with `DigestEmailEnabled` on and an unread conversation, a pending friend request received, or a recent post by an accepted friend. Each row carries the email address and what to put in the email. The workflow pages until a page comes back short. Rows, counts and the post rules are under `InternalController` in `controllers.md`; a user turns the email off with `PUT /api/users/mine/digest-email` ("The digest switch", same file).
- **The automation only raises a moderation status.** On the two moderation routes it may set `Flagged` or `Hidden`. It is refused with `403` and the failure envelope when it sends `Visible`, and when it sends `Flagged` for content that is `Hidden`: a person decides what is shown again. Setting the status the content already has succeeds and changes nothing; content that does not exist answers `404`, which a workflow treats as nothing to do. An administrator's use of the same routes is unchanged. The table of cases is under `ModerationController` in `controllers.md`.

---

## Testing

`CustomWebApplicationFactory` forces `AutomationEvents:Enabled` to false, and always swaps the HTTP handler behind `EventPublisher` for an `EventRecorder` (`Helpers/EventRecorder.cs`), so no event ever leaves the process. A host made with `recordEvents: true` turns events on, with the address `http://automation.webcity.test` (which does not exist) and the secret `CustomWebApplicationFactory.TestEventsSigningSecret`.

```csharp
var factory = new CustomWebApplicationFactory(dbFixture, recordEvents: true);
// ... act through HTTP, or run a job once ...
var recorded = Assert.Single(factory.EventRecorder.Events);   // Path, Body (the exact bytes), Signature, Envelope, Data
```

Set `EventRecorder.Answer` to `RecorderAnswer.Fail` (the recorder answers `500`) or `RecorderAnswer.TimeOut` (it never answers; pair it with a short `AutomationEvents:Timeout` override) to test a failed delivery. A test checks the signature by computing it again from `recorded.Body` and the test secret.

Tests: `Automation/AccountCreatedEventTests`, `PostEventTests`, `CommentEventTests` and `ReportCreatedEventTests` (each event's every field, the nothing-sent cases, and a failed and a timed-out delivery for a post and a report), `EventSecretsTests` (the registration, reset and reactivation flows run, and every recorded body searched for tokens, hashes and passwords; `Helpers/EventAssert` checks the address, envelope, time and signature of each event), `Automation/ExceptionOccurredEventTests` (the route on a Development host, the envelope and data, the signature, the query string left out, the unchanged answer, a failed and a timed-out delivery, events off, the route missing outside Development, and a job built in the test, `ThrowingJob`, run once through `RunOnceAsync`) and `Automation/EventPublisherStartupTests` (the startup checks).

The key side: every host has the key `CustomWebApplicationFactory.TestApiKey` (setting `AutomationApi:Key`; pass `""` in the setting overrides for a host with no key configured), and `Helpers/ApiKeyTestHelper.SendWithApiKeyAsync` sends a request with it (another key, or `null` for none, by argument). The client's own headers still apply, so a client that signed in sends its token as well. Tests: `Automation/AutomationModerationTests` (the raise-only table of from-status, to-status and caller on both routes, an administrator unchanged, `404`), `Automation/AutomationApiKeyAuthenticationTests` (the key alone on a sample of ordinary and administrator routes, wrong, empty and missing keys, a host with no key, and the `/api/internal` rule on `Helpers/AutomationOnlyProbeController`, a route that exists only in the test host), `Automation/AutomationLogTests`, `Automation/DigestTests` (who gets a row, the counts, the posts and their order, paging, and `401` for everyone but the key; heidi's posts 14-19 and grace in `TestDataSeeder` exist for it), `RateLimiting/AutomationRateLimitTests` and `Security/AutomationKeyValidatorTests` (the comparison, including the empty header the test transport cannot send).
