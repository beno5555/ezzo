# 17: The settings page

**What to build:** One page, `/settings`, where a signed-in user manages their profile and their account, in sections.

- **Profile.** Username, bio and date of birth in a form. Under the username: the rule that it can change once in 20 days, the date it was last changed (when it ever was), and the date it can change again. The account's creation date is shown, read-only.
- **Language.** The same switch the shell has.
- **Password.** A button that requests a reset email for the user's own address, since the backend has no change-password endpoint. A message says the email is on its way.
- **Danger zone.** Deactivate and Delete. Each opens the confirmation that requires typing the username. Each ends by signing the user out and showing what happens next: a deactivated account can be reactivated by email; a deleted account is removed after the retention period.

The email digest switch is not built here. It arrives with the n8n spec.

Decisions are under "Settings" in `planning/frontend/spec.md`. The backend's rules are in `docs/backend/auth.md` and under the account controllers in `docs/backend/controllers.md`.

**Blocked by:** 01 (Reserved usernames are refused, and the joined date is private), 08 (The auth pages), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: forms and confirmations on patterns the auth pages and the shared blocks already set.

- [x] A user changes the bio and the date of birth, and the profile page shows the change
- [x] A user changes the username; the session's username follows; the last-changed date appears
- [x] A second username change inside 20 days shows the server's refusal beside the field
- [x] The creation date and the last-changed date are shown through the shared formatter; the date of birth is handled in UTC
- [x] The password button sends the reset email and says so
- [x] Deactivate works only after the username is typed, and Delete only after a sentence that holds it is typed; each ends signed out with its message
- [x] After a rename, going back to the old profile address leads to the profile under the new name, never to a not-found page
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

**Screenshots:** `planning/frontend/shots/17/`.

**Branch.** `worktree-settings-page`: visual work, so it waits for the owner's review before the merge; a lane writes no review-queue line. I left the roadmap's lane table alone for the same reason (the row for round 14 is not marked merged until the merge). Trial merge against `origin/master` (commit 6712717): clean, no conflicts. Pushed.

**2026-11-24, round 2: revision (Sonnet 5.5).**

