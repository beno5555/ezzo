# 10: A user writes a post with photos

**What to build:** A composer card at the top of the feed. A user writes a title and text, picks photos, sees a preview of each, drops any of them, and posts. The new post appears at the top of the feed at once.

- **Fields.** A title is required, and so is either text or at least one photo, as the backend requires. Limits come from `LIMITS`.
- **Photos.** Up to 10. Each must be JPEG, PNG or WebP and at most 5 MB. The browser checks the count, the type and the size before anything is uploaded, and names the file that fails and why.
- **Previews.** Each picked photo shows a thumbnail with a button that removes it from the selection. The order of the thumbnails is the order of the post's photos.
- **Sending.** The post goes as `multipart/form-data`. The user never waits for it (owner, 2026-11-20; "What a user writes shows at once too" under "Across the whole frontend" in the spec):
  - The composer empties at once, and the new post is put at the top of the list, marked as uploading, with the moment it was sent as its time and its photos from the previews. The feed is not read again.
  - A toast says the post is uploading. It stays until the upload ends, so the toast store learns a toast that lasts until it is replaced or closed in code; the edit in ticket 12 uses it too.
  - When the server answers, its copy takes the pending post's place, and a second toast says the post was published and leads to it.
  - The user may write another post meanwhile; each upload has its own toasts.
- **A refusal** removes the pending post, a toast says why, and what the user wrote, photos included, goes back into the composer.

The photo picker (choose, check, preview, remove) is built so that the chat can use it with its own limit of 5 photos (ticket 19).

Decisions are under "Feed, posts and comments" in `.scratch/frontend/spec.md`. The upload rules are under Images in `docs/backend/controllers.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** tricky: a file upload with previews is a new kind of interaction here, and the post that shows before the server has it, with a toast that lasts until the upload ends, sets the pattern that comments, messages and edits copy.

- [ ] A post with a title and text, a post with a title and photos only, and a post with both appear on top of the feed at once, marked as uploading and with the current time, and the server's copy replaces each
- [ ] An uploading toast stays until the upload ends, then a published toast leads to the post
- [ ] A title alone cannot be sent
- [ ] An eleventh photo, a file of another type and a file over 5 MB are each refused in the browser with a message that names the reason
- [ ] The photo checks are a pure helper, unit-tested for the count, each accepted type, a refused type and the size limit
- [ ] A photo removed from the selection is not uploaded, and the others keep their order
- [ ] The server's refusal of a post removes the pending post, shows its message, and puts what the user wrote, photos included, back into the composer
- [ ] Preview addresses made in the browser are released when a photo is removed, and when the server's copy replaces the pending post
- [ ] The create method is unit-tested against the HTTP testing backend: a multipart body with the fields and the files in order
- [ ] Checked in the running app on a desktop width and on a phone width
