# n8n automation

Status: ready-for-agent

## Problem Statement

The documentation sent to the principal (`webcity-documentation.md`) promises six things that WebCity does on its own, without a person asking. None of them exists:

- Nobody checks new content. A post that breaks the rules stays visible until a user reports it and an administrator opens the report.
- An administrator learns about a report only by opening the reports list. A post that many people report stays visible the whole time.
- A new user gets no welcome.
- A user who stays away is never told what they missed.
- Nobody is told that a friend has a birthday.
- When the server fails, a developer finds out by reading log files, or from a user.

## Solution

Add the **automation**: n8n, running in Docker beside the backend, with six workflows. The backend tells the automation what happened, as signed events. The automation acts through a small set of endpoints that only it can call, and through Telegram, email and OpenAI.

- **AI moderation.** New and edited posts and comments, and the photos of a new post, are checked by OpenAI's moderation endpoint. Doubtful content becomes Flagged, clearly violating content becomes Hidden, and administrators get an alert either way.
- **Report handling.** Every new report raises an alert. A post or comment with five pending reports within 24 hours is hidden until an administrator decides.
- **Welcome email.** A new account gets a welcome email.
- **Weekly digest.** Once a week a user gets an email with their unread conversations, their pending friend requests and popular posts by their friends. A switch on the settings page turns it off.
- **Birthdays.** Every day, a user whose friends have a birthday gets one notification in the app and one email.
- **Exception alerts.** An unhandled exception, in a request or in a background job, reaches the developers on Telegram.

The six emails the backend already sends (about passwords, reactivation and deactivation) do not move to the automation (ADR 0008).

## User Stories

### AI moderation

1. As a user, I want my post to appear as soon as I publish it, so that a check I cannot see never makes me wait.
2. As a user, I want a post that clearly breaks the rules to disappear within seconds, so that I rarely see abuse.
3. As a user, I want comments checked the same way as posts, so that abuse cannot move to the comments.
4. As a user, I want the photos of a post checked, so that a clean caption cannot carry a violating picture.
5. As a user, I want an edited post or comment checked again, so that nobody can publish something clean and then change it into abuse.
6. As a user, I want my direct messages never sent to a moderation service, so that my private conversations stay private.
7. As an administrator, I want doubtful content flagged and left visible, so that a machine's uncertainty never removes something by itself.
8. As an administrator, I want flagged content to appear in the moderation queue I already have, so that I review it where I review everything else.
9. As an administrator, I want an alert on Telegram when the automation flags or hides something, so that I know without opening WebCity.
10. As an administrator, I want the same alert by email, so that I have a record outside a chat.
11. As an administrator, I want the alert to say what was checked, who wrote it and which categories it broke, so that I can judge its urgency from the alert.
12. As an administrator, I want the automation unable to make hidden content visible again, so that only a person can undo a hide.
13. As an administrator, I want a hidden post to stay hidden after its author edits it, so that an edit is not a way around moderation.
14. As an author, I want to still see my own hidden post, marked as hidden, so that I know what happened to it.
15. As the owner, I want the scores that decide between flagging and hiding kept in n8n, so that I can tune them without rebuilding the backend.

### Report handling

16. As an administrator, I want an alert for every new report, so that I do not have to keep the reports list open.
17. As an administrator, I want the alert to show what was reported, the reason and the reporter, so that I can decide whether to look now.
18. As a user, I want a post that five people report within a day hidden until someone looks, so that obvious abuse does not wait for an administrator.
19. As an administrator, I want a post hidden by reports to keep its reports pending, so that I still make the decision.
20. As an administrator, I want an alert when reports hide something, so that I review it soon.
21. As a user, I want my account never deactivated by reports alone, so that a group of people cannot switch me off.
22. As an administrator, I want an alert when a user is reported, so that I can look at the account myself.
23. As the owner, I want the number of reports and the time window kept in n8n, so that I can change them without rebuilding the backend.

### Welcome email

24. As a new user, I want a welcome email after I register, so that I know the account exists and what to do first.
25. As a user whose account an administrator created, I want the same welcome email, so that I learn the account exists.
26. As a user, I want every email about my password and my account's state to keep arriving even when the automation is down, so that I never lose control of my account.
27. As the owner, I want the welcome email's text and layout kept in n8n, so that I can change them without rebuilding the backend.

### Weekly digest

