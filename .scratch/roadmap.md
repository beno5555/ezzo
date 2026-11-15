# What's next

The order of work toward the full-stack deadline, 2026-11-25. Tick a step when it is done, and add new steps here. Decisions live in `docs/adr/`, rules in the conventions skill, and work items in the tickets; this file holds the order and the list of what is still missing.

**Scope is fixed.** The documentation sent to the principal (`webcity-documentation.md` at the repo root) is the commitment: everything in it is due on the 25th. The old step "decide what ships" is therefore closed. The frontend comes first, because none of it exists. The backend gaps A to F are built except for three tickets (see step 3); G and H come with n8n.

The schedule below has one buffer day and no other slack. If a day slips, the items under **Last in line** move, not the pages.

## Awaiting the owner's review

Work merged to `master` while the owner was away. It passed the full integration suite and a spec review, but the owner has not looked at it yet. Review each item, then delete its line.

- **Documented-backend-features ticket 02: a post can be created with photos** (gap A, first part), merged 2026-11-14. Look at:
  - the new `ImageStorage` (`backend/aspnetproject/Infrastructure/Services/Storage/`), the only code that touches files;
  - the contract change: `POST /api/posts` is now `multipart/form-data`, and every post read returns `Images`;
  - the open points at the bottom of the ticket, under Comments.

## Open decisions

Settle these before the spec session that needs them. Each has a going-in recommendation.

1. **Who sends email.** The document says n8n sends every transactional email; today MailKit does. Recommendation: move it in step 9, and leave MailKit working until then.
2. **Admin and developer channels.** Telegram for both, which needs one bot token and a chat id from the owner.
3. **The product's name.** The owner may replace "WebCity"; one candidate is Ezo (ეზო). It is settled in a separate name session by **Sat 21**, before the n8n emails that carry it are written. If it is not settled by then, the product ships as WebCity. `webcity-documentation.md`, already sent to the principal, says WebCity; whether to tell the principal is the owner's call.

Settled on 2026-11-16, in the design session:

- **Tailwind v4 with Angular CDK, and no component kit** (ADR 0007). Icons from `@lucide/angular`. Fonts served by the app.
- **Structure now, brand later.** The design token names, the two themes, the layout rules and the floor for motion and accessibility are fixed in `DESIGN.md`. Its colours and fonts are a neutral provisional skin, replaced after the name is chosen.
- **A rename changes only what users see:** one dictionary key, the logo component, the page title and the email texts. The code names (`webcity` in `package.json`, the `webcity-conventions` skill, `~/.webcity-test/`) stay.
- **Light and dark both ship.** If time runs short, dark joins "Last in line" and its switch is hidden.
- **Every user has the default profile picture:** initials on a disc coloured by the user's id. Choosing a picture is a later ticket.
- **An agent looks at pages through Playwright,** which also shows it reference sites in the name session.
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

1. [ ] **Design, in four parts.** The name was still open, so the session fixed the structure and left the brand for later.
   - [x] **Mon 16 (planned for Sat 14, two days late): the design session.** Output: ADR 0007, `DESIGN.md` with a neutral provisional skin, and the Styling rules in the conventions skill's TypeScript reference.
   - [ ] **The foundation ticket,** which the owner writes with `/to-tickets`. Wherever a ticket says it waits for the design session, it now waits for this ticket. It installs Tailwind, CDK and the icon package; adds the token file with the neutral skin in light and dark, and the fonts; builds the theme store, its switch and the first-paint check against a flash of the wrong theme; builds the `Avatar` and `Button` components; adds the Playwright screenshot script, `frontend/CLAUDE.md` and the check for literal values; installs Impeccable and starts the trial of its hook. Ticket 07 gains the theme switch in the menu.
   - [ ] **By Sat 21: the name session** (open decision 3). It uses Playwright to look at reference sites, and writes `PRODUCT.md`.
   - [ ] **After the name: the brand session.** One approval page in two skins; the owner chooses. It replaces the provisional values in `DESIGN.md` and the token file, and adds the logo.
2. [ ] **Write the tickets, one group at a time.** For each group the owner runs `/to-spec` and then `/to-tickets` in a session that already holds the context, because `/to-spec` only writes down what the conversation has settled.
   - Done 2026-11-14: the backend gaps A to F, as 13 tickets in `.scratch/documented-backend-features/issues/`. Tickets 01, 02 and 03 can start at once; the longest chain is 02 → 05 → 08 → 09 → 11 → 12.
   - Done 2026-11-15: the frontend, as a spec (`.scratch/frontend/spec.md`) and 24 tickets in `.scratch/frontend/issues/`. Tickets 01 and 02 can start at once, and 01 to 05 need nothing from the design session; 06 onward wait for it. The longest chain is 02 → 04 → 05 → 07 → 09 → 11 → 13 → 14.
   - By Fri 20: n8n, gaps G and H with the six workflows.
