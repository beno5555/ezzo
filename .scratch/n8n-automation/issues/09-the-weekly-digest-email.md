# 09: The weekly digest email

**What to build:** Every Monday at 10:00 Tbilisi time, each user who has something to catch up on, and has not switched the digest off, receives one email that says what they missed.

- **The workflow** starts from a schedule, weekly on Monday at 10:00. It reads `GET /api/internal/digest` with the API key credential, page by page, until a page comes back short.
- **One email per row,** built from an HTML template: the number of conversations with unread messages, the number of pending friend requests, and the posts (title, author, like count), each part shown only when it has something. A link to WebCity, and a line that says the digest can be switched off on the settings page, with a link there. The product's name and the addresses come from `.env`. The text is English (ADR 0006). n8n's attribution line is off.
- **Batches.** Emails go out in groups with a pause between them, so a large list does not hit the SMTP account's limit at once.
- **The checklist** for this workflow is added to the `n8n/` README. It is run by starting the workflow by hand, not by waiting for Monday.

The digest is first on the roadmap's "Last in line" list: if time runs short, this ticket and ticket 10 are the first to be left out.

Runs on the owner's machine: it needs Docker running and the SMTP account in n8n's credentials file. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" in `.scratch/n8n-automation/spec.md`. Digest is defined in `GLOSSARY.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 08 (The backend lists who gets a digest, and a user can switch it off)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): it copies ticket 05's email pattern and adds a paged read, but no test catches a broken workflow; it is proven only by running it.

## How to work this ticket (workflow ticket: no `/implement`, no TDD)

No test catches a broken workflow, so this ticket is proven by running it, and the owner's run closes it.

1. Set the status to `in-progress`. Work on the current branch; read `n8n/README.md` and ticket 02's Comments first, and copy the exception-alert workflow's pattern.
2. Build the workflow file and its README checklist. Load it with `docker compose -f n8n/compose.yaml up -d` and prove every box that does not need the owner's accounts (the signature answers, the node chain, the real events). Secrets are never printed or committed. Docker must be running, and the Telegram, SMTP and OpenAI values are the owner's to fill in.
3. Run the `spec-review` skill against this ticket and the spec, and fix what it finds.
4. Append a report under `## Comments` as `**<date>, built (<model>).**`: what was built and any departure from the ticket with its reason; what was run against the real n8n and what it showed; and a `For the owner` block with the exact commands from the repo root, what each should show, and which credential and `.env` names to fill in first (names, never values). Say which boxes the session proved and which only the owner's run can prove.
5. Tick only the boxes the session proved. The status stays `in-progress` until the owner has run the checklist; never set `done`. The build and the full test suite are not needed when no backend file changed.
6. Commit to the current branch (the author and the `Co-Authored-By` line follow `CLAUDE.md`). Do not merge.

- [ ] Started by hand, the workflow sends one email to each user the list returns, and none to anyone else
- [ ] The email shows the right counts and the three posts for a user who has all three, and leaves out a part that is empty
- [ ] A user with the switch off receives nothing
- [ ] With more users than one page holds, every page is read and nobody gets two emails
- [ ] The links open WebCity and the settings page
- [ ] The schedule is Monday 10:00 in `Asia/Tbilisi`
- [ ] The email carries no n8n attribution line
- [ ] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [ ] The owner ran the checklist on their machine
