# 14: Repeated exceptions are grouped into one message

**What to build:** When the same exception happens many times in a short while, the developers' Telegram chat gets the first one at once and then one follow-up that says how many more there were, instead of a message for each.

This ticket changes the exception-alert workflow from ticket 02. Nothing in the backend changes: every `exception-occurred` event already carries a fingerprint made of the exception type and the place (for a request, the route's template, not its address: see "Known limits from ticket 01" below).

- **The first event of a fingerprint** sends its alert at once, as today.
- **Every event is written as a row** to an n8n Data Table: the fingerprint, the time, and enough of the event to word the follow-up. The table has its own time column; do not rely on a system column for filtering.
- **A further event of the same fingerprint within 10 minutes** of the first sends nothing.
- **A scheduled run,** every few minutes, is the only thing that removes rows. For each fingerprint whose window has ended, it sends one "seen N more times" message when N is at least one, and deletes that fingerprint's rows. The next event of that fingerprint is then a first event again.
- **The 10 minutes** sit in the workflow's clearly named settings node.

Two executions can run at the same moment, and n8n has no atomic counter. Rows are therefore only ever added by the webhook and only ever removed by the scheduled run. Two alerts for two events that arrive in the same instant are acceptable; a lost count is not.

Data Tables have not been tried here. The facts come from n8n's documentation at 2.47.7: they exist in the Community edition, they offer insert, get, update, upsert, delete and "if row exists", and a Code node cannot read them directly. Where one turns out wrong, record the replacement in this ticket's comments and in the README. Workflow static data is not the replacement: it loses updates when executions overlap.

Whether the table itself is created by the import or by hand on first setup is settled here and written into the README's setup steps.

Alert grouping is third on the roadmap's "Last in line" list, after the digest and birthdays.

Runs on the owner's machine: it needs Docker running. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" in `planning/n8n-automation/spec.md`. Alert is defined in `GLOSSARY.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram)

**Status:** ready-for-agent

**Difficulty:** tricky: state kept between executions in an n8n feature that has not been tried here, with overlapping executions to reason about.

## How to work this ticket (workflow ticket: no `/implement`, no TDD)

No test catches a broken workflow, so this ticket is proven by running it, and the owner's run closes it.

1. Set the status to `in-progress`. Work on the current branch; read `n8n/README.md` and ticket 02's Comments first, and copy the exception-alert workflow's pattern.
2. Build the workflow file and its README checklist. Load it with `docker compose -f n8n/compose.yaml up -d` and prove every box that does not need the owner's accounts (the signature answers, the node chain, the real events). Secrets are never printed or committed. Docker must be running, and the Telegram, SMTP and OpenAI values are the owner's to fill in.
3. Run the `spec-review` skill against this ticket and the spec, and fix what it finds.
4. Append a report under `## Comments` as `**<date>, built (<model>).**`: what was built and any departure from the ticket with its reason; what was run against the real n8n and what it showed; and a `For the owner` block with the exact commands from the repo root, what each should show, and which credential and `.env` names to fill in first (names, never values). Say which boxes the session proved and which only the owner's run can prove.
5. Tick only the boxes the session proved. The status stays `in-progress` until the owner has run the checklist; never set `done`. The build and the full test suite are not needed when no backend file changed.
6. Commit to the current branch (the author and the `Co-Authored-By` line follow `CLAUDE.md`). Do not merge.

- [ ] One request to the backend's throwing route sends one alert at once, and no follow-up
- [ ] Ten requests in a row send one alert at once and, after the window, one message that says it was seen 9 more times
- [ ] Two different exceptions in the same minute each send their own first alert
- [ ] After the follow-up, the same exception alerts at once again
- [ ] An exception from a background job is grouped separately from the same exception type in a request
- [ ] The table holds no rows for a fingerprint once its follow-up has been sent
- [ ] Changing the window in the workflow's settings node changes the grouping, with no backend change
- [ ] A clean start still ends with the workflow published and the table in place, by the steps in the README
- [ ] The workflow file is committed with its fixed id and no pinned data; the README's checklist for the exception-alert workflow is updated
- [ ] The owner ran the checklist on their machine

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **What the fingerprint is.** For a request that matched a route, `{exception type}|{METHOD} {route template}`, e.g. `System.InvalidOperationException|GET /api/posts/{id:int}`, so one failure at many ids groups as one. For a request that matched no route, `{type}|{METHOD} {path}`. For a job, `{type}|{job class name}`. Group by the string as it arrives; do not take it apart.
- **What a row keeps.** Store the fingerprint, the time, the type and `place`, which is enough for "seen N more times". Do not store `stackTrace` or more of the event than the follow-up needs.
- **Lost and missing events are not counted.** "Seen N more times" counts only events that reached n8n. Events lost while n8n was down, and failures that send no event at all (SignalR hub methods, by the owner's decision, and startup), are not in N.
