# WebCity frontend

Status: ready-for-agent

## Problem Statement

The documentation sent to the academy (`webcity-documentation.md`) is the commitment for 2026-11-25. It promises an Angular application, and none of it exists: there is no `frontend/` folder. WebCity can be used today only through Swagger or Postman.

- A person cannot register, sign in, reset a password or reactivate an account in a browser.
- Nobody can read the feed, write a post with photos, like, comment or report.
- Nobody can look at a profile, find a person, or send, accept or decline a friend request.
- Friends cannot chat, see who is online, see "typing…" or see that a message was read.
- Nothing tells a user, while they are on another page, that a message, a comment or a like arrived.
- An administrator cannot manage accounts, read the logs, review reports or review flagged content without calling the API by hand.
- A guest who is sent a link to a post or a profile has nothing to open.

Three small things in the backend also stand in the way of the pages: four usernames that break addresses or imitate a placeholder, a joined date sent to everyone, and a "username last changed" time that is stored but never sent.

## Solution

Build the Angular application in `frontend/`, served from the same origin as the backend (ADR 0001), in the shape the conventions skill and ADRs 0003 to 0006 already fix.

- **Scaffold and plumbing.** The CLI project, the dev proxy, lint, tests and build in CI, the session, the HTTP interceptor with automatic refresh, the hub client, the dictionaries and the shared error handling.
- **Shell and auth.** Navigation for a desktop and a phone, a guest's reduced shell, and the pages to register, sign in, reset a password and reactivate an account.
- **Feed, posts and comments.** A ranked feed, a composer on its own page, a page per post with its comments, likes, edit and delete, and a report dialog.
- **Profile, friends, search and settings.** A profile with posts and friends, the three friendship lists, user search, and one settings page.
- **Chat and live notifications.** A conversation list and a conversation with photos, edit, delete, seen, typing and presence, and toasts for what happens elsewhere.
- **Admin panel.** A page each for users, reports, the moderation queue, logs and statistics.
- **Three small backend changes** that the pages need.

A **guest** reads and searches and does nothing else. English and Georgian ship on the 25th. The demo runs on the owner's machine.

## User Stories

### Session and shell

1. As a user, I want to stay signed in when I reload the page or open a new tab, so that I do not sign in again every time.
2. As a user, I want my session renewed without my noticing when the access token expires, so that an action never fails just because time passed.
3. As a user, I want to be taken to the sign-in page when my session can no longer be renewed, so that I understand why nothing works.
4. As a user, I want to return to the address I asked for after I sign in, so that a link someone sent me still leads where it should.
5. As a user with two tabs open, I want both tabs to stay signed in, so that one tab's renewal does not sign the other out.
6. As a user, I want to sign out from the menu, so that the next person at this computer cannot use my account.
7. As a user on a desktop, I want a top bar with the logo, the search box, Feed, Friends, Messages and a menu under my initials, so that every area is one click away.
8. As a user on a phone, I want a bottom bar with Feed, Search, Friends, Messages and Profile, so that I can reach every area with a thumb.
9. As a user, I want the Messages link to show how many conversations have unread messages, so that I know someone wrote to me.
10. As a user, I want the Friends link to show how many friend requests are waiting, so that I do not miss one.
11. As an administrator, I want an Admin entry in my menu, so that I can reach the admin panel.
12. As a user who is not an administrator, I want no Admin entry and no access to the admin addresses, so that I am not shown pages that will refuse me.
13. As a visitor, I want a clear not-found page for an address that does not exist, so that I know the link is wrong.
14. As a user, I want a failed action to tell me what went wrong in a toast or beside the form, so that I am never left with a button that did nothing.

### Auth pages

15. As a visitor, I want to register with a username, an email, a password, a date of birth and an optional bio, so that I can join WebCity.
16. As a visitor, I want each field checked as I leave it, with the same limits the server uses, so that I fix mistakes before I submit.
17. As a visitor, I want the server's complaint about a field shown beside that field, so that I know which one to change.
18. As a new user, I want to be signed in as soon as I have registered, so that I do not type my password twice.
19. As a new user whose automatic sign-in failed, I want to land on the sign-in page with my username filled in, so that I can finish by hand.
20. As a user, I want to sign in with my username or my email, so that I can use whichever I remember.
21. As a signed-in user, I want the sign-in and register addresses to send me to the feed, so that I do not see forms I do not need.
22. As a user who forgot a password, I want to ask for a reset link by email, so that I can get back in.
23. As a user, I want the link in the reset email to open a page where I choose a new password, so that I do not copy a code by hand.
24. As a user, I want to be told when a reset link is no longer valid, so that I ask for a new one.
25. As a user who deactivated an account, I want to ask for a reactivation link by email and reactivate with one button on the page it opens, so that I can come back without copying a code.
26. As a user who has just reactivated, I want to be sent to sign-in with a message that it worked, so that I know what to do next.
27. As a user, I want links between sign-in, register, forgotten password and reactivation, so that I find the right form from any of them.

