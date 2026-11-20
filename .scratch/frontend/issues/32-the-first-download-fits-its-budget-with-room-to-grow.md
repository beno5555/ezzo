# 32: The first download fits its budget, with room to grow

**What to build:** The app's first download stays under its size budget, and the budget leaves room for the text every page ticket adds. After ticket 07 the first download is 508.8 kB raw (122 kB compressed), 8.8 kB over the 500 kB warning, so every `npm run build` warns and a real jump would go unnoticed.

- **The live-connection library loads on demand.** The SignalR client leaves the first download and is fetched the first time a user signs in. A guest never downloads it. A signed-in user keeps every live feature (presence, the unread count, everything later tickets add), connected a moment later.
- **The connection keeps ticket 05's order.** Connecting and disconnecting still run one after another, in the order the session changed. A user who signs out while the library is still loading gets no connection; signing in as another user connects as that user. A failed load is reported like any other failed connection attempt.
- **The warning limit is raised on purpose.** The build's warning for the first download goes from 500 kB to 600 kB; the 1 MB error stays. The reason is recorded in a new ADR: the limit is Angular's default, not a standard; the first download is about 122 kB compressed, light for a web app; and both dictionaries ship in it (ADR 0006), so it grows with every page ticket. The ADR says to check what grew before raising the limit again.
- **The result is measured.** The ticket's comments record the first download's raw and compressed size after the change.

Decided with the owner on 2026-11-19, reviewing ticket 07 (its Comments propose the on-demand load). Loading only the language in use was considered and left for later, because it changes ADR 0006.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), so the size is measured on top of the shell

**Status:** in-progress

**Difficulty:** routine (Opus 5.5 medium): fully specified, but it changes the live connection that ticket 05 built, which has no unit test of its own, so a slip in the order of connecting and disconnecting would not be caught by tests.

- [ ] The SignalR client is not part of the first download; `npm run build` lists it in a chunk loaded on demand
- [ ] A guest's page load makes no request for the live-connection library or the hub
- [ ] A signed-in user's unread count still changes without a reload when a message arrives
- [ ] Signing out while the library loads opens no connection; signing in as another user connects as that user
- [ ] The first download's warning limit is 600 kB and its error limit 1 MB, and a new ADR records why
- [ ] `npm run build` gives no size warning, and the new raw and compressed sizes are in the ticket's comments
- [ ] The unit tests, lint and Prettier pass
