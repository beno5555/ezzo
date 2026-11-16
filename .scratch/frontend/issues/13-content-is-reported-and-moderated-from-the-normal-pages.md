# 13: Content is reported and moderated from the normal pages

**What to build:** The "…" menu on a post and on a comment offers the right entries to each viewer, a user can report what someone else wrote, and an administrator can delete or hide content right where they meet it.

**Who sees which entry:**

| Viewer | On a post | On a comment |
|---|---|---|
| Guest | no menu | no menu |
| A signed-in user who is not the author | Report | Report |
| The author | Edit, Delete | Edit, Delete |
| The author of the post, on someone else's comment | | Delete, Report |
| An administrator | Delete, Hide or Make visible, and Report when not the author | the same |

- **The rule is one pure helper:** given the viewer and the item, it returns the entries. Templates only show what it returns.
- **Report** opens a dialog with a required reason, limited as the backend limits it. Success shows a toast. A refusal by the server shows its message.
- **Hide and Make visible** call the administrator's moderation endpoints with the status by name. The item shows Hide when it is not hidden and Make visible when it is.
- **Hidden badge.** Content that moderation hid shows a "Hidden" badge. Only its author and administrators ever receive such content, so the badge depends on the item's flag alone.

Decisions are under "Actions on content, reports and hidden content" in `.scratch/frontend/spec.md`. The backend's rules are under Moderation visibility and `ReportController` in `docs/backend/controllers.md`.

**Blocked by:** 11 (A post has its own page with comments), 12 (An author edits and deletes a post), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): what each viewer may do depends on role, authorship and the item's state together, and a wrong entry is a button that the server refuses.

- [ ] The helper is unit-tested for every row of the table, for a post and for a comment, hidden and not hidden
- [ ] A user reports a post and a comment with a reason and sees a confirmation
- [ ] An empty reason and a reason over the limit cannot be sent
- [ ] Nobody is offered Report on their own content
- [ ] An administrator deletes another user's post and comment after a confirmation
- [ ] An administrator hides a post and a comment; the badge appears; Make visible removes it
- [ ] An author sees the badge on their own hidden content
- [ ] The report and moderation `…Api` methods are unit-tested against the HTTP testing backend, including the status sent as text
- [ ] Checked in the running app as another user, as the author, as the post's author on a comment, and as an administrator
