# 14: The profile page

**What to build:** Every user has a page at `/users/:username` that anyone can open.

- **Header.** The username, the bio, and the birthday as a day and a month without the year, formatted in UTC. No joined date.
- **Posts tab.** The user's posts, loaded by pages, shown with the post card.
  - **Own posts leave the feed here** (owner, 2026-11-22). The feed shows a user's new post on top, as pending and then as the server's copy (`NewPostStore`, `onPublished`), only because there was no profile to show it on; the ranked feed never lists the caller's own posts. This ticket removes that from the feed and shows the new post on the profile, where it belongs. An edit already shows on the post's own page and never in the feed (`PostEditStore`). The list must leave out a post whose deletion `PostEditStore.isDeleted` reports, as the feed does; the card fades and menus itself.
  - **No "(you)" mark here** (owner, 2026-11-22). The post card puts "(you)" after the author's name on the reader's own post (`posts.card.ownMark`), for the feed and the post page, where it stands among other people's posts. On a profile every post is that user's, so the card needs a way to leave the mark out.
- **Friends tab.** The user's friends, each a link to their profile. A guest sees no Friends tab, because that list requires sign-in.
- **Friendship button,** for a signed-in visitor on someone else's profile. It follows the relationship the backend reports:

| Relationship | The button offers |
|---|---|
| None, or a declined request | Add friend |
| My request is waiting | Cancel request |
| Their request is waiting | Accept, Decline |
| Friends | Remove friend, after a warning that the messages between the two are deleted |

  Each action shows the next state at once, before the server answers, and goes back with a toast if the server refuses (quick actions, under "Across the whole frontend" in the spec; `PostLikeStore` is the pattern). The mapping from relationship to buttons is one pure helper. Cancel request uses the same call as Remove friend: the backend removes a relationship in any state.
- **Message button** for a friend, leading to `/messages/:username`.
- **My own profile** shows a link to settings where another profile shows the friendship button.
- **The "…" menu** offers Report to a signed-in visitor on someone else's profile, with the report dialog from ticket 13.
- **A guest** sees the header and the posts, read-only. The friendship button's place holds nothing.
- **A username the backend does not find,** which includes deactivated and deleted accounts, shows the not-found page.

Decisions are under "Profile" in `.scratch/frontend/spec.md`. The friendship rules are under `FriendshipController` in `docs/backend/controllers.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes), 13 (Content is reported and moderated from the normal pages), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the friendship button has five states that differ by who asked whom, combined with the guest, own-profile and friend views.

- [ ] A profile opens by username for a guest and for a user, and an unknown username shows the not-found page
- [ ] Moving from one profile to another through a friend link loads the new profile without a reload
- [ ] The birthday shows the day and month the user entered, whatever the visitor's time zone, and no year
- [ ] The helper is unit-tested for every row of the table, including a declined request offering Add again
- [ ] Each friendship action changes the button to the next state at once, on the click (Remove friend: once the warning is confirmed); a refusal puts the button back and shows a toast
- [ ] Removing a friend warns about the messages first
- [ ] A friend's profile has a Message button; a stranger's has none
- [ ] A guest sees no Friends tab and no action buttons
- [ ] A user reports another user from the menu, and is not offered that on their own profile
- [ ] The friendship and user `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, as a guest, as the owner, as a friend and as a stranger
