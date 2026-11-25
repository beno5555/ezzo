# 43: The moderation page lists hidden content and makes it visible

**What to build:** On the moderation page (ticket 23) an administrator opens a third tab, Hidden, listing the posts and comments that moderation hid, and brings one back with Make visible. Until now content hidden from a report or from a "…" menu could be restored only by finding it by hand.

- The Hidden tab shows posts and comments, each loaded by pages from the routes of backend ticket 14. It follows the layout of the Posts and Comments tabs, each item with the snapshot and a single action, Make visible; a settled item fades out and leaves, and comes back with a toast if the server refuses, as in the queue.
- **Third use, so extract first.** The moderation page now holds three panels that differ only in their queue and their actions, and `flagged-item` has a twin in `report-card`. The conventions skill (Styling) says the session that needs a third copy extracts the shared piece first, in the same change, and never writes the copy.
- A closed report whose Hide decision hid a post or a comment points to this tab (a link, no new button) when its target is still hidden.
- Decisions are under "Admin panel" in `planning/frontend/spec.md`; the layout rules are in `DESIGN.md`.

Queued for after the deadline (owner, 2026-11-23).

**Blocked by:** 23 (Admin: reports and the moderation queue), backend 14 (An administrator lists hidden posts and comments, in `planning/documented-backend-features/issues/`)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the pattern exists, but the ticket asks for an extraction of two shared pieces whose shape no code shows yet, and the result is checked mostly by looking.

- [ ] The moderation page shows three tabs, Posts, Comments and Hidden, and the Hidden tab loads by pages
- [ ] Make visible on a hidden post and on a hidden comment settles it, and it leaves the list
- [ ] A refused change comes back with the server's message, as in the queue
- [ ] The panels and the card shell are shared, and no third copy of either exists
- [ ] The new `…Api` methods are unit-tested against the HTTP testing backend
- [ ] Checked in the running app on a desktop width and on a phone width, in both themes
