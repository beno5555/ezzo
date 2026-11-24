# 21: Live toasts

**What to build:** A user who is on any page is told, by a toast, about what happens elsewhere. Each toast is a link.

| Event | Toast | A click opens |
|---|---|---|
| `ReceiveMessage` | The friend's name and the start of the message, or "Photo" | That conversation |
| `ReceiveComment` | Who commented on my post | The post |
| `PostLiked` | Who liked my post | The post |
| `UserOnline` | The friend's name, and that they are online | That conversation |

- **No message toast for the open conversation.** The user can already see the message.
- **At most one online toast per friend in 5 minutes.** A friend who reloads a page goes offline and online again, and that must not produce a toast each time.
- **The friend's name** for an online toast comes from the presence store, which looks an unknown friend up by id.
- **The toast store's own limits** apply: 5 seconds on screen, three at most.
- **Counts on pages do not change live.** A like or a comment that arrives changes no number on a page that is already open; the numbers follow on the next load.

The rules that decide whether an event becomes a toast live in one place with no template, so they can be tested.

Decisions are under "Toasts" in `.scratch/frontend/spec.md`. Events and payloads are in `docs/backend/signalr.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 18 (Chat: the conversation list and reading a conversation), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: four events mapped to toasts by exact rules, each rule unit-tested with fake timers.

- [x] A message for a closed conversation shows a toast; a message for the open conversation shows none (unit-tested)
- [x] A comment and a like on the user's post each show a toast that opens the post
- [x] A friend coming online shows a toast; the same friend coming online again within 5 minutes shows none, and after 5 minutes shows one (unit-tested with fake timers)
- [x] A message that has only photos reads "Photo" in the toast
- [x] A click on each toast leads to the right address
- [x] All toast texts come from the dictionaries, in both languages
- [x] Checked in the running app with two accounts in two browsers

## Comments

**2026-11-24, round 1: implementation (Sonnet 5.5).**

**Built.** `LiveToastStore` (`frontend/src/app/core/hub/live-toast-store.ts`, no template) holds every rule: `messageReceived`, `commentReceived`, `postLiked`, `friendOnline`, `clear`. `HubClient` maps `ReceiveMessage` (toast first, then `ConversationsStore.receive`), `ReceiveComment`, `PostLiked` and `UserOnline` to it. For `UserOnline` it awaits `PresenceStore.markOnline` (which looks up an unknown friend) and then calls `friendOnline`, which reads the name from the store. Two new DTO types (`NotifyCommentDto`, `PostLikedDto`) and the texts under `shared.toasts.live` in both dictionaries. Links are built with `Router.createUrlTree`, so a username is one encoded segment.

- **Open conversation:** it counts as open when the open conversation's friend id matches the sender or, while its friend is still being looked up, when the address's username matches (case-insensitively).
- **Online throttle:** the 5 minutes count from the last toast shown, per friend; a suppressed event does not restart the clock. `clear()` on sign-out forgets the times.
- **Preview:** whitespace collapsed to one line, cut at 60 characters with "…". A message with only photos reads the existing `messages.list.photo` ("Photo"), not a second copy. A message from a gone account (`sender.id` null) shows nothing.
- **Departures:** (1) the store lives in `core/hub/`, not a `features/notifications/` folder: feature folders are named after backend controllers (`typescript.md`). (2) `docs/backend/signalr.md` listed `NotifyCommentDto` without `PostId`; the backend class has it and the post link needs it, so the row now says so.

**Checks.** `npm test` 857 passed (new: 18 store tests with fake timers, 4 `HubClient` tests); `npm run lint` and Prettier on the touched files clean; `npm run build` passes. The build warns that the initial bundle exceeds 600 kB (747.68 kB); that is ticket 32's budget warning, and this change adds about 2 kB. No backend change, so the backend suite was not run. `prettier --check .` reports 506 files: line-ending noise from the Windows checkout, untouched by this ticket.

**Running app** (a second dev frontend on 4300 through the backend on 7102, which another session holds; account A in the Playwright Chrome, account B in a separate headless Chromium plus API calls). Seen at A: B's first sign-in showed "is online"; B's reload (offline, online again) showed no second toast; a text message, a photo-only message ("Photo"), a comment and a like each showed their toast, the fourth waiting for a free place (three at most); a click on the comment toast opened `/posts/<id>`, a click on the message toast opened `/messages/<username>`; with that conversation open, a new message from B showed no toast but appeared in the conversation; in Georgian at 360 px the toasts read correctly. Not tried: the 5-minute expiry in the real app (unit-tested with fake timers), the dark theme, 768 px, a click on the like and online toasts (same address helper as the two clicked). The two throwaway accounts (`toasta…`, `toastb…`, suffix `t8pyz`) and a post stay in the dev database.

**Review (Opus 5.5).** Fixed: the store moved out of a non-controller feature folder; `minuteInMilliseconds` reused; a named boolean in `friendOnline`; the `HubClient` class comment (it now says which two call orders are its own); the repeated `text().shared.toasts.live` made one getter; the "Photo" duplicate removed; one test name and a constant-value assertion. Left alone: the Georgian online text says "ახლა ონლაინ არის" where the presence label says "ახლა აქტიურია" (the spec says "online").

**Open decisions.**
- *Toasts survive sign-out:* a shown toast stays up to 5 s on the sign-in page, which could show a message's text on a shared machine. The spec does not ask for clearing; I recommend `ToastStore.clear()` on sign-out in a small follow-up.
- *Two "open conversation" rules:* `ConversationsStore.receive` matches by friend id only; the toast also matches by address while the friend loads. In that short window the message counts as unread but shows no toast. Left as is.
- *Pending name lookup:* a friend who goes offline while their name loads still gets the "is online" toast when it arrives; signing out and in within that lookup can show a toast from the old session. Judged too rare to code for.

**Waits for another ticket.** Nothing. Counts on pages do not change live, as the ticket says.

**Screenshots:** `.scratch/frontend/shots/21/` in the main checkout (`toasts-desktop.png`: three toasts at about 800 px; `toasts-phone-ka.png`: Georgian at 360 px).

**Branch.** `worktree-live-toasts`, committed, not pushed, waiting for the owner's review (visual work). A lane does not merge; the roadmap and review queue are left for the merge.

**2026-11-24, round 2: revision (Sonnet 5.5).** Fixed point: `ee19655`.

Owner's decisions:
- **Toasts animate in:** a toast slides in from its corner (or emerges slowly), instead of appearing at once.
- **Toasts say what they are by looking:** the person's avatar, the name highlighted, a green bubble for an online friend and for a message, a distinct mark for a comment and for a like. About 90 % of the time the user should know what a toast says without reading it. The same holds for the other toasts (failures, uploads), and every toast keeps being a link where it is one.
- **A friend's profile shows their presence:** on another user's profile, when they are a friend, a green dot while online, a grey dot after a recent visit (no minutes, no sentence), and no dot when they were last active too long ago.
- **Toasts clear on sign-out** (open decision 1: `ToastStore.clear()` on sign-out).
- **Open decisions 2 and 3 stay as they are.**
- **Tests favour the dark theme** (about 80 % dark, 20 % light), written in the docs where tests and screenshots are described.
- **Also asked, not part of this ticket:** a "Write a post" button on the own profile (under the empty "no posts yet" message, and at the top right when there are posts, as in the feed, with the back button leading back to the profile); the same kind of button on the friends page leading to the search; a look at the occasional wrong active indicator with two tabs in one browser; a reminder of the like delay (1 second, `likeSendDelayMilliseconds`).
- **Trial merge** when everything is settled.

**Built (round 2).**
- **Look.** A toast about a person shows their avatar (the disc colour follows their id), their name in `ink-strong` semibold on its own line, and the news in muted text under it. A small badge on the avatar says what kind: a green dot for a friend who came online, an `accent` badge with a speech icon for a message and another for a comment, a `danger` badge with a heart for a like. A toast about no one shows an icon disc: a check (success), a cloud (uploading), an exclamation mark (failure). A link toast ends in a chevron. `ToastLook` is on every `show()` (failure by default); the success toasts of the app (published, saved, deleted, copied, sent, created) say `Success`.
- **Slide-in.** 300 ms: down from the top edge on a phone, in from the end edge from `md:`; none under reduce motion (tokens in `design-tokens.css`; the motion rule's exception is in `DESIGN.md`).
- **Sign-out** clears every toast (`LiveToastStore.clear` calls `ToastStore.clear`). An upload that was under way at sign-out no longer shows its outcome over the sign-in page.
- **Profile dot.** `ProfilePresenceStore` (provided by the profile) reads a friend's presence once and keeps it through `PresenceStore`: green while online, grey within a day of the last visit, nothing after. No words.
- **Write a post** on the own profile: under "No posts yet", and at the top right when there are posts. The page it opens leads back one step in the history when it came from the profile (link, and a sent post alike), so the back button never shows the profile twice. **Find friends** on the friends page leads to `/search`; the empty state got no second button, to keep one primary button per screen.
- **Backend (one line, for the avatar):** `NotifyCommentDto` gained `AuthorId` (`int?`), set by `CommentMapper.ToNotification`.

**Departures (round 2).**
- A live **comment, like or message from an account that no longer exists shows no toast** (the avatar needs an id; a message from one already showed none). The backend change above is the only one.
- **The message badge is `accent` blue, not green:** the owner's words read as a green dot for an online friend; green stays for that alone, so the two never look alike. A comment and a message differ by their icon only; see the open decisions.
- **Georgian:** the name now stands on its own line, so the ending "-მა" ("[name]-მა დააკომენტარა") is gone from the Georgian texts: "შენს პოსტზე დააკომენტარა", "შენი პოსტი მოიწონა".

**Checks (round 2).** `npm test` 880 passed (7 s); `npm run lint` clean; Prettier on every changed file clean; `npm run build` passes (only the old 600 kB budget warning, 756 kB). Backend: build 0 warnings, `dotnet test aspnetproject.IntegrationTests` 898 of 898 passed (`Duration: 36 s`); nothing backend changed after that run except comments and docs.

**Review (Opus 5.5).** Severe and fixed: *a second person's toast was dropped* (the de-duplication compared message and link only, so a like by a second user on the same post within 5 s was skipped; it now compares the person too); *an upload's outcome showed on the sign-in page after sign-out*; *a late presence read could bring the dot back after the friend was removed*; *a sent post could be lost if the step back was cancelled* (`goBack` now ends on any navigation outcome). Tidy-ups fixed: `toast.ts` split to one type per file, `ProfilePresence` renamed `ProfilePresenceStore` and its type inlined, a named boolean in `postLiked`, the profile's two identical buttons made one template, the motion exceptions reworded in `DESIGN.md` and `typescript.md`, the `AuthorId` docs corrected (null only when the account no longer exists; a deactivated account keeps its id), import order, a fire-and-forget comment. Left alone: the feed's third "Write a post" copy (different layout: pinned and floating, not the same block); the repeated `writeButton` dictionary text; four `ToastLook` branches in the toast list (a map and three small switches over a closed set); `text-on-accent` on the danger badge (the token pair has the right contrast in both themes); a DOM spec for the toast list (five DOM specs already exist).

**Occasional wrong active indicator.** Worth knowing, not worth a fix now. In one browser two tabs share one stored session, so signing in as a second account in the second tab changes who the first tab acts as after its next token refresh, and presence follows the account, not the tab: that looks like a flicker. One real race exists too: a page reload closes the old connection and opens a new one, and if the offline write (`LastOnlineAt = now`) lands after the online write (`null`), the user stays "offline" while connected until their next reconnect. It needs the two database writes to cross within milliseconds, so it is rare. Sketch of a fix if it ever matters: `PresenceService` stamps offline only if no connection exists when the write runs.

**Like delay (reminder):** 1 second, `likeSendDelayMilliseconds = 1000` in `post-like-store.ts`: the server hears of a click one second after the last click on that post.

**Open decisions.**
- *Message vs comment badge:* both are blue with a speech icon (a circle, and a square with lines). I judge them different enough; say if you want the comment in another colour or shape.
- *The profile's Friends tab* has no "Find friends" button; only the friends page does.

**Not checked:** the Georgian texts on screen this round (unit-tested), 768 px, the sign-out clearing in the running app (unit-tested), the grey dot's disappearance after a day (unit-tested; the dev data holds no such friend). Checked in the running app: the online, message, comment and like toasts and their slide-in at 1280 px dark and at 360 px light; the published toast; the profile dot green and grey (dark, 1280); the own profile's button with and without posts (360 and 1280, dark); the back button from the profile (link, sent post, the browser's Back); the friends page at 360 dark and its button to `/search`. About 80 % of the pictures are dark.

**Screenshots:** `.scratch/frontend/shots/21/` in the main checkout, the `r2-*` files (round 1's two images stay).

**Branch.** `worktree-live-toasts`, committed and pushed at the end of this round; trial merge against `origin/master` reported in the chat. The two throwaway accounts (`tca_r27107`, `tcb_r27107`, ids 1389 and 1390) and two posts stay in the dev database.
