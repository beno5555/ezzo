# 17: The settings page

**What to build:** One page, `/settings`, where a signed-in user manages their profile and their account, in sections.

- **Profile.** Username, bio and date of birth in a form. Under the username: the rule that it can change once in 20 days, the date it was last changed (when it ever was), and the date it can change again. The account's creation date is shown, read-only.
- **Language.** The same switch the shell has.
- **Password.** A button that requests a reset email for the user's own address, since the backend has no change-password endpoint. A message says the email is on its way.
- **Danger zone.** Deactivate and Delete. Each opens the confirmation that requires typing the username. Each ends by signing the user out and showing what happens next: a deactivated account can be reactivated by email; a deleted account is removed after the retention period.

The email digest switch is not built here. It arrives with the n8n spec.

Decisions are under "Settings" in `.scratch/frontend/spec.md`. The backend's rules are in `docs/backend/auth.md` and under the account controllers in `docs/backend/controllers.md`.

**Blocked by:** 01 (Reserved usernames are refused, and the joined date is private), 08 (The auth pages), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: forms and confirmations on patterns the auth pages and the shared blocks already set.

- [x] A user changes the bio and the date of birth, and the profile page shows the change
- [x] A user changes the username; the session's username follows; the last-changed date appears
- [x] A second username change inside 20 days shows the server's refusal beside the field
- [x] The creation date and the last-changed date are shown through the shared formatter; the date of birth is handled in UTC
- [x] The password button sends the reset email and says so
- [x] Deactivate and Delete work only after the username is typed, and each ends signed out with its message
- [x] The form's limits come from `LIMITS`
- [x] The `…Api` methods added here are unit-tested against the HTTP testing backend
- [x] Checked in the running app on a desktop width and on a phone width, in both languages

## Comments

**2026-11-24, round 1: implementation (Sonnet 5.5).**

**Built.** `/settings` (guarded, lazy) with four sections, each its own component under `features/users/`: `ProfileSettings` (username, date of birth, bio; under the username the 20-day rule, the last-changed date and the date it can change again; the creation date, read-only), the shell's `LanguageSwitch` in a section, `PasswordSettings` (requests a reset email to the user's own address, redirect to this app's reset page; the page says the email is on its way), `DangerZone` (Deactivate and Delete, each through the typed-username confirmation, then sign out and back to `/` with a notice on the sign-in card). New calls: `UserApi.getMine` / `editMine`, `AccountActivationApi.deactivateOwnAccount`, `AccountManagementApi.deleteOwnAccount`; `DateFormatter.date()` (date with year, no time); `LIMITS.users.usernameChangeCooldownDays`; two new sign-in notices (`accountDeactivated`, `accountDeleted`). After a username change the page calls `sessionStore.refresh()`, since the access token carries the username and a refresh issues one with the stored name. The refusal of a second change in 20 days is mapped to the username field by `userRefusalField`.

Departures and extras: a "saved" toast after saving; a loading and a retry state for the profile read; the page also says "You can change it now." once the cooldown is over. The date of birth is the plain date input, as on register, until ticket 42 (day, month, year). Review-driven refactor: `bioOrNull`, `toProfileFormValue` and `FieldRules.dateOfBirth` / `FieldRules.bio` now serve the register page, both admin dialogs and this page (the fourth copy of each was the trigger); `dayInMilliseconds` and `hourInMilliseconds` moved to `core/time/minute-clock.ts` and are shared with `DateFormatter`.

**Checks.** Lint, 875 unit tests (97 files), the build: pass. The build keeps its old warning (initial bundle over the 600 kB budget by about 151 kB). No backend change, so the backend suite was not run. No component DOM tests, by the temporary rule until the 2026-11-25 release: the new components are tested at class level.

**In the running app** (Playwright and the screenshot command, throwaway accounts, backend on https): rename plus bio save with toast; the session's username follows; the second rename inside the cooldown is refused beside the field (the Save button stays disabled until the value changes); the profile page shows the new bio; the reset-email message; Deactivate and Delete (the confirm button is disabled until the exact username is typed; both end signed out on `/` with their notice, in English and Georgian). All 12 screenshots (360, 768, 1280; light and dark; English and Georgian) were looked at; no sideways scroll at 360 and every touch target is at least 44 px. Not tried: reactivating a deactivated account, and the email itself arriving (the backend mails through its own settings).

**Review findings.** Spec review: none. Standards review: three hard findings, all fixed (the third copies of the bio-to-null step, of the date-of-birth and bio validators, and of the profile-to-form mapping, per "extract on third use"); the shared day constant also fixed; the roadmap note was removed from a component comment. None was severe. Left alone: the refusal branch of `save()` is the same shape as in three other forms, which is a candidate for a shared helper but a bigger change to older pages; the private `LeavingTexts` type in `danger-zone.ts` (the code base has local aliases already); Deactivate carries the trash icon of `danger` buttons although nothing is deleted (looked at on screen: acceptable, and `DESIGN.md` says a destructive button carries it).

**Open decisions.**
- *Local date against UTC date.* The page shows the creation, last-changed and can-change-again dates in the visitor's time zone (the shared formatter); the server's cooldown refusal names a UTC date, so near midnight (UTC+4 in the owner's zone) the two can differ by a day. Chosen for now: the formatter. Recommendation: keep it, since the refusal text is the backend's.
- *Dev configuration.* `Cors:AllowedOrigins` in the owner's `appsettings.Development.json` holds only the 5500 origins, so the password button answers "Url origin not allowed" when the app runs on `http://localhost:4200`. `CLAUDE.md` says development must list it. I did not touch the settings file (I ran the backend with an environment override). Recommendation: add `http://localhost:4200` to that list.

**Waits for other tickets.** 42 (date of birth as day, month, year). The email digest switch waits for the n8n spec, as the ticket says.

**Screenshots:** `.scratch/frontend/shots/17/`.

**Branch.** `worktree-settings-page`: visual work, so it waits for the owner's review before the merge; a lane writes no review-queue line. I left the roadmap's lane table alone for the same reason (the row for round 14 is not marked merged until the merge). Trial merge against `origin/master` (commit 6712717): clean, no conflicts. Pushed.
