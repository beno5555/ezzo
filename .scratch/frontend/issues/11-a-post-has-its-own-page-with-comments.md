# 11: A post has its own page with comments

**What to build:** Every post has an address, `/posts/:postId`, that a user or a guest can open and share. The page shows the post and, under it, its comments.

- **The post** is shown with the card from ticket 09, in full.
- **Comments** load by pages as the reader scrolls, using the feed's way of loading.
- **Writing.** A signed-in user writes a comment in a form under the post. It appears at once and the comment count follows.
- **Editing and deleting.** A comment's author edits it in place and deletes it after a confirmation. The author of the post deletes any comment under it.
- **A guest** reads the post, its photos and its comments. The like button and the comment form send a guest to sign-in, which returns them to this page.
- **A post that does not exist,** or that the visitor may not read, shows the not-found page.

Hidden content, reports and the administrator's actions come in ticket 13.

Decisions are under "Feed, posts and comments" in `.scratch/frontend/spec.md`. The backend's rules, including who may delete a comment, are under `CommentController` in `docs/backend/controllers.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes)

**Status:** ready-for-agent

**Difficulty:** routine: it reuses the post card, the page loading and the form pattern that earlier tickets set.

- [ ] The comment count on a feed card leads to the post's page
- [ ] Comments load by pages until the last
- [ ] A new comment appears at once, and the count rises by one
- [ ] An author edits and deletes their own comment; the post's author deletes someone else's comment under their post; nobody else is offered either
- [ ] A comment over the limit cannot be sent, and the limit comes from `LIMITS`
- [ ] A guest reads the page, and the like button and the comment form lead to sign-in and back
- [ ] An unknown post id shows the not-found page
- [ ] The comment `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, as a guest, as the post's author and as another user
