# 09: The feed shows posts with photos and likes

**What to build:** A signed-in user opens the home address and reads the ranked feed. More posts load as the user scrolls, each post shows its photos, and a post can be liked and unliked from its card.

- **Feed page.** It reads the feed by pages and appends each page. A page shorter than the page size is the last one.
- **Post card.** Author (a link to the profile, or plain text when the account is unavailable and the author has no id), time, title, text, photos, the like button with the count, and the comment count as a link to the post's page. The profile page, the post's page and the admin panel show posts too, so the card is placed where the conventions put UI that several features share.
- **Photos.** A grid of up to four thumbnails, with "+N" on the last when there are more. A click opens a full-screen viewer with previous and next, closed by Escape.
- **Likes.** The card changes after the server answers, not before. There is no list of who liked.
- **States.** A first load, an empty feed, a failed load with a way to try again, and the end of the feed.

This is the first paged list. Its way of loading the next page is what the comments, the profile, the friends lists, the chat and the admin tables copy.

Decisions are under "Feed, posts and comments" in `.scratch/frontend/spec.md`. The backend's side is in `docs/backend/controllers.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest)

**Status:** ready-for-agent

**Difficulty:** tricky: the first paged list and the first shared content component; both set patterns that most later pages copy.

- [ ] The feed loads its first page, and scrolling loads the next until the last
- [ ] A page change never shows a post twice and never loads the same page twice at once
- [ ] A post's photos show in their order, and the viewer steps through all of them
- [ ] Liking and unliking change the button and the count after the server answers; a failure shows a toast and changes nothing
- [ ] Times are shown in the visitor's time zone and language through the shared formatter
- [ ] An author with no id is plain text with no link
- [ ] The post and like `…Api` methods are unit-tested against the HTTP testing backend, and the page-loading helper is unit-tested for the last page and for a failed page
- [ ] Checked in the running app on a desktop width and on a phone width: a long feed, a post with one photo, with four and with ten, an empty feed for a fresh account
