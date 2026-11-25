# 04: A photo can be removed from a post, and deleted posts take their files with them

**What to build:** A post's author (or an administrator) removes a single photo from the post with `DELETE /api/posts/{postId}/images/{imageId}`, and a post never ends up empty. When a post goes away, by its author, by an administrator or by the purge of a soft-deleted user, its photo files go with it. After ticket 02 the files of a deleted post stay on disk forever.

A post must keep a title and either text or at least one photo. So removing the last photo of a post that has no text is refused, and editing a post's text to empty is refused unless the post has photos. Editing itself stays a JSON, text-only request.

File removal happens after the database change and is best-effort: a file that cannot be removed is logged and does not fail the request.

The purge of soft-deleted users runs as a background job, which the integration test host removes, so that path is not covered by a test. Verify it by reading the code and by one manual run, and say so in a comment on this ticket.

Decisions are under "Images" in `planning/documented-backend-features/spec.md`.

**Blocked by:** 02 (A post can be created with photos)

**Status:** done

**Difficulty:** tricky: it changes the purge of soft-deleted users, a bulk-delete path that no test covers.

- [x] The author removes a photo from their post; the post no longer lists it and its address no longer serves a file
- [x] An administrator can remove a photo from any post; any other user is refused
- [x] An unknown post, an unknown photo, and a photo that belongs to a different post are each not found
- [x] Removing the last photo of a post with no text is refused, and the photo stays
- [x] Editing a post's text to empty is refused when the post has no photos and accepted when it has
- [x] The remaining photos keep their order
- [x] Deleting a post removes its photo rows and its files
- [ ] The purge of soft-deleted users removes the files of the posts it deletes, verified by a manual run recorded on this ticket
- [x] A file that cannot be removed is logged and the request still succeeds
- [x] The new action has its own rate-limit policy
- [x] `docs/backend/controllers.md`, `docs/backend/data.md` and `docs/backend/background-jobs.md` describe photo removal and file cleanup

## Comments

**2026-11-18, implementation (Claude):**

- **The purge is tested, not run by hand.** The ticket expected that path to have no test, but `SoftDeletedUsersCleanupService` has since been registered as a singleton too, so a test runs one cycle through `RunOnceAsync`. `SoftDeletedUsersCleanupServiceTests.Sweep_ForPurgedUsersPosts_RemovesTheirPhotoFilesAndKeepsOthers` uses a host with `RetentionDays` 0: diana deletes her account, the cycle purges her, and her photo files go while alice's stay. No manual run was made, so the purge box is left unticked for the owner: tick it if the test stands in for the manual run.
- **"Not found" is a 400 with a message.** An unknown post (`PostNotFound`), an unknown photo and a photo of another post (`PostImageNotFound`) are refused with `400`, as are a caller who is neither author nor administrator (`CouldNotRemovePostImage`) and the last photo of a post without text (`LastImageOfPostWithoutText`). `ApplicationResponse` carries no error kind, so an action whose failures mean different things maps them all to one status, as `DELETE` and `PUT api/posts/{id}` already do (`docs/backend/controllers.md`).
- **Not asked for:** a removal stamps the post's `LastUpdatedAt` (so the post reads as edited) and returns the full post shape. It sends no `post-edited` event, because the title and text did not change.
- **Rate limit:** the new policy `RemovePostImage` allows 60 requests an hour per user, against 20 for deleting a post, because emptying a post of its photos takes one request per photo.
- **Edits:** whitespace-only text counts as empty, as it does when a post is created. `UpdatePostDto.Content` is now `[Required(AllowEmptyStrings = true)]`, so empty text reaches the service, which applies the rule.
- **Known gap:** the "never empty" check and the save are not atomic. Two removals at once on the last two photos of a post without text, or a removal at once with an edit that empties the text, could leave the post empty. One author makes this unlikely, and the existing edit rules have the same gap.
