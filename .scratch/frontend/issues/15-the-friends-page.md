# 15: The friends page

**What to build:** One page, `/friends`, with three tabs backed by the backend's three lists.

- **My friends.** Each row links to the friend's profile and offers Remove, after a warning that the messages between the two are deleted with the friendship.
- **Incoming requests.** Each row offers Accept and Decline.
- **Sent requests.** Each row offers Cancel. The backend has no separate cancel: removing the relationship, the same call that removes a friend, deletes a waiting request too.
- **Each list** loads by pages, and shows an empty state when it has no rows.
- **After an action** the row leaves its list at once, on the click (Remove: once the warning is confirmed), before the server answers; if the server refuses, the row comes back and a toast says why (quick actions, under "Across the whole frontend" in the spec; `PostLikeStore` is the pattern). Accepting moves the person to My friends.
- **The count on the Friends link** in the shell is loaded again on each visit to this page and after an accept or a decline.

The count and the incoming list do not update live in this ticket. That is listed under "Last in line" in the spec.

Decisions are under "Friends and search" in `.scratch/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 25 (The friendship endpoints are covered by integration tests), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: three paged lists and four actions on existing endpoints, following the feed's and the confirmation's patterns.

- [x] Each tab shows its list, loads by pages, and shows an empty state
- [x] Accept moves the request to My friends, and Decline removes it
- [x] Cancel removes a sent request
- [x] Remove asks first, naming the loss of the messages, and then removes the friend
- [x] The count on the Friends link falls after an accept or a decline, without a reload
- [x] Every row links to the person's profile
- [x] The friendship `…Api` methods used here are unit-tested against the HTTP testing backend
- [x] Checked in the running app on a desktop width and on a phone width, with two accounts that send, accept, decline and cancel requests

## Comments

**2026-11-23, round 1: implementation (Sonnet 5.5).**

**Built.** `/friends` with three tabs (My friends, Requests, Sent), each a paged list with its own loading, failed, ended and empty states. A tab's list is read the first time the tab opens, and the three panels stay mounted.
- `FriendshipApi` gained `getFriends` (`/accepted`) and `getSentRequests` (`/sent`), unit-tested against the HTTP testing backend with the other methods.
- `FriendsPageStore` (page-scoped) owns the three `PagedList`s and the four actions. The row leaves its list on the click (Remove: once the warning is confirmed), Accept puts the person on top of My friends, and a refusal puts the row back at its place, takes the person off My friends, and shows the server's message in a toast. A second click on the same person while an action is under way, or while the confirmation is open, is ignored. The count is read again on each visit and after an accept or a decline that the server accepted (not after Cancel or Remove, which do not change what waits).
- `FriendList` draws the rows (avatar, username linking to the profile, the list's buttons with an `aria-label` that names the person); `FriendsPage` holds the tabs.
- A person whose account is deactivated or deleted (no id) is plain text with no buttons, since every call needs the id.

**Departures from the ticket, and why.**
- `PagedList.insertAt` is new: a refused removal has to put the row back where it was.
- `PagedList` now remembers how many loaded items were removed since the last page and asks for an earlier page by that many (rounded up to whole pages), dropping repeats. Without it, answering requests shifts the server's list up and the next page skips people who then never show. `remove` counts only an item that was loaded; `insertAt` takes one back. It also helps the comments list, which had the same flaw; its specs still pass. Three new specs cover it.
- `friendship-action-looks.ts` is taken out of `profile-view.ts` so that the profile and the friends page share one map of button looks.
- `friendship-key.ts` is shared by the new lists and `ProfileFriends` (it was inline there).
- `shared/tabs/tabs.ts`: padding `px-4` became `px-3 md:px-4`. With three Georgian tabs at 360 px the third tab was cut off and the page scrolled sideways. The profile's two tabs are only a little tighter on a phone; not re-photographed.
- Tab labels are short: "My friends / Requests / Sent", and in Georgian "მეგობრები / შემოსული / გასული" (the longer words did not fit at 360 px).

**Checks.** Prettier check on `src`, lint (ESLint, `tools` types, the rule tests), 743 unit tests (83 files), `npm run build`: all pass. The build still warns that the initial bundle is 111 kB over its 600 kB budget; the new page is a lazy chunk and adds nothing to it (the warning is ticket 32's). The backend was not touched, so its suite was not run.

**Tried in the running app** (Playwright MCP; own backend and dev server on 4200/7102; accounts `f15a` (the signed-in one), `i01` to `i13`, `snt1` to `snt3`, all throwaway, gone with the database's next reset). Seeded through the API: 13 people sent `f15a` a request, `f15a` accepted two and sent three.
- Requests tab with 11 rows (two pages: the second loaded by the scroll sentinel, "No more requests"); Accept `i01` and Decline `i02`: both rows left at once, the Friends link's count fell 11 to 9, `i01` came on top of My friends.
- Sent: Cancel `snt2` removed it; Cancel on the last two showed the empty state.
- Remove: the warning names the loss of the messages (360 px photographed); Cancel in the dialog changed nothing; confirmed Remove took the friend out. A refusal was provoked by having the friend remove the friendship from their side first: the row came back at its place and the toast said "Relationship Not Found".
- Row links point at `/users/<name>`; one was followed.
- Widths and themes: about 820 px light (desktop shell), 768 px dark (empty Sent), 360 px light and in Georgian. 1280 px, and the dark theme at 360, were not looked at. The ticket's "two accounts": one browser session as `f15a`; the other side's sends and the friend's removal were API calls with their own tokens.
- After the review fixes I re-checked in the browser only the tabs (click and arrow keys load their lists).
- Not tried: the "failed to load" states of the lists, and the blank-list fix (an Idle list whose loaded rows were all answered) in the browser: it needs more than 10 rows on the server to reach, and is covered by the template change and the `PagedList` specs only.

**Review (spec-review, two Opus 5.5 high agents).** Fixed: a list whose loaded rows were all answered while more waited on the server drew nothing (the scroll sentinel now shows for an Idle list with no rows); the paging drift above; the tab opening moved from an `effect` to `ngOnInit` and the tabs' `selectedChange`, with no cast; a named boolean for the Accept test in the store; the tabs' order is one list; the unused `FriendsTab` field was dropped; `ProfileFriends` reuses `friendshipKey`; Tailwind class order in `tabs.ts`. Left alone as judgement calls: the row and state markup of `friend-list.html` resembles `profile-friends.html` (a shared list component would also touch the profile; worth doing if a third list appears), `sourceTabs` (store) and `actionsOfTab` (list) are the same relation in two directions, the `Add` entry in `sourceTabs` and `send` that makes the `Record` complete, the badge falling when the server answers rather than on the click (the row leaves on the click, as the ticket asks; the count is "loaded again" per the ticket).

**Open decisions.**
- Changing `PagedList` for removals (above): chosen for now because it fixes a real skip; recommend keeping. The comments list's behaviour changes with it for the better.
- The shared tab padding: chosen for now; recommend keeping, and glancing at the profile's tabs at 360 px.

**Waits for other tickets.** Live count and live incoming list: "Last in line" in the spec, as the ticket says. The settings page (17) and search (16) are separate.

**Screenshots:** `.scratch/frontend/shots/15/` in the main checkout (8 images).

**Branch:** `worktree-f15-friends`, committed and pushed; waits for the owner's review and merge (a visual ticket). The trial merge result is in the chat report.
