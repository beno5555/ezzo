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

**Status:** ready-for-agent

**Difficulty:** tricky: the first outgoing HTTP call in this backend, with a signature, a rule that it never throws or loops, and a pattern that tickets 04 onward copy.

- [ ] A request to the throwing route produces one recorded event at `/webhook/exception-occurred`, with the envelope and the data listed above
- [ ] The recorded signature equals HMAC-SHA256 of the recorded bytes with the test secret, computed again in the test
- [ ] The event's place carries the method and the path, and never the query string, when the failing request had one
- [ ] A background job built in the test that throws, run once through `RunOnceAsync`, produces one event with the job's name; its `Log` row is still written
- [ ] With the recorder failing, and with it timing out, the caller still gets the usual exception answer, one `Log` row records the failed delivery, and no second event appears
- [ ] With events off, nothing is recorded and no log row is written
- [ ] A host with events on and no base URL, or no signing secret, fails at startup with an error that names the setting
- [ ] The throwing route does not exist outside Development
- [ ] A new `docs/backend/automation.md` describes the publisher, the envelope, the signature and the event; `background-jobs.md` says a failed cycle sends an event; the settings list in `CLAUDE.md` (Config prerequisites) names the new settings and their defaults
- [ ] The full suite passes, and its `Duration` is recorded in this ticket's comments
