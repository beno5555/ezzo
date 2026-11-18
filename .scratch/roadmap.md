# What's next

The order of work toward the full-stack deadline, 2026-11-25. Tick a step when it is done, and add new steps here. Decisions live in the specs, `docs/adr/` and `DESIGN.md`, rules in the conventions skill, and work items in the tickets; this file holds the order, the open decisions and what is still missing. A ticket's own `Status:` line is the truth about it; this file only summarises.

**Scope is fixed.** The documentation sent to the principal (`webcity-documentation.md` at the repo root) is the commitment: everything in it is due on the 25th. The frontend comes first, because none of its pages exist yet.

The schedule below has one buffer day and no other slack. If a day slips, the items under **Last in line** move, not the pages.

## Awaiting the owner's review

Non-visual work (backend, tests, tooling) is merged as soon as it passes the full integration suite and a spec review, and the owner reviews it here afterwards. Visual work waits under "Not merged yet" instead. The rule is in `docs/agents/issue-tracker.md`. Review each item, then delete its line.

- **Documented-backend-features ticket 02: a post can be created with photos**, merged 2026-11-14. Look at `ImageStorage` (`backend/aspnetproject/Infrastructure/Services/Storage/`), the only code that touches files; the contract change (`POST /api/posts` is `multipart/form-data`, every post read returns `Images`); and the open points under the ticket's Comments.
- **Test-suite-speed ticket 01: signing in costs almost nothing in the test suite**, merged 2026-11-16 (`Duration` 1 m 53 s → 49 s). Look at the setting `PasswordConfiguration:HashIterations` and its startup guard (fails below 100,000 outside Testing); `TestDataSeeder`, which now hashes through the app's hasher; and the open points under the ticket's Comments (Testing accepts 0 or a negative value).
- **Test-suite-speed ticket 02: every test is reseeded in one round trip**, merged 2026-11-17 (`Duration` 58 s → 42 to 46 s). Look at `SeedRecorder` and `RecordedSeed` (`backend/aspnetproject.IntegrationTests/Fixtures/`), the startup check that fails the run when a replay differs from the EF seed, and the known limits under the ticket's Comments.
- **Test-suite-speed ticket 03: test classes run in parallel, each on its own database**, merged 2026-11-17 (`Duration` 44 s → 15 to 21 s locally, 22 to 29 s in CI). Look at `TestDatabasePool`, `DatabaseLender`, `TestDatabaseNames` and `DatabaseFixture` (same folder), and the open points under the ticket's Comments.
- **Documented-backend-features ticket 13: an administrator sees system statistics**, merged 2026-11-17. Look at `StatisticsService` and the new `GET /api/admin/statistics` (`docs/backend/controllers.md`, AdminController), the counting helpers added to `BaseEntityRepository`, `UserRepository` and `ReportRepository`, and the online count read from `UserConnectionTracker`. The ticket records no spec review; the owner judged the code safe to merge.
- **Documented-backend-features ticket 04: a photo can be removed from a post, and deleted posts take their files with them**, merged 2026-11-18. Look at `PostService.RemovePostImageAsync` and `CheckImageRemoval` (the "text or a photo" rule, also used by `UpdatePost`), the new `DELETE /api/posts/{postId}/images/{imageId}` (all refusals are `400`), the file cleanup in `DeletePostAsync` and in the purge (`UserRepository.DeleteUsersPostsAsync`), and the ticket's Comments: its purge box is unticked for you, because a test replaced the manual run.
- **Frontend ticket 25: the friendship endpoints are covered by integration tests**, merged 2026-11-17 (`Duration` 40 s for the full suite, 640 tests). Look at `FriendshipControllerTests` (99 tests), the three bugs it exposed and their fixes (list order for paging, a 500 on `GET accepted/{friendId}` for a deactivated friend, the declared type of `GetFriendsOf`), and the points left alone under the ticket's Comments.
- **n8n ticket 01: a failure in the backend leaves as a signed event**, merged 2026-11-17 (`Duration` 36 s on the branch, 43 s on the merge with 662 tests). Look at `EventPublisher` and `AutomationEventsConfiguration` (`backend/aspnetproject/Infrastructure/Services/Automation/`), the two call sites (`GlobalExceptionHandler`, `PeriodicHostedService.RunOnceAsync`), the Development-only `GET api/dev/throw`, the test seam (`EventRecorder`, `recordEvents` on `CustomWebApplicationFactory`) and `docs/backend/automation.md`. The spec review ran on Opus 5.5 (Fable was at its usage limit); the additions beyond the ticket are under its Comments.
- **n8n ticket 04: the backend tells the automation about accounts, content and reports**, merged 2026-11-17 (`Duration` 42 s, 714 tests; the merge changed no code beyond the branch). Look at the six events in `docs/backend/automation.md`, the call sites (`AuthService.RegisterAsync`, `PostService`, `CommentService`, `ReportService`), `GetPendingTimesForTargetAsync` in `ReportRepository`, and `EventSecretsTests`. Also look at the change you asked for on the way: `LastUpdatedAt` of a post or comment is stamped only when the title or text really changes. `EditMessage` and the profile edit still stamp on every save. The spec review ran on Opus 5.5 (Fable was at its usage limit).

