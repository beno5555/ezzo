# 14: Repeated exceptions are grouped into one message

**What to build:** When the same exception happens many times in a short while, the developers' Telegram chat gets the first one at once and then one follow-up that says how many more there were, instead of a message for each.

This ticket changes the exception-alert workflow from ticket 02. Nothing in the backend changes: every `exception-occurred` event already carries a fingerprint made of the exception type and the place.

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

Decisions are under "The six workflows" in `.scratch/n8n-automation/spec.md`. Alert is defined in `GLOSSARY.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram)

**Status:** ready-for-agent

**Difficulty:** tricky: state kept between executions in an n8n feature that has not been tried here, with overlapping executions to reason about.

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
