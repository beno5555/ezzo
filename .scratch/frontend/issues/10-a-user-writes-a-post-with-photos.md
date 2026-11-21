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

**Status:** done

**Difficulty:** tricky: a file upload with previews is a new kind of interaction here, and the post that shows before the server has it, with a toast that lasts until the upload ends, sets the pattern that comments, messages and edits copy.

- [x] A post with a title and text, a post with a title and photos only, and a post with both appear on top of the feed at once, marked as uploading and with the current time, and the server's copy replaces each
- [x] An uploading toast stays until the upload ends, then a published toast leads to the post
- [x] A title alone cannot be sent
- [x] An eleventh photo, a file of another type and a file over 5 MB are each refused in the browser with a message that names the reason
- [x] The photo checks are a pure helper, unit-tested for the count, each accepted type, a refused type and the size limit
- [x] A photo removed from the selection is not uploaded, and the others keep their order
- [x] The server's refusal of a post removes the pending post, shows its message, and puts what the user wrote, photos included, back into the composer
- [x] Preview addresses made in the browser are released when a photo is removed, and when the server's copy replaces the pending post
- [x] The create method is unit-tested against the HTTP testing backend: a multipart body with the fields and the files in order
- [x] Checked in the running app on a desktop width and on a phone width

## Comments

- **2026-11-21, done.** Checked in the running app at 1280 and 360 px in both themes:
  - posts with text only and with photos;
  - a server refusal of a fake PNG, which put the draft back with its photos;
  - picker refusals for an 11th photo, a file over 5 MB and a GIF.

  Extra test seam: `canSendPost` (what the Post button allows).
- **Points raised by the spec review, settled with the owner (2026-11-21):**
  - **A refused post comes back only into an empty composer.** If the user has already started another post, the refused one waits until the fields are cleared, so the user's new text is never overwritten. Kept: the ticket asks that what the user wrote is never lost.
  - **An 11th photo picked on its own gets no refusal message.** The add button is disabled at 10, and the count reads "10 of 10 photos". Kept: if the button failed, the photo check would still refuse the 11th photo with a message, and the server refuses it too.
  - **On a phone the 44 px remove button covered about half a thumbnail.** Fixed: the button shows a 28 px disc, and its 44 px square stays the tap area (`IconButton`'s `on-photo` look). Checked at 360 px in both themes and at 1280 px.
  - **No picker or composer component specs.** Releasing a preview on removal and keeping the order are covered by the code and the running-app check, not by a unit test.
