# 07: The shell gives navigation on a desktop, on a phone and to a guest

**What to build:** Every page sits inside one shell, and the shell changes with the width of the screen and with who is looking.

- **Desktop, signed in:** a top bar with the logo, the search box, Feed, Friends and Messages, and a menu under the user's initials: my profile, settings, admin (administrators only), language, sign out.
- **Phone, signed in:** a top bar with the logo and that menu, and a bottom bar with Feed, Search, Friends, Messages and Profile.
- **Guest:** the logo, the search box, the language switch, Sign in and Register.
- **Two counts.** Messages shows the unread store's number. Friends shows how many friend requests are waiting; a small store loads that number at sign-in and can be told to load it again. The backend gives no total, and the list's `TotalCount` is only the length of the page it returns, so the store reads one page of the largest size and shows the number, or "99+" when that page is full.
- **The whole route table,** with every page lazy, titled by dictionary key, and guarded as the spec's address table says. An address whose page is not built yet shows a placeholder with its title, so the shell can be walked end to end. `/admin` redirects to `/admin/users`.
- **The not-found page,** styled.
- **The search box** sends the visitor to `/search?q=…`.

The bare page from the plumbing tickets is removed here.

Decisions are under "Shell" and "Addresses" in `.scratch/frontend/spec.md`.

**Blocked by:** 04 (A user signs in and stays signed in), 05 (The live connection feeds presence and the unread count), 06 (The pages share a toast, a dialog, a confirmation and a menu), and the design session (roadmap step 1)

**Status:** ready-for-agent

**Difficulty:** tricky: the first styled, responsive layout; every page sits in it, and it joins the session, the guards, the stores and the routes for the first time.

- [ ] Every address in the spec's table exists, lazy, with a title from the dictionary, and with the access the table gives it
- [ ] A guest who opens a signed-in address lands on sign-in, and after signing in arrives at that address
- [ ] The Admin entry shows only for an administrator
- [ ] The unread count changes without a reload when a message arrives
- [ ] The waiting-requests count is loaded at sign-in; its store is unit-tested, including the full-page case
- [ ] The language switch changes every text of the shell in place
- [ ] Sign out returns the visitor to the guest shell
- [ ] No fixed word sits beside a `:username` segment in the route table
- [ ] Checked in the running app on a desktop width and on a phone width, as a guest, as a user and as an administrator: every link leads where it says, nothing scrolls sideways, and the bottom bar never covers content