28. As a user, I want a weekly email telling me how many conversations have unread messages, so that I come back to answer.
29. As a user, I want that email to say how many friend requests are waiting, so that I do not leave people unanswered.
30. As a user, I want it to show the three most-liked recent posts by my friends, so that I see what I missed.
31. As a user with nothing new, I want no digest that week, so that I am not sent an empty email.
32. As a user, I want a switch on the settings page that turns the digest off, so that I decide what reaches my inbox.
33. As a user, I want the switch to take effect when I flip it, so that I do not have to save a form.
34. As a user, I want the digest to say where to turn it off, so that I can stop it from the email.
35. As a new user, I want the digest on by default, so that I get it without looking for a setting.
36. As a user who deactivated the account, I want no digest, so that a paused account stays quiet.
37. As a user, I want hidden posts left out of the digest, so that the email never promotes moderated content.

### Birthdays

38. As a user, I want to be told in the app when a friend has a birthday today, so that I can congratulate them.
39. As a user, I want an email about it as well, so that I learn of it when I am not using WebCity.
40. As a user with several friends born on the same day, I want one email and one notification that name them together, so that I am not flooded.
41. As a user, I want a click on the birthday toast to take me to the friend, so that I can write to them at once.
42. As a user born on 29 February, I want my birthday noticed on 28 February in other years, so that it is not skipped three years out of four.
43. As a user, I want birthdays to follow the date I entered, wherever I am, so that a time zone never moves the day.
44. As a user, I want the birthday notification in the language of my interface, so that it reads like the rest of WebCity.

### Exception alerts

45. As a developer, I want a Telegram alert when a request fails with an unhandled exception, so that I learn of a failure before a user tells me.
46. As a developer, I want the same alert when a background job fails, so that a job does not fail silently for days.
47. As a developer, I want the alert to carry the exception type, the message, the first lines of the stack trace, and where and when it happened, so that I can start from the alert.
48. As a user, I want no request body, header, query string or personal data in an alert, so that a failure never leaks my data into a chat.
49. As a developer, I want a burst of the same exception grouped into one follow-up message, so that an outage does not bury the chat.
50. As a developer, I want an event that cannot be delivered to produce no further event, so that an n8n outage cannot start a loop.

### The boundary between the backend and the automation

51. As a developer, I want every event signed with a shared secret, so that n8n acts only on what the backend sent.
52. As a developer, I want n8n to answer 401 to a wrong signature, so that a forged event is visible to its sender and does nothing.
53. As a developer, I want the automation recognised by an API key and not by a user account, so that it never appears in search, statistics or friend lists.
54. As a developer, I want the API key accepted only on the internal routes and the two moderation routes, so that a leaked key cannot touch accounts.
55. As a developer, I want no event to carry a token, a password or another secret, so that nothing sensitive rests in n8n (ADR 0008).
56. As a user, I want my action to succeed when n8n is down, so that the automation is never a reason a post fails.
57. As a developer, I want a failed delivery written to the logs an administrator reads, so that lost events can be found.
58. As a developer, I want one setting that turns events off, so that a fresh clone, the test suite and a cloud session work without n8n.
59. As a developer, I want every action of the automation logged as the automation's, so that the logs tell a person's decision from a machine's.
60. As a developer, I want each new route to have its own rate-limit policy, so that the house pattern has no holes.

### Running it

61. As the owner, I want one command to start n8n with every workflow imported and published, so that a clean start needs no clicking.
62. As the owner, I want the workflows stored as files in the repository, so that they are versioned with the code that sends their events.
63. As the owner, I want every secret in gitignored files, with a committed example beside them, so that nothing sensitive is committed and a new setup knows what to fill in.
64. As the owner, I want the two shared secrets generated by a script and written to both sides, so that I never invent or copy them by hand.
65. As the owner, I want the n8n version pinned, so that a one-way upgrade cannot happen a week before the hand-in.
66. As the owner, I want a checklist for each workflow, so that I can prove all six work before the hand-in.
67. As a coding agent, I want the per-area docs, the README and `CLAUDE.md` updated with each ticket, so that the docs keep matching the code.

## Implementation Decisions

### Across the whole spec

