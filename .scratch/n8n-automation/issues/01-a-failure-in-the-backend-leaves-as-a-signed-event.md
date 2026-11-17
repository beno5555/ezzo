# 01: A failure in the backend leaves as a signed event

**What to build:** When a request or a background job fails with an unhandled exception, the backend posts a signed `exception-occurred` event to the automation's address. This ticket builds the one module every later event goes through, and proves it with the first event. Nothing on the n8n side is built here: the test host records what leaves.

- **The publisher.** One module with one call: an event name and a data object. It builds the envelope (a unique id, the event name, the UTC time, `data`), writes JSON the way the API does, signs the exact bytes of the body, and posts to `{base URL}/webhook/{event name}`. It never throws.
- **The signature.** The header `X-WebCity-Signature` holds the lower-case hex of HMAC-SHA256 over the body, keyed with the signing secret.
- **One awaited attempt,** with a timeout of 3 seconds by default. No retry. A failure (unreachable, timeout, any answer that is not a success) writes one `Log` row through the database logger and changes nothing else.
- **Settings,** in an options class with defaults: on or off (off by default), the base URL, the signing secret, the timeout. When events are on and the base URL or the secret is missing, the app refuses to start. When events are off, publishing does nothing and writes no log.
- **`exception-occurred`** is sent from the global exception handler and from a background job's failed cycle. Its data: the exception type, the message, the first 15 lines of the stack trace, the kind of place (request or job), the place (the HTTP method and the path without the query string, or the job's name), and a fingerprint made of the type and the place. It never carries a request body, a header, the query string or user data. The answer the caller gets does not change.
- **No loop.** A failure inside the publisher is caught there and never produces another event.
- **A route that throws on purpose,** mapped only in Development, as Swagger is. No existing route can be made to fail on request, and the tests, ticket 02's checklist and the demo all need one.
- **The test seam.** The test host can turn events on, point them at an address that does not exist, and swap the HTTP handler behind the publisher for a recorder that a test can read and can tell to fail or to time out. Later tickets use the same recorder.

Decisions are under "Events" and "Testing Decisions" in `.scratch/n8n-automation/spec.md`. The words Automation and Alert are defined in `GLOSSARY.md`.

**Blocked by:** None (can start immediately).

**Status:** done

**Difficulty:** tricky: the first outgoing HTTP call in this backend, with a signature, a rule that it never throws or loops, and a pattern that tickets 04 onward copy.

- [x] A request to the throwing route produces one recorded event at `/webhook/exception-occurred`, with the envelope and the data listed above
- [x] The recorded signature equals HMAC-SHA256 of the recorded bytes with the test secret, computed again in the test
- [x] The event's place carries the method and the path, and never the query string, when the failing request had one
- [x] A background job built in the test that throws, run once through `RunOnceAsync`, produces one event with the job's name; its `Log` row is still written
- [x] With the recorder failing, and with it timing out, the caller still gets the usual exception answer, one `Log` row records the failed delivery, and no second event appears
- [x] With events off, nothing is recorded and no log row is written
- [x] A host with events on and no base URL, or no signing secret, fails at startup with an error that names the setting
- [x] The throwing route does not exist outside Development
- [x] A new `docs/backend/automation.md` describes the publisher, the envelope, the signature and the event; `background-jobs.md` says a failed cycle sends an event; the settings list in `CLAUDE.md` (Config prerequisites) names the new settings and their defaults
- [x] The full suite passes, and its `Duration` is recorded in this ticket's comments

## Comments

**2026-11-17, implementation (cloud session, branch `claude/kind-fermi-rgzhwf`).**

- Full suite through `scripts/test-linux.sh`: 564 passed, 0 failed, `Duration: 36 s` (baseline before the ticket: 542 passed, `Duration: 27 s`). 22 new tests in `Automation/ExceptionOccurredEventTests` and `Automation/EventPublisherStartupTests`.
- `/spec-review` ran on Opus 5.5 at high effort; Fable 5.2 was unavailable (usage limit). Standards: no hard violations. Spec: nothing missing. Fixed after the review: the negative `if` in `EventPublisher.SendAsync`, an unused test constant, and the log-details truncation, which was duplicated in `EventPublisher` and `PeriodicHostedService` and now lives in `Logging/LogDetails`. `automation.md` now says that `occurredAt` is taken at send time, because each event is published in the same method as the thing it reports.
- Additions beyond the ticket:
  - startup also fails when `AutomationEvents:Timeout` is zero or less, because `HttpClient` throws on such a value and the publisher must never throw;
  - the throwing route has its own per-IP rate-limit policy (`ThrowOnPurpose`, 30 a minute), as every new action does;
  - a failed delivery's `Log` row is written through a scope of its own, so a `DbUpdateException` left in the request's `DbContext` cannot block it.
- Not tested: the event for the conflict answer (a `DbUpdateException`). It goes through the same code before the status branch in `GlobalExceptionHandler`, but no test forces one.
- **Not merged into `master`.**
  - `origin/master` was force-pushed to a new history, and the local `master` (`685d7e6`) shares no history with it, so `git pull --ff-only` cannot succeed.
  - The local `master` holds commits (for example "Stop integration test hosts from leaking inotify instances") that I could not find in the new history, so I left it alone, as CLAUDE.md asks.
  - The branch is based on `2f93490`. `origin/master` has since moved to `1978158`.
  - To finish: the owner decides what happens to the old local `master`, then merges `claude/kind-fermi-rgzhwf` into `master` with `--no-ff` and adds the "Awaiting the owner's review" line in `.scratch/roadmap.md`. That line was left out here so it cannot conflict with the roadmap changes made since.