**Not merged yet.** Finished visual branches that wait for the owner's review. No agent merges them until the owner says so. After the merge, delete the line.

- **Frontend ticket 06: the pages share a toast, a dialog, a confirmation and a menu**, branch `worktree-shared-frontend-blocks`, finished 2026-11-18. Start `npm start` and look at the block buttons on the bare page (toasts, dialog, both confirmations, menu, avatars) at 360, 768 and 1280 px in both themes, then tick the last open box. Read the ticket's Comments: toasts are not a CDK overlay, repeated toasts are skipped, the dialog pane carries two `!` classes, and the build has a bundle-budget warning until ticket 07.

## Open decisions

Settle these before the session that needs them. Each has a going-in recommendation.

1. **The product's name.** The owner may replace "WebCity"; one candidate is Ezo (ეზო). It is settled in a separate name session by **Sat 21**, before the n8n emails that carry it are written. If it is not settled by then, the product ships as WebCity. `webcity-documentation.md`, already sent to the principal, says WebCity; whether to tell the principal is the owner's call.

## Settled

Each decision is recorded where the work reads it: the n8n session (2026-11-16) in `.scratch/n8n-automation/spec.md`, ADR 0008 and `GLOSSARY.md`; the design session (2026-11-16) in ADR 0007, `DESIGN.md`, frontend tickets 27 to 30 and `docs/agents/skills.md`; the frontend spec session (2026-11-15) in `.scratch/frontend/spec.md`; the backend gaps (2026-11-14) in `.scratch/documented-backend-features/spec.md`. Kept here only what is recorded nowhere else, or departs from the principal's document:

- **An unexpected server error keeps the failure envelope** (2026-11-14). The document says `ProblemDetails`; the owner accepts the difference (readiness ticket 02 and ADR 0003 stand).
- **The moderation queue is two routes,** `GET /api/admin/moderation-queue/posts` and `/comments`, where the document lists one.
- **A rename changes only what users see** (2026-11-16): one dictionary key, the logo component, the page title and the email texts. The code names (`webcity` in `package.json`, the `webcity-conventions` skill, `~/.webcity-test/`) stay.

## Now

Dates are the day a step should finish.

**Overdue, as of Tue 17.** Step 4 is overdue: its pages wait for the rest of the frontend setup (frontend ticket 29) and for frontend ticket 06. Steps 5 to 8 each wait for the step before, so each will be late by as much as step 4 is, and their dates no longer hold.

