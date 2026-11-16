# What's next

The order of work toward the full-stack deadline, 2026-11-25. Tick a step when it is done, and add new steps here. Decisions live in `docs/adr/`, rules in the conventions skill, and work items in the tickets; this file holds the order and the list of what is still missing.

**Scope is fixed.** The documentation sent to the principal (`webcity-documentation.md` at the repo root) is the commitment: everything in it is due on the 25th. The old step "decide what ships" is therefore closed. The frontend comes first, because none of it exists. The backend gaps A to F are built except for three tickets (see step 3); G and H come with n8n.

The schedule below has one buffer day and no other slack. If a day slips, the items under **Last in line** move, not the pages.

## Awaiting the owner's review

Non-visual work (backend, tests, tooling) is merged as soon as it passes the full integration suite and a spec review, and the owner reviews it here afterwards. Visual work waits under "Not merged yet" instead. The rule is in `docs/agents/issue-tracker.md`. Review each item, then delete its line.

- **Documented-backend-features ticket 02: a post can be created with photos** (gap A, first part), merged 2026-11-14. Look at:
  - the new `ImageStorage` (`backend/aspnetproject/Infrastructure/Services/Storage/`), the only code that touches files;
  - the contract change: `POST /api/posts` is now `multipart/form-data`, and every post read returns `Images`;
  - the open points at the bottom of the ticket, under Comments.
- **Test-suite-speed ticket 01: signing in costs almost nothing in the test suite**, merged 2026-11-16 (suite on `master` after the merge: 519 tests, `Duration: 49 s`, down from 1 m 53 s). Look at:
  - the new setting `PasswordConfiguration:HashIterations` (`PasswordHashingConfiguration`, default 100,000) and its startup guard, which fails below 100,000 outside Testing;
  - `TestDataSeeder`, which now hashes the shared test password through the app's hasher, so seeded users sign in only on Testing hosts;
  - the open points at the bottom of the ticket, under Comments (Testing accepts 0 or a negative value).

**Not merged yet.** These branches are finished but wait for the owner's review before they are merged. No agent merges them until the owner says so. After the merge, delete the line. Merge 27 first: it is on the critical chain (28, 06 and 30 wait for it).
- **Branch `worktree-design-tokens`**: frontend ticket 27, the app takes its look from design tokens (`.scratch/frontend/issues/27-the-app-takes-its-look-from-design-tokens.md`). Worktree `.claude/worktrees/design-tokens`, added 2026-11-16.

## Open decisions

Settle these before the spec session that needs them. Each has a going-in recommendation.

1. **The product's name.** The owner may replace "WebCity"; one candidate is Ezo (ეზო). It is settled in a separate name session by **Sat 21**, before the n8n emails that carry it are written. If it is not settled by then, the product ships as WebCity. `webcity-documentation.md`, already sent to the principal, says WebCity; whether to tell the principal is the owner's call.

Settled on 2026-11-16, in the n8n session (the grilling before the n8n spec). The words Automation, Notification, Alert, Toast, Report, Flagged, Hidden and Digest are defined in `GLOSSARY.md`.

