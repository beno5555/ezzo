# What's next

The order of work toward the full-stack deadline, 2026-11-25. A ticket's own `Status:` line is the truth about it; this file only holds the order, the open decisions and what is still missing. Decisions live in the specs, `docs/adr/` and `DESIGN.md`, rules in the conventions skill, and what waits for the owner's eyes in `.scratch/review-queue.md`.

**Keep this file about what is ahead.** When a step or round is done, tick it or say "merged" and delete its detail: no merge dates, test durations or review notes. Git history, the ticket and the review queue hold those. Every repeated fact is one more line to go stale.

**Scope is fixed.** The documentation sent to the academy (`webcity-documentation.md` at the repo root) is the commitment: everything in it is due on the 25th. The schedule has one buffer day (Tue 24) and no other slack. If a day slips, the items under **Last in line** move, not the pages.

## Open decisions

Settle these before the session that needs them. Each has a going-in recommendation.

1. **Telling the academy about the name.** `webcity-documentation.md`, already sent to the academy, says WebCity; users now see Ezzo (`PRODUCT.md`). Whether to tell the academy is the owner's call.

## Settled

Each decision is recorded where the work reads it: the name session in `PRODUCT.md` and `GLOSSARY.md`; the n8n session in `.scratch/n8n-automation/spec.md`, ADR 0008 and `GLOSSARY.md`; the design session in ADR 0007, `DESIGN.md`, frontend tickets 27 to 30 and `docs/agents/skills.md`; the frontend spec session in `.scratch/frontend/spec.md`; the backend gaps in `.scratch/documented-backend-features/spec.md`. Kept here only what is recorded nowhere else, or departs from the document:

- **An unexpected server error keeps the failure envelope.** The document says `ProblemDetails`; the owner accepts the difference (readiness ticket 02 and ADR 0003 stand).
- **The moderation queue is two routes,** `GET /api/admin/moderation-queue/posts` and `/comments`, where the document lists one.

## Now

Dates are the day a step should finish. **Steps 5 to 8 are crucial and late.** They are the pages, and the pages are the commitment. No page can be dropped or traded for an item under Last in line. Each step waits for the one before, so every day lost is taken from the buffer first and from Last in line after that.

### Lanes: which tickets run in parallel

Two worktree lanes at a time (`docs/agents/worktrees.md`), each taking frontend tickets from **different feature areas**, so that the only shared files are the routes and the two dictionaries. A lane that finishes early takes the next ticket in its own column. "F" is a frontend ticket. Rounds 0 to 9 are merged.

| Round | Lane 1 | Lane 2 |
|---|---|---|
| 7 | F10, write a post (merged) | F18, chat: list and reading (merged) |
| 8 | F11, the post page (merged) | F22, admin: layout and users (merged) |
| 9 | F12, edit and delete a post (merged) | F19, chat: send and receive live (merged) |
| 10 | F13, reports from the normal pages | F20, chat: edit, delete, typing |
| 11 | F14, the profile page | F23, admin: reports and the queue |
| 12 | F16, user search | F24, admin: logs and statistics |
| 13 | F15, the friends page | F21, live toasts |
| 14 | F17, the settings page | F26, the landing page |
| 15 | F39, save a photo from the viewer | |
| 16 | F40, save a message's or a post's photos together | |

Backend lane: n8n 08 and 11 are finished on their worktree branches and parked: the frontend pages come first, so their merge waits until the pages are done (owner, 2026-11-22). A session lists the two branches as parked, not as work to merge. Readiness 07 is left out: it matters only if the demo moves to a host.

1. [ ] **Design.** The name was still open, so the design session fixed the structure and left the brand for later. The frontend setup (tickets 27 to 29) is merged.
   - [ ] **Frontend ticket 30: Impeccable.** Merged, and the owner kept the hook on after its trial on F10. Open only for box 6, a cloud session's run of the launcher. No ticket waits for it.
   - [x] **The name session.** The product is Ezzo (`PRODUCT.md`).
   - [ ] **Next: the brand session** (worktree `brand`). The owner chose skin A, **Balcony** (2026-11-23): the painted balconies over Tbilisi's courtyards, a cool plaster page with a deep teal accent, Bricolage Grotesque for display, Noto Sans stays the body. The approval page's values (contrast-checked in both themes) are in the session's scratchpad and are re-derived from this line if lost. The session waits for F13 and F20 to reach `master`, merges `master` into its branch, then:
     - Replaces the provisional values in `DESIGN.md` and the token file, and adds the scrollbar rule (`border-strong` on `surface-page`).
     - The display stack is Bricolage, then Noto Sans (Cyrillic), then Noto Sans Georgian; Georgian headings drop the Latin letter spacing; Bricolage's Latin Extended file ships too. `DESIGN.md`'s typography names the Cyrillic partner.
     - The logo is the wordmark "ezzo" drawn as an SVG, with the balcony zigzag only beside it on the sign-in and landing pages; the browser tab gets a compact mark. The owner picks from two or three tab marks, shown with the eight discs before anything goes in.
     - The discs (`disc-1` to `disc-8`) are redrawn from the Balcony palette (teals, greens, slate and faded blues, wood browns, a dusk plum), none equal to the accent, white letters at 4.5 to 1. Still chosen by id.
     - Every on-screen "WebCity" becomes Ezzo: the two dictionaries, the browser-tab title and its spec.
     - Then a full screenshot run (360, 768, 1280; both themes; signed out and in; English and Georgian) and Impeccable's `critique` on the real pages. Check by eye: the liked state of a post (filled heart and `aria-pressed`, not colour alone), Georgian headings and tagline, teal discs beside the accent.
