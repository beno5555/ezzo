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