- **Words.** Automation, Notification, Alert, Toast, Report, Flagged, Hidden and Digest mean what `GLOSSARY.md` says. A user reports; an administrator or the automation flags.
- **House patterns hold.** Controllers call services, services call repositories, no interfaces, the result wrapper, `LogResultAsync` for outcomes, static mappers, tiered DTOs, one type per file, no magic literals, UTC times. Every new action carries a rate-limit policy of its own.
- **Failure shapes do not grow.** New failures return the envelope; input validation keeps the framework's shape (ADR 0003).
- **New settings have defaults in their options class,** because the settings files are gitignored and CI writes its own. Events are off by default. Each new setting is added to the prerequisites list in `CLAUDE.md`.
- **The schema changes once:** `digestEmailEnabled` on `User`, through `dotnet ef migrations add`. Existing users get `true`.
- **Emails written by the automation are in English** (ADR 0006), and take the product's name from one n8n-side value, because the name may change before the hand-in.

### Events

- **One module publishes events.** Its interface is one call: an event name and a data object. It hides the envelope, the JSON, the signature, the HTTP call, the timeout, the off switch and the failure log. It never throws.
- **The envelope:** a unique id, the event name, the UTC time the thing happened, and `data`. JSON is written the way the API writes it: camelCase, enums as the API's text, times marked UTC (ADR 0005).
- **Where it goes:** `POST {base URL}/webhook/{event name}`. One base URL setting; the event name is the path.
- **The signature:** the header `X-WebCity-Signature` holds the lower-case hex of HMAC-SHA256 over the exact bytes of the body, keyed with the shared signing secret. There is no timestamp.
- **When it is sent:** by the service, in the same method that changed the data, after the change is committed. A change that is rolled back sends nothing.
- **How it is sent:** one awaited attempt with a timeout of 3 seconds (a setting). n8n answers as soon as it has checked the signature, so the wait is normally milliseconds. There is no retry and no stored queue.
- **When it fails** (n8n unreachable, a timeout, any answer that is not a success): one `Log` row through the database logger, as background jobs write theirs, and nothing else. The user's request is unaffected.
- **Settings:** on or off, the base URL, the signing secret, the timeout. When events are on and the base URL or the secret is missing, the app refuses to start. When events are off, publishing does nothing and writes no log.
- **No event carries a secret** (ADR 0008): no token, no password, no password hash.

| Event | Sent when | Data |
|---|---|---|
| `account-created` | a registration succeeds, or an administrator creates an account | user id, username, email |
| `post-created` | a post is created | post id, title, text, photo addresses, author id and username, moderation status |
| `post-edited` | a post's title or text is changed | the same as `post-created` |
| `comment-created` | a comment is created | comment id, text, post id, author id and username, moderation status |
| `comment-edited` | a comment's text is changed | the same as `comment-created` |
| `report-created` | a report is created | report id, target type, target id, reason, reporter id and username, the target snapshot the reports list shows, and the creation times of every pending report on the same target (this one included) |
| `exception-occurred` | an unhandled exception reaches the global handler, or a background job's cycle throws | exception type, message, the first 15 lines of the stack trace, the kind of place (request or job), the place (HTTP method and path without the query string, or the job's name), and a fingerprint made of the type and the place |

- **Photo addresses are the relative addresses the API already returns.** n8n prefixes its own setting for the backend's address.
- **The query string is never sent,** because hub connections carry the access token there.
- **An exception event is sent for every unhandled exception,** the conflict answer for a database update error included.
- **Publishing never raises an exception event.** A failure inside the publisher is caught there.
- **A route that throws on purpose is mapped only in Development,** as Swagger is. No existing route can be made to fail on request, and the tests, the first workflow's checklist and the demo all need one.

### The automation's identity

- **An API key in the `X-Api-Key` header,** recognised by its own authentication scheme beside the JWT scheme. The key is one setting. It is compared in constant time. When no key is configured, the scheme refuses every caller: an empty key never matches.
- **No `User` row.** The automation has no id, no username and no role an administrator could grant.
- **What it reaches:** every route under `/api/internal`, and the two moderation routes. Nothing else.
  - The internal routes accept only the key. Anyone else, an administrator included, gets `401`.
  - The two moderation routes accept an administrator or the automation.
  - Every other route ignores the key, so a request with only the key gets `401`.
- **Rate limits:** each internal route has its own policy, and the automation's requests are counted in one bucket of their own, not by IP.
- **Logs:** a row written for something the automation did has no user id, is marked as an authorized request, and names the automation in its details. Today a row without a user id is marked unauthorized, so this is a change to the database logger.