### Guest

28. As a guest, I want to open a link to a post and read it with its photos and comments, so that a shared link works without an account.
29. As a guest, I want to open a link to a profile and read the bio and the posts, so that I can see who someone is.
30. As a guest, I want to search for people by name, so that I can find someone I know before I register.
31. As a guest, I want a shell with only the logo, the search box, the language switch, Sign in and Register, so that I am not shown areas I cannot use.
32. As a guest, I want a like, comment or report button to take me to sign-in, so that I learn the action needs an account.
33. As a guest, I want the home address and every signed-in address to take me to sign-in, so that I never see an empty or broken page.

### Feed and posts

34. As a user, I want the feed page to show the ranked feed, so that I see friends' news and discover other people.
35. As a user, I want more posts to load as I scroll, so that I never press a "next page" button.
36. As a user, I want a Write a post button on the feed that opens a composer page with a title, text and up to 10 photos, so that the feed stays a list and other kinds of post can join the composer later (owner, 2026-11-21).
37. As a user, I want a preview of each photo I picked, and a way to drop one before I post, so that I publish what I meant.
38. As a user, I want a file of the wrong type or over the size limit refused in the browser with a clear message, so that I do not wait for an upload that will fail.
39. As a user, I want my new post to appear at the top of the feed at once, with a toast while it uploads and another when it is published, so that I never wait and still know when it is done.
40. As a reader, I want a post's photos shown as a grid, and a full-screen viewer when I click one, so that I can look at them properly.
41. As a reader, I want each feed card to show the author, the time, the like count and the comment count, so that I can judge a post at a glance.
42. As a user, I want to like and unlike a post from its card, so that reacting takes one click.
43. As a reader, I want to open a post on its own page, so that I can read its comments and share its address.
44. As a post author, I want to edit the title and the text of my post on a page of its own, so that I can fix a mistake (owner, 2026-11-22: not in place in the feed).
45. As a post author, I want to remove one photo from my post, so that I can fix a mistake without deleting the post. (Owner, 2026-11-22: the edit page does not touch photos until it can add them too; the control comes back with that ticket, and asks before it removes.)
46. As a post author, I want to delete my post after a confirmation, so that I do not delete it by accident.
47. As a reader, I want times shown in my own time zone and language, so that "when" is never ambiguous.

### Comments

48. As a user, I want to read a post's comments on the post's page, loaded as I scroll, so that long discussions stay usable.
49. As a user, I want to write a comment under a post, so that I can answer it.
50. As a comment's author, I want to edit and delete my comment, so that I can correct or withdraw it.
51. As a post author, I want to delete any comment on my post, so that I can keep my post's discussion clean.
52. As a user, I want my new comment to appear at once, marked "Sending…" until the server has it, and the count to follow, so that I never wait for it.

### Actions on content, reports and hidden content

53. As a user, I want a "…" menu on every post, comment and profile, so that less common actions are in one predictable place.
54. As a user, I want to report a post, a comment or a user with a reason, so that an administrator looks at it.
55. As a user, I want to be told when my report was received, so that I do not send it twice.
56. As a user, I want no Report entry on my own content and my own profile, so that I am not offered something the server refuses.
57. As an administrator, I want Delete in that menu on any post or comment, so that I can remove content where I meet it.
58. As an administrator, I want Hide and Make visible in that menu on any post or comment, so that I can moderate without opening the admin panel.
59. As an author, I want a "Hidden" badge on my content that moderation hid, so that I know other users no longer see it.
60. As an administrator, I want the same badge on hidden content I come across, so that I know its state.

### Profile

61. As a visitor, I want a profile to show the username, the bio and the birthday as a day and a month, so that I learn about the person without their age.
62. As a user, I want no joined date on a profile, so that this detail stays between the account's owner and the administrators.
63. As a user, I want a Posts tab with the person's posts, loaded as I scroll, so that I can read what they published.
64. As a user, I want a Friends tab with the person's friends, so that I can find people we both know.
65. As a user, I want one friendship button that shows the state between us (add, cancel my request, accept or decline, remove), so that I always know where we stand.
66. As a user, I want a Message button on a friend's profile, so that I can start a chat from there.
67. As a user, I want my own profile to offer a link to settings where another profile shows the friendship button, so that I can edit it.
68. As a reader, I want an author whose account is deactivated or deleted shown as plain text with no link, so that I do not click through to nothing.
69. As a visitor, I want the address of a profile that does not exist, or is no longer available, to show the not-found page, so that I understand the link is dead.

### Friends

