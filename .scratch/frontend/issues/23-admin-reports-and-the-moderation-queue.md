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

**Blocked by:** 13 (Content is reported and moderated from the normal pages), 22 (Admin: the layout and the users page)

**Status:** ready-for-agent

**Difficulty:** routine: two paged lists that show shapes the backend already sends, with actions that exist from ticket 13 or are clearly marked as waiting.

- [ ] The reports list opens on pending reports, and each filter narrows it
- [ ] A reported post, comment and user each show inline, a post with its photos
- [ ] A report whose target is gone is marked
- [ ] Hide and Reject work as described, or are disabled with "Coming soon" when backend ticket 12 is open; the ticket's closing note says which
- [ ] The moderation page shows flagged posts and flagged comments in two tabs
- [ ] Hide and Make visible each settle an item, and it leaves the queue
- [ ] The report `…Api` methods are unit-tested against the HTTP testing backend, including filters sent as text
- [ ] Checked in the running app on a desktop width and on a phone width