### Moderation by the automation

- **The automation only raises a status.** Through the two moderation routes it may set Flagged or Hidden. It is refused, with `403` and the envelope, when it sends Visible, or sends Flagged for content that is Hidden.
- **Setting the status it already has succeeds** and changes nothing.
- **The service is told that the caller is the automation,** the way services are already told that a caller is an administrator. An administrator's use of the same routes does not change.
- **The routes still do not touch reports.**
- **Content that no longer exists answers `404`,** which the workflows treat as nothing to do.

### Internal endpoints

- **`GET /api/internal/digest`:** paged with the paging parameters every list uses, ordered by user id. One row per user who has the digest switch on and something to report. A row carries the user's id, username and email, the number of conversations with unread messages, the number of pending friend requests received, and up to three posts.
  - The posts are the most-liked posts created in the last 7 days by the user's accepted friends, newest first on a tie, never Hidden ones. Each carries its id, title, author's username and like count.
  - "Something to report" means at least one of the three is not zero or empty.
  - Deactivated and deleted accounts are left out, as recipients and as authors, by the existing filter.
- **`GET /api/internal/birthdays`:** paged, ordered by user id. One row per recipient: a user with at least one accepted friend whose birthday is on the date. A row carries the recipient's id, username and email, and the id and username of each such friend.
  - The date is today by UTC, or the optional `date` parameter. The parameter lets a missed day be run again and lets the 29 February rule be tested.
  - A birthday matches on month and day. In a year without 29 February, a 29 February birthday matches 28 February.
  - The digest switch has no effect here.
- **`POST /api/internal/notifications`:** a list of recipient ids (1 to 100), a kind, and a data object. The backend pushes `ReceiveNotification` with the kind and the data to each recipient's hub group. Nothing is stored. A recipient who is not connected, or does not exist, receives nothing and causes no failure.
  - The only kind is `BIRTHDAY`. Its data is the list of friends (id and username) whose birthday it is. Another kind is refused by validation.
  - The service that handles it pushes through the hub context in the same method, as every other push does.

### The digest switch

- **`digestEmailEnabled` is returned in the user's own shape,** and nowhere else.
- **It has its own route:** `PUT /api/users/mine/digest-email`, with one boolean. It is not a field of the profile update, because that update replaces the whole profile, and a client that does not know the field would switch the digest off without meaning to.
- **An administrator's edit of a user does not change it.**

### n8n setup

- **A third top-level folder, `n8n/`,** beside `backend/` and `frontend/`. It holds the compose file, the workflow files, the example files for the secrets, and a README with the setup steps and the checklists.
- **The image is pinned to `docker.n8n.io/n8nio/n8n:2.47.7`.** n8n 3.0 is a one-way upgrade and is not taken before the hand-in.
- **A named volume holds n8n's data.** The instance's timezone is `Asia/Tbilisi`.
- **Workflows are committed as one JSON file each, with a fixed id.** A one-shot service in the compose file imports the credentials, imports the workflows, and publishes each workflow by id, before n8n starts. A clean start therefore needs no clicking.
- **Exported workflows carry no pinned test data.** A payload pinned while building a workflow would be committed with it.
- **Credentials come from a gitignored file** that the import reads and n8n encrypts: SMTP, the Telegram bot, the OpenAI key, the API key (as a header credential) and the signing secret (as a Crypto credential). A committed example lists the entries with placeholders.
- **Values that differ per machine come from a gitignored `.env`,** read in workflows through `$env`: the backend's address as the container sees it, the frontend's address for links, the product's name, the two Telegram chat ids, the administrator address, the sender's address and name, and n8n's encryption key. This needs n8n's block on environment access turned off in the compose file, which is safe on an instance with one owner.
- **Numbers the owner may tune sit in one clearly named node at the top of each workflow:** the hide score, the report count and window, the grouping window.
- **A setup script generates the signing secret and the API key** and writes them to both sides, n8n's credentials file and the backend's development settings, without printing them.
- **n8n reaches the backend at `https://host.docker.internal:7102`,** with the HTTP Request node's option to ignore certificate problems, because the development certificate is issued for `localhost`. The backend reaches n8n at `http://localhost:5678`.

### The six workflows

