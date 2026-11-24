# 12: Friends are told about a birthday

**What to build:** Every day at 09:00 Tbilisi time, each user who has a friend with a birthday that day gets one notification in WebCity, if they are connected, and one email. A user with several such friends gets one of each, naming them together.

- **The workflow** starts from a schedule, daily at 09:00. It reads `GET /api/internal/birthdays` with the API key credential, page by page, until a page comes back short. It sends no `date`, so the backend uses today's UTC date. 09:00 in Tbilisi is 05:00 UTC, the same UTC day.
- **For each row,** two things:
  - one call to `POST /api/internal/notifications` for that recipient, with the kind `BIRTHDAY` and the row's friends as the data;
  - one email built from an HTML template that names the friends and links to WebCity. The product's name and the address come from `.env`. The text is English (ADR 0006). n8n's attribution line is off.
- **Batches.** Rows are worked through in groups with a pause between them, so a day with many birthdays does not hit the SMTP account's limit at once.
- **The email does not follow the digest switch.**
- **The checklist** for this workflow is added to the `n8n/` README. It is run by starting the workflow by hand, with a test account's date of birth set to today.

Until ticket 13 is built, the notification can be seen arriving in the browser's developer tools, on the hub connection.

Birthdays are second on the roadmap's "Last in line" list, after the digest.

Runs on the owner's machine: it needs Docker running and the SMTP account in n8n's credentials file. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" in `.scratch/n8n-automation/spec.md`. Notification is defined in `GLOSSARY.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 11 (The backend lists today's birthdays and delivers notifications)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): it copies the paged read and the email of ticket 09 where that exists, but no test catches a broken workflow; it is proven only by running it.

## How to work this ticket (workflow ticket: no `/implement`, no TDD)

No test catches a broken workflow, so this ticket is proven by running it, and the owner's run closes it.

1. Set the status to `in-progress`. Work on the current branch; read `n8n/README.md` and ticket 02's Comments first, and copy the exception-alert workflow's pattern.
2. Build the workflow file and its README checklist. Load it with `docker compose -f n8n/compose.yaml up -d` and prove every box that does not need the owner's accounts (the signature answers, the node chain, the real events). Secrets are never printed or committed. Docker must be running, and the Telegram, SMTP and OpenAI values are the owner's to fill in.
3. Run the `spec-review` skill against this ticket and the spec, and fix what it finds.
4. Append a report under `## Comments` as `**<date>, built (<model>).**`: what was built and any departure from the ticket with its reason; what was run against the real n8n and what it showed; and a `For the owner` block with the exact commands from the repo root, what each should show, and which credential and `.env` names to fill in first (names, never values). Say which boxes the session proved and which only the owner's run can prove.
5. Tick only the boxes the session proved. The status stays `in-progress` until the owner has run the checklist; never set `done`. The build and the full test suite are not needed when no backend file changed.
6. Commit to the current branch (the author and the `Co-Authored-By` line follow `CLAUDE.md`). Do not merge.

- [ ] Started by hand, with one test account born today, each of its accepted friends gets one email that names it, and nobody else gets one
- [ ] A friend who is connected to WebCity receives `ReceiveNotification` with the kind `BIRTHDAY` and the friend's id and username
- [ ] A user with two friends born today gets one email and one notification that name both
- [ ] A friend who is not connected still gets the email, and the run does not fail
- [ ] On a day with no birthdays the run ends without sending anything
- [ ] The schedule is daily at 09:00 in `Asia/Tbilisi`
- [ ] The email carries no n8n attribution line
- [ ] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [ ] The owner ran the checklist on their machine
