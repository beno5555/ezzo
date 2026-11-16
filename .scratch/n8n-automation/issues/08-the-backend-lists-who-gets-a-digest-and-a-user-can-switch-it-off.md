# 08: The backend lists who gets a digest, and a user can switch it off

**What to build:** The automation can ask the backend who should get this week's digest and what to put in it, and a user can switch the digest off for themselves. The email itself is ticket 09 and the switch on the settings page is ticket 10.

- **The switch.** `digestEmailEnabled` on `User`, on by default, added through a migration that gives existing users `true`. It is returned in the user's own shape and in no other shape.
- **Its route.** `PUT /api/users/mine/digest-email`, with one boolean, for the signed-in user. It is not a field of the profile update: that update replaces the whole profile, so a client that does not know the field would switch the digest off without meaning to. An administrator's edit of a user does not change it.
- **`GET /api/internal/digest`.** Only the automation's API key opens it; anyone else, an administrator included, gets `401` (the rule from ticket 03). Paged with the paging parameters every list uses, ordered by user id. One row per user who has the switch on and something to report:
  - the user's id, username and email;
  - the number of conversations with unread messages;
  - the number of pending friend requests the user has received;
  - up to three posts: the most-liked posts created in the last 7 days by the user's accepted friends, newest first on a tie, never Hidden ones. Each carries its id, title, author's username and like count.
- **"Something to report"** means at least one of the three is not zero or empty. A user with nothing gets no row.
- **Deactivated and deleted accounts** are left out, as recipients and as authors, by the existing filter.

Ticket 11 also adds routes under `/api/internal`. Whichever of the two tickets lands first creates that group of routes, and the other adds to it.

Decisions are under "Internal endpoints" and "The digest switch" in `.scratch/n8n-automation/spec.md`. Digest is defined in `GLOSSARY.md`.

**Blocked by:** 03 (The automation calls the backend with its own key and can only raise a moderation status)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the work is fully specified, but who is listed and which posts appear depend on several conditions that must all hold at once.

- [ ] A new user has the switch on; the own shape returns it; the public and administrator shapes do not
- [ ] The switch route turns it off and on for the caller; a guest is refused
- [ ] A profile update that does not mention the switch leaves it as it was, and so does an administrator's edit of the user
- [ ] With the key, the list returns a row for a user with unread conversations, with pending requests, or with friends' posts, and the counts match the seed data
- [ ] A user with the switch off, a user with nothing to report and a deactivated user get no row
- [ ] The posts are the three most-liked from the last 7 days by accepted friends, in order; an older post, a Hidden post, a post by a non-friend and a post by a deactivated friend are left out (seed rows with fixed creation times)
- [ ] Paging works and the order is stable across pages
- [ ] Without the key, with a wrong key, with a user's token and with an administrator's token, the list answers `401`
- [ ] Each new route has its own rate-limit policy
- [ ] New seed rows are appended and no existing seeded id changes
- [ ] `docs/backend/controllers.md`, `data.md` and `automation.md` describe the switch, its route and the list
