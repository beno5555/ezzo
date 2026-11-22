# 11: A post has its own page with comments

**What to build:** Every post has an address, `/posts/:postId`, that a user or a guest can open and share. The page shows the post and, under it, its comments.

- **The post** is shown with the card from ticket 09, in full.
- **Comments** load by pages as the reader scrolls, using the feed's way of loading.
- **Writing.** A signed-in user writes a comment in a form under the post. It appears at once, before the server has it, with "Sending…" under it from the dictionary, and the comment count rises; the server's copy then takes its place (owner, 2026-11-20; "What a user writes shows at once too" under "Across the whole frontend" in the spec). A refusal removes it, lowers the count again, shows a toast, and puts the text back into the form.
- **Editing and deleting.** A comment's author edits it in place, and the edit shows at once with the same "Sending…" mark; a refusal puts the old text back, shows a toast and reopens the form with what the author wrote. A comment is deleted after a confirmation. The author of the post deletes any comment under it.
- **A guest** reads the post, its photos and its comments. The like button and the comment form send a guest to sign-in, which returns them to this page.
- **A post that does not exist,** or that the visitor may not read, shows the not-found page.

Hidden content, reports and the administrator's actions come in ticket 13.

Decisions are under "Feed, posts and comments" in `.scratch/frontend/spec.md`. The backend's rules, including who may delete a comment, are under `CommentController` in `docs/backend/controllers.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: it reuses the post card, the page loading and the form pattern that earlier tickets set.

- [x] The comment count on a feed card leads to the post's page
- [x] Comments load by pages until the last
- [x] A new comment appears at once with "Sending…", the count rises by one, and the mark leaves when the server's copy arrives
- [x] A refused comment leaves the list, the count falls back, a toast says why and the text is back in the form
- [x] An author edits and deletes their own comment; the post's author deletes someone else's comment under their post; nobody else is offered either
- [x] A comment over the limit cannot be sent, and the limit comes from `LIMITS`
- [x] A guest reads the page, and the like button and the comment form lead to sign-in and back
- [x] An unknown post id shows the not-found page
- [x] The comment `…Api` methods are unit-tested against the HTTP testing backend
- [x] Checked in the running app on a desktop width and on a phone width, as a guest, as the post's author and as another user

## Comments

2026-11-22, implementation (Sonnet 5.5), spec review on Opus 5.5. The branch is `worktree-post-page`; visual work, so it waits for the owner's review and is not merged.

- **Checked in the running app** against the real backend: send, edit, delete with its confirmation, a refused comment (forced by sending to a post that does not exist: "Sending…", count up, then removed, count back, toast, text back in the form), the menus (author: Edit and Delete; post author on another's comment: Delete only; a non-author of the post: Edit and Delete on own comments only), the not-found page for `/posts/999999` and `/posts/abc`. The guest page and the signed-in page were photographed at 360, 768 and 1280 px in both themes and both languages. Not clicked through by hand: a guest's like button and the sign-in link returning to the post (both use the existing return address).
- **Left in the dev database:** the post "Ticket 11 check post" and some test comments by `shell_dev_1119`, and the account `comment_check_11` with one comment.
- **Backend fix (owner's request, 2026-11-22):** `EditCommentDto` read `PostContentMaxLength` (3000) while `CreateCommentDto` and the column take 500, so an edit of 501 to 3000 characters passed validation (the test showed it did not answer 400). It now reads `CommentMaxLength`; `CommentControllerTests` gained two tests (501 characters is refused, exactly 500 is accepted). No migration.
- **Backend change (owner's request, 2026-11-22): `GET /api/posts/{id}` no longer carries the post's comments.** It loaded every readable comment with its author, with no limit, and this page threw them away to read page 1 from `GET /api/comments/post/{postId}`. `FullPostDisplayDto` lost `Comments`, `PostRepository.GetPostByIdAsync` no longer includes them (the count stays, `CommentCount`), and the frontend's `FullPostDisplayDto` is now the same as `StandardPostDisplayDto`. Tests: `GetById_Anonymous_ReturnsPostWithItsCommentCountButNotItsComments` (no comment text and no `comments` property in the body); the hidden-comment tests of the post read now check the count only, because `ContentVisibilityTests` and `CommentControllerTests` already check the comments through the paged route (the flagged-comment test now reads them from it too); the orphaned-comment test of the post read was dropped for `GetByPost_IncludesOrphanedComment`. `docs/backend/controllers.md` updated. The suite: 875 tests.
- **Not done: loading the post and its first comments in parallel.** The comment section mounts only after the post has loaded (it needs the post's author for the delete rule, and it must not show for a post that is missing or hidden), so the two calls run one after the other. Running them together means prefetching the comments in the page and handing them to the section, and throwing them away when the post turns out unreadable. Left out as not worth the complexity.
- **Added beyond the ticket:** `PagedList.append` and `remove` (a new comment goes after everything; a page that holds it moves it into place), a "Try again" state on the post page for failures other than 404, and an edit that changes nothing sends nothing.
- **Spec review, fixed:** the scroll trigger no longer waits for a loaded item, so deleting every loaded comment cannot strand the later pages. The class `CommentThread` became `CommentThreadStore` (a role word, as the naming table asks).
- **The review's two judgement calls, decided by the owner (2026-11-22):**
  1. The comment section, item and form moved to `shared/` (`shared/comment-section`, `comment-item`, `comment-form`), so `PostPage` no longer imports another feature's components. Their logic stays in `features/comments/` (`CommentThreadStore`, `CommentApi`, the DTOs), which the shared components import, as `shared/post-card` imports a post DTO.
  2. The failure block is one shared component, `shared/load-failure` (`<app-load-failure [message] [retryLabel] (retry)>`), used by the feed, the comment section and the post page. It always has `py-4`; the comment section used `py-2` before.
- **Known limit:** paging is by page number, so after a delete the next page the server sends starts one comment later and that comment is not shown until a reload. It follows from the spec's paging.
- **Owner's visual review, round 1 (2026-11-22):**
  1. A "Back to feed" link sits above the post, for a signed-in user only: a guest has no feed to go back to (the feed address would send them to sign-in).
  2. The comment form is pinned to the bottom of the screen (on a phone above the bottom bar, on a desktop 1 rem above the edge), so it shows without scrolling and stays while the comments scroll. A guest's "Sign in to write a comment" box is pinned the same way. To stay pinned from the first screen, the form sits outside the comment `<section>` and the section's host is `display: contents`: a sticky box stays inside its parent, and inside the section it was pushed up over the comments until the reader scrolled. The text box there has 2 rows (`CommentForm` got a `rows` input; an edit keeps 3).
  3. The feed's heading is "What's new" (Georgian "რა ახალია?") with a line under it, "Fresh posts from your friends and from people you may not know yet.", instead of the literal "Feed". The route's title and the navigation links keep "Feed".
  4. The guest's like button still leads to sign-in and back; the owner kept the redirect over a toast or a shake.
  5. Checked in the running app at 360 and 1280 px, in both themes where it matters, as a signed-in user and as a guest. A comment sent from the pinned form shows at once and the count rises. Not checked: the Georgian texts on screen.
