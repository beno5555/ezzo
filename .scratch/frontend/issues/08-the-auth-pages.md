# 08: The auth pages

**What to build:** A visitor registers, signs in, resets a forgotten password and reactivates a deactivated account, all in the browser.

- **Register:** username, email, password, date of birth and an optional bio. After a successful registration the frontend calls sign-in with the same credentials, so the new user is signed in at once. The register endpoint is unchanged. If that second call fails, the user lands on sign-in with the username filled in.
- **Sign in:** the real page, replacing the unstyled form from ticket 04. One field takes a username or an email. It returns the user to the address a guard remembered.
- **Forgotten password:** the visitor gives an email, and the request carries the app's own `/reset-password` address as the return address, so the email holds a link.
- **Reset password:** the page reads `token` from the address and asks for the new password.
- **Reactivate account:** one page, two steps. The email first, then the code from the email. Success leads to sign-in with a message.
- **Links** between the four, so a visitor finds the right form from any of them.

These are the first forms. They set the pattern for every later one: typed reactive forms, validators that take their limits from `LIMITS`, an error shown once a field was touched, the submit button disabled while the form is invalid, and the server's field errors placed on the matching controls after a failed submit.

Decisions are under "Auth pages" in `.scratch/frontend/spec.md`, and in "Forms" and "Errors" in the conventions skill's TypeScript reference. The backend's side is in `docs/backend/auth.md`.

**Blocked by:** 04 (A user signs in and stays signed in), 07 (The shell gives navigation on a desktop, on a phone and to a guest), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** tricky: the first forms, which every later form copies, on flows where a mistake locks a person out.

- [ ] A visitor registers and arrives at the feed's address signed in
- [ ] A username the server refuses (taken, or reserved) shows the server's message beside the username field
- [ ] When the sign-in after registration fails, the visitor lands on sign-in with the username filled in
- [ ] A user signs in with a username and with an email
- [ ] A wrong password shows the server's message above the submit button
- [ ] The reset email's link opens the reset page, and a new password then works at sign-in
- [ ] A reset link that is no longer valid shows the server's message and a way to ask for a new one
- [ ] A deactivated user asks for a code, enters it, and can sign in again
- [ ] Each form's limits come from `LIMITS`, which names the backend file it mirrors
- [ ] The `…Api` methods added here are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, in both languages
