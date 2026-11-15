# What's next

The order of work toward the full-stack deadline, 2026-11-25. Tick a step when it is done, and add new steps here. Decisions live in `docs/adr/`, rules in the conventions skill, and work items in the tickets; this file holds the order and the list of what is still missing.

**Scope is fixed.** The documentation sent to the principal (`webcity-documentation.md` at the repo root) is the commitment: everything in it is due on the 25th. The old step "decide what ships" is therefore closed. The frontend comes first, because none of it exists; backend gaps are built in parallel, just before the page that needs them.

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

1. [ ] **Sat 14: design session and scaffold.** Timebox the design session to half a day. It chooses the styling toolset and the visual identity (palette, type, shape, mood).
   - Going-in recommendation for the toolset: Tailwind with Angular CDK, because the look must not be ordinary.
   - Fixed constraint: the typeface must cover Latin, Cyrillic and Georgian.
   - Consider installing one general frontend design skill first (candidate: Anthropic's `frontend-design`). Read `docs/agents/skills.md` before installing.
   - Output: the token values, a short style brief, the Styling rules in §10 of the conventions skill's TypeScript reference (replacing its temporary line), and an ADR for the toolset.
   - Then scaffold `frontend/` with the dev proxy for `/api` and `/hubs`.
2. [ ] **Write the tickets, one group at a time.** For each group the owner runs `/to-spec` and then `/to-tickets` in a session that already holds the context, because `/to-spec` only writes down what the conversation has settled.
   - Done 2026-11-14: the backend gaps A to F, as 13 tickets in `.scratch/documented-backend-features/issues/`. Tickets 01, 02 and 03 can start at once; the longest chain is 02 → 05 → 08 → 09 → 11 → 12.
   - The frontend pages of steps 4 to 8: the owner's answers were taken on 2026-11-15 and are listed under **Answers from the frontend spec session** below. Next, the owner runs `/to-spec` and then `/to-tickets` in that session.
   - By Fri 20: n8n, gaps G and H with the six workflows.
3. [ ] **Any time, in parallel: the open backend tickets.** Readiness 06, 08 and 09, and openapi-document 01. Ticket 08 bites as soon as sign-in exists, 09 as soon as a date is shown, and the document promises per-user limits (06) and Swagger. Message-editing 01 (the 20-minute edit window) was done on 2026-11-14.
4. [ ] **Mon 16: shell and auth.** Lazy-loaded feature areas, the HTTP interceptor with automatic refresh, session restore, route guards for signed-in users and administrators, and the pages: register, sign in, password reset, account reactivation.
   - Backend alongside: **images** and **likes** (gaps A and B). Images ticket 02 (photos on a new post) is done and awaiting review. Likes ticket 05 was done on 2026-11-14. They change the post and message contracts, so they land before the pages that use them.
5. [ ] **Tue 17: feed, posts and comments.** Feed with pagination, create a post with photos, edit and delete, like, comment, edit and delete a comment, report a post or comment.
   - Backend alongside: **feed ranking** (gap C).
6. [ ] **Wed 18: profile, friends and search.** Profile page (bio, posts, friends), edit profile, user search, friend requests (send, accept, decline, remove; the three lists), account settings (deactivate, delete, digest opt-out), the guest view.
   - Backend alongside: **typing on the hub** (gap D), done on 2026-11-14 (ticket 07).
7. [ ] **Fri 20: chat and live notifications.** The SignalR service and the central state (signals) for the session, conversations, online friends and unread count. Conversation list with last message, conversation with photos, edit and delete, seen, typing, presence and last active. Toasts for a new message, comment, like and a friend coming online.
   - Backend alongside: **admin logs and statistics**, **reports and moderation** (gaps E and F).
8. [ ] **Sat 21: admin panel.** Users (create, edit, deactivate, restore, delete, grant and remove the administrator role), delete any post or comment, logs, statistics, the reports list, the moderation queue.
9. [ ] **Mon 23: n8n.** One day for the plumbing and two workflows, one day for the other four.
   - Sun 22: gap G, then the transactional-email and exception-alert workflows.
   - Mon 23: AI moderation, report handling, weekly digest, birthday notifications.
   - The workflows are exported as JSON into the repo, with a compose file that starts n8n.
   - Needs from the owner before Sun 22: Docker Desktop installed (it is not on this machine as of 2026-11-14), the OpenAI key, the Telegram bot token and chat id, and SMTP credentials entered in n8n.
10. [ ] **Tue 24: buffer and finish.** Responsive pass on a phone width. Walk the document top to bottom against the running app and fix what fails. Update `README.md` (monorepo ticket 04) and `docs/backend/*.md` for everything added.
11. [ ] **Wed 25: hand in.**

### Answers from the frontend spec session

Taken on 2026-11-15. This is the record until `/to-spec` writes the spec; delete this section once the spec exists.

**Addresses.** `/` feed (signed in), `/sign-in` and `/register` (signed out only), `/forgot-password`, `/reset-password?token=…`, `/reactivate-account`, `/posts/:postId`, `/users/:username`, `/settings`, `/search?q=…`, `/friends` (three tabs), `/messages` and `/messages/:username`, `/admin/users`, `/admin/reports`, `/admin/moderation`, `/admin/logs`, `/admin/statistics`, and a not-found page. Never put a fixed word beside a `:username` segment.

**Guest.** Reads a profile (bio and posts, no friends tab) and one post with its comments, and searches users. The guest shell holds the logo, the search box, the language switch, and Sign in and Register. An action button sends a guest to sign-in.

**Shell.** Desktop: a top bar with the logo, the search box, Feed, Friends and Messages (unread badge), and a menu under the user's initials (my profile, settings, admin for administrators, language, sign out). Phone: a top bar with the logo and that menu, and a bottom bar with Feed, Search, Friends, Messages and Profile. The website plays no sound.

**Toasts.** New message (none while that chat is open), comment on my post, like on my post, friend came online (at most once per friend per 5 minutes). Each is a link, lasts 5 seconds, and at most three show at once. There is no notification history.

**Feed and posts.** A composer card at the top of the feed: title, text, up to 10 photos with previews, type and size checked in the browser. A new post appears at the top without a reload. A post is edited in place: title, text, and removing photos one at a time; photos cannot be added to an existing post. Photos show as a grid with a full-screen viewer. The feed card shows the like button and the two counts; comments are read and written only on the post's page.

**Actions on content.** A "…" menu on every post, comment and profile. Anyone signed in: Report, with a reason. The author: Edit and Delete; a post's author also deletes comments on it. An administrator: Delete, and Hide or Make visible, on any post or comment in the normal pages. Hidden content carries a badge for its author and for administrators.

**Profile.** Username, bio, and birthday as day and month. A friendship button that follows the state, and a Message button for friends. Tabs: Posts and Friends. No joined date. An unavailable author shows as plain text with no link, and their address shows the not-found page.

**Friends.** The Friends link shows the incoming count, loaded at sign-in and on each visit to `/friends`.

**Chat.** Two routes, shown as two screens on a phone and side by side on a desktop. A chat starts from "New message" (friends with no conversation) or from a friend's profile. A list row shows the name, an online dot or last active time, the last message ("Photo" for images only) and the unread count. "typing…" hides after 3 seconds of silence; the client sends the typing signal at most once every 2 seconds.

**Settings.** One page. Profile (username with the 20-day limit, bio, date of birth, the account's creation date, when the username was last changed), Language, Password (a button that emails a reset link), Email digest (appears with gap G), and a danger zone (deactivate and delete, each confirmed by typing the username).

**Auth.** After registering, the frontend calls sign-in with the same credentials; the register endpoint is unchanged. If that sign-in fails, the user lands on the sign-in page with the username filled in. The reset link lands on `/reset-password?token=…`. Reactivation is one page with two steps and ends at sign-in. A guard remembers the wanted address and returns there after sign-in.

**Admin.** A page per area with a side navigation. Users: a table filtered by state and username, create and edit in dialogs, row actions. Reports: pending first, filters, the reported content inline, Hide and Reject. Moderation: one page with Posts and Comments tabs. Logs: a table with the backend's filters. Statistics: number tiles, no charts. The Hide and Reject buttons wait for backend ticket 12, and the statistics page for ticket 13.

**Search.** The top-bar box opens `/search?q=…`; the page searches as the user types, after a 300 ms pause.

**Languages.** English and Georgian. Georgian on a first visit when the browser's language is Georgian, English otherwise.

**Scope of the spec.** It includes the scaffold and the plumbing (dev proxy, lint, CI, session, interceptor, hub client, dictionaries) as its first tickets; these do not wait for the design session, the page tickets do. The scaffold ticket checks that a reload of `/users/john.doe` (a username with a dot) still serves the app. `admin/` and `reports/` join the feature folders, and `PostLikeApi` lives in `posts/`.

**Small backend changes the spec carries.**

- Refuse four usernames, compared without regard to case: `mine` and `search` (they collide with `/api/users/mine` and `/api/users/search`), and `account_deactivated` and `account_deleted` (the placeholder names shown for unavailable accounts).
- Remove `RegisteredAt` from `StandardUserDto`, so only the user (in settings) and administrators (in the users table) see a joined date.
- Add `UsernameLastChangedAt` to `FullUserDto`.

### Days the owner is away

The owner expects to lose more than a day, which is more than the buffer. The backend tickets (step 3 and gaps A to F) are the work that can run without the owner: they are covered by integration tests and can be implemented in a cloud session and reviewed afterwards. The pages cannot, because someone has to look at them. So the backend tickets are written first, on Sat 14, and a day away is spent on them, not lost.

### Last in line

If time runs short, these are finished last, in this order from the end: the orphan-photo cleanup job (`.scratch/orphan-image-cleanup/`, a backstop the document does not promise), the weekly digest, birthday notifications, grouping of repeated exception alerts, automatic hiding after several reports, the mutual-friends tier of the feed ranking, the activity part of the statistics page.

On the frontend, in this order from the end: the account history in settings (every username change, deactivation and reactivation, which needs a new table because `AccountDeactivatedAt` is cleared on reactivation), live friend requests (a new hub event, the badge and the incoming list on `/friends` updating live, and a fifth toast), and the dialog that lists who liked a post.

## What the document promises and the backend lacks

Checked against the code on 2026-11-14. Everything not listed here already exists (auth, users, accounts, posts and comments as text, friendships, text chat with seen and unread, presence, rate limiting, cleanup jobs, integration tests). Gaps A to F are specified in `.scratch/documented-backend-features/spec.md`; G and H wait for the n8n spec.

- **A. Images.** No upload exists anywhere. Needed: storage on disk with format and size checks, static serving, `PostImage` and `MessageImage`, `POST /api/posts` and `POST /api/messages/{receiverId}` as `multipart/form-data`, `DELETE /api/posts/{postId}/images/{imageId}`, image URLs in the post and message DTOs and in the `ReceiveMessage` push.
- **B. Likes.** `PostLike`, the three `/api/posts/{postId}/likes` endpoints, the `PostLiked` push to the author, and a like count and "liked by me" on the post DTOs. Done on 2026-11-14 (ticket 05).
- **C. Feed ranking.** The feed today is friends' posts only, newest first. Needed: friends' and other users' posts, ranked by connection (friends, then users with mutual friends), activity (likes and comments) and age.
- **D. Hub.** `SendTyping` from the client and the `UserTyping` push. Done on 2026-11-14.
- **E. Admin reads.** `GET /api/admin/logs` (`LogService` exists but is empty and nothing calls it), `GET /api/admin/statistics`, and a list of accounts in any state, which the document does not list but restoring a deactivated account needs.
- **F. Reports and moderation.** The `Report` entity and its three endpoints; `moderationStatus` on `Post` and `Comment`, with hidden content filtered from every read that other users make; `GET /api/admin/moderation-queue` and the two `PUT /api/admin/{posts|comments}/{id}/moderation` endpoints.
- **G. n8n plumbing.** Outbound webhooks signed with a shared secret for registration, post and comment creation, a new report and an exception (from requests and from background jobs). An API-key identity that can reach only the internal and moderation endpoints. `GET /api/internal/digest`, `GET /api/internal/birthdays`, `POST /api/internal/notifications` with the `ReceiveNotification` push it sends. `digestEmailEnabled` on `User`, editable in the profile settings.
- **H. Email through n8n.** The welcome, password-reset, account-reactivation and security emails leave the backend as events instead of being sent by MailKit (open decision 1).

## After the deadline

- A few end-to-end test flows (sign in, post, message). They come before component tests.
- Russian and Spanish dictionary files (ADR 0006).
- Translated server text, which needs a stable code on every backend failure (ADR 0006).
- **Share one test host per test class**, once the integration suite reaches about 400 tests or a run takes more than a minute (on 2026-11-14: 159 tests, 18 s). xUnit builds a new class instance per test, so each test boots its own `CustomWebApplicationFactory`. Moving the factory into an `IClassFixture` would roughly halve the run time; the database reset per test stays.
