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

**Status:** done

**Difficulty:** tricky: the first forms, which every later form copies, on flows where a mistake locks a person out.

- [x] A visitor registers and arrives at the feed's address signed in
- [x] A username the server refuses (taken, or reserved) shows the server's message beside the username field
- [x] When the sign-in after registration fails, the visitor lands on sign-in with the username filled in
- [x] A user signs in with a username and with an email
- [x] A wrong password shows the server's message above the submit button
- [x] The reset email's link opens the reset page, and a new password then works at sign-in
- [x] A reset link that is no longer valid shows the server's message and a way to ask for a new one
- [x] A deactivated user asks for a code, enters it, and can sign in again
- [x] Each form's limits come from `LIMITS`, which names the backend file it mirrors
- [x] The `…Api` methods added here are unit-tested against the HTTP testing backend
- [x] Checked in the running app on a desktop width and on a phone width, in both languages

## Comments

**2026-11-20, implementing session (Opus 5.5).** Done on branch `worktree-frontend-08-auth-pages`; waits for the owner's visual review.

- **How the boxes were checked.** In the running app (Playwright), at 360, 768 and 1280 px, in both themes and both languages, against the dev backend with a throwaway user `qa08_reg` (left in the dev database, active). The database holds only the hashes of reset and activation tokens, so the reset and reactivation checks wrote the hash of a known token into `Users.ResetTokenHash` and used that token; the owner checks one real email at review. The register path whose follow-up sign-in fails was checked in the code and by the spec review, not provoked in the app.
- **Owner's change during the ticket (2026-11-19):** the five account pages keep only the logo in the top bar and show no bottom bar, for guests and signed-in users alike (spec.md, Shell). This replaces spec story 31's language switch for guests. `isOnAccountPage` reads the browser's address until the first navigation ends, so a page opened from the reset email does not flash the full bar.
- **Register refusals** are placed on their fields by mirroring two backend messages (`register-refusal-fields.ts`), approved by the owner for now; a reserved username gets the same "taken" message (`AuthService`).
- **Spec review, open points for the owner:**
  - Links: sign-in links to the other three; register, forgotten password and reactivation link back to sign-in only, and reset links to forgotten password and sign-in. Every form is two clicks away at most. Say if "from any of them" means direct links everywhere.
  - Small additions beyond the ticket: notices on sign-in after registering and after a reset (the ticket asks only for reactivation's), the email filled in after reactivation, a "Use another email" button on the code step, and the forgotten-password form replaced by a "sent to" message.
  - The reactivation code's failure does not go through `applyFieldErrors`: the backend's `ActivateAccountDto` has no validation, so no field errors come back, and its field is `ActivationToken`, not `code`.
  - `LIMITS.users.bioMinLength` mirrors the backend but nothing reads it: the page sends an empty bio as `null`.
  - Judgement calls left as they are: the email and new-password validator lists repeat across pages; `<p authLink class="flex flex-wrap items-center gap-x-1">` repeats seven times (a candidate for a shared look); the top bar's empty `@if (isOnAccountPage())` branch; the name `shownFor` in the bottom bar.
  - Fixed after the review: `SignInNotice` moved to its own file, the custom validators' error keys became one constant (`AppErrorKey`), and the reset page tests its token once.
- **Notes:** the date-of-birth field's `mm/dd/yyyy` follows the browser's locale, not the app's language. The forgotten-password request needs `http://localhost:4200` in the backend's `Cors:AllowedOrigins` (missing from the worktree's settings; the check ran with an environment variable). The initial bundle is 528.57 kB against a 500 kB budget (ticket 32).
