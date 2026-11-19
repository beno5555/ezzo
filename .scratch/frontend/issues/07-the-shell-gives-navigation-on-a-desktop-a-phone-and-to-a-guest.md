# 07: The shell gives navigation on a desktop, on a phone and to a guest

**What to build:** Every page sits inside one shell, and the shell changes with the width of the screen and with who is looking.

- **Desktop, signed in:** a top bar with the logo, the search box, Feed, Friends and Messages, and a menu under the user's profile picture: my profile, settings, admin (administrators only), language, theme, sign out.
- **Phone, signed in:** a top bar with the logo and that menu, and a bottom bar with Feed, Search, Friends, Messages and Profile.
- **Guest:** the logo, the search box, the language switch, the theme switch, Sign in and Register.
- **Two counts.** Messages shows the unread store's number. Friends shows how many friend requests are waiting; a small store loads that number at sign-in and can be told to load it again. The backend gives no total, and the list's `TotalCount` is only the length of the page it returns, so the store reads one page of the largest size and shows the number, or "99+" when that page is full.
- **The whole route table,** with every page lazy, titled by dictionary key, and guarded as the spec's address table says. An address whose page is not built yet shows a placeholder with its title, so the shell can be walked end to end. `/admin` redirects to `/admin/users`.
- **The not-found page,** styled.
- **The search box** sends the visitor to `/search?q=…`.

The bare page from the plumbing tickets is removed here.

Decisions are under "Shell" and "Addresses" in `.scratch/frontend/spec.md`.

**Blocked by:** 04 (A user signs in and stays signed in), 05 (The live connection feeds presence and the unread count), 06 (The pages share a toast, a dialog, a confirmation and a menu), and the frontend setup: 27 (The app takes its look from design tokens), 28 (A user switches between light and dark), 29 (An agent and the owner see every page in screenshots)

**Status:** done

**Difficulty:** tricky: the first styled, responsive layout; every page sits in it, and it joins the session, the guards, the stores and the routes for the first time.

- [x] Every address in the spec's table exists, lazy, with a title from the dictionary, and with the access the table gives it
- [x] A guest who opens a signed-in address lands on sign-in, and after signing in arrives at that address
- [x] The Admin entry shows only for an administrator
- [x] The unread count changes without a reload when a message arrives
- [x] The waiting-requests count is loaded at sign-in; its store is unit-tested, including the full-page case
- [x] The language switch changes every text of the shell in place
- [x] The theme switch from ticket 28 sits in the menu and in the guest shell, and changes the whole shell in place
- [x] Sign out returns the visitor to the guest shell
- [x] No fixed word sits beside a `:username` segment in the route table
- [x] Checked in the running app as a guest, as a user and as an administrator, with screenshots at 360, 768 and 1280 px in both themes for the owner's approval: every link leads where it says, nothing scrolls sideways, and the bottom bar never covers content

## Comments

- **Waiting for your approval.** It is a visual ticket, so the branch `frontend-07-shell` is not merged. Look at the screenshots in `frontend/screenshots/` (guest: `home`, `sign-in`, `nowhere`; signed in: `feed`, `friends`, `messages`, `search_q=shell`, `users_shell_dev_1119`), 12 per address: 360, 768 and 1280 px, both themes, both languages.
- **How it was checked.** A Playwright walk of the running app as a guest, a user and an administrator:
  - A guest at `/friends` lands on `/sign-in?returnUrl=%2Ffriends` and arrives at `/friends` after signing in.
  - The waiting badge showed 1 at sign-in. The unread badge went from nothing to 1 without a reload when the other account sent a message.
  - The user's menu has no Admin entry. The administrator's has it, and it leads to `/admin/users` and closes the menu. The administrator was photographed at 1280 px in the light theme only, because the one difference is that menu entry.
  - Escape closes the menu and gives the focus back to its button.
  - Nothing scrolls sideways at 360 px, with or without the menu open.
  - The language switch changes the bars and the tab title in place. The theme switch changes the shell in place, from the guest's popover and from the menu.
  - Sign out leads to `/` with the guest's top bar and no bottom bar.
  - The search box leads to `/search?q=…`, and Back restores the previous search.
- **Two development accounts** in your development database: `shell_dev_1119` (its password is only in `frontend/.env`, which the screenshot command reads) and `shell_peer_1119`. They are friends and have one message. `shell_dev_1119` held the Administrator role only for the check, and it was removed afterwards.
- **Deviations for you to decide:**
  - **The guest's language and theme switches are in a small preferences menu** (a gear button), not in the bar. Both switches side by side do not fit at 360 px beside the logo, Sign in and Register.
  - **The search box's label is visually hidden.** `DESIGN.md` asks for a visible label above every input. A visible label does not fit in a top bar, so a screen reader reads the hidden label and the placeholder shows the same words.
  - **The search box is a plain form, not a typed reactive form.** The conventions ask for `NonNullableFormBuilder`. The shell is part of the first download, and the forms library alone added 41 kB to it, so one field with a length limit uses the browser's form.
  - **From 768 to 1024 px, Feed, Friends and Messages show only their icons** (the words are still read by a screen reader). In Georgian, the words and the search box do not fit side by side at 768 px.
  - **The bottom bar uses shorter Georgian words** (`shell.bottomBar`): ფიდი, ძებნა, მეგობრები, ჩატი, პროფილი. The page titles did not fit five to a row at 360 px. Please check the words.
  - **The bottom bar's words are `text-xs`** (12 px). `DESIGN.md` keeps body text at `text-sm` or larger. These are labels under icons, as on most phone bars.
  - **The first download is 508.5 kB,** 8.5 kB over the 500 kB budget, so `npm run build` warns. The largest parts are Angular's core (162 kB), the router (96), the CDK (68) and SignalR (66). Loading SignalR only after sign-in would bring it under. That changes ticket 05's code, so it was not done here.
- **The count of waiting requests is loaded at sign-in only.** The spec also loads it again on each visit to `/friends`. `IncomingRequestsStore.refresh()` is ready, and ticket 15 calls it when it builds the friends page.
- **Changed beyond the ticket:**
  - The search page reads its query from the address (`?q=`), so the search box, its own form and the Back button lead to the same search. The same query a second time searches again, so a failed search can be retried.
  - The not-found page has an icon.
  - The screenshot command's sign-in clicks the button in the password's form, because the shell's search box is a form on every page too.
  - Presence is no longer loaded at startup. The bare page that showed it is gone, and ticket 18 loads presence where it is shown.
- **Changed after your review (2026-11-19):** the search page showed two search boxes, the top bar's and its own: for a signed-in user from 768 px up, and for a guest at every width. The top bar now leaves its box out on `/search` only (`isOnSearchPage` in `TopBar`), so the page's labelled box is the one left. Every other page is unchanged. Checked with the screenshot command on `/search?q=shell` and `/feed`, as a guest and signed in. Your note on the avatar went into ticket 31, under Last in line.
- **Review points left alone:**
  - The preferences popover is `w-72 max-w-full`. That is a fixed width with a cap, because a CDK overlay pane takes its size from its content.
  - The unread badge text is built in the top bar and the bottom bar. The waiting badge text is built in its store. The waiting store has to build it, because only the store knows whether the page was full ("99+").
  - `PageTitleStrategy` and `PagePlaceholder` both read a page title from the dictionary.
  - The focus-ring classes are written out in four shell elements.
  - Dictionary entries: `shell.feedLink` and the other link words are the same as the page titles. They are kept apart so a link word can change on its own.
