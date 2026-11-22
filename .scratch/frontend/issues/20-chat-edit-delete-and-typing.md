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

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the rules are exact and tested with fake timers, but they change a store that real-time events feed, which ticket 19 built.

- [ ] Edit is offered on the user's own message inside 20 minutes and not after, tested with fake timers including the moment the window closes while the conversation is open
- [ ] An edit changes the message for the editor at once and for the friend without a reload, and both see it marked as edited
- [ ] An edit shows the clock icon until the server's copy arrives; an edit the server refuses puts the old text back and shows its message
- [ ] Delete asks first and removes the message from the sender's view; the list row shows the new last message
- [ ] The outgoing typing signal is sent at most once every 2 seconds, tested with fake timers
- [ ] "typing…" shows on the friend's event, hides after 3 seconds of silence, and hides when their message arrives, tested with fake timers
- [ ] The edit and delete `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app with two accounts in two browsers
