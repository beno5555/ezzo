# 23: Admin: reports and the moderation queue

**What to build:** An administrator reviews what users reported and what was flagged.

**Reports, at `/admin/reports`:**

- The list opens on pending reports and loads by pages. Filters: status (pending, resolved, rejected) and what was reported (post, comment, user). Both are sent by name.
- Each report shows the reporter, the reason, the time, and the reported thing inline from the snapshot the backend sends: a post with its photos, a comment with the title of its post, or a user with their bio. A closed report also shows who reviewed it and when.
- A report whose target is gone is marked as such.
- **Hide and Reject** on a pending report. The backend endpoint, `PUT /api/reports/{id}`, is documented-backend-features ticket 12. If that ticket is done when this one starts, the buttons work: Hide closes the report and every other pending report on the same target, and Reject closes this one; a report whose target is gone offers Reject only. If it is not done, the `…Api` method is written and unit-tested against the documented contract and the buttons are shown disabled with "Coming soon".

**Moderation queue, at `/admin/moderation`:**

- One page with a Posts tab and a Comments tab, one per queue route, each loading by pages.
- Each flagged item offers Hide and Make visible, using the moderation calls from ticket 13. A settled item leaves the queue.

Decisions are under "Admin panel" in `.scratch/frontend/spec.md`. The backend's side is under `ReportController` and `AdminController` in `docs/backend/controllers.md`, and ticket 12 in `.scratch/documented-backend-features/issues/`.

**Blocked by:** 13 (Content is reported and moderated from the normal pages), 22 (Admin: the layout and the users page), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: two paged lists that show shapes the backend already sends, with actions that exist from ticket 13 or are clearly marked as waiting.

- [x] The reports list opens on pending reports, and each filter narrows it
- [x] A reported post, comment and user each show inline, a post with its photos
- [x] A report whose target is gone is marked
- [x] Hide and Reject work as described, or are disabled with "Coming soon" when backend ticket 12 is open; the ticket's closing note says which
- [x] The moderation page shows flagged posts and flagged comments in two tabs
- [x] Hide and Make visible each settle an item, and it leaves the queue
- [x] The report `…Api` methods are unit-tested against the HTTP testing backend, including filters sent as text
- [x] Checked in the running app on a desktop width and on a phone width

## Comments

**2026-11-23, round 1: implementation (Sonnet 5.5).**

**Built.** `/admin/reports` and `/admin/moderation` replace the two placeholders, in `features/admin/`, as lazy routes.

- **Reports:**
  - Opens on Pending; status and target-type filters are sent by name ("Anything" leaves the target parameter out).
  - Each card shows the reporter, time, reason and a status word, then the reported thing from the snapshot: a post with its photo grid, a comment with its post's title, a user with the bio ("No bio." when empty).
  - A closed report shows "Resolved/Rejected by X, time". A report whose target is gone shows a per-type "gone" mark and offers Reject only.
  - Backend ticket 12 is done, so Hide and Reject are live (no "Coming soon"). Hide also takes the other pending reports on the same target out of the list.
- **Moderation:** `app-tabs` with Posts and Comments, each paged from its own queue. Comments are read the first time their tab opens. Hide and Make visible per item; a settled item leaves.
- **Tests:** `ReportApi.getAll` and `decide` (filters as text, each status and target type, 403, 400 with its message), `AdminApi` queue reads, `PagedList.leave`, `SettlingList`, `reportDecisionsOffered`, `reportsClosedWith`, `isUserAvailable`.

**Departures from the ticket.**

- Hide on a *user* report asks for confirmation first, because it deactivates the account and emails its owner (the spec has every destructive admin action open a confirmation). Hide on a post or comment is instant. **Recommendation:** keep.
- A comment's post title links to the post. **Recommendation:** keep.
- Quick-action behaviour (owner, 2026-11-20): the item fades out and leaves on the click, and comes back with a toast if the server refuses (`SettlingList`, new).
- `PagedList.leave(key)` (new, in `core/paging`): settled items leave the server's list, so asking for page 2 by number would skip items that moved up. `leave` makes the next request ask for the page holding the first unseen item. The review found the first version wrong after a second round of settles; fixed with a regression test (`unseenOffset` replaces the page counter and the left count).
- `pageParams()` moved to `core/http/page-params.ts`, used by `AdminApi` and `ReportApi`.

