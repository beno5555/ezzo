# 21: Live toasts

**What to build:** A user who is on any page is told, by a toast, about what happens elsewhere. Each toast is a link.

| Event | Toast | A click opens |
|---|---|---|
| `ReceiveMessage` | The friend's name and the start of the message, or "Photo" | That conversation |
| `ReceiveComment` | Who commented on my post | The post |
| `PostLiked` | Who liked my post | The post |
| `UserOnline` | The friend's name, and that they are online | That conversation |

- **No message toast for the open conversation.** The user can already see the message.
- **At most one online toast per friend in 5 minutes.** A friend who reloads a page goes offline and online again, and that must not produce a toast each time.
- **The friend's name** for an online toast comes from the presence store, which looks an unknown friend up by id.
- **The toast store's own limits** apply: 5 seconds on screen, three at most.
- **Counts on pages do not change live.** A like or a comment that arrives changes no number on a page that is already open; the numbers follow on the next load.

The rules that decide whether an event becomes a toast live in one place with no template, so they can be tested.

Decisions are under "Toasts" in `.scratch/frontend/spec.md`. Events and payloads are in `docs/backend/signalr.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 18 (Chat: the conversation list and reading a conversation), and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** routine: four events mapped to toasts by exact rules, each rule unit-tested with fake timers.

- [ ] A message for a closed conversation shows a toast; a message for the open conversation shows none (unit-tested)
- [ ] A comment and a like on the user's post each show a toast that opens the post
- [ ] A friend coming online shows a toast; the same friend coming online again within 5 minutes shows none, and after 5 minutes shows one (unit-tested with fake timers)
- [ ] A message that has only photos reads "Photo" in the toast
- [ ] A click on each toast leads to the right address
- [ ] All toast texts come from the dictionaries, in both languages
- [ ] Checked in the running app with two accounts in two browsers
