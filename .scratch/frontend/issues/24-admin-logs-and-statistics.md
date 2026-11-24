# 24: Admin: logs and statistics

**What to build:** An administrator follows what happened in WebCity and sees how big and how active it is.

**Logs, at `/admin/logs`:**

- A table of log rows, loaded by pages: the time, the user's id when there is one, whether the request was signed in, the action, whether it succeeded, the details, and the entity's name and id.
- Filters, the ones the backend offers: user, outcome, action, entity name and id, signed in or not, and a period from one time to another. The period is entered in the administrator's own time zone and sent as UTC.
- The filters live in the address, so a filtered view can be reloaded.

**Statistics, at `/admin/statistics`:**

- Number tiles, with no charts and no chart library: the totals, what was created in the last 7 and the last 30 days, and how many users are online now.
- The backend endpoint, `GET /api/admin/statistics`, is documented-backend-features ticket 13. If that ticket is done when this one starts, the page shows real numbers. If it is not done, the `…Api` method is written and unit-tested against the documented contract and the page shows "Coming soon".

Decisions are under "Admin panel" in `.scratch/frontend/spec.md`. The backend's side is under `AdminController` in `docs/backend/controllers.md`, and ticket 13 in `.scratch/documented-backend-features/issues/`.

**Blocked by:** 22 (Admin: the layout and the users page), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: one filtered table and one page of numbers, on the patterns the users page set.

- [x] The logs table loads by pages, and each filter narrows it
- [x] A period that the backend refuses (an end before its start) shows the server's message
- [x] A filtered view survives a reload
- [x] Times are shown in the administrator's time zone through the shared formatter, and the period is sent as UTC
- [x] The statistics page shows its tiles, or "Coming soon" when backend ticket 13 is open; the ticket's closing note says which
- [x] The logs and statistics `…Api` methods are unit-tested against the HTTP testing backend
- [x] Checked in the running app on a desktop width and on a phone width

**Closing note:** backend ticket 13 is done, so the statistics page shows real numbers (no "Coming soon").

## Comments

**2026-11-24, round 1: implementation (Sonnet 5.5).**

- **Built.** `/admin/logs`: a paged table (cards on a phone) with the filters user id, outcome, signed in or not, action, entity name, entity id and a period. The filters live in the address under the backend's own names (`userId`, `succeeded`, `authorizedRequest`, `action`, `entityName`, `entityId`, `from`, `to`), so a reload or a pasted link restores the view. The period is typed in the administrator's time zone (`datetime-local`) and held and sent as UTC; `to` runs to the last millisecond of its minute. A refused period (400) shows the server's sentence under the form, with no Try again. `/admin/statistics`: number tiles in four sections (totals, last 7 days, last 30 days, online now), thousands separators by language. `AdminApi.getLogs` and `getStatistics`; both languages.
- **Departures.** (1) The shared `core/page-placeholder` component and its `pagePlaceholder` texts are deleted: these two routes were its last users. `origin/worktree-live-toasts` is older and still imports `placeholderPage` in `app.routes.ts`; if it merges after this branch it will need that import reconciled. (2) Outcome and signed-in choices are two toggle groups that search at once, with the whole form (text typed but not yet searched goes out with them). (3) Small additions beyond the ticket: a time-zone hint under the period, `LIMITS.logs`, and the helpers `core/time/local-date-time-input.ts` and `features/admin/log-filter-address.ts`, each with its own spec. (4) A time in a hand-written address must carry its offset (`Z` or `+04:00`), otherwise it is read as not set.
- **Checks.** Prettier, lint, the unit suite (917 tests, all pass), and the build. Warning left standing: the initial bundle is over its 600 kB budget (757 kB); not compared against `master`, and it is not from this ticket's lazy pages. No backend change, so no backend suite.
- **Running app** (Playwright script, backend on 7102, an administrator account, time zone Asia/Tbilisi): each filter alone and combined, the refused period, a reload with filters; screenshots of both pages at 360, 768 and 1280 px, in both themes and both languages (English light, Georgian dark). The screenshots were taken before the review fixes; the review changes after them (toggle and header loops, a disabled Search) do not change the markup's look, and the id boxes, a reload with ids and a toggle after a reload were re-run in the running app afterwards. Not tried: a clock-change gap or repeated hour in a typed time (the browser decides).
- **Review findings fixed (severe).** The id boxes' pattern was `/^d+$/` (no backslash), so any typed user id or entity id made the form invalid and Search sent nothing; fixed, and re-checked in the running app. Also fixed from the reviews: a time without an offset in the address; DTO types now one per file under the backend's names (`LogDisplayDto`, `ActivityCountsDto`, `StatisticsTotalsDto`, `StatisticsActivityDto`); Search is disabled while the form is invalid; `getLogs` reuses `logFilterToParams`; named booleans; the dead `isLoading` state removed; the toggle groups, the table's header cells and the statistics sections are loops; a `LogTable` spec.
- **Left alone.** The phone label span and cell classes of the logs table repeat the users page's (a second copy of the responsive admin table; the third use extracts it). `stat-tile` has its own card shell, close to `flagged-item` and `report-card`: the convention names those two as the known exception, so it is flagged here, not extracted; I recommend a shared card when a fourth one appears. `[maxlength]` without a counter on the action and entity-name boxes follows the users page.
- **Open decisions.** The toggles search at once (chosen: one click, one view); the alternative is to change the choice only and wait for Search. The bundle budget: raise it or split, for ticket 32 to decide.
- **Screenshots:** `.scratch/frontend/shots/24/` in the main checkout.
- **Branch:** `worktree-f24-logs-and-statistics`, waiting for the owner's visual review.
