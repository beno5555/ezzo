# 44: An administrator flags a post or a comment from its menu

**What to build:** The "…" menu on a post and on a comment offers an administrator a Flag entry beside Hide, so content that deserves a second look goes into the moderation queue (ticket 23) without hiding it. Today the queue fills only through the API, because the automation that would flag content does not exist yet.

- Flag sends the `Flagged` status by name through the moderation call from ticket 13 and shows a toast. Flagged content reads exactly as visible content, so the item itself does not change.
- The entry rules stay one pure helper (ticket 13): an administrator is offered Flag on any item that is not hidden. The client cannot tell flagged from visible, because no ordinary shape carries the status; flagging content that is already flagged succeeds and changes nothing, so the menu may offer it again. A hidden item offers Make visible, as before.
- The Report and the Delete rules do not change.
- Add the Georgian and English texts for the entry and its toast.

Queued for after the deadline (owner, 2026-11-23).

**Blocked by:** 13 (Content is reported and moderated from the normal pages) and 23 (Admin: reports and the moderation queue), both done

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): what each viewer is offered depends on role, authorship and the item's state together, and a wrong entry is a button that the server refuses.

- [ ] The helper's unit tests cover Flag for an administrator on a post and a comment, hidden and not hidden, and for every other viewer (never offered)
- [ ] An administrator flags a post and a comment from the menu and sees a toast; the item then appears in the moderation queue
- [ ] The moderation call sends the status as text, tested against the HTTP testing backend
- [ ] The entry exists in both languages
- [ ] Checked in the running app as an administrator and as another user