- **Each email has one sender** (ADR 0008). The backend keeps sending its six emails through MailKit, unchanged: the reset request, the reactivation request, "someone tried to register with your email", "your password was reset", account deactivated and account reactivated. The automation sends the new welcome email, the digest, birthday emails and the moderation email to administrators. No event carries a token or another secret.
- **The backend tells the automation facts, in one attempt.** Every event has one envelope (a unique id, the event name, the UTC time, a `data` object) and carries everything its workflow needs. It is posted after the data is committed, to one path per event name under one base URL. There is no retry and no stored queue: a failure writes a `Log` row and never fails the user's request. One setting turns events off, for a fresh clone and for cloud sessions.
- **Events are signed.** The header `X-WebCity-Signature` holds the lower-case hex of HMAC-SHA256 over the raw body with a shared secret. n8n checks it with a Crypto node and answers 401 on a mismatch. No timestamp.
- **The automation is a caller with no `User` row.** It sends an API key in a header, is recognised by its own authentication scheme, and reaches only `/api/internal/*` and the two moderation routes. It has its own rate-limit bucket.
- **Alerts go to Telegram,** with one chat id for administrators and one for developers (they may be the same chat). Moderation alerts also go by email to one fixed administrator address set in n8n. No Discord.
- **AI moderation.** Content is published at once and checked afterwards, on creation and on edit: posts, comments and post photos, never direct messages. Content that OpenAI marks as violating becomes Flagged; a category score of 0.9 or more makes it Hidden. Both numbers live in n8n. The automation only raises a status: the backend refuses a "Visible" from it.
- **Reports.** Every new report raises an alert. Five pending reports on one post or comment within 24 hours hide it; the number lives in n8n. A reported user is never deactivated automatically, and the reports stay pending for an administrator.
- **Exception alerts.** Every unhandled exception, from a request or a background job, produces an event with the exception type, the message, the first lines of the stack trace, the place and the time, and never a request body, headers or user data. A failure to deliver an event never produces another event. Grouping (the first occurrence alerts at once, repeats within 10 minutes are counted and sent as one message) stays last in line.
- **Birthdays.** `GET /api/internal/birthdays` returns one row per recipient with the friends whose birthday is today (UTC date; 29 February counts on 28 February in other years), paged. The run is daily at 09:00 Tbilisi time. Each recipient gets one email and one notification, and the email ignores the digest switch.
- **A notification is a kind and data, not text** (ADR 0006), and is not stored. The frontend shows it as a fifth toast.
- **The digest** runs on Mondays at 10:00 Tbilisi time, for each user with the switch on and something to report: the number of conversations with unread messages, the number of pending friend requests, and the three most-liked posts by their friends in the last 7 days. The list is paged. The switch is on by default and is changed on the settings page.
- **n8n lives in `n8n/`** at the repo root: a compose file pinned to image 2.47.7 with a named volume, `workflows/*.json` with fixed ids that a one-shot service imports and publishes, and a gitignored credentials file and `.env` beside a committed example.
- **Testing.** The backend's half has integration tests: the test host records the outgoing call, and tests assert the event's name, body and signature; the internal endpoints are tested with the API key. The workflows are checked by hand from a checklist in `n8n/`.
- **Order of the tickets.** The first is the exception alert, end to end on real Docker (signed event, verified in n8n, Telegram message, workflow imported from a clean start). Then the welcome email, AI moderation, report handling, the digest, birthdays, and alert grouping.

Settled on 2026-11-16, in the design session:

- **Tailwind v4 with Angular CDK, and no component kit** (ADR 0007). Icons from `@lucide/angular`. Fonts served by the app.
- **Structure now, brand later.** The design token names, the two themes, the layout rules and the floor for motion and accessibility are fixed in `DESIGN.md`. Its colours and fonts are a neutral provisional skin, replaced after the name is chosen.
- **A rename changes only what users see:** one dictionary key, the logo component, the page title and the email texts. The code names (`webcity` in `package.json`, the `webcity-conventions` skill, `~/.webcity-test/`) stay.
- **Light and dark both ship.** If time runs short, dark joins "Last in line" and its switch is hidden.
- **Every user has the default profile picture:** initials on a disc coloured by the user's id. Choosing a picture is a later ticket.
- **An agent looks at pages through Playwright,** which also shows it reference sites in the name session. A screenshot script gives the repeatable evidence. The Playwright MCP server, in a committed `.mcp.json`, lets an agent click through a page; it is on trial, and that one file is deleted if it bloats context or goes unused.
- **Two design skills:** Anthropic's `frontend-design` (installed) and Impeccable (installed by the foundation ticket, its hook on trial). See `docs/agents/skills.md`.
- **Styling rules are enforced in three layers:** a `frontend/CLAUDE.md` that is loaded when frontend work starts, a check in lint and CI that fails on a literal colour or a bracketed Tailwind value, and screenshots of every page at 360, 768 and 1280 px in both themes for the owner's approval.

Settled on 2026-11-15, in the frontend spec session:

- **A guest reads and searches, and nothing else.** A guest sees a profile (bio and posts, without the friends list), one post with its comments, and user search. Every other address, the home address included, sends a guest to sign-in.
- **The demo runs on the owner's machine** (dev proxy, n8n in Docker). A host behind nginx (ADR 0001) is set up only if the project is finished with time to spare.

Settled on 2026-11-14:

- **An unexpected server error keeps the failure envelope.** The document says `ProblemDetails`; the owner accepts the difference (readiness ticket 02 and ADR 0003 stand).
- **AI moderation uses OpenAI's moderation endpoint.** The owner provides the API key before step 9.
- **Hiding a reported user means deactivating the account.** For a `USER` report, the admin's "hide" decision deactivates that user.
- **Images go on local disk.** JPEG, PNG and WebP; 5 MB each; up to 10 per post and 5 per message. AWS S3 was considered and left for after the deadline.
- **Real-time behaviour is tested with a real SignalR client** connected to the test host.