**Checks.**

- Prettier (`src/app`), lint, build and the full unit suite pass: 86 files, 761 tests.
- Standing warning: the initial bundle is 713.81 kB against the 600 kB budget (it was over before this ticket).
- Not run: the backend's integration suite, because nothing in `backend/` changed.

**Tried in the running app, against the real backend.**

- Set-up: the lane's own database `WebCityAdminQueue` on local SQL Server (it is still there; the migrations are applied), the backend on `https://localhost:7102` with email sending switched off for the run (`EmailConfiguration__Enabled=false`, so Hide on a user sent no mail), the Angular dev server on 4200. Data: four throwaway accounts (`qadmin` an administrator, `qalice`, `qbob`, `qcarol`), 30 pending reports (posts, comments, a user, two on one post, two on a deleted post), 11 flagged posts and 12 flagged comments, so every list spans more than one page of 10.
- Reports:
  - Pending opens first (`?status=Pending`); each filter goes by name (`targetType=Post`, `status=Resolved`); 30 reports loaded over three scrolls, then the end.
  - Hide on a post report sent `PUT /api/reports/1 {"decision":"Hide"}` once; the other pending report on the same post left with it, and both show under Resolved with "Resolved by qadmin, time" and the post's Hidden badge. The database agrees (both rows Resolved, reviewer is the admin).
  - Reject on a comment report: Rejected in the database. A deleted post's report shows "This post no longer exists" with Reject only. A post report shows its two photos.
  - Hide on a user report opens the confirmation; Cancel sends nothing; Hide deactivates the account (`AccountDeactivatedAt` set) and closes the report.
  - Refusal: I rejected a report through the API, then clicked Hide on its stale card: the backend answered 400, the card stayed, and the toast said "This report has already been decided".
- Moderation: the Posts tab loaded 10 then 11; Hide sent `PUT /api/admin/posts/7/moderation {"status":"Hidden"}` and the item left (10 remain). The Comments tab loaded on first open (10, then 12 on scroll); Make visible sent `{"status":"Visible"}` and the item left. After an item leaves, the next read asks for page 1 again and then page 2, with no item skipped or repeated.
- **A bug the real data found, fixed:** the admin endpoints send a deactivated reporter as `{id: 9, username: "account_deactivated"}`, with an id, while the public endpoints send no id. The card took "has an id" to mean "available" and linked to `/users/account_deactivated`. `isUserAvailable` (new, `features/users/`, with a spec) now also checks the placeholder names, and the reporter is plain text with the grey disc, as on the post card. My first, mocked pass could not show this, because its fixtures had no id.
- Layout: the screenshot command's full set for both pages (360, 768 and 1280 px, both themes, English and Georgian, 24 images), plus single shots of the open confirmation, the refusal toast, a post report with photos and the 360 px top. Nothing scrolls sideways at 360 px, and every button and tab is at least 44 px high.
- Not tried: Hide on a user *with email enabled* (a real mail would have gone to a made-up address), and the keyboard-only path through the confirmation.

**Review.**

- Spec axis: one real bug (the paging above, fixed), the missing closing bookkeeping (this note), and the Comments tab re-reading on every switch (fixed: first open only). The run against the real backend added the deactivated-reporter bug above.
- Standards axis, fixed: specs for the two helpers and `SettlingList`; `QueueTab` in its own typed file; `pageParams` shared; `SettlingList` keyed by id; the same-target rule moved out of the page into a tested helper; `hasPosts`/`hasComments` instead of repeated length checks.
- Left alone: the shared card shell in `flagged-item` and `report-card` (**recommendation:** extract a `shared/` card if a third use appears); the two near-identical moderation panels (a generic panel needs projected templates, which cost more than they save); the `computed` pass-throughs in `SettlingList`.

**Waits for other tickets.** Nothing.

**Screenshots:** `.scratch/frontend/shots/23/` in the main checkout: the 24 images of the screenshot command (`admin_reports--signed-in--*`, `admin_moderation--signed-in--*`) and five single shots (`real-*.png`), all from the real backend.

**Branch:** `worktree-admin-queue`, waiting for the owner's review (visual work). A lane writes no review-queue line, and the roadmap row stays unmarked until the merge.

