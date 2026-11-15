# 18: Chat: the conversation list and reading a conversation

**What to build:** A signed-in user opens `/messages`, sees their conversations, opens one at `/messages/:username`, and reads its history. Sending arrives in ticket 19.

- **Two routes, one layout.** On a desktop the list and the open conversation sit side by side. On a phone they are two screens, and the back button returns from the conversation to the list.
- **List row.** The friend's name, an online dot or the last active time from the presence store, the last message and its time, and the count of unread messages in that conversation. A last message that has only photos reads "Photo".
- **Conversations store.** It holds the list and the open conversation, because the hub changes both. It exposes read-only signals and the methods that change them.
- **Addresses use the username.** The message endpoints and the hub use the id, so the page resolves the username first: from the list when it is loaded, and from the backend's read by username otherwise. A username that is not found, or is not a friend, shows a clear state.
- **History.** Messages load by pages, older ones as the user scrolls up, and the view keeps its place when a page is added on top. Each message shows its text, its photos (with the viewer from ticket 09), its time, and whether it was edited.
- **Opening a conversation marks it read.** The row's count goes to nothing and the unread store reads its number again.
- **Live, in this ticket:** presence in the rows.

Decisions are under "Chat" and "Scaffold and plumbing" in `.scratch/frontend/spec.md`. The backend's side is in `docs/backend/signalr.md` and under `MessageController` in `docs/backend/controllers.md`.

**Blocked by:** 05 (The live connection feeds presence and the unread count), 07 (The shell gives navigation on a desktop, on a phone and to a guest)

**Status:** ready-for-agent

**Difficulty:** tricky: shared state that the hub changes, one pair of routes serving two layouts, and a scroll position that must hold while history loads upward.

- [ ] The list shows each conversation with the name, presence, last message, time and unread count
- [ ] A row whose last message has only photos reads "Photo"
- [ ] A friend going online or offline changes their row without a reload
- [ ] A conversation opens from the list and from its address pasted into a new tab
- [ ] Older messages load on scrolling up, and the view does not jump
- [ ] Opening a conversation clears its count and lowers the number on the Messages link
- [ ] On a phone the list and the conversation are separate screens, and back returns to the list
- [ ] The conversations store is unit-tested through its public methods: loading the list, opening a conversation, marking it read
- [ ] The message `…Api` methods used here are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, with two accounts
