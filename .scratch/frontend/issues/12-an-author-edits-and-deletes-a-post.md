# 12: An author edits and deletes a post

**What to build:** The author of a post gets a "…" menu on it, in the feed and on the post's page, with Edit and Delete.

- **Edit** happens on a page of its own, `/posts/:postId/edit` (owner, 2026-11-22, after the visual review: not in place in the feed): a form with the title and the text, and Save and Cancel. The same limits apply as in the composer: the title and text boxes take no character past the limit and show "used/limit" beside their label (the composer gets the same).
- **Save never waits** (owner, 2026-11-20; "What a user writes shows at once too" under "Across the whole frontend" in the spec). Save sends the author to the feed, where the post shows with the new title and text at once, marked as uploading (the ranked feed never lists the caller's own posts, so the edited post goes on top, as a new post does). The uploading toast from ticket 10 stays until the server answers; then a toast says the post was saved and leads to it. A refusal puts the old title and text back and shows a toast that says why and leads to the edit page, with the form filled with what the author wrote; that is dropped as soon as the author leaves the edit page.
- **Delete** asks for a confirmation. The post's card fades out (200 ms) and leaves the list, a toast says it was deleted, and on the post's own page the author is sent to the feed. A refusal brings the post back, with a toast.
- **Photos while editing** are shown, with no control on them at all (owner, 2026-11-22: photos cannot be added to an existing post, so the edit page does not touch them). The `…Api` method for `DELETE /api/posts/{postId}/images/{imageId}` is written and unit-tested, and stays unused until a ticket brings photo editing back, whose remove control must ask first.

The menu holds only the author's entries here. Report and the administrator's entries join it in ticket 13.

Decisions are under "Feed, posts and comments" and "Actions on content, reports and hidden content" in `.scratch/frontend/spec.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: an edit form and a confirmed delete on patterns that already exist, with the one unfinished part clearly marked.

- [x] Only the author sees the menu's Edit and Delete on a post
- [x] The edit page opens from the menu; Save shows the post in the feed at once with the new text, marked as uploading, with the uploading toast and then the saved toast; Cancel leaves the post as it was
- [x] An edit the server refuses puts the old title and text back, shows its message, and its toast leads to the edit page filled with what the author wrote; leaving the edit page drops it
- [x] Delete asks first, fades the post out, removes it from the list, shows a toast, and on the post's own page leads to the feed
- [x] The edit page shows the photos and offers no control on them
- [x] The composer's and the edit page's title and text boxes stop at their limit and show the count
- [x] The edit, delete and remove-photo `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, on the feed and on the edit page