**2026-11-23, round 2: revision (Sonnet 5.5).**

Owner's decisions:

- The departures stay: the confirmation before Hide on a user report, the link from a comment to its post, and the quick-action fade-out.
- The shared card shell (`flagged-item`, `report-card`) and the two moderation panels stay as two copies now. The session that writes a **third** use extracts the shared piece first and does not copy it a third time. The rule is written into `webcity-conventions` (`references/typescript.md`, Styling), where every frontend session reads it.
- The first download above 700 kB is not a concern for now: the 1 MB error limit is the real ceiling, and the app is nearing it. Nothing to change in this ticket.
- The owner reads over remote control and cannot open local files: screenshots are sent into the chat.

**2026-11-23, round 3: master merged, new look applied (Sonnet 5.5).**

Owner's decision: bring the redesigned `master` (the Balcony skin, the Ezzo logo, the landing page) into this branch and make the two pages fit it, so the branch merges as one piece.

- `master` merged into the branch (`2e85f23`, no conflicts). The pages use only design tokens, so the new colours, fonts, active-page bar in the admin menu and top bar reached them with no change.
- **One change the redesign forced.** `Button`'s danger look now adds a trash icon by itself (DESIGN.md, Components). Hide in the moderation queue and on a report would have read as "delete", but it is reversible (Make visible). Hide is now the quiet look with the eye-off icon the Hidden badge uses, and Make visible has the eye icon (`flagged-item`, `report-card`). **Recommendation:** keep; if the owner wants Hide to keep its red look, `Button` needs a way to switch the trash icon off.
- Retaken: the screenshot command's 24 images for both pages, from the real backend and the lane's database (a new throwaway admin `qshots`, because the old accounts' passwords were not kept). Looked at: 1280 light en (reports), 768 light en (moderation), 360 light ka (reports), 360 dark en (moderation). Nothing scrolls sideways at 360 px; the Georgian text fits.
- Checks: lint, the unit suite (86 files, 761 tests) and the build pass. Prettier's check lists 15 files from `master`'s merge but none of this ticket's: the Windows checkout converts their line endings, and they are not changed here. The first download is 723.95 kB (budget warning 600 kB, error limit 1 MB), up from 713.81 kB through `master`'s fonts and logo.
- Not run: the backend integration suite (the merge brought no backend change). No spec-review pass: the round's own change is four files and an icon swap.
- Servers stopped, ports 4200 and 7102 free.

**2026-11-23, round 4: the reports layout reworked (Sonnet 5.5).**

Owner's decisions: the page looked lopsided and the filters were confusing; rethink the layout and choose the variation I judge best. Also: the "hidden content" ticket is queued for after the deadline, and an administrator should be able to flag from the menu (also queued).

- **One centred column.** The title, the filters and the list share one column of the `column` width, centred in the space beside the admin menu. Before, the title and filters ran the full width while the cards stopped at 42rem and hung to the left, which at 768 px left a strip of empty space on the right. The moderation page has the same column.
- **Filters in two clear levels.** Status (Pending, Resolved, Rejected) is a row of tabs, the same control as the moderation page's Posts and Comments tabs. What was reported (Anything, Post, Comment, User) is one row of choices under the tabs, with a short label "About" before it. The long labels ("Show reports that are", "About a") are gone; `statusTabsLabel` names the tab row for screen readers.
- **Shared `Tabs` changed for the phone:** a tab does not shrink or wrap, the row scrolls sideways inside itself instead of widening the page, and a tab is `text-sm` with small padding below 768 px. The first version made the page 523 px wide at 360 px in Georgian.
- **Two Georgian words changed** so three tabs fit at 360 px: Pending is "მოლოდინში" (was "განსახილველი") and Resolved is "მოგვარებული" (was "დაკმაყოფილებული"). They also appear on each report's status line. **Recommendation:** keep; a Georgian reader should confirm the two words.
- Checks: lint, the unit suite (86 files, 761 tests) and the build pass. Retaken: the 24 images; looked at 1280 light en, 360 light ka and dark ka. The profile page also uses `Tabs`; its screenshots were not retaken (**not checked**).
- No behaviour changed.
- New tickets from this round, all queued after the deadline: backend 14 (list hidden posts and comments), frontend 43 (a Hidden tab, extracting the shared panel) and frontend 44 (an administrator flags from the menu). They are in the roadmap under "After the deadline".

**2026-11-23, round 5: wording, the users panel and the admin layout (Sonnet 5.5).**

Owner's decisions: the admin menu stays pinned at the top while the page scrolls, and the admin area is wider and pushed left (first option; the left-middle pin was weighed and not chosen: a menu in the middle of the left edge drifts out of reach on a short page and jumps as the page grows). Emails get a copy icon, and a click on the email itself copies too. Wording: "All" for "Anything"; no "About", and the target names are plural (Posts, Comments, Users); Georgian "გაუქმება" for deactivate and "გაუქმებული" for deactivated, in every admin text; English stays.

- **Reports.** A user report's button says "Deactivate" (UserX icon; Georgian "გაუქმება"); post and comment reports say "Hide". The resolved line says how: "Post hidden by …", "Comment hidden by …", "Account deactivated by …" (and the Georgian forms), because Hide is the only way to resolve a report. "Pending" became "Awaiting review" (Georgian "მოლოდინში" kept). The confirmation for a user report names deactivation.
- **Users panel.** The "Show accounts that are" label is read by screen readers only. A row that no longer fits the filter (reactivating in Deactivated, deactivating in Active, and so on) fades out and leaves the list without a refresh, by the same `PagedList.leave` and `DeleteFade` the lists use; a refused action brings it back. `AccountActionStore.run` takes a `settled` callback for this.
- **Layout.** New token `--container-admin: 90rem` (tokens file and `DESIGN.md` together); the admin menu is sticky from 1024 px. The table loses its Deactivated and Deleted columns on a desktop: the date sits under the state word, so six columns share the room.
- **Emails** are cut with an ellipsis before they wrap, and the full address is in the `title`. The copy button has an accessible label; the email text is a mouse shortcut for it and is hidden from screen readers so they meet one control. A toast says "Email copied." (or that it failed).
- Checks: Prettier on my files, lint, the unit suite (86 files, 767 tests, 9.72 s) and the build pass. Retaken: the users, reports and moderation images at 360, 768 and 1280 px, both themes and languages; looked at the users page at 1280 light en and ka, 768 dark en and 360 light en. Initial bundle 728.21 kB (warning budget 600 kB, limit 1 MB).
- **Not checked:** the sticky menu while scrolling (static images cannot show it; no ancestor sets an overflow, so it should hold); the fade-out of a row against the real backend; the clipboard in a real browser. No backend change, so no integration run. **To confirm:** the Georgian wording of the three "resolved by" phrases and "Awaiting review".

**2026-11-23, round 5 (later): the users table in English and Georgian (Sonnet 5.5).**

Owner's decisions: a long username is cut with an ellipsis and is copyable like the email; Georgian "მდგომარეობა" became "სტატუსი" and "მოქმედებები" in the users table became "ოპერაციები" (the post, comment, message and profile menus keep their words); the English and Georgian tables must look alike.

- **Why they differed:** the table sizes its columns by their content, and the email column was told to take all the slack, so the other columns shrank to their narrowest. In English the dates wrapped to four lines and the email stretched; in Georgian the words were wide enough that it happened to look right. I had only looked at the Georgian image after that change. Now role, state and joined never wrap on a desktop, the email column takes what is left, and the username is capped.
- **One shared `CopyableText`** (a text cut with an ellipsis, a click that copies it, and a copy button; 32 px on a desktop, 44 px on a phone) serves the username and the email. Its texts moved to `shared.copy`.
- Checks: Prettier on my files, lint, the unit suite (86 files, 767 tests, 6.46 s) and the build pass; the users page retaken at all twelve sizes and looked at in both languages at 1280 px and in Georgian at 360 px. Initial bundle 728.32 kB.
- **Known limit:** in Georgian at 1280 px the email column is at its narrowest, so short emails are also cut ("alice@example..."). Hovering shows the whole address, and the copy button copies it.
- **Emails (later):** an email is capped like a username (about 16 rem) and cut with an ellipsis; the column still shrinks, so nothing scrolls sideways in Georgian at 1280 px. Looked at 1280 en and ka, light and dark, and 360 en.
