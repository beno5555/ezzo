# 10: An administrator reviews flagged content

**What to build:** An administrator opens a queue of the posts and comments that are marked `FLAGGED` and sees enough of each to decide, then approves or hides it with the moderation endpoints from ticket 09.

`GET /api/admin/moderation-queue/posts` and `GET /api/admin/moderation-queue/comments` are administrator-only and paged. Each returns the flagged content of one type, oldest first. One route per type avoids paging across two tables. (Changed by the owner on 2026-11-15: this ticket first asked for one route with a query parameter. A comment's snapshot also carries its post's title.)

Each row carries a snapshot of the content:

- for a post: its id, title, text, photos, author and creation time;
- for a comment: its id, text, author, the post it belongs to and creation time.

The report list in ticket 11 shows the same snapshot for a reported post or comment. Whichever of the two tickets lands first creates the shape, and the other reuses it.

Until the n8n spec is built, content becomes flagged only when an administrator sets that status, which is how the tests fill the queue.

Decisions are under "Reports and moderation" in `.scratch/documented-backend-features/spec.md`.

**Blocked by:** 09 (An administrator can hide a post or a comment)

**Status:** done

**Difficulty:** routine: one paged read per content type that follows existing patterns, built on the status from ticket 09.

- [x] An administrator gets the flagged posts, page by page, oldest first, each with its snapshot
- [x] An administrator gets the flagged comments the same way, from their own route
- [x] Visible and hidden content never appear in the queue
- [x] Content leaves the queue once an administrator sets it to `VISIBLE` or `HIDDEN`
- [x] An ordinary user and a guest are refused
- [x] The endpoint has its own rate-limit policy
- [x] `docs/backend/controllers.md` and `README.md` describe the moderation queue

## Comments

**2026-11-15, for whoever merges ticket 11 after this one** (merged to `master` as `300dd3f`; ticket 11 was built in parallel and had already committed its own snapshot shape, so this ticket was aligned to it).

- **Shared shape.** `PostSnapshotDto` is identical on both branches and merges cleanly. `CommentSnapshotDto` and `SnapshotMapper` differ only by what this ticket added: `PostTitle` on the comment snapshot, and `SnapshotMapper.ToCommentSnapshot` setting it from `comment.Post!.PostTitle`. The owner asked for the title on 2026-11-15. Ticket 11 also has `UserSnapshotDto` and `SnapshotMapper.ToUserSnapshot`, which this ticket does not.
- **Where to expect conflicts.** Merging ticket 11 into `master` conflicts in three files: `README.md` (keep both additions), `CommentSnapshotDto.cs` and `SnapshotMapper.cs` (both add/add: take ticket 11's version and keep the `PostTitle` lines and the `Post` in the mapper's `.Include()` remark). Everything else auto-merges, including `ResponseMessages.cs`, `RateLimitConfig.cs`, `PostRepository.cs`, `CommentRepository.cs` and `docs/backend/controllers.md`.
- **A change git will not flag.** `CommentRepository.GetSnapshotsByIdsAsync` (ticket 11) must also `.Include(comment => comment.Post)`. Without it `comment.Post!` is null, and listing reports on comments throws. Rerun `ReportControllerTests` after the merge to confirm.
- **Moderation queue.** It is two routes, `moderation-queue/posts` and `moderation-queue/comments`, with policies `AdminReadFlaggedPosts` and `AdminReadFlaggedComments`. Every row has `IsHidden` false, because only flagged content is listed.
