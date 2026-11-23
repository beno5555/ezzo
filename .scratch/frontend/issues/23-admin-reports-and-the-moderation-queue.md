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
- **Tests:** `ReportApi.getAll` and `decide` (filters as text, each status and target type, 403, 400 with its message), `AdminApi` queue reads, `PagedList.leave`, `SettlingList`, `reportDecisionsOffered`, `reportsClosedWith`.

**Departures from the ticket.**

- Hide on a *user* report asks for confirmation first, because it deactivates the account and emails its owner (the spec has every destructive admin action open a confirmation). Hide on a post or comment is instant. **Recommendation:** keep.
- A comment's post title links to the post. **Recommendation:** keep.
- Quick-action behaviour (owner, 2026-11-20): the item fades out and leaves on the click, and comes back with a toast if the server refuses (`SettlingList`, new).
- `PagedList.leave(key)` (new, in `core/paging`): settled items leave the server's list, so asking for page 2 by number would skip items that moved up. `leave` makes the next request ask for the page holding the first unseen item. The review found the first version wrong after a second round of settles; fixed with a regression test (`unseenOffset` replaces the page counter and the left count).
- `pageParams()` moved to `core/http/page-params.ts`, used by `AdminApi` and `ReportApi`.

**Checks.**

- Prettier (touched folders), lint, build and the full unit suite pass: 85 files, 757 tests.
- Standing warning: the initial bundle is 713.77 kB against the 600 kB budget (it was over before this ticket).
- Not run: the real backend. Creating a database for the lane (`CREATE DATABASE WebCityAdminQueue`) was denied, so nothing here talked to the real API.

**Tried in the running app (API mocked in the browser through Playwright routes).**

- Reports: Pending default, both filters, Hide closing same-target reports, Reject, a refusal fading back with a toast, page 2 correct after removals, the missing-target mark, the closed-report review line, the user-hide confirmation.
- Moderation: tabs (arrow keys too), lazy comments, settle and refusal, the empty state.
- Layout: 360, 768 and 1280 px, both themes, English and Georgian; nothing overflows, targets are at least 44 px.
- **Not tried:** the real backend, so response shapes come from `docs/backend/controllers.md` and the DTOs, not from observation. **Recommendation:** open both pages once against a seeded backend before the merge.

**Review.**

- Spec axis: one real bug (the paging above, fixed), the missing closing bookkeeping (this note), and the Comments tab re-reading on every switch (fixed: first open only).
- Standards axis, fixed: specs for the two helpers and `SettlingList`; `QueueTab` in its own typed file; `pageParams` shared; `SettlingList` keyed by id; the same-target rule moved out of the page into a tested helper; `hasPosts`/`hasComments` instead of repeated length checks.
- Left alone: the shared card shell in `flagged-item` and `report-card` (**recommendation:** extract a `shared/` card if a third use appears); the two near-identical moderation panels (a generic panel needs projected templates, which cost more than they save); the `computed` pass-throughs in `SettlingList`.

**Waits for other tickets.** Nothing.

**Screenshots:** `.scratch/frontend/shots/23/` in the main checkout (7 images).

**Branch:** `worktree-admin-queue`, waiting for the owner's review (visual work). A lane writes no review-queue line, and the roadmap row stays unmarked until the merge.
