# 09: The feed shows posts with photos and likes

**What to build:** A signed-in user opens `/feed` and reads the ranked feed. More posts load as the user scrolls, each post shows its photos, and a post can be liked and unliked from its card.

- **Feed page.** It reads the feed by pages and appends each page. A page shorter than the page size is the last one.
- **Post card.** Author (a link to the profile, or plain text when the account is unavailable and the author has no id), time, title, text, photos, the like button with the count, and the comment count as a link to the post's page. The profile page, the post's page and the admin panel show posts too, so the card is placed where the conventions put UI that several features share.
- **Photos.** A grid of up to four thumbnails, with "+N" on the last when there are more. A click opens a full-screen viewer with previous and next, closed by Escape.
- **Likes.** The card changes after the server answers, not before. There is no list of who liked.
- **States.** A first load, an empty feed, a failed load with a way to try again, and the end of the feed.

This is the first paged list. Its way of loading the next page is what the comments, the profile, the friends lists, the chat and the admin tables copy.

Decisions are under "Feed, posts and comments" in `.scratch/frontend/spec.md`. The backend's side is in `docs/backend/controllers.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** tricky: the first paged list and the first shared content component; both set patterns that most later pages copy.

- [x] The feed loads its first page, and scrolling loads the next until the last
- [x] A page change never shows a post twice and never loads the same page twice at once
- [x] A post's photos show in their order, and the viewer steps through all of them
- [x] Liking and unliking change the button and the count after the server answers; a failure shows a toast and changes nothing
- [ ] Times are shown in the visitor's time zone and language through the shared formatter
- [x] An author with no id is plain text with no link
- [x] The post and like `…Api` methods are unit-tested against the HTTP testing backend, and the page-loading helper is unit-tested for the last page and for a failed page
- [x] Checked in the running app on a desktop width and on a phone width: a long feed, a post with one photo, with four and with ten, an empty feed for a fresh account

## Comments

- **Times box left unticked (2026-11-20).** The card prints its time through the shared `DateFormatter`, in the visitor's time zone. But desktop Chrome and Playwright's Chromium carry no Georgian locale data: `Intl.DateTimeFormat.supportedLocalesOf(['ka'])` returns `[]`, so `ka` falls back to `en-US` and the Georgian interface shows English month names. Node has the full data, which is why `date-formatter.spec.ts` passes. The gap is in the formatter from an earlier ticket, not in this one. The owner accepts it for now (2026-11-20): the fix is listed under "After the deadline" in `.scratch/roadmap.md`.
- **Empty feed.** The backend ranks every post the caller did not write (`PostRepository`), so a fresh account sees an empty feed only in an empty database. The empty state, the failed state with "Try again" and the end of the feed were checked in the running app by answering the feed request in the browser with an empty page, a failure and a short page. The long feed and the posts with one, four and ten photos were checked against real posts at 360, 768 and 1280 px in both themes.
- **Likes guess the new count.** The like calls return no count, so `toggledLike` adds or removes one. On a stale card (the post was liked elsewhere since it loaded), the backend's repeated like succeeds without a new row, and the card shows one too many until the next load. The owner accepts this (2026-11-20): a like count need not be exact.
- **The page sends the like** (owner, 2026-11-20). The card in `shared/` is presentational, as the conventions want: it takes `isLiking` and asks through `likeToggle`. The page calls `PostLikeStore.toggle` (`features/posts/`), which sends the like, shows the toast on a refusal, ignores a second click while one is on its way, and returns the changed post for the page's list. `shared/post-card` and `shared/photos` still import the post DTO types from `features/posts/`; those are types only.
- **Not built here.** The hidden badge (`isHidden` is on the DTO) and the "…" menu from the spec's feed card; later tickets add them. Beyond the ticket, the viewer also steps with the arrow keys and wraps around at both ends, so no button is ever disabled and the focus stays put.
- **Spec review (Opus 5.5).** Fixed after it: the like button and the comments link shared one long class string, now `shared/action-button`; the grid's ", " and "+N" were literal text, now dictionary entries; the grid sorted the photos twice; `toggleLike` returned early; a lone photo spanned two columns of a one-column grid. These fixes change no look, and were checked by lint, the tests and the build, not again in the browser. Left as judgement calls: `PhotoViewerOpener.open(images, startIndex)` could take `PhotoViewerData`, the viewer reads its title id from the dialog's config, and `PagedListOptions.keyOf` allows a string key that no caller uses yet.
