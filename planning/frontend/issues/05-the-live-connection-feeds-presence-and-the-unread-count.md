# 05: The live connection feeds presence and the unread count

**What to build:** Once a user is signed in, the app holds one live connection to the hub, and what arrives on it changes shared state that any page can read.

- **Hub client.** One client in `core/` owns the connection to `/hubs/messages`. It starts after sign-in, stops on sign-out and reconnects by itself. On every connect it asks the session store for a valid access token, which refreshes first when the token has expired.
- **Events.** The event names and payload types mirror `docs/backend/signalr.md`, as constants and DTO types. The client maps each server event to one store method and holds no logic of its own. Events whose store arrives in a later ticket (messages, comments, likes) are mapped then.
- **Presence store.** Which friends are online, and when the others were last active. It starts from what friend rows carry ("last active", where empty means online) and is updated by `UserOnline` and `UserOffline`. For an online event about a friend whose name it does not hold, it looks the user up by id.
- **Unread store.** The number of conversations with unread messages. It is read from the backend, and read again after anything that can change it; it is never computed in the client.
- **Proof in the running app.** The bare page shows the unread count and the friends who are online, until the shell replaces it.

Decisions are under "Scaffold and plumbing" in `planning/frontend/spec.md`, and in "Real-time" and "State" in the conventions skill's TypeScript reference.

**Blocked by:** 04 (A user signs in and stays signed in)

**Status:** done

**Difficulty:** tricky: real-time behaviour, reconnects and token renewal on a connection that outlives the access token.

- [x] In the running app, the hub connects through the dev proxy after sign-in and disconnects on sign-out
- [x] With two browsers signed in as two friends, one signing in or closing changes the other's bare page without a reload
- [x] A message sent to the user from the API changes the unread count on the bare page without a reload
- [x] After the network drops and returns, the connection comes back by itself, with a valid token
- [x] The presence store is unit-tested through its public methods: the starting state, a friend coming online, a friend going offline with a last active time, and an unknown friend being looked up
- [x] The unread store is unit-tested: it reads the count again when told that something changed, and exposes the latest answer
- [x] No component touches the connection, and nothing outside a store writes its signals

## Comments

- **Done (2026-11-17), on branch `claude/dazzling-pasteur-o137eq`, not yet merged into `master`.** The merge waits for the owner's answer on the two points below. The new dependency is one, and the conventions say to ask before adding one.
- **New dependency: `@microsoft/signalr` 10.0.11.** It matches the backend's .NET 10. It was installed with the pinned npm 11.19.0; npm 10 would have stripped the `libc` fields from the lockfile.
- **Changed rule: only a refused refresh ends the session.** The live check found that a refresh with no answer signed the user out. While the backend was down past the token's life, the reconnect asked for a fresh token, got a 502, and `SessionStore` cleared the session. Now only a `401` from `POST /api/auth/refresh` clears the session; it is the backend's only refusal. Any other failure keeps the session, so a later attempt can refresh: offline, a 502 from the proxy, a 429. The interceptor then retries the call once with the same token, and the call fails without sending the user to sign-in.
  - Updated to match: the conventions' "Session and auth", the refresh-flow bullet under the spec's Testing Decisions, and the comments in `SessionStore` and `authInterceptor`.
  - A test in `session-store.spec.ts` and one in `auth-interceptor.spec.ts` pin the behaviour.
- **Conventions, one more line:** "Path literals appear only in `…Api` files" now adds "and the hub's address only in the hub client".
- **How it was checked:** in headless Chromium from a cloud session, since the Chrome extension is not available there. The backend ran in Testing on a seeded pool database, with 1-minute access tokens, behind the dev proxy. alice and bob are seeded friends.
  - The hub socket opened through `localhost:4200/hubs/messages` on sign-in and closed on sign-out.
  - bob signing in and closing changed alice's bare page live.
  - A message from bob through the API moved alice's count from 0 to 1.
  - "The network drops" was simulated by stopping the backend for 80 seconds (the proxy answered 502), longer than the token lives. alice reconnected by herself with a newly refreshed token, and the unread count and friend lists were read again.
  - The page does not scroll sideways at 360 px.
- **Presence after a reconnect.** `HubClient.connectionNumber` counts connects and reconnects. The bare page reads the friend lists again on each one, because events missed during an outage are lost. Rows asked for before a live event do not overwrite it (`PresenceStore.track(rows, askedAt)`).
  - Ticket 18's conversation store should do the same: pass the time it asked, and read again on a new connection number.
- **Ticket 19 note:** `ReceiveMessage` is mapped straight to `UnreadStore.refresh()`, because no conversation store exists yet. Ticket 19 maps it to the conversation store, which re-reads the count only for a conversation that is not open.
- **Backend bug found, out of scope:** `UserRepository.GetNonConversationFriendsAsync` checks `Accepted` on only one side of an `||`. A user who only sent the caller a friend request is listed as a friend (seeded charlie shows up for alice). It is queued as a separate task.
- **Known limit, backend:** when the backend stops without a clean shutdown, connected users keep an empty `LastOnlineAt`, so friend rows show them online until they connect and disconnect again.

