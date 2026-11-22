# 20: Chat: edit, delete and typing

**What to build:** A user corrects or withdraws a message they sent, and each friend sees when the other is writing.

- **Edit.** A user's own message offers Edit for 20 minutes after it was sent. The offer disappears when the 20 minutes pass, even while the conversation stays open. The window's length is mirrored in `LIMITS`. An edited message is marked as edited. The editor sees the edit at once with ticket 19's clock icon, until the HTTP response's copy takes its place; a refusal puts the old text back, shows a toast, and reopens the edit with what the user wrote (owner, 2026-11-20).
- **Edits arrive live.** `MessageEdited` changes the receiver's copy in the open conversation, and the list row when it was the last message.
- **Delete.** A user deletes their own message after a confirmation, and it leaves their view at once. The backend sends no push for a deletion, so the friend's open conversation keeps the message until it is loaded again. That is accepted.
- **Typing, outgoing.** While the user types in a conversation, the client calls `SendTyping` at most once every 2 seconds.
- **Typing, incoming.** `UserTyping` from the friend shows "typing…" in the open conversation, and it hides 3 seconds after the last such event or when a message from that friend arrives.

Decisions are under "Chat" in `.scratch/frontend/spec.md`. The 20-minute rule and the events are in `docs/backend/signalr.md` and under `MessageController` in `docs/backend/controllers.md`.

**Shared delete fade (owner, 2026-11-22).** A deleted post's card fades out over 200 ms before it leaves the list (`PostEditStore.delete`, `deleteFadeMilliseconds`, the card's `duration-200`), and a toast says it is deleted. Comment deletion (ticket 11) does not fade yet. This is the first ticket after 12 that deletes something in a list, so it extracts the shared piece instead of copying the wait and the opacity classes: one helper or small component for "fade out, then leave", used by the post card, the comment and the message, and gives comments and messages the same fade and toast.

**Blocked by:** 19 (Chat: sending and receiving live), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): the rules are exact and tested with fake timers, but they change a store that real-time events feed, which ticket 19 built.

- [x] Edit is offered on the user's own message inside 20 minutes and not after, tested with fake timers including the moment the window closes while the conversation is open
- [x] An edit changes the message for the editor at once and for the friend without a reload, and both see it marked as edited
- [x] An edit shows the clock icon until the server's copy arrives; an edit the server refuses puts the old text back and shows its message
- [x] Delete asks first and removes the message from the sender's view; the list row shows the new last message
- [x] The outgoing typing signal is sent at most once every 2 seconds, tested with fake timers
- [x] "typing…" shows on the friend's event, hides after 3 seconds of silence, and hides when their message arrives, tested with fake timers
- [x] The edit and delete `…Api` methods are unit-tested against the HTTP testing backend
- [x] Checked in the running app with two accounts in two browsers

## Comments

**2026-11-23, round 1: implementation (Sonnet 5.5).**

**Built.** Edit, live edits, delete and typing, as the ticket describes, plus the shared fade. Where the ticket left room:
- **Edit happens in the conversation's own message box** (owner, 2026-11-23, mid-task), not in the bubble. `ConversationsStore.startEditing` puts the message's text into `MessageForm`, which shows an "Editing message" line, Cancel where the photo button was and Save where Send was. Enter saves, Escape cancels. What the user was writing comes back afterwards. The photo picker is hidden meanwhile and no typing signal is sent. The edit ends by itself when the 20 minutes pass (a refused-for-being-late edit comes back already expired and ends again at once, so its text is not kept). The bubble is outlined while it is being edited.
- **The "…" menu sits inside the bubble at its right end** (owner, 2026-11-23). With a mouse it shows while the pointer is over the message or the keyboard is in it (`pointer-fine:` variants); on a touch screen it always shows. Its 44 px square reaches into the bubble's padding.
- **Photo-only messages can be edited** (a caption is added): the backend takes any non-empty text for any own message. The spec review raised it; I had first hidden Edit there.
- **Shared fade:** `shared/fade-out/` holds `DeleteFade` (state: fading and gone ids, 200 ms) and the `FadeOut` directive (the look). The post card, the comment and the message use them. Comments and messages now say "deleted" in a toast. One behaviour change: a comment's count on its post drops after the 200 ms fade, not at once.
- `beforeDeadline` (`core/time/`) turns the Edit offer off at the exact moment the window closes, not at the next minute. `TypingSender` (throttle, 2 s, per friend) and `TypingStore` (debounce, 3 s, per friend) hold the typing rules.
- A `MessageEdited` for a message the open conversation does not hold re-reads page 1 of the list quietly, because a list row carries no message id. It costs one request per such edit and cannot reach rows beyond page 1.
- Deleting the last message of a fully loaded conversation drops its row from the list.

