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

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): what each viewer may do depends on role, authorship and the item's state together, and a wrong entry is a button that the server refuses.

- [x] The helper is unit-tested for every row of the table, for a post and for a comment, hidden and not hidden
- [x] A user reports a post and a comment with a reason and sees a confirmation
- [x] An empty reason and a reason over the limit cannot be sent
- [x] Nobody is offered Report on their own content
- [x] An administrator deletes another user's post and comment after a confirmation
- [x] An administrator hides a post and a comment; the badge appears; Make visible removes it
- [x] An author sees the badge on their own hidden content
- [x] The report and moderation `…Api` methods are unit-tested against the HTTP testing backend, including the status sent as text
- [x] Checked in the running app as another user, as the author, as the post's author on a comment, and as an administrator

## Comments

**2026-11-22, round 1: implementation (Sonnet 5.5).**

- **Built.** `contentActionsOffered` (`shared/content-actions/`) is the one pure rule; `contentMenuEntries` turns its actions into menu entries, so `PostCard` and `CommentItem` only show what it returns. Report: `features/reports/` (`ReportApi`, `canSendReport`, `ReportDialog`, `ReportOpener`). Hide and Make visible: `features/moderation/` (`ModerationApi`, `ModerationStore`). Badge: `shared/hidden-badge/`. The limit (500) is in `LIMITS.reports`. Both dictionaries got the new entries, dialog and toast.
- **Departures.** (1) The edit and delete labels moved from `posts.menu` and `comments.menu` to `shared.content`, since one entry list now serves both. (2) `posts.deletedToast` is neutral ("The post is deleted."), because an administrator deletes other people's posts too. (3) Hide and Make visible are optimistic, with a revert and a toast on refusal: the spec's "Quick actions show their result at once". (4) `docs/agents/screenshots.md` now says how to make a development administrator account; outside the ticket's scope, but its last checkbox needs one.
- **Checks run.** Prettier check on the changed paths, `npm run lint`, `npm test -- --watch=false` (68 files, 561 tests, all pass), `npm run build`. **Warning left standing:** the initial bundle is 611.61 kB against the 600 kB budget (master was 600.17 kB); ticket 37 deals with the budget. Not run: the backend integration suite (no backend change).
- **Tried in the running app (Playwright and a headless script, English only).** Guest: no menus. Another user: Report only; the dialog refuses an empty, a whitespace-only and a 501-character reason and accepts 500; a report shows the toast; a second report on the same item shows the server's message in the dialog with the text kept; the same for a comment. The author: post Edit, Delete; own comment Edit, Delete; someone else's comment Delete, Report (as the post's author). Administrator: Delete, Hide, Report on every item; Hide shows the badge at once and it survives a reload; Make visible removes it; the same for a comment; deleting another user's comment and a post goes through the confirmation. The author sees the badge on their own hidden post and comment; another user receives neither. Widths 360, 768 and 1280, light and dark, on the hidden post with its menu open: no sideways scroll, nothing overlaps. **Not tried:** the Georgian text in the browser; the report dialog with text typed in at 360 (my script typed into the wrong box, so that picture shows the empty dialog).
- **Review.** Standards review, fixed: backend enums are now `as const` mirrors (`ReportTargetType`, `ReportStatus`, `ModerationStatus`, `ModeratedKind`; `ContentAction` was a TS `enum`), `ContentViewer` and `ContentItem` have their own files, the dialog puts the server's `fieldErrors` on the control, `ModerationStore` has a named condition, the spec uses the limit constant, `shown` became `loadedFlag`. Spec review, fixed: the "post's author on a comment" rows are tested hidden and not hidden. Code review, fixed: (i) `ModerationStore` drops its answered states on every navigation, so an item moderated elsewhere (another administrator, the automation, a report's decision) shows the server's flag again on arrival; (ii) the report dialog shows the "sent" toast itself, so closing it while the request is on its way (Escape, a click outside, Cancel) no longer hides the confirmation; (iii) a Hide or Make visible click made while one is on its way is queued (the latest wish only) instead of dropped. **Left alone:** (a) the offered entries do not remember what this user already reported, so Report is offered again and the server's "already pending" message shows in the dialog; the ticket's rule is that the server may still refuse, and the message says why. (b) The two cards' handler maps are close to each other; a third caller is the time to share them. (c) `ModerationStatus.Flagged` is mirrored but never sent.
- **Open decisions.** (1) The Georgian wording (`shared.content`, `reports.*`, the neutral delete toast) is mine and needs your eye. (2) A development administrator now exists in the local database; its credentials are in the main checkout's `frontend/.env` (`WEBCITY_ADMIN_USER`, `WEBCITY_ADMIN_PASSWORD`). Seeded test content from this session (posts 1529, 1530's remains, `rep_*` accounts) is still in the local database.
- **Waits for other tickets.** A Report entry on a profile (the `User` target) waits for the profile ticket. Deciding a report waits for the administrator's reports queue; `ModerationStore` needs no change for it, since a navigation drops its states.
- **Screenshots:** `.scratch/frontend/shots/13/` in the main checkout.
- **Branch.** `worktree-content-reporting`, pushed, waiting for the owner's review and merge. The trial merge against `origin/master` (`f08af12`) is clean.