- **Every webhook starts the same way:** the raw body option on, a Crypto node that computes the HMAC of the raw body with the Crypto credential, a comparison with the header, and a Respond to Webhook node that answers `401` on a mismatch and `200` otherwise. The work happens after the answer.
- **Telegram messages set their parse mode explicitly, escape what they insert, and switch n8n's attribution line off.** Emails switch it off too.
- **Exception alerts** (`exception-occurred`): one Telegram message to the developers' chat per event. This is the first workflow built.
  - **Grouping, built last:** the first event of a fingerprint alerts at once. Each event is also written as a row to an n8n Data Table. Further events of the same fingerprint within 10 minutes send nothing. A scheduled run sends one "seen N more times" message per fingerprint and deletes the rows it counted.
- **Welcome email** (`account-created`): one email from an HTML template.
- **AI moderation** (`post-created`, `post-edited`, `comment-created`, `comment-edited`): the text goes to OpenAI's moderation endpoint in one call, and each photo in a call of its own, downloaded from the backend and sent as base64. The highest result decides.
  - Marked as violating by OpenAI: set Flagged. Any category score of 0.9 or more: set Hidden.
  - An edit cannot add photos, so an edit is checked on its text alone.
  - Content that arrives already Hidden is not checked.
  - Flagged or Hidden: an alert to the administrators' chat and an email to the administrator address, with the content, its author, the outcome and the categories.
- **Report handling** (`report-created`): an alert to the administrators' chat for every report. For a post or a comment, when five or more of the pending report times fall within the last 24 hours, set Hidden through the moderation route and send the moderation alert, by Telegram and by email. For a reported user, the alert is all that happens.
- **Weekly digest** (a schedule, Mondays at 10:00): read the digest list page by page, and send each row one email with the three items, a link to WebCity and a line saying where to turn the digest off.
- **Birthdays** (a schedule, daily at 09:00): read the birthday list page by page. For each row, post one notification for that recipient and send one email naming the friends.

### Frontend

- **The digest switch** is a new section of the settings page: one switch, read from the user's own data, saved by its own call when flipped, with a toast if the save fails.
- **A fifth toast.** The hub client maps `ReceiveNotification` to the toast rules. For `BIRTHDAY`, the text comes from the dictionaries in both languages: one friend by name, or the first friend and the number of others. A click opens the conversation with the friend when there is one, and the friends page when there are several. A kind the frontend does not know is ignored.
- **Nothing in the frontend ever calls n8n.**

## Testing Decisions

- **What makes a good test here.** A test acts the way a caller does (an HTTP request as a user, as an administrator or as the automation; a hub connection) and asserts on what a caller would see: the status code, the response body, a push that arrives, an event that leaves. It does not reach into services or check which method ran.
- **Main seam: the existing HTTP integration seam.** The test host, real requests, the real test database, reset and reseeded per class.
- **One new seam: the outgoing call is recorded.** The test host turns events on, points them at an address that does not exist, and swaps the HTTP handler behind the publisher for a recorder that the test can read and can tell to fail. Tests assert the path, the envelope, the data and the signature, which they verify by computing it again from the recorded bytes and the test secret.
  - Each event is tested from the action that causes it: a registration, an administrator creating an account, a post and a comment created and edited, a report.
  - Nothing is sent when the action fails, and nothing when events are off.
  - With the recorder failing or timing out, the user's request still succeeds.
  - No recorded event contains a token: the registration, reset and reactivation flows are run and every recorded body is searched.
- **Exceptions.** Tests reach the Development-only route that throws, on a host started in Development. A request to it must produce one `exception-occurred` event without the query string. A background job built in the test that throws, run once through the existing `RunOnceAsync`, must produce one with the job's name. With the recorder failing, the exception answer is unchanged and no second event appears.
- **The automation's identity.** A helper sends requests with the test API key. Tests cover: the internal routes with the key, without it, with a wrong key, with a user's token and with an administrator's token; the key on a sample of ordinary and administrator routes, refused; the two moderation routes with the key; a host with no key configured, which refuses an empty key.
- **Raise-only moderation** is tested as a table of from-status, to-status and caller.
- **The internal lists** are tested by their properties, from seed data: who is included and who is left out (switch off, nothing to report, deactivated), the three posts and their order, hidden posts left out, paging. Birthdays use the `date` parameter: a match, no match, several friends in one row, both directions of a friendship, a pending friendship left out, 29 February in a leap year and in another year.
- **Notifications** use the real SignalR client: the named recipients receive `ReceiveNotification` with the kind and data, another connected user receives nothing, an unknown kind and an oversized recipient list are refused.
- **The digest switch:** on for a new user, changed by its route, returned in the own shape, untouched by a profile update and by an administrator's edit.
- **Seed data.** New seed rows are appended; existing seeded ids do not change. Each test class keeps the comment that describes the seed state it uses.
- **Frontend: Vitest unit tests** on the new `…Api` method against the HTTP testing backend, and on the birthday toast rule (one friend, several, an unknown kind, the address a click opens). The switch and the toast are then checked in the running app.
- **Workflows are not tested automatically.** Nothing in the test suite or CI starts n8n. Each workflow has a checklist in the `n8n/` README, run by hand against the real stack before the hand-in. The first ticket's checklist also proves the setup itself: a clean start imports and publishes, a wrong signature gets `401`, and the container reaches the backend.
- **Prior art.** The controller test classes (`Method_Condition_ExpectedResult`, grouped by endpoint), the hub tests with the shared SignalR client, the background-job tests that run a cycle through `RunOnceAsync`, and the test host's setting overrides.