**Checks run.** Prettier, lint and `ng build` pass; the full unit suite passes (72 files, 602 tests). Fake-timer tests cover the window (19 min, 20 min, closing while open, in the item and in the message box), the 2 s and 3 s typing rules, and the fade. The `edit` and `delete` API methods are tested against the HTTP testing backend. I broke the window-closing code once on purpose to see the test fail. Not run: backend tests (no backend change). **Standing warning:** the build says the initial bundle is 691 kB against a 600 kB budget; I did not compare it with master's number (this lane cannot build the main checkout).

**Running app** (backend on 7202, frontend on 4300, because 4200 and 7102 were taken; two isolated browser contexts, two new accounts `t20_alice` and `t20_bob`, friends, left in the dev database). Seen working: Alice's edit shows at once and reaches Bob live with "Edited" and the new list row; "typing…" shows while Bob types and goes 3 s after he stops, and at once when his message arrives; Delete asks first, fades, shows the toast and the row follows; edit in the message box, Save by Enter, Cancel by Escape with the draft restored. Widths 360, 768 and 1280, light and dark, were looked at for the first layout (menu beside the bubble) and again at 360 and 1280 for the final one. **Not tried in the running app:** a refused edit (it needs a message older than 20 minutes; covered by store tests), the Georgian texts, 768 px in the final layout, a real touch screen (the "always shown" rule for touch devices), and the final round of small changes (photo-only caption, the edit ending at 20 minutes, "typing…" at `text-xs`): those are covered by unit tests only. A bug the running app found, and the unit tests had missed: `beforeDeadline` read a required input in the constructor (NG0950). It is fixed and has a test.

**Review (spec-review).** Fixed: `HubMethod` moved to its own file; `savingEditIds` in place of `editingIds` (the form's and the item's "editing" means the draft in the box); "typing…" at `text-xs` like the presence label it replaces; Edit offered on photo-only messages; the edit ends when its window closes; specs added for the message item's menu and for the message box. Left alone: the `try/catch` in `HubClient.sendTyping` (a dropped connection is an expected failure and typing is best effort; a wrong method name would also be hidden); `markSavingEdit` repeats the set-update shape of `CommentThreadStore.mark` (a shared helper would touch four stores); `ConversationsStore` keeps growing (edit draft, fades and the list refresh could move to a small store of their own).

**Open decisions.** (1) Whether `ConversationsStore` should be split before ticket 21 adds toasts to it: I recommend yes if 21 touches it much. (2) Whether the friend's `MessageEdited` for a message outside the open conversation should instead carry the message id (a backend change) to avoid the page-1 re-read: I recommend no for now.

**Waits for others.** Ticket 21 (live toasts) reads `ConversationsStore` as it is now. The friend still sees a deleted message until the conversation is loaded again (accepted in the ticket).

**Screenshots:** `.scratch/frontend/shots/20/` in the main checkout (hover on and off, the message box in edit mode at 1280 and 360 px in both themes, after the edit).

**Branch:** `worktree-chat-edit-delete-typing`, visual work, waiting for the owner's review (a lane writes no review-queue line). Trial merge against `origin/master`: see the chat report.