3. [ ] **Any time, in parallel: the open backend tickets.**
   - Documented-backend-features 04 (remove a photo from a post), 12 (an administrator decides a report) and 13 (statistics). The frontend shows "Coming soon" on whatever depends on one that is still open when its page is built.
   - Frontend ticket 01, the three small backend changes the pages need: four reserved usernames, the joined date removed from the public user shape, and the time the username was last changed added to the user's own shape.
   - Readiness 07 (the real client IP behind a proxy) matters only if the demo moves to a host.
   - Done: readiness 06, 08 and 09, openapi-document 01 and message-editing 01.
4. [ ] **Mon 16: shell and auth.** Lazy-loaded feature areas, the HTTP interceptor with automatic refresh, session restore, route guards for signed-in users and administrators, and the pages: register, sign in, password reset, account reactivation.
   - The pages of this step could not start on Mon 16: they wait for the foundation ticket and ticket 06. The dates of steps 4 to 8 are the owner's to move.
   - Backend, already done: **images** and **likes** (gaps A and B), which changed the post and message contracts. Ticket 02 (photos on a new post) still awaits the owner's review; 05 (likes) and 06 (photos in a message) are done. Only ticket 04 (remove a photo from a post) is open.
5. [ ] **Tue 17: feed, posts and comments.** Feed with pagination, create a post with photos, edit and delete, like, comment, edit and delete a comment, report a post or comment.
   - Backend, already done: **feed ranking** (gap C, ticket 08).
6. [ ] **Wed 18: profile, friends and search.** Profile page (bio, posts, friends), edit profile, user search, friend requests (send, accept, decline, remove; the three lists), account settings (deactivate, delete, digest opt-out), the guest view.
   - Backend, already done: **typing on the hub** (gap D, ticket 07).
7. [ ] **Fri 20: chat and live notifications.** The SignalR service and the central state (signals) for the session, conversations, online friends and unread count. Conversation list with last message, conversation with photos, edit and delete, seen, typing, presence and last active. Toasts for a new message, comment, like and a friend coming online.
   - Backend alongside: what is left of gaps E and F, which is ticket 12 (an administrator decides a report) and ticket 13 (statistics). Logs, the account list, hiding content, the moderation queue and the reports list are done (tickets 03, 09, 10 and 11).
8. [ ] **Sat 21: admin panel.** Users (create, edit, deactivate, restore, delete, grant and remove the administrator role), delete any post or comment, logs, statistics, the reports list, the moderation queue.
9. [ ] **Mon 23: n8n.** One day for the plumbing and two workflows, one day for the other four.
   - Sun 22: gap G, then the transactional-email and exception-alert workflows.
   - Mon 23: AI moderation, report handling, weekly digest, birthday notifications.
   - The workflows are exported as JSON into the repo, with a compose file that starts n8n.
   - Needs from the owner before Sun 22: Docker Desktop installed (it is not on this machine as of 2026-11-15), the OpenAI key, the Telegram bot token and chat id, and SMTP credentials entered in n8n.
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
- **G. n8n plumbing.** Outbound webhooks signed with a shared secret for registration, post and comment creation, a new report and an exception (from requests and from background jobs). An API-key identity that can reach only the internal and moderation endpoints. `GET /api/internal/digest`, `GET /api/internal/birthdays`, `POST /api/internal/notifications` with the `ReceiveNotification` push it sends. `digestEmailEnabled` on `User`, editable in the profile settings.
- **H. Email through n8n.** The welcome, password-reset, account-reactivation and security emails leave the backend as events instead of being sent by MailKit (open decision 1).

## After the deadline

- A few end-to-end test flows (sign in, post, message). They come before component tests.
- Russian and Spanish dictionary files (ADR 0006).
- Translated server text, which needs a stable code on every backend failure (ADR 0006).
- **Share one test host per test class**, once the integration suite reaches about 400 tests or a run takes more than a minute (on 2026-11-14: 159 tests, 18 s). xUnit builds a new class instance per test, so each test boots its own `CustomWebApplicationFactory`. Moving the factory into an `IClassFixture` would roughly halve the run time; the database reset per test stays.
