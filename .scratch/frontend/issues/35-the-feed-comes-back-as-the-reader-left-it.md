# 35: The feed comes back as the reader left it

**What to build:** A reader who opens a post from the feed and comes back finds the feed as it was: the same posts, already loaded, with the screen at the post they left, not a fresh list at the top. The decisions below are the owner's (2026-11-22, after the visual review of ticket 11).

- **What is kept.** The feed's list (the loaded posts and where its paging stands) lives in an app-wide store, not in the feed page, so it outlives the page. The post you left is remembered, and on return the screen scrolls to that post, not to a pixel offset: the list may have changed above it.
- **What "back" means.** The post page's Back button, its card's comments button and the browser's own back button all return to the kept feed. The Back button and the comments button go back in the browser's history only when the previous entry is the feed and a kept feed exists; the check comes first, because the post may have been opened from somewhere else (a shared link, a new tab, a link followed while the reader was scrolling the feed). In that case they go to `/` as a link does today, and the feed loads fresh. A guest has no feed, so nothing changes for a guest.
- **What starts fresh.** The "Feed" link in the top bar and in the bottom bar loads the feed from the top, as a new visit.
- **How long it is kept.** 10 minutes after the reader left the feed. A return after that loads fresh. The owner asked for the number to be changed if it proves wrong, so it is one named constant.
- **Changes made while away.** What happens on the post's page shows on the kept list, without a reload:
  - a like or unlike (including one the like store has not sent yet) shows on the kept card;
  - the post's comment count follows comments sent, refused or deleted on the page;
  - a post deleted on its page leaves the list.
  Keep this simple: the post page hands its last state of the post to the store when the reader leaves, and the store replaces the card by id.
- **When it is dropped.** On sign-out and when another user signs in, so one user never sees another's feed. A change of language does not drop it: a post's text does not depend on the language, and the dictionary texts around it change on their own.

Out of scope: the lists on a profile page and in the admin panel (they may copy this later), and restoring the comment list under a post.

**Blocked by:** 11 (A post has its own page with comments), 09 (The feed shows posts with photos and likes)

**Status:** ready-for-agent

**Difficulty:** tricky: a new pattern (a list that outlives its page, the history check, scroll restoration) that tests will not fully catch and that later lists will copy

- [ ] Opening a post from the feed and pressing Back, the comments button or the browser's back button shows the same loaded posts, scrolled to the post that was left
- [ ] Back and the comments button check that the previous history entry is the feed, with a kept list, before they go back; otherwise they open `/` and it loads fresh (a post opened from a shared link, in a new tab, or from elsewhere)
- [ ] The "Feed" link in the top bar and the bottom bar loads the feed from the top
- [ ] A feed left more than 10 minutes ago loads fresh; the time is one named constant
- [ ] A like, a comment count change and a deletion made on the post's page show on the kept feed on return
- [ ] Signing out, or another user signing in, drops the kept feed; a change of language keeps it
- [ ] Posts a user writes and the feed's own load failures still behave as before (a new post goes on top; Try again works)
- [ ] Unit tests cover the store (keeping, patching by id, the time limit, dropping on sign-out) and the history check
- [ ] Checked in the running app at a phone and a desktop width, as a signed-in user, with a feed long enough to scroll
