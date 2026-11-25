# 15: An event n8n did not receive is sent again

**What to build:** An event that n8n does not accept is kept by the backend and sent again until n8n accepts it or a day has passed, so an n8n restart or crash no longer loses a welcome email, a moderation check or an alert. n8n drops an event it has already handled, so a resend never doubles an email or a message.

- **The first attempt does not change.** The publisher from ticket 01 still sends each event at once, in one awaited attempt, so alerts stay immediate and a delivered event never touches the database.
- **A failed attempt is stored.** When the attempt fails (unreachable, timeout, an answer that is not a success), the publisher writes one row to a new table: the envelope's id, the event name, the exact body bytes, the creation time, the number of attempts and the time of the next one. It writes the row in a scope of its own, as it writes its failure log today. It still writes the failure `Log` row. If the row cannot be written (the database is down too), the event is lost as before and `SystemLogger` records it. With events off, nothing is stored.
- **A retry job** (`PeriodicHostedService`, every minute by default) sends due rows, oldest first, in batches. It sends the stored bytes unchanged, so the envelope's `id` and `occurredAt` stay those of the first attempt, and signs them again at send time. A delivered row is deleted. A failed one waits longer each time (1, 2, 4 … minutes, at most an hour). A row older than a day is given up: one `Log` row naming the event and its id, and the row is deleted.
- **No feedback loop.** The retry job's own failed cycle is logged but sends no `exception-occurred` event, so a broken retry cannot keep adding rows for itself.
- **Settings,** with defaults in an options class: `AutomationEvents:Retry:{Interval,MaxAge,BatchSize}` (1 minute, 24 hours, 100). They go into the settings list in `CLAUDE.md`.
- **Duplicates on the n8n side.** A resend can reach n8n after n8n already handled the first attempt (it did the work, but its answer came too late). Every workflow that receives events (02, 05, 06, 07, and 14's grouping) first checks the envelope's `id` against an n8n Data Table of ids it has handled, answers `200` and stops when the id is there, and adds it otherwise. A scheduled run deletes ids older than two days.
- **The schema change.** One new table, through `dotnet ef migrations add`. It is the spec's second schema change; the owner asked for this ticket on 2026-11-17.

Not in scope: a stored queue for the first attempt (a transactional outbox written in the same transaction as the change). A crash of the backend between a commit and its event still loses that event.

Decisions: "Events" in `planning/n8n-automation/spec.md`, ADR 0008 (no secret in any event, so stored bodies hold none). Data Tables are first proven in ticket 14.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 04 (The backend tells the automation about new accounts, content and reports), 14 (Repeated exceptions are grouped into one message)

**Status:** ready-for-agent

**Difficulty:** tricky: the first stored event in the backend, a second schema change, a job that must never feed itself, and duplicate handling across every workflow, which no test can check.

- [ ] With the recorder failing, an action still succeeds and one row is stored; with the recorder accepting, nothing is stored
- [ ] One run of the retry job with the recorder accepting sends the stored event once, with the same `id`, `occurredAt` and body bytes as the first attempt and a valid signature, and the row is gone
- [ ] A row that keeps failing waits longer after each attempt, and is given up after `MaxAge` with one `Log` row that names the event and its id
- [ ] A batch sends at most `BatchSize` rows, oldest first
- [ ] With events off, a failing action stores nothing and the job sends nothing
- [ ] A failed cycle of the retry job writes its `Log` row and records no `exception-occurred` event
- [ ] The migration adds the table and changes nothing else
- [ ] Every event workflow drops an `id` it has already handled: sending one recorded event twice by hand produces one email, one Telegram message or one moderation call
- [ ] `docs/backend/automation.md`, `background-jobs.md` and `data.md` describe the stored events, the job and the table; `CLAUDE.md` lists the new settings
- [ ] The full suite passes, and its `Duration` is recorded in this ticket's comments
- [ ] The owner ran the duplicate checklist on their machine