**Owner's decisions.**
- *Bug found while reviewing, outside this ticket's scope but fixed here (owner's request).* From a profile, a post's "Back" link and its comments button led to the feed, not back to the profile (the browser's own back arrow was right). Both go back to where the reader came from, with the feed only when the post was opened directly.
- The settings page gets a back button like the post page's, and its navigation is done properly: the same shared behaviour as the post page, not a second hard-wired link.
- Dev configuration: the agent adds `http://localhost:4200` and `http://localhost:4300` to `Cors:AllowedOrigins` in `appsettings.Development.json` (owner's permission).
- Local date against UTC date: keep the shared formatter (the recommendation stands; no objection).
- Question, not a decision: HTTPS on the frontend dev server. Answered in the chat, nothing changed.

**Built.** One shared mechanism for every "Back": `NavigationHistoryStore` (`core/routing`, started by an app initializer) counts the history entries the app has added behind the page shown (+1 for a navigation that adds one, 0 for a replacing one, a redirect or the same address opened again, ±1 for the browser's own Back and Forward, read from the router's "popstate" trigger and the id in each history entry). `goBack(fallback)` uses the browser's own Back when the count is above zero, and goes to the feed (the fallback) otherwise, so a page opened directly still has somewhere to go. The new shared `BackLink` (`shared/back-link`) is the pinned Back bar and margin link taken out of the post page; the post page and the settings page both use it. The post card's comments button on the post's own page (`commentsGoBack`, replacing the old `commentsAddress` input) goes back the same way. The link keeps the feed as its `href`, so a click with a modifier key or a middle click still opens the feed in the browser's way. Settings got `users.settings.backLink` in both languages. Departure from the first sketch: a first version linked to the previous page's address; the spec review showed it was wrong after the browser's Back and Forward (Angular marks those navigations as replacing), after a replacing navigation onto the page just left, and let two pages lead to each other, so it was replaced by the history-based one above before anything was committed.

**Docs.** `DESIGN.md` Layout: the one 1024 px exception now names "a page with a pinned Back button" (post page, settings page). `planning/frontend/spec.md`: the post page line (both buttons go back) and the Settings line (pinned Back). The `posts.page.backLink` comment in `english.ts` no longer says "feed".

**Dev configuration.** `http://localhost:4200` and `http://localhost:4300` added to `Cors:AllowedOrigins` in the owner's `appsettings.Development.json` (a file Git ignores, so it is in no commit). The running backend has to be restarted to pick it up.

**Checks.** Prettier on the touched paths, lint, 885 unit tests (98 files, 10 of them new for the store), the build: pass; the build keeps its old warning (initial bundle over the 600 kB budget by about 153 kB). No backend change, so the backend suite was not run. No component DOM tests, by the temporary rule until 2026-11-25.

**In the running app** (Playwright, throwaway account `backtest1`, my own backend on 7202 and frontend on 4300 because 4200 and 7102 were in use): profile → post → Back and → the comments button both land on the profile; after Back the browser's Back goes to the feed, so no entry was added; through browser Back and Forward the Back link still goes to the profile; settings opened from the profile goes back to the profile; settings and a post opened directly go to the feed. Looked at: the settings page (and the post page) at 360, 768 and 1280 px, light and dark, English and Georgian (24 images, in the shots folder; the Back bar looks as it did on the post page). Not tried: the new-post page and Cancel on the edit page (they keep their own links), a guest.

**Review findings.** *Severe, fixed (spec review of the first version):* browser Back/Forward did not update the previous page; a replacing navigation (saving an edit) made the link lead to the page it was on; Back links added history entries, so two pages could bounce between each other. All three gone with the history-based store, each now covered by a test (back and forward, replace, same address, guard redirect). *Standards, fixed:* the `DESIGN.md` exception, the stale comment and spec line, the service named without a role word (now `NavigationHistoryStore`), the unused `fallback` input (removed), the duplicated address computed on the post page (removed), two comments that wrapped early. *Left alone:* (1) after a rename on the settings page, Back leads to the old profile address, which no longer exists (the browser's own Back does the same; the not-found page shows); (2) a guest who signs in from the like button, or is redirected by a guard, comes back with the sign-in address behind the post, so Back leads to the feed with a leftover `returnUrl` in the address (the feed shows normally); (3) the new-post page keeps its own link to the feed, on purpose ("without writing anything"); (4) the router events subscription has no `filter`/`takeUntilDestroyed`, as it lives as long as the app. The rewrite was not given a second spec review.

**Open decisions.**
- *HTTPS on the frontend dev server.* Answered in the chat, nothing changed.
- *Rename and Back.* The profile the reader came from may no longer exist after a rename (point 1 above). Recommendation: leave it; the not-found page is accurate.

**Screenshots:** `planning/frontend/shots/17/` (the settings and post pages, 12 images each, from this round).

**Branch.** `worktree-settings-page`: visual work, so it waits for the owner's review before the merge. Trial merge against `master` (commit 6712717): see the chat report.

**2026-11-24, round 3: revision (Sonnet 5.5).**

**Owner's decisions.**
- *Rename and Back.* Not acceptable to land on a not-found page after a rename: where the old profile can no longer be shown, the user must be taken to the main page, or to their profile under the new name automatically. Chosen: the second (see Built).
- *Local date against UTC date, dev configuration:* as in round 2, nothing more.
- *HTTPS on the frontend dev server:* the owner did not know the answer and asked for it; answered in the chat (a question, no change).
- The reset email was checked by the owner and arrives.
- *Harder confirmation.* The owner asked whether deactivation and deletion should ask for more than the username (a typed sentence), and to implement it if it is a good idea.
- *Guest returning from sign-in:* the leftover `returnUrl` behind the post is accepted.
- *Router-events subscription, the repeated refusal branch, the second spec review:* the owner asked for each to be explained simply, and for each to be fixed only if it causes a problem.

**Built.**
- *Rename and Back.* `SessionStore` keeps the lower-case usernames the signed-in user had earlier in this visit (filled when a refresh brings a token for the same user under another name, reset when another user signs in); `currentUsernameOf(name)` answers the current name for one of them. `ProfilePage`, on a 404, asks it: for a former name it replaces the address with the profile under the new name (`replaceUrl`), otherwise it shows the not-found page as before; should the move not happen it shows not-found rather than load for ever. Works for the Back link, the browser's Back and an old link, within the visit; after a reload the memory is gone, so an old address then is a plain not-found page.
- *Delete asks for a sentence.* Deactivate keeps asking for the username (an email link undoes it). Delete asks for `I am <username> and I want to delete my account` (Georgian: `მე ვარ <username> და მინდა ჩემი ანგარიშის წაშლა`), typed exactly as shown (same matcher, so letter case counts). It is `users.settings.dangerZone.delete.typedSentence` in both dictionaries; the confirmation dialog is unchanged except `autocorrect="off"` on its input (a phone's autocorrect would otherwise rewrite the sentence).
- *The Back store, rebuilt (found by the spec review of round 2, which the owner's question about "no second spec review" asked for).* `NavigationHistoryStore` compared the router's navigation ids to tell Back from Forward; three cases broke it, each now a failing-then-passing test: after a reload the ids start again at 1 while the old entries keep theirs (Back across the reload could leave the app); a jump over several entries (the browser's long-press history list) counted as one step; a page replaced after going back got a newer id than the entries ahead of it (Forward after the rename redirect misread). It now stamps every entry it shows with its own position (`historyPosition` in the history state), so the pages behind are the position minus the first position shown, and a restored entry tells its own position. Checked in the running app: Back across a reload goes to the feed (fallback) and stays in the app; rename, Back link, browser Back, browser Forward, Back link again all land where they should.
- *Docs.* `planning/frontend/spec.md`: the confirmation line, the Settings line and the not-found line.

**Checks.** Prettier on the touched paths, lint, 894 unit tests (99 files; 9 new), the build: pass; the build keeps its old warning (initial bundle over the 600 kB budget by about 154 kB). No backend change, so the backend suite was not run. Class-level tests only, by the temporary rule until 2026-11-25.

**In the running app** (Playwright, throwaway accounts `round3tester`/`round3second`, backend on https 7102, frontend on 4200): rename, then the settings Back link and the browser's Back both land on the profile under the new name; the delete dialog refuses the username alone and the sentence missing its last character, and accepts the full sentence, in English and Georgian, at 360 and 1280 px (no sideways scroll); a real deletion with the sentence ends signed out on `/` with its notice; the reload and forward scenarios above. Not looked at again: the dark theme of the delete dialog (only the dialog's text changed). The throwaway accounts stay in the development database.

**Review findings.** *Severe, fixed:* the three Back-store cases above (spec review, round 2 code). *Standards, fixed:* two stale comments (post card, confirmation opener), the unnamed condition and the negative-first branches in `SessionStore` and `NavigationHistoryStore` (named, then written positive), a one-letter lambda parameter in a spec, `feedAddress` renamed `fallbackAddress` (it is the fallback of the Back link), the duplicated reasoning comment in `DangerZone`, three over-long or short-wrapped comments, a typo and a hard-coded address in the profile page spec; the spec review's `spec.md` gaps and a comment that overstated when former usernames are dropped. *Left alone, with a reason:* (1) the Back link and the post card's comments button are an `<a [href]>` with a click handler, not `routerLink`: `routerLink` cannot go back in history, and the store's comment says so (the rule in `typescript.md` has no written exception for it; the owner may want one); (2) `typedWord` now holds a sentence too (its comment says so; a rename to `typedText` touches five files for no behaviour); (3) the fallback pair `fallbackAddress` + `followBackLink` exists in two components, which is two copies: a third back-going link must extract it first; (4) if the refresh after a rename fails (no network), the old name is not recorded and Back shows the not-found page; (5) the refusal branch repeated in four forms, as in round 1. The revised store had a second spec review in this round; its fixes are covered above, and it was not reviewed a third time.

**Open decisions.**
- *Rename after a reload.* The memory of former names lives for the visit; after a reload an old address is a not-found page. Recommendation: leave it (storing names in the browser would outlive the visit and could point a stranger's old link at the user's profile).
- *`routerLink` exception.* Recommendation: add one line to `typescript.md` naming the two Back controls as the exception.

**After round 3 (owner, 2026-11-24).** Accepted as it stands; goes to the merge without a round 4. The repeated tail of `save()` (four forms, nine lines each) is to be extracted later: noted in `planning/roadmap.md` under "After the deadline".

**Screenshots:** `planning/frontend/shots/17/` (`delete-dialog--*`: 360 and 1280 px, light, English and Georgian, empty and typed; eight images).