**Steps 4 to 8 are crucial.** They are the pages, and the pages are the commitment. No page can be dropped or traded for an item under Last in line. Every day lost here is taken from the buffer (Tue 24) first and from the items under Last in line after that. Two chains meet at frontend ticket 07, and the slower decides the finish date: 29 (28 merged 2026-11-18), and 06 (05 merged 2026-11-18; 06 finished 2026-11-18 and waits under "Not merged yet" for the owner's look). Ticket 29 can start now. Work on these chains comes before anything else.

### Lanes: which tickets run in parallel

Set on 2026-11-16. Two worktree lanes at a time (`docs/agents/worktrees.md`). Until the shell (frontend 07) lands, each pair is one frontend ticket and one backend ticket, because every frontend ticket before the shell puts its proof on the same bare page. Start the next pair when both tickets of the current one are merged; a lane that finishes early may take the next ticket in its own column. "F" is a frontend ticket, "B" a `documented-backend-features` one, "T" a `test-suite-speed` one.

| Round | Frontend lane | Backend lane | Status |
|---|---|---|---|
| 0 | F27, design tokens (merged 2026-11-16) | B12, an administrator decides a report (merged 2026-11-16) | both merged 2026-11-16 |
| 1 | F28, the themes (merged 2026-11-18) | T01, then T02: cheaper sign-in, one-batch reseed | all merged by 2026-11-18 |
| 2 | F29, the screenshots | T03, test classes in parallel (merged 2026-11-17) | |
| 3 | F06, toast, dialog, confirmation, menu | B13, statistics (merged 2026-11-17) | |
| 4 | F05, the live connection (merged 2026-11-18) | frontend 25, friendship tests (merged 2026-11-17) | both merged 2026-11-18 |
| 5 | F07, the shell | n8n 01, a failure leaves as a signed event | |

After round 5 the backend lane takes n8n 04, then 03 once 02 is done with the owner, then 08 and 11; B04 (remove a photo) waits until the backend lane is free (owner, 2026-11-17). A third lane can open once the shell lands.

After the shell, both lanes take frontend tickets from **different feature areas**, so that the only shared files are the routes and the two dictionaries.

| Round | Lane 1 | Lane 2 |
|---|---|---|
| 6 | F08, the auth pages | F09, the feed |
| 7 | F10, write a post | F18, chat: list and reading |
| 8 | F11, the post page | F22, admin: layout and users |
| 9 | F12, edit and delete a post | F19, chat: send and receive live |
| 10 | F13, reports from the normal pages | F20, chat: edit, delete, typing |
| 11 | F14, the profile page | F23, admin: reports and the queue |
| 12 | F16, user search | F24, admin: logs and statistics |
| 13 | F15, the friends page | F21, live toasts |
| 14 | F17, the settings page | F26, the landing page |

Frontend 30 (Impeccable) runs in a session with the owner whenever the owner is present. Readiness 07 is left out: it matters only if the demo moves to a host.

1. [ ] **Design.** The name was still open, so the design session fixed the structure and left the brand for later.
   - [x] **Mon 16: the design session** (planned for Sat 14). Output: ADR 0007, `DESIGN.md` with a neutral provisional skin, and the Styling rules in the conventions skill's TypeScript reference.
   - [ ] **Crucial: the frontend setup, frontend tickets 27 to 29.** Every open frontend ticket from 07 onward waits for all three (owner's decision, 2026-11-16), except 06 (05 and 25 are merged).
     - [x] 27, the design tokens. Merged 2026-11-16.
     - [x] 28, the themes. Merged 2026-11-18.
     - [ ] 29, the screenshots and the Playwright MCP server on trial. After 28.
   - [ ] **Frontend ticket 30: Impeccable, with its hook on trial.** In a session with the owner, not through `/implement`. No ticket waits for it.
   - [ ] **By Sat 21: the name session** (open decision 1). It uses Playwright to look at reference sites, and writes `PRODUCT.md`. On Opus 5.5.
   - [ ] **After the name: the brand session.** One approval page in two skins; the owner chooses. It replaces the provisional values in `DESIGN.md` and the token file, and adds the logo.
2. [x] **Write the tickets.** All four groups are ticketed: the backend gaps A to F (`documented-backend-features`, 2026-11-14), the frontend (`frontend`, 2026-11-15, with the setup tickets 27 to 30 added on 2026-11-16) and n8n (`n8n-automation`, 2026-11-17). Of the n8n tickets, 01, 03, 04, 08 and 11 are backend work proven by integration tests; 02, 05, 06, 07, 09, 12 and 14 are workflows, open until the owner has run their checklist; 10 and 13 are visual frontend work.
3. [x] **The last open backend ticket,** documented-backend-features 04 (remove a photo from a post). Merged 2026-11-18, so frontend ticket 12 can build the real control.
4. [ ] **Mon 16, overdue, crucial: shell and auth.** Lazy-loaded feature areas, route guards, and the pages: register, sign in, password reset, account reactivation. The session, automatic refresh, session restore and the guards are done (frontend ticket 04), as are the two dictionaries (03). Still open: the shell (07) and the real auth pages (08).
5. [ ] **Tue 17, will be late, crucial: feed, posts and comments.** Feed with pagination, create a post with photos, edit and delete, like, comment, edit and delete a comment, report a post or comment.
6. [ ] **Wed 18, will be late, crucial: profile, friends and search.** Profile page (bio, posts, friends), edit profile, user search, friend requests (send, accept, decline, remove; the three lists), account settings (deactivate, delete, digest opt-out), the guest view.
7. [ ] **Fri 20, will be late, crucial: chat and live notifications.** The SignalR service and the central state for the session, conversations, online friends and unread count. Conversation list with last message, conversation with photos, edit and delete, seen, typing, presence and last active. Toasts for a new message, comment, like and a friend coming online.
8. [ ] **Sat 21, will be late, crucial: admin panel.** Users (create, edit, deactivate, restore, delete, grant and remove the administrator role), delete any post or comment, logs, statistics, the reports list, the moderation queue.
9. [ ] **Sun 22 and Mon 23: n8n.**
   - Sun 22: n8n tickets 01 to 05 (the backend's events, the n8n setup, the exception alert, the welcome email).
   - Mon 23: tickets 06 to 13 (AI moderation, reports, digest, birthdays). Alert grouping (14) is last.
   - Ticket 01 can start now. Docker Desktop is installed (2026-11-16, 29.9.3, WSL 2); a session that was open before the install does not have `docker` on its PATH.
   - Ticket 03 waits for 02 by the owner's decision (2026-11-17), so 08 and 11 do too.
   - Needs from the owner: the Telegram bot token and the chat ids (before ticket 02), the OpenAI key (before ticket 06), and the administrator address. n8n uses the same SMTP account as the backend's `EmailConfiguration`.
10. [ ] **Tue 24: buffer and finish.** Responsive pass on a phone width. Walk the document top to bottom against the running app and fix what fails. Update `README.md` (monorepo ticket 04) and `docs/backend/*.md` for everything added.
11. [ ] **Wed 25: hand in.**

### Days the owner is away

The owner expects to lose more than a day, which is more than the buffer. Work that is covered by tests can run without the owner, in a cloud session, and be reviewed afterwards: the backend tickets of step 3, the frontend's plumbing tickets (unit-tested, with no visual part), and the n8n backend tickets (01 now, 04 after it, and 03, 08 and 11 once the owner has checked 02). The pages cannot, because someone has to look at them, and neither can a workflow ticket, because someone has to run its checklist.

### Last in line

If time runs short, these are finished last, in this order from the end: the weekly digest, birthday notifications, grouping of repeated exception alerts, automatic hiding after several reports, the activity part of the statistics page.

On the frontend, in this order from the end: choosing a profile picture (the default picture is built either way), the dark theme (its switch is hidden if it is not checked on every page), the account history in settings (needs a new table, because `AccountDeactivatedAt` is cleared on reactivation), live friend requests (a new hub event, a live badge and incoming list on `/friends`, and their own toast), and the dialog that lists who liked a post.

## What the document promises and the backend lacks

Gaps A to F (`.scratch/documented-backend-features/spec.md`) are built except one endpoint: `DELETE /api/posts/{postId}/images/{imageId}` (ticket 04). Gaps G and H, the n8n plumbing and the welcome email, are the n8n tickets.

## After the deadline

- A few end-to-end test flows (sign in, post, message). They come before component tests.
- **Stored notifications:** a table, a list with an unread count, a mark-as-read route, and a bell with a badge. Until then a notification reaches only a user who is connected.
- **Retried events:** an outbox table and a job that resends an event the automation did not receive (n8n ticket 15, written 2026-11-17). Until then an event sent while n8n is down is lost.
- Images on AWS S3 (considered on 2026-11-14). Until then they stay on local disk.
- Russian and Spanish dictionary files (ADR 0006).
- Translated server text, which needs a stable code on every backend failure (ADR 0006).
