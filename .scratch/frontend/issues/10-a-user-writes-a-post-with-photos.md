# 10: A user writes a post with photos

**What to build:** A composer card at the top of the feed. A user writes a title and text, picks photos, sees a preview of each, drops any of them, and posts. The new post appears at the top of the feed at once.

- **Fields.** A title is required, and so is either text or at least one photo, as the backend requires. Limits come from `LIMITS`.
- **Photos.** Up to 10. Each must be JPEG, PNG or WebP and at most 5 MB. The browser checks the count, the type and the size before anything is uploaded, and names the file that fails and why.
- **Previews.** Each picked photo shows a thumbnail with a button that removes it from the selection. The order of the thumbnails is the order of the post's photos.
- **Sending.** The post goes as `multipart/form-data`. While it uploads, the form cannot be sent twice.
- **After.** The composer empties and the new post is put at the top of the list, without reading the feed again.

The photo picker (choose, check, preview, remove) is built so that the chat can use it with its own limit of 5 photos (ticket 19).

Decisions are under "Feed, posts and comments" in `.scratch/frontend/spec.md`. The upload rules are under Images in `docs/backend/controllers.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): fully specified, but a file upload with previews is a new kind of interaction here and most of it is checked by looking.

- [ ] A post with a title and text, a post with a title and photos only, and a post with both are published and appear on top of the feed
- [ ] A title alone cannot be sent
- [ ] An eleventh photo, a file of another type and a file over 5 MB are each refused in the browser with a message that names the reason
- [ ] The photo checks are a pure helper, unit-tested for the count, each accepted type, a refused type and the size limit
- [ ] A photo removed from the selection is not uploaded, and the others keep their order
- [ ] The server's refusal of a post shows its message and keeps what the user wrote
- [ ] Preview addresses made in the browser are released when a photo is removed and when the composer empties
- [ ] The create method is unit-tested against the HTTP testing backend: a multipart body with the fields and the files in order
- [ ] Checked in the running app on a desktop width and on a phone width
