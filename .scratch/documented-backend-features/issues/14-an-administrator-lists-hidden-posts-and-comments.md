# 14: An administrator lists hidden posts and comments

**What to build:** An administrator can read, page by page, every post and every comment that moderation has hidden, with the same snapshot the flagged queue and the report list show, so the content can be found again and made visible (the moderation routes from ticket 09 already set `Visible` from `Hidden`).

Two administrator-only routes beside the flagged queue, one per content type, as for the queue (posts and comments are separate tables, so there is no page across both). Each takes only the paging parameters of `PageQuery` and returns `ListResponse<PostSnapshotDto>` or `ListResponse<CommentSnapshotDto>`. A snapshot's `IsHidden` is always true here. Hidden content whose author has no active account is listed too, with the placeholder username, as in the queue. Content leaves the list as soon as its status is not `Hidden`.

Order: oldest first by creation time, with the id as tie-break, as in the flagged queue: no column records when content was hidden, and a new column is not worth it for this list.

A successful read writes no `Log` row, and each route has its own rate-limit policy, as the other administrator reads do. Document the routes under `AdminController` in `docs/backend/controllers.md` and update the README's feature list if it names the queue.

Queued for after the deadline (owner, 2026-11-23).

**Blocked by:** None (can start immediately; tickets 09 and 10 are done)

**Status:** ready-for-agent

**Difficulty:** routine: a paged read per content type that copies the flagged queue.

- [ ] An administrator gets the hidden posts, page by page, oldest first, each with its snapshot
- [ ] An administrator gets the hidden comments the same way, from their own route
- [ ] Visible and flagged content is never listed; content made visible leaves the list
- [ ] A guest gets `401` and a signed-in user who is not an administrator gets `403`; the API key opens nothing
- [ ] An out-of-range page value gets `400` with the framework's validation `ProblemDetails`
- [ ] Hidden content of a deactivated author is listed with the placeholder name
- [ ] Integration tests cover each bullet above; the docs name the two routes and their policies