## Now

Dates are the day a step should finish.

**Overdue, as of Mon 16.** Step 4 is overdue: its pages could not start, because they wait for the frontend setup of step 1 (frontend tickets 27 to 29) and for frontend ticket 06. Steps 5 to 8 each wait for the step before, so each will be late by as much as step 4 is, and their dates no longer hold.

**Steps 4 to 8 are crucial.** They are the pages, and the pages are the commitment in `webcity-documentation.md`. No page can be dropped or traded for an item under Last in line. Every day lost here is taken from the buffer (Tue 24) first and from the items under Last in line after that. Three chains meet at frontend ticket 07, and the slowest of them decides the finish date: 27 → 28 → 29, 27 → 06, and 04 → 05. After 07 come the pages. Work on these chains comes before anything else. Tickets 27 and 05 can start now, and 06 and 28 can run side by side once 27 is done.

### Lanes: which tickets run in parallel

Set on 2026-11-16. Two worktree lanes at a time (`docs/agents/worktrees.md`). Until the shell (frontend 07) lands, each pair is one frontend ticket and one backend ticket, so that no two lanes edit the frontend at once: before the shell, every frontend ticket puts its proof on the same bare page. Start the next pair when both tickets of the current one are merged; if one lane finishes early, it may take the next ticket in its own column. "F" is a frontend ticket and "B" a backend one (`documented-backend-features`, unless marked "frontend").

| Round | Frontend lane | Backend lane | Status |
|---|---|---|---|
| 0 | F27, design tokens | B12, an administrator decides a report (merged 2026-11-16) | running |
| 1 | F28, the themes | T01, then T02: cheaper sign-in, one-batch reseed | T01 merged 2026-11-16 |
| 2 | F29, the screenshots | T03, test classes in parallel | |
| 3 | F06, toast, dialog, confirmation, menu | B13, statistics | |
| 4 | F05, the live connection | frontend 25, friendship tests | |
| 5 | F07, the shell | B04, remove a photo from a post | |

"T" is a `test-suite-speed` ticket. The three run one after another, each in its own worktree, and only beside frontend tickets: they change the seed and every test class that the other backend tickets rely on. The n8n backend tickets take the backend lane after round 5, or a third lane once the shell lands.

After the shell, both lanes take frontend tickets, always from **different feature areas**, so that the only shared files are the routes and the two dictionaries, where both sides add lines and a merge takes a minute. The n8n backend tickets fill a third lane when they exist.

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

Frontend 30 (Impeccable) runs in a session with the owner whenever the owner is present, after 27. Readiness 07 is left out: it matters only if the demo moves to a host.

1. [ ] **Design, in four parts.** The name was still open, so the session fixed the structure and left the brand for later.
   - [x] **Mon 16 (planned for Sat 14, two days late): the design session.** Output: ADR 0007, `DESIGN.md` with a neutral provisional skin, and the Styling rules in the conventions skill's TypeScript reference.
   - [ ] **Crucial: the frontend setup, frontend tickets 27 to 29.** Every open frontend ticket from 07 onward waits for all three, by the owner's decision on 2026-11-16: the environment is set up before the pages are built. Three tickets do not: 05 (the live connection, which has no styles) waits only for 04, 06 (the shared blocks) waits only for 27, and 25 is backend tests.
     - **27, the design tokens:** Tailwind, CDK and the icon package; the token file with the neutral skin in light and dark; the fonts; the `Button`; `frontend/CLAUDE.md`; the check that fails on a literal value. It can start at once.
     - **28, the themes:** the theme store, its switch, and no flash of the wrong theme on load. After 27.
     - **29, the screenshots:** the Playwright command, and the Playwright MCP server in `.mcp.json` on trial. After 28 and 04.
   - [ ] **Frontend ticket 30: Impeccable, with its hook on trial.** Done in a session with the owner, not through `/implement`. No ticket waits for it.
   - [ ] **By Sat 21: the name session** (the open decision on the name). It uses Playwright to look at reference sites, and writes `PRODUCT.md`. On Fable 5.2 if available, like the brand session.
   - [ ] **After the name: the brand session.** One approval page in two skins; the owner chooses. It replaces the provisional values in `DESIGN.md` and the token file, and adds the logo.
