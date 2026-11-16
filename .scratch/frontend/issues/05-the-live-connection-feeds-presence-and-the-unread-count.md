# 05: The live connection feeds presence and the unread count

**What to build:** Once a user is signed in, the app holds one live connection to the hub, and what arrives on it changes shared state that any page can read.

- **Hub client.** One client in `core/` owns the connection to `/hubs/messages`. It starts after sign-in, stops on sign-out and reconnects by itself. On every connect it asks the session store for a valid access token, which refreshes first when the token has expired.
- **Events.** The event names and payload types mirror `docs/backend/signalr.md`, as constants and DTO types. The client maps each server event to one store method and holds no logic of its own. Events whose store arrives in a later ticket (messages, comments, likes) are mapped then.
- **Presence store.** Which friends are online, and when the others were last active. It starts from what friend rows carry ("last active", where empty means online) and is updated by `UserOnline` and `UserOffline`. For an online event about a friend whose name it does not hold, it looks the user up by id.
- **Unread store.** The number of conversations with unread messages. It is read from the backend, and read again after anything that can change it; it is never computed in the client.
- **Proof in the running app.** The bare page shows the unread count and the friends who are online, until the shell replaces it.

Decisions are under "Scaffold and plumbing" in `.scratch/frontend/spec.md`, and in "Real-time" and "State" in the conventions skill's TypeScript reference.

**Blocked by:** 04 (A user signs in and stays signed in), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** tricky: real-time behaviour, reconnects and token renewal on a connection that outlives the access token.

- [ ] In the running app, the hub connects through the dev proxy after sign-in and disconnects on sign-out
- [ ] With two browsers signed in as two friends, one signing in or closing changes the other's bare page without a reload
- [ ] A message sent to the user from the API changes the unread count on the bare page without a reload
- [ ] After the network drops and returns, the connection comes back by itself, with a valid token
- [ ] The presence store is unit-tested through its public methods: the starting state, a friend coming online, a friend going offline with a last active time, and an unknown friend being looked up
- [ ] The unread store is unit-tested: it reads the count again when told that something changed, and exposes the latest answer
- [ ] No component touches the connection, and nothing outside a store writes its signals
