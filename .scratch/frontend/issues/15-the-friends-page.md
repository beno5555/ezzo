# 15: The friends page

**What to build:** One page, `/friends`, with three tabs backed by the backend's three lists.

- **My friends.** Each row links to the friend's profile and offers Remove, after a warning that the messages between the two are deleted with the friendship.
- **Incoming requests.** Each row offers Accept and Decline.
- **Sent requests.** Each row offers Cancel. The backend has no separate cancel: removing the relationship, the same call that removes a friend, deletes a waiting request too.
- **Each list** loads by pages, and shows an empty state when it has no rows.
- **After Accept, Decline or Cancel** the row leaves its list at once, on the click, before the server answers; if the server refuses, the row comes back and a toast says why (quick actions, under "Across the whole frontend" in the spec; `PostLikeStore` is the pattern). Accepting moves the person to My friends.
- **After Remove** (once the warning is confirmed) the row says "Deleting…" with a spinner and waits for the server; on a yes it fades out and the next row moves up, on a no the row stays and a toast says why (round 2; "A deletion waits for the server" in the spec).
- **Every My friends row has a Message button** that leads to the conversation with that person (round 2).
- **No list shows a "No more …" line** at its end; the lists keep loading as the reader scrolls (round 2).
- **The count on the Friends link** in the shell is loaded again on each visit to this page and after an accept or a decline.

The count and the incoming list do not update live in this ticket. That is listed under "Last in line" in the spec.

Decisions are under "Friends and search" in `.scratch/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 25 (The friendship endpoints are covered by integration tests), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: three paged lists and four actions on existing endpoints, following the feed's and the confirmation's patterns.

- [x] Each tab shows its list, loads by pages, and shows an empty state
- [x] Accept moves the request to My friends, and Decline removes it
- [x] Cancel removes a sent request
- [x] Remove asks first, naming the loss of the messages, and then removes the friend: "Deleting…", the server's answer, then the row fades out
- [x] Every My friends row has a Message button
- [x] The profile's Friends tab shares the friends page's list component
- [x] No list but the feed shows a "No more …" end message
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

**2026-11-23, round 2: revision (Sonnet 5.5).** Fixed point: `9c3ba11`.

Owner's decisions:
- Every row of My friends has a **Message** button (it leads to `/messages/<username>`). It is crucial; its absence is also why the phone layout looked off.
- A deletion (a friend, and the same for a post, a comment and a message) shows a **"Deleting…" spinner** first and waits for the server's answer. Only then does the row fade out and the next one move up (the `DeleteFade` motion). The spinner stays for a short minimum so a fast answer does not flicker, and as long as the server takes otherwise. A refusal drops the spinner, keeps the row and shows the toast. This replaces "the row leaves on the click" for deletions; Accept, Decline and Cancel stay as the ticket says.
- A shared list-row component replaces the near-duplicate markup of `friend-list.html` and `profile-friends.html`.
- The "No more …" end messages go from every list except the feed's.
- Automatic scroll loading stays on the friends lists for now. Numbered pages with arrows and a total (a backend change) are post-deadline work, a separate ticket that the owner asks for with `/to-tickets`; not part of this one.

**Built.**
- `DeleteFade.delete(id, request)` (`shared/fade-out`) is the one deletion motion: "Deleting…" (waiting) until the server has answered and 400 ms have passed, then on a yes a 200 ms fade (fading) and gone; on a no everything clears and the item stays. It also clears the waiting state if the request throws. The `FadeOut` directive draws it (`appDeleting` dims, `appFadeOut` fades); `app-deleting-notice` is the spinner and the words (stands still under reduced motion).
- Used by posts (`PostEditStore`, card and post page), comments (`CommentThreadStore`; the count falls only on a yes), messages (`ConversationsStore`; the conversation's row preview updates only on a yes) and friends (`FriendsPageStore.removeFriend`, after the warning).
- `FriendList` moved to `shared/friend-list` and serves both the friends page's tabs and the profile's Friends tab (no actions and no Message there, since those are another person's friends). My friends rows have a **Message** button (a primary link to `/messages/<username>`) beside a short **Remove**.
- Every "No more …" line is gone but the feed's: friends lists, profile posts and friends, admin users.
- `spec.md` has the new rule ("A deletion waits for the server"); the old "quick actions" and "fades out" lines were corrected.

**Departures from the ticket, and why.**
- Accept, Decline and Cancel stay optimistic: only Remove (and the other deletions) got the Deleting flow, as decided.
- The Remove button says "Remove" on a row (the profile's says "Remove friend"); the long label pushed the buttons onto two lines at 360 px. The accessible name still names the person.
- The notice's minimum is 400 ms (the owner said about 300 to 400).
- The spinner turns for longer than the 200 ms motion limit in `DESIGN.md` and the conventions' Motion section: the owner asked for a spinner and it is the only motion that long. If you want the limit to say so, it is a one-line addition to `DESIGN.md`; I did not change it.
- The initial bundle grew about 3 kB (114 kB over its budget, was 111): the shared deletion code sits in the first chunk. The warning is ticket 32's.
- "No more reports" is not in this branch (the admin-queue lane has it); that lane must drop it too.
- The post page now leads to the feed after a deletion only if the reader is still on that post (the wait is now as long as the server takes).
- Not built: numbered pages (post-deadline, a ticket for the owner to ask for with `/to-tickets`).

**Checks.** Prettier check, lint (all 39 rule tests pass), 746 unit tests (83 files, 8.11 s), `npm run build`: all pass; the bundle warning is the one above. The backend is untouched.

**Tried in the running app** (Playwright MCP; own backend on 7202 and dev server on 4300; throwaway accounts): at 360 px My friends rows with Message and Remove on one line; Remove's warning; a delayed DELETE showed the dimmed "Deleting…" row, then the row left; a post's "Deleting…" card at 360 px, gone after the answer; at 1280 px the list and the Deleting row. Not looked at: the dark theme, 768 px, Georgian after this round, a refused deletion in the browser (covered by unit specs), the comment and message "Deleting…" states in the browser.

**Review (spec-review, two Opus 5.5 high agents).** Severe findings: none. Fixed: the post page led the reader to the feed even after they had followed a link elsewhere during the now longer wait; a shared component imported from another feature (moved to `shared/`); the spinner's inline template (now three files); a component DOM test, forbidden until 2026-11-25 (removed); a request that throws left an item on "Deleting…" (now cleared, with a spec); a stale comment about refused comment deletions raising the count, and others about menus and end messages; the spec's old deletion rules. Left alone, judgement calls: the spinner against the motion limit (above); naming drift between `isFadingOut` and `isFading`; `PostEditStore`'s two pass-through getters; `retryLabel` as a separate input; a possible merge of `sourceTabs` and `actionsOfTab` in `FriendsPage`. One known smaller case: if the reader switches conversations while a message says "Deleting…", the first conversation's row may keep the deleted message as its preview until the next load.

**Open decisions.**
- The spinner against the 200 ms motion limit: chosen for now to keep the spinner turning; recommend adding the exception to `DESIGN.md` (owner decides).

**Screenshots:** `C:\Users\admin\Workspace\Programming\web development\backend\projects\aspnetproject\.scratch\frontend\shots\15\`, the `f15r2-` files (phone: friends with Message, remove warning, deleting, after delete, post deleting; desktop: friends, deleting).

**Branch:** `worktree-f15-friends`, pushed; not merged.