2. [ ] **Write the tickets, one group at a time.** For each group the owner runs `/to-spec` and then `/to-tickets` in a session that already holds the context, because `/to-spec` only writes down what the conversation has settled.
   - Done 2026-11-14: the backend gaps A to F, as 13 tickets in `.scratch/documented-backend-features/issues/`. Tickets 01, 02 and 03 can start at once; the longest chain is 02 → 05 → 08 → 09 → 11 → 12.
   - Done 2026-11-15: the frontend, as a spec (`.scratch/frontend/spec.md`) and 24 tickets in `.scratch/frontend/issues/`. Tickets 01 and 02 can start at once, and 01 to 05 need nothing from the design session; 06 onward wait for it. The longest chain is 02 → 04 → 05 → 07 → 09 → 11 → 13 → 14.
   - Done 2026-11-16: the frontend setup from the design session, as frontend tickets 27 to 30. Tickets 06 and 07 were changed to match (the default profile picture, the theme switch, screenshots), and every open frontend ticket from 07 onward now waits for 27 to 29.
   - By Fri 20: n8n, gaps G and H with the six workflows. The grilling was held on 2026-11-16 (its decisions are under Open decisions). Still to do: `/to-spec` and `/to-tickets` in the same session, on Fable 5.2 if available (`docs/agents/issue-tracker.md`).
3. [ ] **Any time, in parallel: the open backend tickets.**
   - Documented-backend-features 04 (remove a photo from a post), 12 (an administrator decides a report) and 13 (statistics). The frontend shows "Coming soon" on whatever depends on one that is still open when its page is built.
   - Frontend ticket 01, the three small backend changes the pages need: four reserved usernames, the joined date removed from the public user shape, and the time the username was last changed added to the user's own shape.
   - Readiness 07 (the real client IP behind a proxy) matters only if the demo moves to a host.
   - Done: readiness 06, 08 and 09, openapi-document 01 and message-editing 01.
4. [ ] **Mon 16, overdue, crucial: shell and auth.** Lazy-loaded feature areas, the HTTP interceptor with automatic refresh, session restore, route guards for signed-in users and administrators, and the pages: register, sign in, password reset, account reactivation.
   - Backend, already done: **images** and **likes** (gaps A and B), which changed the post and message contracts. Ticket 02 (photos on a new post) still awaits the owner's review; 05 (likes) and 06 (photos in a message) are done. Only ticket 04 (remove a photo from a post) is open.
5. [ ] **Tue 17, will be late, crucial: feed, posts and comments.** Feed with pagination, create a post with photos, edit and delete, like, comment, edit and delete a comment, report a post or comment.
   - Backend, already done: **feed ranking** (gap C, ticket 08).
6. [ ] **Wed 18, will be late, crucial: profile, friends and search.** Profile page (bio, posts, friends), edit profile, user search, friend requests (send, accept, decline, remove; the three lists), account settings (deactivate, delete, digest opt-out), the guest view.
   - Backend, already done: **typing on the hub** (gap D, ticket 07).
7. [ ] **Fri 20, will be late, crucial: chat and live notifications.** The SignalR service and the central state (signals) for the session, conversations, online friends and unread count. Conversation list with last message, conversation with photos, edit and delete, seen, typing, presence and last active. Toasts for a new message, comment, like and a friend coming online.
   - Backend alongside: what is left of gaps E and F, which is ticket 12 (an administrator decides a report) and ticket 13 (statistics). Logs, the account list, hiding content, the moderation queue and the reports list are done (tickets 03, 09, 10 and 11).
8. [ ] **Sat 21, will be late, crucial: admin panel.** Users (create, edit, deactivate, restore, delete, grant and remove the administrator role), delete any post or comment, logs, statistics, the reports list, the moderation queue.
9. [ ] **Mon 23: n8n.** One day for the plumbing and two workflows, one day for the other four.
   - Sun 22: gap G, then the exception-alert and welcome-email workflows.
   - Mon 23: AI moderation, report handling, weekly digest, birthday notifications.
   - The workflows are exported as JSON into the repo, with a compose file that starts n8n.
   - The first ticket (the exception alert, end to end) can start as soon as it exists: Docker Desktop was installed on 2026-11-16 (29.9.3, WSL 2). A session that was open before the install does not have `docker` on its PATH.
   - Needs from the owner: the Telegram bot token and the chat ids (before the first ticket), the OpenAI key (before AI moderation), and the administrator address. n8n uses the same SMTP account as the backend's `EmailConfiguration`.