70. As a user, I want a Friends page with three tabs (my friends, incoming requests, sent requests), so that every friendship matter is in one place.
71. As a user, I want to accept or decline an incoming request, so that I choose who my friends are.
72. As a user, I want to cancel a request I sent, so that I can change my mind.
73. As a user, I want to remove a friend after a warning that our messages are deleted with the friendship, so that I do not lose a conversation by accident.
74. As a user, I want to send a request again after it was declined, so that a decline is not final.
75. As a user, I want each row to link to the person's profile, so that I can look before I decide.

### Search

76. As a visitor, I want the search box in the top bar to open the search page with my words, so that I can search from anywhere.
77. As a visitor, I want results to follow my typing after a short pause, so that I do not press a button for every try.
78. As a visitor, I want only the results of my latest words shown, so that a slow older answer never replaces a newer one.
79. As a visitor, I want the search words kept in the address, so that I can share or reload a search.

### Chat

80. As a user, I want a list of my conversations with the friend's name, the last message and its time, so that I can pick up where I left off.
81. As a user, I want a row whose last message has only photos to say "Photo", so that the row is never blank.
82. As a user, I want each row to show how many unread messages it holds, so that I know which to open first.
83. As a user, I want an online dot beside a friend who is online and "last active" beside one who is not, so that I know whether to expect an answer.
84. As a user, I want a "New message" button that lists friends I have not written to yet, so that I can start a conversation.
85. As a user on a desktop, I want the list and the open conversation side by side, so that I can switch quickly.
86. As a user on a phone, I want the list on one screen and the conversation on the next, with the back button returning to the list, so that each has the whole screen.
87. As a user, I want to send text, up to 5 photos, or both, and to see my message at once with a small clock until it is sent, so that chat is not limited to text and never makes me wait.
88. As a user, I want a message from my friend to appear the moment it is sent, so that we can talk in real time.
89. As a user, I want older messages to load as I scroll up, so that the whole history is reachable.
90. As a user, I want to edit my message for 20 minutes after I sent it and not see the option afterwards, so that I am not offered an edit that will be refused.
91. As a user, I want an edited message marked as edited, and my friend's edits to appear live, so that both of us read the same text.
92. As a user, I want to delete my message, so that I can withdraw it.
93. As a user, I want opening a conversation to mark its messages as read, so that the unread count is right.
94. As a user, I want "seen" under my last message that my friend has read, so that I know it arrived.
95. As a user, I want "typing…" while my friend writes, disappearing after 3 seconds of silence, so that I know an answer is coming.
96. As a user, I want the conversation's address to carry my friend's username, so that I can bookmark it.

### Toasts and live updates

97. As a user, I want a toast when a friend sends me a message while I am elsewhere, so that I do not miss it.
98. As a user, I want no toast for a message in the conversation I am looking at, so that I am not told what I can already see.
99. As a post author, I want a toast when someone comments on my post, so that I can answer.
100. As a post author, I want a toast when someone likes my post, so that I know it was noticed.
101. As a user, I want a toast when a friend comes online, at most once per friend in 5 minutes, so that I am informed without being flooded.
102. As a user, I want a click on a toast to open the chat or the post it is about, so that I can act on it.
103. As a user, I want a toast to leave after 5 seconds and at most three on screen, so that they never cover the page.
104. As a user, I want the unread count and the online dots to change without a reload, so that what I see is current.
105. As a user, I want the live connection to come back by itself after my network drops, so that I do not reload the page.

### Settings

106. As a user, I want one settings page, so that I do not hunt through several.
107. As a user, I want to change my username, bio and date of birth, so that my profile stays right.
108. As a user, I want the 20-day limit on username changes explained, with the date my username was last changed, so that I know when I can change it again.
109. As a user, I want to see when my account was created, so that I know my own history.
110. As a user, I want to switch the language of the interface, so that I can read WebCity in English or Georgian.
111. As a user, I want a button that emails me a password reset link, so that I can change my password while signed in.
112. As a user, I want to deactivate my account after typing my username to confirm, so that I can take a break without doing it by accident.
113. As a user, I want to delete my account after typing my username to confirm, so that I can leave without doing it by accident.
114. As a user who deactivated or deleted, I want to be signed out and told what happens next, so that I know how to return or that I cannot.

### Admin panel

