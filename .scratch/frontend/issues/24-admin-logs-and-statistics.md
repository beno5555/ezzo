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

**Status:** ready-for-agent

**Difficulty:** routine: one filtered table and one page of numbers, on the patterns the users page set.

- [ ] The logs table loads by pages, and each filter narrows it
- [ ] A period that the backend refuses (an end before its start) shows the server's message
- [ ] A filtered view survives a reload
- [ ] Times are shown in the administrator's time zone through the shared formatter, and the period is sent as UTC
- [ ] The statistics page shows its tiles, or "Coming soon" when backend ticket 13 is open; the ticket's closing note says which
- [ ] The logs and statistics `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width