10. [ ] **Tue 24: buffer and finish.** Responsive pass on a phone width. Walk the document top to bottom against the running app and fix what fails. Update `README.md` (monorepo ticket 04) and `docs/backend/*.md` for everything added.
11. [ ] **Wed 25: hand in.**

### Days the owner is away

The owner expects to lose more than a day, which is more than the buffer. Work that is covered by tests can run without the owner, in a cloud session, and be reviewed afterwards. Most of the backend was built that way on 2026-11-14. What is left of that kind: the backend tickets of step 3, the frontend's plumbing tickets (unit-tested, with no visual part), and the backend half of gap G once the n8n spec exists. The pages cannot, because someone has to look at them.

### Last in line

If time runs short, these are finished last, in this order from the end: the weekly digest, birthday notifications, grouping of repeated exception alerts, automatic hiding after several reports, the activity part of the statistics page. (The orphan-photo cleanup job and the mutual-friends tier of the feed ranking were on this list and are done.)

On the frontend, in this order from the end: choosing a profile picture (an upload; the default picture is built either way), the dark theme (its switch is hidden if it is not checked on every page), the account history in settings (every username change, deactivation and reactivation, which needs a new table because `AccountDeactivatedAt` is cleared on reactivation), live friend requests (a new hub event, the badge and the incoming list on `/friends` updating live, and a fifth toast), and the dialog that lists who liked a post.

## What the document promises and the backend lacks

Checked against the code on 2026-11-15. Gaps A to F are specified in `.scratch/documented-backend-features/spec.md`, and all of them are built except three tickets; G and H wait for the n8n spec.

- **A. Images.** Done (tickets 02 and 06): photos on a new post and in a message, stored on disk, checked and served. Still missing: `DELETE /api/posts/{postId}/images/{imageId}` (ticket 04).
- **B. Likes.** Done (ticket 05).
- **C. Feed ranking.** Done (ticket 08), the mutual-friends tier included.
- **D. Hub.** Done (ticket 07): `SendTyping` and the `UserTyping` push.
- **E. Admin reads.** Done (ticket 03): `GET /api/admin/logs` and `GET /api/admin/users`, the account list the document does not mention. Still missing: `GET /api/admin/statistics` (ticket 13).
- **F. Reports and moderation.** Done (tickets 09, 10 and 11): hiding a post or comment, creating and listing reports, and the moderation queue. Still missing: the report decision, `PUT /api/reports/{id}` (ticket 12). The queue is two routes, `GET /api/admin/moderation-queue/posts` and `/comments`, where the document lists one.
- **G. n8n plumbing.** Outbound webhooks signed with a shared secret for a new account, post and comment creation and edits, a new report and an exception (from requests and from background jobs). An API-key identity that can reach only the internal and moderation endpoints. `GET /api/internal/digest`, `GET /api/internal/birthdays`, `POST /api/internal/notifications` with the `ReceiveNotification` push it sends. `digestEmailEnabled` on `User`, editable in the profile settings.
- **H. Email through n8n.** Only the new welcome email, which follows the "an account was created" event. The six existing emails stay in the backend (ADR 0008).

## After the deadline

- A few end-to-end test flows (sign in, post, message). They come before component tests.
- **Stored notifications:** a table, a list with an unread count, a mark-as-read route, and a bell with a badge in the interface. Until then a notification reaches only a user who is connected (n8n session, 2026-11-16).
- **Retried events:** an outbox table and a job that resends an event the automation did not receive. Until then an event sent while n8n is down is lost.
- Russian and Spanish dictionary files (ADR 0006).
- Translated server text, which needs a stable code on every backend failure (ADR 0006).
- **Replaced on 2026-11-16 by the `test-suite-speed` tickets** (484 tests, 1 m 53 s; a shared host per class would carry rate-limit counters between tests). Test-suite-speed ticket 03 deletes this entry. **Share one test host per test class**, once the integration suite reaches about 400 tests or a run takes more than a minute (on 2026-11-14: 159 tests, 18 s). xUnit builds a new class instance per test, so each test boots its own `CustomWebApplicationFactory`. Moving the factory into an `IClassFixture` would roughly halve the run time; the database reset per test stays.
