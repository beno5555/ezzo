# 19: Chat: sending and receiving live

**What to build:** Two friends talk in real time. Each sends text, photos or both, sees the other's messages the moment they are sent, and sees when their own were read.

- **Sending.** Text up to the backend's limit, up to 5 photos, or both, as `multipart/form-data`. The photo picker from ticket 10 is used with the chat's limit. The message shows for the sender at once, before the server has it, with its photos from the previews and a clock icon where its time goes; the icon carries no visible text, and its accessible label says "Sending" from the dictionary. The HTTP response's copy then takes its place. A refusal removes it, shows a toast, and puts the text and the photos back into the box (owner, 2026-11-20; "What a user writes shows at once too" under "Across the whole frontend" in the spec).
- **Receiving.** `ReceiveMessage` reaches the conversations store. If that conversation is open, the message is added to it and the conversation is marked read again. If not, its row moves to the top with the new last message and a higher count, and the unread store reads its number again.
- **Seen.** `MessageSeen` marks the user's sent messages as seen, and "seen" is shown under the last of them.
- **Starting a conversation.** A "New message" button lists friends with no conversation yet, by pages; choosing one opens `/messages/:username`. The Message button on a friend's profile leads to the same address.
- **The list stays right.** Sending a message moves that conversation to the top with the new last message.
- **The view follows new messages** when the user is at the bottom, and does not pull them away from older messages they are reading.

Edit, delete and typing arrive in ticket 20; toasts in ticket 21.

Decisions are under "Chat" in `.scratch/frontend/spec.md`. Events and payloads are in `docs/backend/signalr.md`.

**Blocked by:** 10 (A user writes a post with photos), 18 (Chat: the conversation list and reading a conversation), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** tricky: real-time on both sides, where an arriving message must update the open conversation, the list and the unread count consistently.

- [x] A text message, a photo message and a message with both appear for the sender at once with the clock icon, which leaves when the server's copy arrives
- [x] A refused message leaves the conversation, a toast says why, and its text and photos are back in the box
- [x] The friend sees each of them appear without a reload, in an open conversation and as a changed row when it is closed
- [x] A sixth photo, a wrong type and an oversized file are refused in the browser
- [x] A message that arrives in the open conversation is marked read, and the sender sees "seen"
- [x] A message that arrives for a closed conversation raises that row's count and the number on the Messages link
- [x] "New message" lists only friends with no conversation, and the first message creates the conversation in the list
- [x] The store is unit-tested through its public methods: a message arriving for the open conversation, for a closed one, for a conversation not yet in the list; a sent message; seen
- [x] The send method is unit-tested against the HTTP testing backend: a multipart body with the text and the files in order
- [x] Checked in the running app with two accounts in two browsers, on a desktop width and on a phone width

## Comments

- **Left over: the profile's Message button.** The profile page is still a placeholder, so the button waits for ticket 14, which links it to `appAddresses.conversation(username)`, the address "New message" opens.
- **The list row moves on the server's answer,** not at the moment of sending: the pending message shows in the conversation at once, and the row moves to the top when the server's copy arrives (a refused message never reaches the list).
- **Added on the way:** sending scrolls the user's own view to the newest message, even from older ones (only arriving messages leave a reader where they are); a refused message waits per conversation until its box is empty. The message box shows its count with the shared `CharacterCounter`, placed in its corner as the comment box does.
- **After the owner's review (2026-11-22):** Enter sends and Shift+Enter starts a new line. The counter shows from a tablet up, not on a phone (the limit still stops the typing). The box shows at most three small thumbnails, "+N" on the third; a thumbnail opens the photo viewer on every picked photo, each with a Remove button.
- **The initial bundle is over budget:** 619.79 kB against 600 kB, about 16 kB of it from this ticket (`master` was already over it). Tickets 36 to 38 cover the first download.