115. As an administrator, I want a side navigation with Users, Reports, Moderation, Logs and Statistics, each at its own address, so that I can link straight to an area.
116. As an administrator, I want a table of accounts in any state, filtered by state and by username, so that I can find one account among many.
117. As an administrator, I want to see each account's email, role, state and its joined, deactivated and deleted dates, so that I know what I am acting on.
118. As an administrator, I want to create an account and edit an account's profile in a dialog, so that I do not leave the table.
119. As an administrator, I want to deactivate, restore and delete an account from its row, so that account management is one click.
120. As an administrator, I want to grant and remove the administrator role from a row, so that I can manage who helps me.
121. As an administrator, I want a confirmation before a deactivation, a deletion or a role change, so that a slip does no harm.
122. As an administrator, I want the reports list to open on pending reports, filterable by status and by what was reported, so that I see what needs a decision.
123. As an administrator, I want each report to show the reported post, comment or user inline, with its photos, so that I decide without opening another page.
124. As an administrator, I want a report whose target is gone marked as such, so that I know only a rejection is possible.
125. As an administrator, I want Hide and Reject on a pending report, so that I can close it.
126. As an administrator, I want a moderation page with a Posts tab and a Comments tab of flagged content, so that I review what was flagged.
127. As an administrator, I want Hide and Make visible on each flagged item, so that I can settle it.
128. As an administrator, I want the logs in a table with the filters the server offers (user, outcome, action, entity, period, signed-in or not), so that I can follow what happened.
129. As an administrator, I want a statistics page of number tiles (totals, the last 7 and 30 days, online now), so that I see how big and how active WebCity is.

### Languages, dates and phone

130. As a visitor, I want the interface in Georgian on my first visit when my browser is set to Georgian, and in English otherwise, so that it starts in a language I read.
131. As a visitor, I want my language choice remembered, so that I set it once.
132. As a visitor, I want the language to change in place, without a reload, so that I do not lose what I was doing.
133. As a visitor, I want dates and times written in the chosen language, so that the page reads as one language.
134. As a user, I want my birthday to show the day I entered wherever I am, so that a time zone never moves it.
135. As a user on a phone, I want every page to fit the screen without sideways scrolling, so that WebCity is usable on a phone.

### Backend changes

136. As a user, I want the usernames `mine`, `search`, `account_deactivated` and `account_deleted` refused, in any letter case, so that every profile has a working address and nobody can pose as a placeholder.
137. As a user, I want my joined date kept from other users and guests, so that only I and the administrators know it.
138. As a user, I want my own profile data to include when my username was last changed, so that the settings page can show it.

### For the people building on this

139. As the owner, I want every `…Api` call to return a promise of a result that I `await` and branch on, so that the frontend reads like the backend (ADR 0003).
140. As the owner, I want a missing dictionary key to fail the build, so that no label is left untranslated.
141. As a developer, I want one command that starts the frontend with `/api` and `/hubs` proxied to the backend, so that the single-origin setup works in development.
142. As a developer, I want lint, unit tests and the build to run in the existing CI workflow, so that a broken frontend is caught on every push.
143. As a coding agent, I want the plumbing tickets to need no visual decision, so that they can be built before the design session ends.
144. As a coding agent, I want each page ticket to list what to click through in the running app, so that I can verify a page that has no DOM test.
145. As a coding agent, I want the conventions skill and the docs updated with each ticket, so that the next ticket starts from the truth.

## Implementation Decisions

### Across the whole frontend

- **The conventions hold.** §10 of the conventions skill's TypeScript reference and ADRs 0001 and 0003 to 0006 are the rules: standalone components, no zone.js, signals, `…Api` services that return `Promise<AppResult<T>>`, stores only for state that several pages share or the hub changes, typed reactive forms, lazy pages, relative URLs, three guards, typed dictionaries, one date formatter. This spec adds decisions; it changes none of those.
- **Page tickets wait for the design session; plumbing tickets do not.** The design session (roadmap step 1) chooses the styling toolset and the tokens. Scaffold, session, interceptor, hub client, dictionaries, stores and `…Api` services have no visual part.
- **Every user has the default profile picture.** It is the user's initials on a coloured disc, drawn by the frontend through one component, so that a chosen picture can take its place later (`DESIGN.md`, Components). Choosing a picture is not built here.
- **Light and dark themes both ship** (design session, 2026-11-16). The first visit follows the operating system's setting, the choice is remembered, and the switch sits in the menu beside the language.
- **Lists use infinite scroll** everywhere a list is paged, with the paging the backend already has (`PageNumber`, `PageSize`). A page shorter than the page size is the last.
- **Quick actions show their result at once** (owner, 2026-11-20). Like and unlike, every friendship action (add, cancel, accept, decline, remove), Hide and Make visible, the administrator's row actions, and a delete once it is confirmed: the screen changes on the click as if the server had agreed, then the request goes. If the server refuses, the screen goes back to how it was and a toast says why. A second click on the same item while its request is on its way is ignored. `PostLikeStore` is the pattern.
- **What a user writes shows at once too** (owner, 2026-11-20). A new or edited post, comment or message appears before the server has it, marked as pending, and the server's copy takes its place when it arrives (the server makes the id, the photo addresses and the times). Until then a new item shows the moment it was sent as its time, and its photos from the browser's previews.
  - **A post:** sending it empties the composer and goes to the feed, and saving an edit closes the form; an edit saved on the post's page sends the author to the feed. A toast says the post is uploading and stays until the upload ends; then a second toast says it was published or saved, and leads to the post. Meanwhile a new post is at the top of the feed and an edited one shows its new title and text.
  - **A comment** is in the list at once with "Sending…" under it, and the count rises. An edit shows the same mark.
  - **A message** is in the conversation at once with a clock icon where its time goes, and no text; the icon's accessible label says "Sending". An edit shows the same icon.
  - **A refusal** removes the pending item, or puts an edited one back, and a toast says why. What the user wrote is never lost: a new post's toast leads back to the composer, filled with what the user wrote, a comment or a message goes back into its box with its photos, and an edit's toast leads back to its form, filled with what the user wrote.