2. [x] **Write the tickets.** Of the n8n tickets, 01, 03, 04, 08 and 11 are backend work proven by integration tests; 02, 05, 06, 07, 09, 12 and 14 are workflows, open until the owner has run their checklist; 10 and 13 are visual frontend work.
3. [x] **The backend gaps** (documented-backend-features), the last of them ticket 04.
4. [x] **Shell and auth.**
5. [ ] **Tue 17, late, crucial: feed, posts and comments.** Feed with pagination, create a post with photos, edit and delete, like, comment, edit and delete a comment, report a post or comment. F09 to F12 are merged; only reporting (F13) is left. F09's `PagedList` (`core/paging/`) is the paging pattern the later lists copy.
6. [ ] **Wed 18, late, crucial: profile, friends and search.** Profile page (bio, posts, friends), edit profile, user search, friend requests (send, accept, decline, remove; the three lists), account settings (deactivate, delete, digest opt-out), the guest view.
7. [ ] **Fri 20, late, crucial: chat and live notifications.** The SignalR service and the central state for the session, conversations, online friends and unread count. Conversation list with last message, conversation with photos, edit and delete, seen, typing, presence and last active. Toasts for a new message, comment, like and a friend coming online.
8. [ ] **Sat 21, late, crucial: admin panel.** Users (create, edit, deactivate, restore, delete, grant and remove the administrator role), delete any post or comment, logs, statistics, the reports list, the moderation queue.
9. [ ] **Sun 22 and Mon 23: n8n.**
   - Merged: the backend tickets 01, 03 and 04, and the setup (02).
   - Ticket 02 stays `in-progress` until the owner adds the Telegram bot token and the chat ids and runs the checklist in `n8n/README.md` (the ticket's Comments list the steps). Workflows 05 to 14 copy its setup.
   - Next: 05 (the welcome email), then 06 to 13 (AI moderation, reports, digest, birthdays). Alert grouping (14) is last.
   - Needs from the owner: the Telegram bot token and the chat ids, the OpenAI key (before ticket 06), and the administrator address. n8n uses the same SMTP account as the backend's `EmailConfiguration`.
10. [ ] **Tue 24: buffer and finish.** Responsive pass on a phone width. Walk the document top to bottom against the running app and fix what fails. Update `README.md` (monorepo ticket 04) and `docs/backend/*.md` for everything added.
11. [ ] **Wed 25: hand in.**

### Days the owner is away

The owner expects to lose more than a day, which is more than the buffer. Work that is covered by tests can run without the owner, in a cloud session, and be reviewed afterwards: the frontend's plumbing tickets (unit-tested, with no visual part) and the n8n backend tickets. The pages cannot, because someone has to look at them, and neither can a workflow ticket, because someone has to run its checklist.

### Last in line

If time runs short, these are finished last, in this order from the end: the weekly digest, birthday notifications, grouping of repeated exception alerts, automatic hiding after several reports, the activity part of the statistics page.

On the frontend, in this order from the end: the default picture's new look (a ring coloured by the id around a faceless silhouette, frontend ticket 31; the current initials on a coloured disc stay until then), choosing a profile picture (the default picture is built either way), the dark theme (its switch is hidden if it is not checked on every page), the account history in settings (needs a new table, because `AccountDeactivatedAt` is cleared on reactivation), live friend requests (a new hub event, a live badge and incoming list on `/friends`, and their own toast), and the dialog that lists who liked a post.

## After the deadline

- A few end-to-end test flows (sign in, post, message). They come before component tests.
- **Stored notifications:** a table, a list with an unread count, a mark-as-read route, and a bell with a badge. Until then a notification reaches only a user who is connected.
- **Retried events:** an outbox table and a job that resends an event the automation did not receive (n8n ticket 15). Until then an event sent while n8n is down is lost.
- Images on AWS S3. Until then they stay on local disk.
- Russian and Spanish dictionary files (ADR 0006).
- Translated server text, which needs a stable code on every backend failure (ADR 0006).
- **A topic check for posts:** the automation flags, never hides, a post that is not something its author made, with a paid chat-model call beside ticket 06's moderation. It needs a spec first.
- **The profile of a deactivated account** (found in frontend ticket 22). `GET api/users/{id}` and `PUT api/users/{id}` go through the `User` query filter, so the backend can neither read nor edit a deactivated account's bio and date of birth. The admin panel lists such an account (the admin list ignores the filter), greyed, and offers Restore and Delete only; to edit it, an administrator restores it first (owner, 2026-11-22). Whether an administrator should be able to read or edit a deactivated profile is a backend decision to discuss. No ticket yet.
- **Georgian dates in Chrome** (found in frontend ticket 09). Desktop Chrome has no Georgian locale data, so `DateFormatter` falls back to English month names on the Georgian interface; the time zone is right. The fix is a locale polyfill (`@formatjs/intl-datetimeformat` with `ka` data) or our own Georgian month names. No ticket yet; the owner accepts the English dates until then. Also worth doing in spare time before the deadline.
