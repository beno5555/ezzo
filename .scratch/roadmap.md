# What's next

The order of work toward the full-stack deadline, 2026-11-25. A ticket's own `Status:` line is the truth about it; this file only holds the order, the open decisions and what is still missing. Decisions live in the specs, `docs/adr/` and `DESIGN.md`, rules in the conventions skill, and what waits for the owner's eyes in `.scratch/review-queue.md`.

**Keep this file about what is ahead.** When a step or round is done, tick it or say "merged" and delete its detail: no merge dates, test durations or review notes. Git history, the ticket and the review queue hold those. Every repeated fact is one more line to go stale.

**Scope is fixed.** The documentation sent to the academy (`webcity-documentation.md` at the repo root) is the commitment: everything in it is due on the 25th. The schedule has one buffer day (Tue 24) and no other slack. If a day slips, the items under **Last in line** move, not the pages.

## Settled

Each decision is recorded where the work reads it: the name session in `PRODUCT.md` and `GLOSSARY.md`; the n8n session in `.scratch/n8n-automation/spec.md`, ADR 0008 and `GLOSSARY.md`; the design session in ADR 0007, `DESIGN.md`, frontend tickets 27 to 30 and `docs/agents/skills.md`; the frontend spec session in `.scratch/frontend/spec.md`; the backend gaps in `.scratch/documented-backend-features/spec.md`. Kept here only what is recorded nowhere else, or departs from the document:

- **An unexpected server error keeps the failure envelope.** The document says `ProblemDetails`; the owner accepts the difference (readiness ticket 02 and ADR 0003 stand).
- **The moderation queue is two routes,** `GET /api/admin/moderation-queue/posts` and `/comments`, where the document lists one.

## Now

Dates are the day a step should finish. **Steps 5 to 8 are crucial and late.** They are the pages, and the pages are the commitment. No page can be dropped or traded for an item under Last in line. Each step waits for the one before, so every day lost is taken from the buffer first and from Last in line after that.

### Lanes: which tickets run in parallel

Two worktree lanes at a time (`docs/agents/worktrees.md`), each taking frontend tickets from **different feature areas**, so that the only shared files are the routes and the two dictionaries. A lane that finishes early takes the next ticket in its own column. "F" is a frontend ticket. Rounds 0 to 9 are merged.

| Round | Lane 1                                            | Lane 2                                     |
| ----- | ------------------------------------------------- | ------------------------------------------ |
| 7     | F10, write a post (merged)                        | F18, chat: list and reading (merged)       |
| 8     | F11, the post page (merged)                       | F22, admin: layout and users (merged)      |
| 9     | F12, edit and delete a post (merged)              | F19, chat: send and receive live (merged)  |
| 10    | F13, reports from the normal pages                | F20, chat: edit, delete, typing (merged)   |
| 11    | F14, the profile page                             | F23, admin: reports and the queue (merged) |
| 12    | F16, user search                                  | F24, admin: logs and statistics            |
| 13    | F15, the friends page (merged)                    | F21, live toasts                           |
| 14    | F17, the settings page                            | F41, the landing page with sign-in         |
| 15    | F39, save a photo from the viewer                 |                                            |
| 16    | F40, save a message's or a post's photos together |                                            |

Backend lane: n8n 08 and 11 are finished on their worktree branches and parked: the frontend pages come first, so their merge waits until the pages are done (owner, 2026-11-22). A session lists the two branches as parked, not as work to merge. Readiness 07 is left out: it matters only if the demo moves to a host.

