# 12: An author edits and deletes a post

**What to build:** The author of a post gets a "…" menu on it, in the feed and on the post's page, with Edit and Delete.

- **Edit** happens in place: the title and the text become a form on the card, with Save and Cancel. The same limits apply as in the composer.
- **Save never waits** (owner, 2026-11-20; "What a user writes shows at once too" under "Across the whole frontend" in the spec). The form closes and the card shows the new title and text at once, marked as uploading; saved on the post's own page, it sends the author to the feed. The uploading toast from ticket 10 stays until the server answers; then a toast says the post was saved and leads to it. A refusal puts the old title and text back and shows a toast that says why and leads to the post's page with the edit form open and filled with what the author wrote.
- **Delete** asks for a confirmation. A deleted post leaves the list; on the post's own page the author is sent to the feed.
- **Photos while editing.** Each photo shows a remove control. The backend endpoint for it, `DELETE /api/posts/{postId}/images/{imageId}`, is not built yet (documented-backend-features ticket 04). So the `…Api` method for it is written and unit-tested now, and the control is shown disabled with a "Coming soon" label from the dictionary. When ticket 04 is done, the control is enabled and removes the photo; nothing else changes. If ticket 04 is already done when this ticket starts, build the control working.
- **Photos cannot be added** to an existing post.

The menu holds only the author's entries here. Report and the administrator's entries join it in ticket 13.

Decisions are under "Feed, posts and comments" and "Actions on content, reports and hidden content" in `.scratch/frontend/spec.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** routine: an edit form and a confirmed delete on patterns that already exist, with the one unfinished part clearly marked.

- [ ] Only the author sees the menu's Edit and Delete on a post
- [ ] Saving an edit changes the card at once, with the uploading toast and then the saved toast; on the post's page it returns the author to the feed; Cancel restores the card
- [ ] An edit the server refuses puts the old title and text back, shows its message, and its toast leads to the edit form filled with what the author wrote
- [ ] Delete asks first, removes the post from the list, and on the post's own page leads to the feed
- [ ] Each photo in the edit form shows a remove control that says "Coming soon" and does nothing, or works if backend ticket 04 is done
- [ ] The edit, delete and remove-photo `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, in the feed and on the post's page