- **Destructive actions ask first.** Deleting a post, a comment or a message, removing a friend, and every destructive admin action open a confirmation dialog. Deactivating and deleting one's own account require typing the username.
- **Enums travel as text.** Every enum the API sends or accepts is the name of its member as text (`"Pending"`, `"Hidden"`, `"Post"`, `"Active"`); none is a number. Each frontend mirror is an `as const` object whose values are those names. Where the backend reads an enum from a request body it accepts the name only and refuses a number, so the frontend always sends the name.
- **Two more feature folders.** `admin/` and `reports/` join the list, after the backend's controllers. `PostLikeApi` lives in `posts/`.
- **The website plays no sound.**

### Addresses

| Address | Page | Access |
|---|---|---|
| `/` | Landing page for guests; a signed-in user is sent to `/feed` | anyone |
| `/feed` | Feed, with a Write a post button | signed in |
| `/posts/new` | The composer | signed in |
| `/posts/:postId/edit` | Where an author edits a post | signed in |
| `/sign-in`, `/register` | Sign in, register | signed out only |
| `/forgot-password` | Ask for a reset link | anyone |
| `/reset-password?token=…` | Choose a new password | anyone |
| `/reactivate-account` (`?token=…` from the email) | Ask for a link; opened from it, reactivate with one button | anyone |
| `/posts/:postId` | One post and its comments | anyone |
| `/users/:username` | Profile | anyone |
| `/search?q=…` | User search | anyone |
| `/settings` | Settings | signed in |
| `/friends` | Friends, incoming, sent | signed in |
| `/messages`, `/messages/:username` | Chat | signed in |
| `/admin/users`, `/admin/reports`, `/admin/moderation`, `/admin/logs`, `/admin/statistics` | Admin panel | administrator |
| anything else | Not found | anyone |

- **People are addressed by username,** in profiles and in chat. The backend resolves a username to a user with its public read by username; chat endpoints and hub events use the id, so the chat page resolves the username first, from the conversation list when it is loaded and from the backend otherwise.
- **Never put a fixed word beside a `:username` segment.** A username could equal it.
- **Usernames hold no dots,** only letters, digits, `_` and `-`. A last segment with a file extension (`bob.png`) is taken for a file by the dev server and by typical asset rules, which would break a reload of that profile.
- **`/admin` redirects to `/admin/users`.**
- **A guard that turns someone away to sign-in passes the wanted address along,** and sign-in returns there. Only addresses inside the app are accepted as a return target.

### Scaffold and plumbing

- **The CLI project** lives in `frontend/`, with the dev proxy forwarding `/api` and `/hubs` (web sockets included) to the backend.
- **Scaffold acceptance checks,** each proven in the running app: signing in and reloading keeps the session (the refresh cookie survives the proxy); the hub connects through the proxy; a reload of `/users/john_doe` still serves the app.
- **The dev origin must be in the backend's `Cors:AllowedOrigins`,** or the backend refuses the reset page's address as a return address.
- **CI** runs lint, the unit tests and the build in the existing workflow.
- **Stores.** Session; language; presence (which friends are online, and last active times); unread (the number of conversations with unread messages); conversations (the list and the open conversation); incoming friend requests (the count); toasts.
- **The unread count is read, not computed.** The unread store asks the backend again after anything that can change it (a message arriving for a conversation that is not open, a conversation being marked read), because the count is of conversations and the client does not hold every conversation.
- **Presence starts from what lists carry.** Friend rows in the chat lists carry "last active", where empty means online. `UserOnline` and `UserOffline` update the store. An online event for a friend whose name the store does not hold looks the user up by id.
- **The hub client maps each server event to one store method** and holds no logic of its own.

### Shell

