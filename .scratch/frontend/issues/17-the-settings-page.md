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

**2026-11-24, round 2: revision (Sonnet 5.5).**

**Owner's decisions.**
- *Bug found while reviewing, outside this ticket's scope but fixed here (owner's request).* From a profile, a post's "Back" link and its comments button led to the feed, not back to the profile (the browser's own back arrow was right). Both go back to where the reader came from, with the feed only when the post was opened directly.
- The settings page gets a back button like the post page's, and its navigation is done properly: the same shared behaviour as the post page, not a second hard-wired link.
- Dev configuration: the agent adds `http://localhost:4200` and `http://localhost:4300` to `Cors:AllowedOrigins` in `appsettings.Development.json` (owner's permission).
- Local date against UTC date: keep the shared formatter (the recommendation stands; no objection).
- Question, not a decision: HTTPS on the frontend dev server. Answered in the chat, nothing changed.

**Built.** One shared mechanism for every "Back": `NavigationHistoryStore` (`core/routing`, started by an app initializer) counts the history entries the app has added behind the page shown (+1 for a navigation that adds one, 0 for a replacing one, a redirect or the same address opened again, ±1 for the browser's own Back and Forward, read from the router's "popstate" trigger and the id in each history entry). `goBack(fallback)` uses the browser's own Back when the count is above zero, and goes to the feed (the fallback) otherwise, so a page opened directly still has somewhere to go. The new shared `BackLink` (`shared/back-link`) is the pinned Back bar and margin link taken out of the post page; the post page and the settings page both use it. The post card's comments button on the post's own page (`commentsGoBack`, replacing the old `commentsAddress` input) goes back the same way. The link keeps the feed as its `href`, so a click with a modifier key or a middle click still opens the feed in the browser's way. Settings got `users.settings.backLink` in both languages. Departure from the first sketch: a first version linked to the previous page's address; the spec review showed it was wrong after the browser's Back and Forward (Angular marks those navigations as replacing), after a replacing navigation onto the page just left, and let two pages lead to each other, so it was replaced by the history-based one above before anything was committed.

**Docs.** `DESIGN.md` Layout: the one 1024 px exception now names "a page with a pinned Back button" (post page, settings page). `.scratch/frontend/spec.md`: the post page line (both buttons go back) and the Settings line (pinned Back). The `posts.page.backLink` comment in `english.ts` no longer says "feed".

**Dev configuration.** `http://localhost:4200` and `http://localhost:4300` added to `Cors:AllowedOrigins` in the owner's `appsettings.Development.json` (a file Git ignores, so it is in no commit). The running backend has to be restarted to pick it up.

**Checks.** Prettier on the touched paths, lint, 885 unit tests (98 files, 10 of them new for the store), the build: pass; the build keeps its old warning (initial bundle over the 600 kB budget by about 153 kB). No backend change, so the backend suite was not run. No component DOM tests, by the temporary rule until 2026-11-25.

**In the running app** (Playwright, throwaway account `backtest1`, my own backend on 7202 and frontend on 4300 because 4200 and 7102 were in use): profile → post → Back and → the comments button both land on the profile; after Back the browser's Back goes to the feed, so no entry was added; through browser Back and Forward the Back link still goes to the profile; settings opened from the profile goes back to the profile; settings and a post opened directly go to the feed. Looked at: the settings page (and the post page) at 360, 768 and 1280 px, light and dark, English and Georgian (24 images, in the shots folder; the Back bar looks as it did on the post page). Not tried: the new-post page and Cancel on the edit page (they keep their own links), a guest.

**Review findings.** *Severe, fixed (spec review of the first version):* browser Back/Forward did not update the previous page; a replacing navigation (saving an edit) made the link lead to the page it was on; Back links added history entries, so two pages could bounce between each other. All three gone with the history-based store, each now covered by a test (back and forward, replace, same address, guard redirect). *Standards, fixed:* the `DESIGN.md` exception, the stale comment and spec line, the service named without a role word (now `NavigationHistoryStore`), the unused `fallback` input (removed), the duplicated address computed on the post page (removed), two comments that wrapped early. *Left alone:* (1) after a rename on the settings page, Back leads to the old profile address, which no longer exists (the browser's own Back does the same; the not-found page shows); (2) a guest who signs in from the like button, or is redirected by a guard, comes back with the sign-in address behind the post, so Back leads to the feed with a leftover `returnUrl` in the address (the feed shows normally); (3) the new-post page keeps its own link to the feed, on purpose ("without writing anything"); (4) the router events subscription has no `filter`/`takeUntilDestroyed`, as it lives as long as the app. The rewrite was not given a second spec review.

**Open decisions.**
- *HTTPS on the frontend dev server.* Answered in the chat, nothing changed.
- *Rename and Back.* The profile the reader came from may no longer exist after a rename (point 1 above). Recommendation: leave it; the not-found page is accurate.

**Screenshots:** `.scratch/frontend/shots/17/` (the settings and post pages, 12 images each, from this round).

**Branch.** `worktree-settings-page`: visual work, so it waits for the owner's review before the merge. Trial merge against `master` (commit 6712717): see the chat report.