1. [ ] **Design.** The name was still open, so the design session fixed the structure and left the brand for later. The frontend setup (tickets 27 to 29) is merged.
   - [ ] **Frontend ticket 30: Impeccable.** Merged, and the owner kept the hook on after its trial on F10. Open only for box 6, a cloud session's run of the launcher. No ticket waits for it.
   - [x] **The name session.** The product is Ezzo (`PRODUCT.md`).
   - [x] **The brand session** (worktree `brand`). The owner chose skin A, **Balcony** (2026-11-23), revised after a second review: the painted balconies over Tbilisi's courtyards, a cool plaster page with a balcony-blue accent (moved off teal so it stays apart from `success` in hue and lightness), Bricolage Grotesque narrow and heavy for display, Noto Sans stays the body. The values below passed the contrast check in both themes. The session waits for F13 and F20 to reach `master`, merges `master` into its branch, then:
     - Replaces the provisional values in `DESIGN.md` and the token file, and adds the scrollbar rule (`border-strong` on `surface-page`). Light: page `#ecf1f2`, raised `#ffffff`, sunken `#dce5e8`, ink `#12202a`, muted `#485b63`, border `#c9d6da`, border-strong `#6a8088`, accent `#1d6a8e`, accent-strong `#134d68`, on-accent `#ffffff`, success `#24561a`. Dark: page `#0f1a20`, raised `#1e2f38`, sunken `#060c10`, ink `#e5eef1`, muted `#9db1b9`, border `#33474f`, border-strong `#6d8791`, accent `#9bd3f2`, accent-strong `#c2e4f7`, on-accent `#05263a`, success `#74bd52`. Danger and warning keep their values; focus equals accent.
     - The display stack is Bricolage (weight and width axes, Latin plus Latin Extended), then Noto Sans (Cyrillic), then the variable Noto Sans Georgian, so Georgian headings get the same narrow, heavy look; Georgian headings drop the Latin letter spacing. Body Noto Sans serves its Latin Extended and Cyrillic subsets (₾, ş, ł, ґ). `DESIGN.md`'s typography names the Cyrillic partner.
     - The logo is the wordmark "ezzo" drawn as an SVG, with the balcony fretwork (hanging teeth with drilled holes on a rail) only beside it on the sign-in and landing pages; the browser tab gets a compact mark. The owner picks from two or three tab marks before anything goes in.
     - The discs are redrawn from the Balcony palette, white letters at 4.5 to 1 or more, still chosen by id: `#1f6b62`, `#2f6a47`, `#566a1d`, `#3d5788`, `#4c4f8c`, `#8a4925`, `#69513a`, `#6d3c69`; unavailable `#686c6e`.
     - The active link in the bars changes from a sunken pill to accent text with a bar along the edge (`active-bar-link.ts`). Every danger button carries a trash icon. Chat bubbles keep the app's look (own on sunken, the other person's on a bordered page surface).
     - Every on-screen "WebCity" becomes Ezzo: the two dictionaries, the browser-tab title and its spec.
     - Then a full screenshot run (360, 768, 1280; both themes; signed out and in; English and Georgian) and Impeccable's `critique` on the real pages. Check by eye: the liked state of a post (filled heart and `aria-pressed`), Georgian and Russian headings, discs beside the accent, dark toasts and menus against the page.
     - **Applied on `worktree-brand` (2026-11-23)**, all of the above except the tab mark. The wordmark is live text in the display face (`tracking-logo`, `text-logo` on the sign-in pages), not an SVG; the fretwork and tagline stand under it in `auth-frame`. Screenshots and the critique ran. Revised the same day: the logo is the "zz" speech bubble (top bar and tab icon), the name is not written on the page, and the tagline, welcome line and fretwork left sign-in. Ticket 41, the landing page merged with sign-in at `/`, waits for the owner on `frontend-41-landing-page`. Next: ticket 42, a three-field date of birth (day, month by name, year) replacing the browser date picker in register and both admin dialogs.