## Out of Scope

- **Moving the six existing emails to n8n.** They stay in the backend (ADR 0008). Their plain look does not change.
- **Stored notifications:** a table, a list, an unread count, a bell. A notification reaches only a user who is connected. Listed under "After the deadline" in the roadmap.
- **Retried events:** an outbox and a resending job. An event sent while n8n is down is lost. Listed under "After the deadline".
- **Protection against a replayed event,** and a constant-time comparison inside n8n.
- **Moderation of direct messages,** of profile text (username, bio) and of photos added later.
- **An automatic test of any workflow.**
- **Discord.** Alerts go to Telegram.
- **An email to every administrator account.** Moderation emails go to one address.
- **Automatic deactivation of a reported user.**
- **A second switch for birthday emails.**
- **A host other than the owner's machine:** TLS for n8n, a public webhook address, n8n behind the reverse proxy.
- **Translated emails** (ADR 0006).
- **n8n 3.0.**

## Further Notes

- **Order.** The exception alert comes first, as one thin slice across everything: the publisher, the signature, the `n8n/` folder with its compose file and import, the setup script, and one workflow that ends in a Telegram message. It needs Docker and the Telegram bot only. After it: the automation's identity with raise-only moderation, the welcome email, AI moderation, report handling, the digest, birthdays, and alert grouping.
- **Last in line.** If time runs short, these are finished last, in this order from the end: the digest, birthdays, alert grouping, hiding by reports (the roadmap's list).
- **What can run without the owner.** Every backend part is covered by integration tests and can be built in a cloud session. A workflow cannot be finished there, because someone has to run its checklist against real Telegram, SMTP and OpenAI.
- **The frontend parts wait for frontend tickets.** The digest switch needs the settings page (frontend 17). The birthday toast needs the live connection (frontend 05) and the live toasts (frontend 21).
- **Nothing here was run against a real n8n.** The n8n facts come from its documentation and source at 2.47.7. The first slice exists to settle the unproven ones: import followed by publish in a compose service, the Crypto node's check of a raw body, `$env` in expressions, and reaching a backend that listens on `localhost` through `host.docker.internal`. If one fails, the slice finds the replacement before any other workflow is built on it.
- **Not confirmed:** that OpenAI's moderation endpoint serves an account with no payment method, and that it refuses more than one photo per call. The workflow sends one photo per call either way.
- **Needs from the owner:** the Telegram bot token and chat ids before the first slice; the OpenAI key before AI moderation; the administrator address; the SMTP account, which may be the one the backend uses.
- **Deliberate differences from the documentation:**
  - Of the emails it lists under n8n, only the welcome email goes through n8n (ADR 0008).
  - Edits are moderated as well as new content.
  - Alerts go to Telegram, not "Telegram or Discord".
  - A notification is not stored.
- **Additions to the documentation:** `PUT /api/users/mine/digest-email`, the `date` parameter of the birthday list, and the events for edited posts and comments.
- **Docs to update as behavior lands:** a new `docs/backend/automation.md` for the events, the identity and the internal routes; `auth.md` (the second authentication scheme); `controllers.md`; `signalr.md` (`ReceiveNotification`); `data.md` (the new column); `background-jobs.md` (a failed cycle now sends an event); `README.md`; and in `CLAUDE.md` the new settings, the `n8n/` folder and its commands.