- **Desktop:** a top bar with the logo, the search box, Feed, Friends (incoming count), Messages (unread count), and a menu under the user's initials: my profile, settings, admin (administrators only), language, sign out.
- **Phone:** a top bar with the logo and that menu; a bottom bar with Feed, Search, Friends, Messages and Profile, with the same two counts.
- **Guest:** the logo, the search box, the language switch, Sign in and Register.
- **Account pages** (sign-in, register, forgotten password, reset, reactivation): the logo only, with no bottom bar, for a guest and a signed-in user alike. They are a short stop, so they leave out search, the menus and the language switch; the language starts from the browser's (owner, 2026-11-19).
- **The incoming-request count** is loaded at sign-in and again on each visit to `/friends`. It is not live in this spec.

### Auth pages

- **Register, then sign in.** After a successful registration the frontend calls sign-in with the same credentials. The register endpoint is unchanged and hands out no session, which keeps email confirmation possible later. If the second call fails, the user lands on sign-in with the username filled in.
- **Password reset.** The request sends the app's own `/reset-password` address as the return address, so the email carries a link. The page reads `token` from the address.
- **Reactivation.** The request sends the app's own `/reactivate-account` address as the return address, so the email carries a link. Opened from it, the page reads `token` from the address and reactivates only when the button is pressed, because mail scanners open every link in an email. Success leads to sign-in (owner, 2026-11-20, ticket 33).
- **Sign-in** accepts a username or an email in one field.

### Feed, posts and comments

- **Composer:** a card on its own page, `/posts/new`, opened from a Write a post button beside the feed's heading (owner, 2026-11-21: the feed stays a list, and other kinds of post can get their own fields there later). Sending goes to the feed, where the post shows as pending, and the feed takes the composer's place in the history. A title is required, and so is either text or at least one photo, as the backend requires. Up to 10 photos, each JPEG, PNG or WebP and at most 5 MB, checked in the browser against `LIMITS` before upload. The post goes as `multipart/form-data`. It shows at the top of the list at once, with an uploading toast and then a published one ("What a user writes shows at once too", under "Across the whole frontend").
- **Editing** happens on the post, in the feed card and on the post's page: title and text. Saving shows the edit at once, and from the post's page returns the author to the feed, with the same two toasts as a new post. Photos are removed one at a time. Photos cannot be added to an existing post.
- **Photos on the edit page are shown and left alone** (owner, 2026-11-22). Photos cannot be added to an existing post, so the edit page offers no control on them at all, not even a remove one. `PostApi` has its method for `DELETE /api/posts/{postId}/images/{imageId}` (backend ticket 04 is done), unused until a ticket brings photo editing back; the control must then ask before it removes, as the removal is immediate and final.
- **Editing is a page, not a form in the feed** (owner, 2026-11-22): `/posts/:postId/edit`, opened from the card's menu. Save goes to the post's own page, where the post shows at once with its new text, marked as uploading. An edit is never shown in the feed: the ranked feed does not list the caller's own posts, and a new post's showing there is test scaffolding that ticket 14 (the profile) removes. A refused edit's toast leads back to the edit page with what the author wrote, and that is dropped as soon as the page is left.
- **Text boxes of posts stop at their limit** (owner, 2026-11-22): the composer's and the edit page's title and text boxes take no character past the limit (`maxlength`) and show "used/limit" beside their label (`FormField`, `CharacterCounter`), as the comment box does.
- **A deleted post fades out** over 200 ms, then leaves the list, and a toast says it is deleted.
- **Feed card:** author, time, title, text, photo grid, like button with the count, comment count linking to the post's page, the "…" menu. Comments are not shown or written in the feed.
- **Likes** change the card at once, as every quick action does ("Across the whole frontend"). There is no list of who liked. The server hears of a click a second after the last click on that post (owner, 2026-11-22): a like taken back inside that second, or an unlike taken back, is never sent, and clicking never waits for an answer.
- **Photo grid and viewer:** up to four thumbnails with a "+N" on the last when there are more; a click opens a full-screen viewer with previous and next.
- **Post page:** the post, then its comments by pages, then a comment form for a signed-in user. The form and a "Back" link stay pinned while the reader scrolls (owner, 2026-11-22). The card's comments button goes back to the feed too. The comment box takes no character past the limit (`maxlength`), so a comment cannot be too long to send. In a list a long post's text stops after five lines with a "See more" button that opens the rest in place; the post's own page shows it all. A signed-in user's own comments come first, newest first, then everyone's oldest first; the backend orders them (`docs/backend/controllers.md`), because the list is paged. A new comment appears on top.

### Actions on content, reports and hidden content

- **One "…" menu component** serves posts, comments and profiles. Its entries depend on the viewer: Report for a signed-in user on someone else's content; Edit and Delete for the author; Delete for a post's author on comments under it; Delete, Hide and Make visible for an administrator on any post or comment.
- **Report** opens a dialog with a required reason, limited as the backend limits it.
- **Hidden** content shows a badge. Only its author and administrators ever receive it, so the badge needs no role check beyond the flag on the content.

