# 04: A user signs in and stays signed in

**What to build:** A user signs in, reloads the page, opens a second tab, waits past the access token's life, and is still signed in everywhere. When the session can no longer be renewed, the user lands on sign-in and comes back to the address they wanted.

- **Session store.** It holds the access token in memory only and exposes who is signed in (id, username, roles) as read-only signals (ADR 0004).
- **Token decoder.** One function reads the id, username, roles and expiry from the access token.
- **Auth `…Api`.** Sign in (a username or an email in one field), refresh and sign out. Sign in and refresh answer without the envelope and are wrapped into a result.
- **Restore.** Every page load calls refresh before the first route activates.
- **Interceptor.** It adds the token to `/api` calls. On a `401` from anything but sign in and refresh it refreshes once and retries once; simultaneous `401`s share one refresh; a failed refresh clears the session and goes to sign-in.
- **Tabs take turns refreshing** through the Web Locks API, because refresh tokens rotate.
- **Three guards:** signed in, signed out, administrator. A guard that turns someone away to sign-in passes the wanted address along, and sign-in returns there. Only an address inside the app is accepted as a return target.
- **An unstyled sign-in form and a sign-out button,** enough to prove all of this in the running app. Ticket 08 replaces the form with the real page.

Decisions are under "Addresses" and "Auth pages" in `planning/frontend/spec.md`, and in "Session and auth" and "Routing" in the conventions skill's TypeScript reference.

**Blocked by:** 02 (The Angular app starts, reaches the backend through the proxy, and CI checks it)

**Status:** done

**Difficulty:** tricky: an auth boundary, with concurrent refreshes inside one tab and across tabs, and a cookie that must survive the proxy.

- [x] In the running app, a user signs in, reloads, and is still signed in (the refresh cookie survives the dev proxy)
- [x] With two tabs open, both stay signed in after each has refreshed
- [x] Signing out clears the session, and a reload stays signed out
- [x] The token is never written to `localStorage` or `sessionStorage`
- [x] The decoder is unit-tested for the four claim names, for `role` missing, as a string and as an array, and for a base64url, UTF-8 payload
- [x] The interceptor is unit-tested: a `401` leads to one refresh and one retry; two simultaneous `401`s lead to one refresh; a failed refresh clears the session; sign in and refresh are never retried
- [x] Each guard is unit-tested, including the remembered return address and the refusal of a return address outside the app
- [x] A signed-in user who opens the sign-in address is sent to the home address
- [x] A user without the administrator role who opens an admin address is turned away

## Comments

- **Merged with ticket 03 (2026-11-16):** `master` was merged into this branch, following the note in ticket 03. The session bar, the sign-in page and the admin users page now take their texts from `english.ts` and `georgian.ts` (`session`, `auth.signIn`, `admin.users`), and `AuthApi` passes `httpFailures` to `toAppResultWithoutEnvelope`.
