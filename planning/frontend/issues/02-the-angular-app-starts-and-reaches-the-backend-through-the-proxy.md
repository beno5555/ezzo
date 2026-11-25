# 02: The Angular app starts, reaches the backend through the proxy, and CI checks it

**What to build:** A developer runs one command and gets the Angular app in `frontend/`, served on one origin with the backend (ADR 0001): the dev server forwards `/api` and `/hubs`, web sockets included, to the running backend. A bare, unstyled page proves the whole path by listing users from a real call to the public user search. CI checks the frontend on every push.

This ticket writes the first frontend code, so what it writes is what later tickets copy:

- The CLI project as the conventions describe it: standalone components, no zone.js, Vitest, Prettier, the `core/`, `shared/` and `features/` folders.
- ESLint with Angular's recommended rules plus the two mandatory ones: no un-awaited promises and no `any`.
- `AppResult` with its helpers, and `toAppResult`, the one place that turns an `HttpClient` call into a promise of a result and maps every failure shape (ADR 0003).
- The first `…Api` service (user search) and its tests, as the pattern for every other one.
- The `LIMITS` file, started with the limits this ticket needs.
- A route table that ends with a not-found route.

It installs no UI kit and no CSS framework; the design session chooses those.

Decisions are under "Scaffold and plumbing" and "Across the whole frontend" in `planning/frontend/spec.md`. The rules are in §10 of the conventions skill's TypeScript reference.

**Blocked by:** None (can start immediately)

**Status:** done

**Difficulty:** tricky: the first frontend code and the first integration of the two halves; it sets the patterns every later ticket copies, and proxy problems need debugging.

- [x] One documented command starts the frontend, and the bare page lists users returned by the backend's search through the proxy
- [ ] The proxy forwards `/api` and `/hubs`, and web socket upgrades on `/hubs`
- [x] Every address the app does not know shows the not-found page
- [x] A reload of `/users/john.doe`, an address with a dot in it, serves the app and not a file error
- [x] `toAppResult` is unit-tested for a success, the failure envelope, a validation response with field errors, a bodiless `401`, `403` and `404`, and a network failure
- [x] The user search `…Api` method is unit-tested against Angular's HTTP testing backend: the address, the query and the mapped result
- [x] Lint fails on an un-awaited promise and on `any`
- [x] The existing CI workflow runs the frontend's lint, unit tests and build, and the backend job is unchanged
- [x] `CLAUDE.md` gains the frontend commands, the dev proxy, and the note that the dev origin must be listed in the backend's `Cors:AllowedOrigins`
- [x] The Structure section of the conventions skill's TypeScript reference lists `admin/` and `reports/` among the feature folders

## Comments

- The web socket box stays open. Through the proxy, an upgrade request to `/hubs/messages` reached Kestrel, which answered `401` with `www-authenticate: Bearer`. A full `101` handshake needs a signed-in user, so ticket 04 finishes this check.
- The dev server answered a hard reload of an address ending in a file extension, such as `/users/a.png`, with `404`. Fixed at the source: usernames no longer allow dots (`Constants.UsernameRegexPattern`), so a profile address never looks like a file.