### Profile

- **Header:** username, bio, birthday as day and month (formatted in UTC, without the year). No joined date.
- **Friendship button** follows the relationship the backend reports: add; cancel my request; accept or decline theirs; remove. After a decline, add is offered again.
- **Message button** for a friend opens `/messages/:username`.
- **Tabs:** Posts and Friends. A guest sees no Friends tab, because the friends list requires sign-in.
- **Unavailable accounts:** an author with no id is shown as text without a link. A profile the backend does not find shows the not-found page.

### Friends and search

- **`/friends`** has three tabs backed by the three lists. Removing a friend warns that the messages between the two are deleted.
- **`/search`** keeps the words in the address, searches 500 ms after the last keystroke, and ignores every response but the latest (ADR 0003). The top-bar box navigates there. Search is open to a guest.

### Chat

- **Two routes, one layout.** On a desktop the list and the conversation sit side by side; on a phone they are two screens.
- **List row:** name, online dot or last active time, last message (or "Photo"), unread count.
- **Starting a chat:** a "New message" button lists friends without a conversation; a friend's profile has a Message button.
- **Sending:** text up to the backend's limit, up to 5 photos, or both, as `multipart/form-data`. The sender sees the message at once with the clock icon, until the HTTP response's copy takes its place; the receiver's copy comes from `ReceiveMessage`.
- **Opening a conversation marks it read.** So does a message arriving while the conversation is open.
- **Seen:** `MessageSeen` marks the user's sent messages as seen; "seen" is shown under the last of them.
- **Edit** is offered for 20 minutes after sending (mirrored in `LIMITS`). The editor sees the edit at once with the clock icon; `MessageEdited` updates the receiver's copy. An edited message is marked.
- **Delete** removes the message for the sender at once. The backend sends no push for a deletion, so the friend's open conversation keeps it until it is loaded again.
- **Typing:** the client calls `SendTyping` at most once every 2 seconds while the user types, and hides the friend's "typing…" 3 seconds after the last `UserTyping`.

### Toasts

- **Four live toasts:** a new message (not when that conversation is open), a comment on my post, a like on my post, a friend coming online.
- **Each is a link:** to the chat, to the post, to the post, to the chat.
- **Rules:** 5 seconds on screen, at most three at once, and at most one online toast per friend in 5 minutes.
- **Upload toasts** for a post (under "Across the whole frontend"): the uploading toast stays until the upload ends, outside the 5-second rule, and the published or saved toast that follows it keeps the rule.
- **Failures of actions outside a form** use the same toast component (conventions, Errors).
- **There is no notification history,** because the backend stores none.

### Settings

- **One page, in sections.** Profile: username (with the 20-day limit and the date it was last changed), bio, date of birth, and the account's creation date, read-only. Language. Password: a button that requests a reset email for the user's own address. Danger zone: deactivate and delete, each confirmed by typing the username, each ending in sign-out.
- **The email digest toggle is not built here.** It arrives with the n8n spec, which adds the setting to the backend.

### Admin panel

- **Layout:** a side navigation, a page per area. On a phone the navigation collapses.
- **Users:** a table from the admin account list, filtered by state and username. Create and edit in dialogs. Row actions: deactivate, restore, delete, grant and remove the administrator role.
- **Reports:** pending by default; filters for status and target type; the snapshot of the target inline; a mark when the target is missing. Hide and Reject need documented-backend-features ticket 12.
- **Moderation:** one page, two tabs, one per queue route. Each item offers Hide and Make visible.
- **Logs:** a table with the backend's filters.
- **Statistics:** number tiles, no charts and no chart library. Needs ticket 13.

### Languages and dates

- **English and Georgian** ship. The first visit picks Georgian when the browser's preferred language is Georgian, English otherwise; the choice is then remembered.
- **Server text stays English** (ADR 0006).

### Backend changes

- **Reserved usernames.** `mine`, `search`, `account_deactivated` and `account_deleted` are refused wherever a username is set (registration, an administrator creating an account, a user or an administrator editing a profile), compared without regard to letter case. The first two collide with endpoints beside the read by username; the last two are the placeholder names shown for unavailable accounts. The list lives in one place.
- **The joined date leaves the public user shape.** The shape returned by the public reads of a user no longer carries it. The user's own full shape and the admin account shape keep it.
- **The user's own full shape gains the time the username was last changed.** It is empty when the username was never changed.
- **Docs, Postman and tests follow** each of the three.

## Testing Decisions

