# 17: The settings page

**What to build:** One page, `/settings`, where a signed-in user manages their profile and their account, in sections.

- **Profile.** Username, bio and date of birth in a form. Under the username: the rule that it can change once in 20 days, the date it was last changed (when it ever was), and the date it can change again. The account's creation date is shown, read-only.
- **Language.** The same switch the shell has.
- **Password.** A button that requests a reset email for the user's own address, since the backend has no change-password endpoint. A message says the email is on its way.
- **Danger zone.** Deactivate and Delete. Each opens the confirmation that requires typing the username. Each ends by signing the user out and showing what happens next: a deactivated account can be reactivated by email; a deleted account is removed after the retention period.

The email digest switch is not built here. It arrives with the n8n spec.

Decisions are under "Settings" in `.scratch/frontend/spec.md`. The backend's rules are in `docs/backend/auth.md` and under the account controllers in `docs/backend/controllers.md`.

**Blocked by:** 01 (Reserved usernames are refused, and the joined date is private), 08 (The auth pages)

**Status:** ready-for-agent

**Difficulty:** routine: forms and confirmations on patterns the auth pages and the shared blocks already set.

- [ ] A user changes the bio and the date of birth, and the profile page shows the change
- [ ] A user changes the username; the session's username follows; the last-changed date appears
- [ ] A second username change inside 20 days shows the server's refusal beside the field
- [ ] The creation date and the last-changed date are shown through the shared formatter; the date of birth is handled in UTC
- [ ] The password button sends the reset email and says so
- [ ] Deactivate and Delete work only after the username is typed, and each ends signed out with its message
- [ ] The form's limits come from `LIMITS`
- [ ] The `…Api` methods added here are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, in both languages
