# 04: The backend tells the automation about new accounts, content and reports

**What to build:** Six more events leave the backend through the publisher from ticket 01, each sent by the service in the same method that changed the data, after the change is committed. The workflows that listen to them are tickets 05, 06 and 07.

| Event | Sent when | Data |
|---|---|---|
| `account-created` | a registration succeeds, or an administrator creates an account | user id, username, email |
| `post-created` | a post is created | post id, title, text, photo addresses, author id and username, moderation status |
| `post-edited` | a post's title or text is changed | the same as `post-created` |
| `comment-created` | a comment is created | comment id, text, post id, author id and username, moderation status |
| `comment-edited` | a comment's text is changed | the same as `comment-created` |
| `report-created` | a report is created | report id, target type, target id, reason, reporter id and username, the target snapshot the reports list shows, and the creation times of every pending report on the same target (this one included) |

- **Photo addresses** are the relative addresses the API already returns.
- **Nothing is sent when the action fails:** a refused registration, a refused report, an edit by someone who may not edit.
- **No event carries a secret** (ADR 0008): no token, no password, no password hash. A registration attempt with an address that is already registered sends no event; that case keeps its email from the backend.
- **A failed delivery never fails the action.** The publisher already guarantees it; one test here proves it for a user-facing action.

Decisions are under "Events" in `.scratch/n8n-automation/spec.md`. The six emails the backend sends itself are not touched (ADR 0008).

**Blocked by:** 01 (A failure in the backend leaves as a signed event)

**Status:** ready-for-agent

**Difficulty:** routine: six calls to the publisher from ticket 01, each proven by the recorder from that ticket.

- [ ] A successful registration records one `account-created` event with the id, username and email; an administrator creating an account records the same
- [ ] A registration refused for a taken username or a registered email records no event
- [ ] Creating a post with photos records `post-created` with the title, the text, every photo's relative address, the author and the status; editing it records `post-edited`
- [ ] Creating and editing a comment record `comment-created` and `comment-edited` with the text, the post id and the author
- [ ] A refused create or edit records nothing
- [ ] A report records `report-created` with the target snapshot and the reason; a second user's report on the same target carries both pending times; a decided report's time is no longer among them
- [ ] A refused report (own content, a second pending report by the same user) records nothing
- [ ] With the recorder failing, creating a post still succeeds
- [ ] The registration, password reset and reactivation flows are run, and no recorded body contains a reset token or a password
- [ ] `docs/backend/automation.md` lists the six events and their data