2. [x] **Write the tickets.** Of the n8n tickets, 01, 03, 04, 08 and 11 are backend work proven by integration tests; 02, 05, 06, 07, 09, 12 and 14 are workflows, open until the owner has run their checklist; 10 and 13 are visual frontend work.
3. [x] **The backend gaps** (documented-backend-features), the last of them ticket 04.
4. [x] **Shell and auth.**
5. [ ] **Tue 17, late, crucial: feed, posts and comments.** Feed with pagination, create a post with photos, edit and delete, like, comment, edit and delete a comment, report a post or comment. F09 to F12 are merged; only reporting (F13) is left. F09's `PagedList` (`core/paging/`) is the paging pattern the later lists copy.
6. [ ] **Wed 18, late, crucial: profile, friends and search.** Profile page (bio, posts, friends), edit profile, user search, friend requests (send, accept, decline, remove; the three lists), account settings (deactivate, delete, digest opt-out), the guest view.
7. [ ] **Fri 20, late, crucial: chat and live notifications.** The SignalR service and the central state for the session, conversations, online friends and unread count. Conversation list with last message, conversation with photos, edit and delete, seen, typing, presence and last active. Toasts for a new message, comment, like and a friend coming online. F18 to F20 are merged; only the live toasts (F21) are left.
8. [ ] **Sat 21, late, crucial: admin panel.** Users (create, edit, deactivate, restore, delete, grant and remove the administrator role), delete any post or comment, logs, statistics, the reports list, the moderation queue. F22 and F23 are merged; only logs and statistics (F24) are left.
9. [ ] **Sun 22 and Mon 23: n8n.**
   - Merged: the backend tickets 01, 03 and 04, and the setup (02).
   - Ticket 02 stays `in-progress` until the owner adds the Telegram bot token and the chat ids and runs the checklist in `n8n/README.md` (the ticket's Comments list the steps). Workflows 05 to 14 copy its setup.
   - Next: 05 (the welcome email), then 06 to 13 (AI moderation, reports, digest, birthdays). Alert grouping (14) is last.
   - Needs from the owner: the Telegram bot token and the chat ids, the OpenAI key (before ticket 06), and the administrator address. n8n uses the same SMTP account as the backend's `EmailConfiguration`.
10. [ ] **Tue 24: buffer and finish.** Responsive pass on a phone width. Walk the document top to bottom against the running app and fix what fails. Update `README.md` (monorepo ticket 04) and `docs/backend/*.md` for everything added.
11. [ ] **Wed 25: hand in.**

### Before the presentation

- [ ] **Allow the app's origin for emailed links.** Add `http://localhost:4200` to `Cors:AllowedOrigins` in `backend/aspnetproject/appsettings.Development.json` (the file is gitignored: edit the copy of the checkout the backend runs from), then restart the backend. Today the list holds only the two `:5500` origins, so forgot-password and reactivation answer "url link is not allowed". Whatever origin serves the frontend in the demo must be on the list.

### Days the owner is away

The owner expects to lose more than a day, which is more than the buffer. Work that is covered by tests can run without the owner, in a cloud session, and be reviewed afterwards: the frontend's plumbing tickets (unit-tested, with no visual part) and the n8n backend tickets. The pages cannot, because someone has to look at them, and neither can a workflow ticket, because someone has to run its checklist.

### Last in line

If time runs short, these are finished last, in this order from the end: the weekly digest, birthday notifications, grouping of repeated exception alerts, automatic hiding after several reports, the activity part of the statistics page.

On the frontend, in this order from the end: the default picture's new look (a ring coloured by the id around a faceless silhouette, frontend ticket 31; the current initials on a coloured disc stay until then), choosing a profile picture (the default picture is built either way), the dark theme (its switch is hidden if it is not checked on every page), the account history in settings (needs a new table, because `AccountDeactivatedAt` is cleared on reactivation), live friend requests (a new hub event, a live badge and incoming list on `/friends`, and their own toast), and the dialog that lists who liked a post.

## After the deadline

- **Hidden content, and flagging from the menu** (owner, 2026-11-23). An administrator can restore hidden content only through the "…" menu of the item itself, and cannot flag from the menu at all. Backend ticket 14 lists hidden posts and comments; frontend ticket 43 adds a Hidden tab to the moderation page (and extracts the shared panel); frontend ticket 44 adds Flag to the menu. Ticket 43 waits for 14.
- A few end-to-end test flows (sign in, post, message). They come before component tests.
- **Stored notifications:** a table, a list with an unread count, a mark-as-read route, and a bell with a badge. Until then a notification reaches only a user who is connected.
- **Retried events:** an outbox table and a job that resends an event the automation did not receive (n8n ticket 15). Until then an event sent while n8n is down is lost.
- Images on AWS S3. Until then they stay on local disk.
- Russian and Spanish dictionary files (ADR 0006).
- Translated server text, which needs a stable code on every backend failure (ADR 0006).
- **A topic check for posts:** the automation flags, never hides, a post that is not something its author made, with a paid chat-model call beside ticket 06's moderation. It needs a spec first.
- **The profile of a deactivated account** (found in frontend ticket 22). `GET api/users/{id}` and `PUT api/users/{id}` go through the `User` query filter, so the backend can neither read nor edit a deactivated account's bio and date of birth. The admin panel lists such an account (the admin list ignores the filter), greyed, and offers Restore and Delete only; to edit it, an administrator restores it first (owner, 2026-11-22). Whether an administrator should be able to read or edit a deactivated profile is a backend decision to discuss. No ticket yet.
- **Extract the tail of `save()`** (found in frontend ticket 17, owner, 2026-11-24). The same nine lines end `save()` in `register-page.ts`, `create-account-dialog.ts`, `edit-profile-dialog.ts` and `profile-settings.ts`: `isSubmitting.set(false)`, `userRefusalField`, `setServerErrors`, `applyFieldErrors`, `failureMessage.set`. Two forms accept a username or an email refusal, two only a username. One helper next to `userRefusalField`, which sets the error on the control only if the form has it, removes both variants. No ticket yet.
- **Georgian dates in Chrome** (found in frontend ticket 09). Desktop Chrome has no Georgian locale data, so `DateFormatter` falls back to English month names on the Georgian interface; the time zone is right. The fix is a locale polyfill (`@formatjs/intl-datetimeformat` with `ka` data) or our own Georgian month names. No ticket yet; the owner accepts the English dates until then. Also worth doing in spare time before the deadline.
- **A presence race on a page reload** (found in frontend ticket 21, owner, 2026-11-24). A reload closes the old hub connection and opens a new one; if `OnDisconnectedAsync`'s offline write (`LastOnlineAt = now`) lands after `OnConnectedAsync`'s online write (`null`), the user stays "offline" while connected until their next reconnect (the `UserOffline` event also arrives after `UserOnline`). It needs the two writes to cross within milliseconds, and the cost is a wrong grey dot, so it waits. Fix sketch: `PresenceService.NotifyUserOfflineAsync` stamps and announces the departure only if `UserConnectionTracker` still has no connection for the user when the write runs; a test needs the two calls forced into that order.
- **A smoother delete** (found in frontend ticket 21, owner, 2026-11-24). A deleted post, comment or message fades out over 200 ms (`FadeOut`, `DeleteFade`) and then leaves the list at once, so the items below jump up by its height. The likely fix, not yet tried: close the item's height while it fades (a grid row from `1fr` to `0fr`, or a measured `max-height`), so the list closes smoothly; it needs the 200 ms rule in `DESIGN.md` looked at, and a look at all four places that use `FadeOut` (post, comment, message, friend's row).
