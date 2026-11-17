# 04: The backend tells the automation about new accounts, content and reports

**What to build:** Six more events leave the backend through the publisher from ticket 01, each sent by the service in the same method that changed the data, after the change is committed. The workflows that listen to them are tickets 05, 06 and 07.

| Event | Sent when | Data |
|---|---|---|
| `account-created` | a registration succeeds, or an administrator creates an account | user id, username, email |
| `post-created` | a post is created | post id, title, text, photo addresses, author id and username, moderation status |
| `post-edited` | a post's title or text is changed | the same as `post-created` |
| `comment-created` | a comment is created | comment id, text, post id, author id and username, moderation status |
| `comment-edited` | a comment's text is changed | the same as `comment-created` |
| `report-created` | a report is created | report id, target type, target id, reason, reporter id and username, the target snapshot the reports list shows, and the creation times of every pending report on the same target (this one included) |

- **Photo addresses** are the relative addresses the API already returns.
- **Nothing is sent when the action fails:** a refused registration, a refused report, an edit by someone who may not edit.
- **No event carries a secret** (ADR 0008): no token, no password, no password hash. A registration attempt with an address that is already registered sends no event; that case keeps its email from the backend.
- **A failed delivery never fails the action.** The publisher already guarantees it; one test here proves it for a user-facing action.

Decisions are under "Events" in `.scratch/n8n-automation/spec.md`. The six emails the backend sends itself are not touched (ADR 0008).

**Blocked by:** 01 (A failure in the backend leaves as a signed event)

**Status:** done

**Difficulty:** routine: six calls to the publisher from ticket 01, each proven by the recorder from that ticket.

- [x] A successful registration records one `account-created` event with the id, username and email; an administrator creating an account records the same
- [x] A registration refused for a taken username or a registered email records no event
- [x] Creating a post with photos records `post-created` with the title, the text, every photo's relative address, the author and the status; editing it records `post-edited`
- [x] Creating and editing a comment record `comment-created` and `comment-edited` with the text, the post id and the author
- [x] A refused create or edit records nothing
- [x] A report records `report-created` with the target snapshot and the reason; a second user's report on the same target carries both pending times; a decided report's time is no longer among them
- [x] A refused report (own content, a second pending report by the same user) records nothing
- [x] With the recorder failing, creating a post still succeeds
- [x] The registration, password reset and reactivation flows are run, and no recorded body contains a reset token or a password
- [x] `docs/backend/automation.md` lists the six events and their data

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **A hung n8n slows every action here.** Each event is one awaited attempt inside the user's request. If n8n refuses the connection, that costs milliseconds; if it hangs, a registration, a post, a comment or a report waits up to `AutomationEvents:Timeout` (3 seconds) before it answers. Keep the default. Prove "a failed delivery never fails the action" with `RecorderAnswer.TimeOut` and a short `AutomationEvents:Timeout` override, as `ExceptionOccurredEventTests` does, as well as with `RecorderAnswer.Fail`.
- **Lost events.** While n8n is down an event is lost, and the only trace is a `Log` row (action `EventPublisher.PublishAsync`) whose details name the event but not the post, comment, report or user. Tickets 05 to 07 inherit this.
- **Nothing ties an event's name to its data.** `PublishAsync(string, object)` accepts any data for any name. Add each name to `EventNames`, give each event a data DTO of its own, and assert every field of the recorded body in a test: the tests are the only guard.
- **Enums are text only when the DTO says so.** The publisher writes JSON as the API does, with no global enum converter. A moderation status or a target type is written as its name only with `[JsonConverter(typeof(JsonStringEnumConverter<T>))]` on the property, as `StandardReportDto` does; without it, it leaves as a number.
- **`occurredAt` is the send time.** Publish in the same method, right after the change is committed. Never publish inside an `ExecuteInTransactionAsync` delegate: a change that is rolled back must send nothing.
- **The test seam:** `new CustomWebApplicationFactory(dbFixture, recordEvents: true)`, then `factory.EventRecorder.Events` (each with `Path`, `Body`, `Signature`, `Envelope` and `Data`). Seeded users sign in only on Testing hosts, which is the default.

## Comments

**2026-11-17, implementation.** Six events sent from `AuthService.RegisterAsync` (also the administrator's `POST api/users`), `PostService.UploadPost` / `UpdatePost`, `CommentService.AddCommentAsync` / `EditCommentAsync` and `ReportService.CreateReportAsync`, each after the commit and outside any transaction delegate. Each has its own data DTO (`PostEventDto` and `CommentEventDto` are abstract bases for the created/edited pairs). Tests: `Automation/AccountCreatedEventTests`, `PostEventTests`, `CommentEventTests`, `ReportCreatedEventTests`, `EventSecretsTests`. Full suite: 709 passed, 49 s.

- **`post-edited` is sent for every saved edit,** even when the title and text are the same as before, because `UpdatePost` stamps `LastUpdatedAt` regardless. The spec says "a post's title or text is changed". Skipping an unchanged edit is a small change if the owner wants it.
- **The secrets test cannot consume the emailed tokens.** Email is off in tests, so the reset and reactivation flows are run as far as the request and the administrator's reactivation; the raw token is never readable. Every recorded body is searched for token-shaped strings, JWTs, the stored password hashes, salts and reset-token hashes, the plaintext passwords, and the words password, token and hash.
