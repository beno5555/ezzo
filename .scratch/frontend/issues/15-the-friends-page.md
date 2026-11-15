# 15: The friends page

**What to build:** One page, `/friends`, with three tabs backed by the backend's three lists.

- **My friends.** Each row links to the friend's profile and offers Remove, after a warning that the messages between the two are deleted with the friendship.
- **Incoming requests.** Each row offers Accept and Decline.
- **Sent requests.** Each row offers Cancel. The backend has no separate cancel: removing the relationship, the same call that removes a friend, deletes a waiting request too.
- **Each list** loads by pages, and shows an empty state when it has no rows.
- **After an action** the row leaves its list. Accepting moves the person to My friends.
- **The count on the Friends link** in the shell is loaded again on each visit to this page and after an accept or a decline.

The count and the incoming list do not update live in this ticket. That is listed under "Last in line" in the spec.

Decisions are under "Friends and search" in `.scratch/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 25 (The friendship endpoints are covered by integration tests)

**Status:** ready-for-agent

**Difficulty:** routine: three paged lists and four actions on existing endpoints, following the feed's and the confirmation's patterns.

- [ ] Each tab shows its list, loads by pages, and shows an empty state
- [ ] Accept moves the request to My friends, and Decline removes it
- [ ] Cancel removes a sent request
- [ ] Remove asks first, naming the loss of the messages, and then removes the friend
- [ ] The count on the Friends link falls after an accept or a decline, without a reload
- [ ] Every row links to the person's profile
- [ ] The friendship `…Api` methods used here are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, with two accounts that send, accept, decline and cancel requests
