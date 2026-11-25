# 14: The profile page

**What to build:** Every user has a page at `/users/:username` that anyone can open.

- **Header.** The username, the bio, and the birthday as a day and a month without the year, formatted in UTC. No joined date.
- **Posts tab.** The user's posts, loaded by pages, shown with the post card.
  - **Own posts leave the feed here** (owner, 2026-11-22). The feed shows a user's new post on top, as pending and then as the server's copy (`NewPostStore`, `onPublished`), only because there was no profile to show it on; the ranked feed never lists the caller's own posts. This ticket removes that from the feed and shows the new post on the profile, where it belongs. An edit already shows on the post's own page and never in the feed (`PostEditStore`). The list must leave out a post whose deletion `PostEditStore.isDeleted` reports, as the feed does; the card fades and menus itself.
  - **No "(you)" mark here** (owner, 2026-11-22). The post card puts "(you)" after the author's name on the reader's own post (`shared.ownMark`; comments carry it too), for the feed and the post page, where it stands among other people's posts. On a profile every post is that user's, so the card needs a way to leave the mark out.
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

Decisions are under "Profile" in `planning/frontend/spec.md`. The friendship rules are under `FriendshipController` in `docs/backend/controllers.md`.

**Blocked by:** 09 (The feed shows posts with photos and likes), 13 (Content is reported and moderated from the normal pages), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): the friendship button has five states that differ by who asked whom, combined with the guest, own-profile and friend views.

- [x] A profile opens by username for a guest and for a user, and an unknown username shows the not-found page
- [x] Moving from one profile to another through a friend link loads the new profile without a reload
- [x] The birthday shows the day and month the user entered, whatever the visitor's time zone, and no year
- [x] The helper is unit-tested for every row of the table, including a declined request offering Add again
- [x] Each friendship action changes the button to the next state at once, on the click (Remove friend: once the warning is confirmed); a refusal puts the button back and shows a toast
- [x] Removing a friend warns about the messages first
- [x] A friend's profile has a Message button; a stranger's has none
- [x] A guest sees no Friends tab and no action buttons
- [x] A user reports another user from the menu, and is not offered that on their own profile
- [x] The friendship and user `…Api` methods are unit-tested against the HTTP testing backend
- [x] Checked in the running app at 360, 768 and 1280 px (light English for every role; dark and Georgian in part, see round 2), as a guest, as the owner, as a friend and as a stranger

## Comments

**2026-11-23, round 1: implementation (Sonnet 5.5).**

**Built.** `/users/:username` (`ProfilePage` loads the user in an effect, so a friend link to another profile loads it without a reload; unknown, deactivated and deleted names show the not-found page). `ProfileView` holds the header (avatar, username, birthday as day and month in UTC through `DateFormatter.birthday`, bio), the buttons and the tabs. `ProfilePosts` is a `PagedList` over the new `PostApi.getByUser`, with the card's "(you)" turned off by the new `hasOwnMark` input, deleted posts left out through `PostEditStore.isDeleted`, and the composer's pending and published posts shown on the writer's own profile only. `ProfileFriends` lists the friends through the new `FriendshipApi.getFriendsOf`, each a link; an unavailable account is plain text. The friendship button is `RelationshipStore` (component-provided, in `features/friendships`) with two pure helpers, `friendshipActionsOffered` (the table) and `relationshipAfter` (the optimistic next state). Cancel and Remove use the same call. Report uses the report dialog with a new `User` target and title. The Friends tab loads when first opened and stays mounted; it reads again after Accept or Remove.

**Departures and additions, with reasons.**
- **Backend: `StandardFriendshipDto.IsRequester`** (mapper, a 6-case integration test, `controllers.md`). The relationship endpoint did not say who sent a pending request, so "my request is waiting" and "their request is waiting" could not be told apart. Additive field. Open decision, below.
- **The feed no longer shows own posts or a pending post;** `NewPostPage.publish` now navigates to the writer's profile (feed if the name is unknown) before publishing, since the post would otherwise show nowhere. The ticket says the post shows on the profile; sending the user there is my reading.
- **New `shared/tabs`** (`Tabs`: roles, arrow/Home/End keys). No tab component existed.
- **A guest's like click on a profile post goes to sign-in and back,** as on the post page. The ticket only says "read-only".
- **After Accept or Decline the waiting-requests badge is refreshed** (`IncomingRequestsStore.refresh`), found by the spec review.
- **The header stacks on a phone:** the name goes under the picture, because beside the large avatar it broke mid-word at 360 px.
- **Georgian text is my own** (`users.profile.*`, `friendships.actions`, `friendships.removeConfirmation`, `reports.dialog.userTitle`). Please read it.

**Checks.** Backend build 0 warnings, full integration suite 891 passed. Frontend Prettier on `src/app`, lint (including the rule tests), build, unit tests 722 passed. The build keeps ticket 32's initial-bundle warning (701 kB against 600 kB); this ticket adds a lazy chunk only. Not run: the `scripts/test-linux.sh` suite, and Prettier's check on the whole of `frontend/` (27 files outside `src/app` were not formatted before this ticket and are untouched).

