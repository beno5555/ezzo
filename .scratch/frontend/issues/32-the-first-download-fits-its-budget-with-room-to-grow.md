# 32: The first download fits its budget, with room to grow

**What to build:** The app's first download stays under its size budget, and the budget leaves room for the text every page ticket adds. After ticket 07 the first download is 508.8 kB raw (122 kB compressed), 8.8 kB over the 500 kB warning, so every `npm run build` warns and a real jump would go unnoticed.

- **The live-connection library loads on demand.** The SignalR client leaves the first download and is fetched the first time a user signs in. A guest never downloads it. A signed-in user keeps every live feature (presence, the unread count, everything later tickets add), connected a moment later.
- **The connection keeps ticket 05's order.** Connecting and disconnecting still run one after another, in the order the session changed. A user who signs out while the library is still loading gets no connection; signing in as another user connects as that user. A failed load is reported like any other failed connection attempt.
- **The warning limit is raised on purpose.** The build's warning for the first download goes from 500 kB to 600 kB; the 1 MB error stays. The reason is recorded in a new ADR: the limit is Angular's default, not a standard; the first download is about 122 kB compressed, light for a web app; and both dictionaries ship in it (ADR 0006), so it grows with every page ticket. The ADR says to check what grew before raising the limit again.
- **The result is measured.** The ticket's comments record the first download's raw and compressed size after the change.

Decided with the owner on 2026-11-19, reviewing ticket 07 (its Comments propose the on-demand load). Loading only the language in use was considered and left for later, because it changes ADR 0006.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), so the size is measured on top of the shell

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): fully specified, but it changes the live connection that ticket 05 built, which has no unit test of its own, so a slip in the order of connecting and disconnecting would not be caught by tests.

- [x] The SignalR client is not part of the first download; `npm run build` lists it in a chunk loaded on demand
- [x] A guest's page load makes no request for the live-connection library or the hub
- [ ] A signed-in user's unread count still changes without a reload when a message arrives
- [x] Signing out while the library loads opens no connection; signing in as another user connects as that user
- [x] The first download's warning limit is 600 kB and its error limit 1 MB, and a new ADR records why
- [x] `npm run build` gives no size warning, and the new raw and compressed sizes are in the ticket's comments
- [x] The unit tests, lint and Prettier pass

## Comments

**2026-11-20, implementation (Opus 5.5).**

- **Sizes** (`npm run build`, "Initial total"; compressed is the build's estimated transfer size):

  | | Raw | Compressed |
  |---|---|---|
  | Before, on `master` at `d129c76` (tickets 08, 09 and 33 had grown it past ticket 07's 508.8 kB) | 559.68 kB, warning | 130.57 kB |
  | After | 503.66 kB, no warning | 118.59 kB |
  | SignalR, now the lazy chunk `index` | 56.37 kB | 12.82 kB |

  Moving SignalR alone would leave the first download 3.7 kB over the old 500 kB warning, so the raised limit is needed as well (ADR 0009).
- **How it works.** `SignalRLoader` (`frontend/src/app/core/hub/`) holds the only runtime reference to `@microsoft/signalr`, an `import()`; `HubClient` keeps type-only imports. The load runs inside the session turn, so the order stays ticket 05's. After the load, the turn checks that the same user is still signed in, and connects only then. A turn left stale by a sign-out opens nothing, and the turn queued for the next user connects.
- **New unit tests** (`hub-client.spec.ts`, 7 tests). Ticket 05's connection had none. They cover a guest, sign-in, sign-out, signing out during the load, another user signing in during the load, and a failed load. Removing the "still signed in" check fails the sign-out-during-load test.
- **Guest check.** A guest load of `/sign-in` on the dev server (Playwright) requested no `@microsoft/signalr` file and nothing under `/hubs`.
- **Not checked: the live unread count (box 3 unticked).** This worktree has no backend settings files, so the backend could not run here. To check it, run the app signed in, have another user send you a message, and watch the badge change without a reload.
- **For the owner: what "a failed load is reported like any other failed connection attempt" means.** The code reads "reported" literally. A failed load fails its turn, and `ErrorHandler` reports it like any other failed turn. Nothing retries until the next sign-in. Both reviewers pointed out that ticket 05's other failed attempts (a failed `start()`) are treated as expected and retried silently on the 0/2/5/10/30 s backoff. Under that reading a failed load would be retried the same way. Retrying fits "connected a moment later" better: a user who signs in during a brief outage would still go live. Against it: some browsers cache a failed dynamic `import()` until the page reloads, and a load that fails after a deploy has replaced the chunk never succeeds. In both cases a retry loop would only spin. Say if you want the retry; it is a small change in `HubClient.follow`.
- **Minor, left alone.** If a user signs out and back in as the same user while the library loads, the stale turn connects, and the queued turns disconnect and connect again. It ends in the right state, with one extra connection.