- **What makes a good test here.** A test calls a unit through the surface its callers use and asserts on what they would see: the request an `…Api` method makes and the result it returns, the value of a store's read-only signals after one of its methods is called, where a guard sends someone. It does not reach into private fields or check which internal method ran.
- **Main seam: Vitest unit tests on code that has logic and no template.** This is the seam the conventions already name.
  - `…Api` services, against Angular's HTTP testing backend: the method, the address, the body, and the mapping of each response to `AppResult`.
  - `toAppResult`: the failure envelope, a validation response with field errors, a bodiless `401`, `403` and `404`, and a network failure.
  - The token decoder: the four claim names; `role` missing, a string and an array; base64url and UTF-8.
  - The refresh flow, through the interceptor: a `401` leads to one refresh and one retry; simultaneous `401`s share one refresh; a refused refresh (a `401`) clears the session, and one that gets no answer keeps it; login and refresh themselves are not retried.
  - The three guards, including the remembered return address and the refusal of an address outside the app.
  - Stores, by calling the methods the hub client calls: a message arriving for an open and for a closed conversation, seen, edited, online and offline, the unread count being read again.
  - Pure helpers: the date formatter (including a birthday west of UTC), the photo checks, the toast rules, the typing timings.
- **Time is faked.** The 2-second, 3-second, 5-second, 5-minute and 20-minute rules are tested with Vitest's fake timers, never by waiting.
- **Pages are verified by running the app,** against the real backend through the dev proxy. Until the release there are no component DOM tests and no end-to-end tests (conventions, temporary rule). Each page ticket therefore lists the paths to click through, on a desktop width and a phone width, as a signed-in user and where it applies as a guest and as an administrator.
- **The hub client is not unit-tested.** It only maps events to store methods; the scaffold check and the chat pages prove it.
- **Dictionaries are checked by the compiler,** not by tests.
- **Backend changes use the existing HTTP integration seam:** the test host, real requests, the real test database. Each reserved name is refused in more than one letter case at every place a username is set; the public user reads no longer carry the joined date while the own and admin shapes do; the own shape carries the last-changed time after a username change and nothing before one.
- **Prior art.** On the backend, the existing controller test classes (`Method_Condition_ExpectedResult`, grouped by endpoint). On the frontend there is none: the first tests arrive with the scaffold and set the pattern, named as §11 of the TypeScript reference shows.

## Out of Scope

- **The design session:** the styling toolset, the tokens, the visual identity and their ADR. This spec needs its output and does not produce it.
- **n8n and what it adds to the interface:** the email digest toggle, `ReceiveNotification` and its toast, birthday notifications.
- **Last in line, built only if time is left,** in this order from the end: the account history in settings (every username change, deactivation and reactivation, which needs a new table); live friend requests (a new hub event, the badge and the incoming list updating live, a fifth toast); the dialog that lists who liked a post.
- **Adding photos to an existing post or message.**
- **A notification history, a bell, sounds, and browser notifications outside the page.**
- **Updating a post's like and comment counts live** on pages that already show it. The author gets a toast; the numbers follow on the next load.
- **Live removal of a deleted message** from the friend's screen.
- **Choosing a profile picture.** Every user has the default one.
- **Hiding the birth year in the API.** The page shows day and month; the public user shape still carries the full date.
- **A change-password form.** The reset email is the way.
- **Russian and Spanish, and translated server text** (ADR 0006).
- **Component DOM tests and end-to-end tests,** until after the release.
- **Hosting.** A host behind nginx is set up only if the project is finished with time to spare; readiness ticket 07 belongs to that.
- **A mobile application.**

## Further Notes

- **Order.** Scaffold and plumbing first, in parallel with the design session. Then shell and auth, feed and posts, profile with friends, search and settings, chat with toasts, and the admin panel, which is the order of the roadmap's steps 4 to 8. The three backend changes can be done at any time before the pages that show them (register, profile, settings).
- **Waiting on backend tickets:** photo removal on edit (documented-backend-features 04), Hide and Reject on a report (12), the statistics page (13). The frontend is written against the documented endpoint in each case. If the backend ticket is still open when its page is built, the control or page is shown disabled with "Coming soon" and is switched on when the ticket lands, so the rest of the page is not held back.
- **A difference from the documentation:** none in what is promised. Additions the documentation does not list: guest search, the report dialog on a profile, and administrators moderating from the normal pages.
- **The conventions skill needs two edits** as tickets land: the Styling section (from the design session) and the feature folder list (`admin/`, `reports/`). Its rule on enums was corrected on 2026-11-15 to say they travel as text.
- **Docs to update as behavior lands:** `README.md` (monorepo ticket 04 covers the full-stack rewrite), `CLAUDE.md` (the frontend commands and the dev proxy), `docs/backend/controllers.md` and `auth.md` for the three backend changes.
- **The owner reads C# fluently and Angular less so.** Tickets should name the Angular idea a page relies on when it is not obvious from the conventions.