**Tried in the running app** (Playwright MCP, local backend and dev server, three throwaway accounts: owner, friend, stranger, who are gone with the database's next reset):
- Guest: a profile opens with header and posts, no Friends tab, no buttons; an unknown name shows not-found.
- Owner on a friend's profile: Remove friend (warning shown, confirmed, button became Add friend, Message gone); Add friend, then Cancel request; Accept and Decline on a request sent by the other; Add friend refused by the server (a request from the other side was waiting): the button stayed Add friend and a toast showed the server's message; Friends tab lists the friend; the friend link opened the other profile; own profile shows "Edit your profile" and no menu; stranger's menu shows Report and opens the report dialog; the composer returned to the profile with the post once.
- Pictures: friend's profile at 360 light, 360 light in Georgian, 1280 dark.
- Not tried: guest and stranger at both widths, 768 px, the other theme at each width, the "failed to load" and "loading more" states of the two lists in the browser.
- The last box is therefore left unticked: the pages were looked at as owner and friend at 360 and 1280, and as guest and stranger only at the window's default width.

**Review (spec-review, two Opus 5.5 high agents).** Fixed: `RelationshipReadStatus` split into its own file (one type per file); `RelationshipPerson` removed in favour of the profile's user; a spec for `RelationshipStore` (load, optimistic action and revert, confirmation, busy guard, what an accepted action changes elsewhere); the stale badge; the friends list no longer reloads after Add, Cancel or Decline; a comment on the last `InlineData` row; the composer's variable renamed. Left alone as judgement calls: `isOwn` repeated in `ProfileView` and `ProfilePosts` (two one-line computeds; a shared helper would be larger), the first-page loading code repeated in the two list components, and `RelationshipReadStatus` resembling `ProfilePageStatus` (they differ in NotFound and live in different features).

**Open decisions.**
- `IsRequester` on the backend DTO: chosen for now as an additive field; recommend keeping it, since the front end cannot tell the directions apart otherwise.
- Guest like click: chosen to send to sign-in and back; recommend keeping, it matches the post page.

**Waits for other tickets.** The friends page (15) and settings page (17) addresses are linked already (`/settings` exists as a placeholder route until 17). Nothing else.

**Screenshots:** `planning/frontend/shots/14/` in the main checkout (3 images).

**Branch:** `worktree-profile-page`, committed in the lane; it waits for the owner's review and merge. The trial merge result is in the chat report.

**2026-11-23, round 2: revision (Sonnet 5.5).**

- **Owner decision: keep `StandardFriendshipDto.IsRequester`** unless a better way exists. None does: the only alternative is searching the paged `pending` and `sent` lists for the other user (two calls, wrong past one page).
- **Owner decision: keep the guest's like click as is** (sign-in and back, as on the post page).
- **Owner decision: the last box stays open and is done now.** The profile is checked as guest, owner, friend and stranger at 360, 768 and 1280 px in both themes (`frontend/CLAUDE.md`, `DESIGN.md` Layout); 768 was skipped in round 1 without a recorded reason.
- **No code changed this round.** The checks of round 1 (backend build and 891 integration tests; Prettier on `src/app`, lint, 722 unit tests, build) still stand; spec-review had nothing to review.
- **Checked in the running app** (the screenshot command on the lane's own servers, 4200 and 7102; three new throwaway accounts `r2owner`, `r2friend`, `r2stranger`, who are gone with the database's next reset). `/users/r2owner` photographed as a guest, as the owner, as their friend and as a stranger: 12 images each (360, 768, 1280 × light, dark × English, Georgian). Looked at: all four roles at 360, 768 and 1280 in light English (12 images); beyond that the guest at 1280 dark English, the friend at 768 dark English and 360 dark Georgian, the stranger at 360 dark Georgian, the owner at 768 dark Georgian. The other dark and Georgian images were taken but not opened. Then a request sent by the stranger to the owner, and the owner's view of the stranger's profile at 360 Georgian (Accept and Decline side by side).
- **Found:** nothing. Header, buttons and tabs fit at 360 in both languages (in Georgian at 360 the friend's two buttons wrap onto two rows); nothing scrolls sideways; the guest has a Posts tab only and no buttons; the stranger has Add friend and the Report menu; the friend has Remove friend and Message; the owner has "Edit your profile" and no header menu; the owner's own post has no "(you)" mark.
- **Still not tried in a browser:** the "failed to load" and "loading more" states of the two lists. Their logic is covered by unit tests only.
- **Screenshots:** `C:\Users\admin\Workspace\Programming\web development\backend\projects\aspnetproject\planning\frontend\shots\14\` in the main checkout, now 16 images (the 3 of round 1, the 12 light English ones of this round, and the pending-request view).
- **Branch:** `worktree-profile-page`, pushed; waits for the owner's review and merge. The trial merge result is in the chat report.
