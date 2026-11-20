# 11: The backend lists today's birthdays and delivers notifications

**What to build:** The automation can ask the backend who has friends with a birthday today, and can ask it to show a notification to users who are connected. The daily workflow is ticket 12 and the toast is ticket 13.

- **`GET /api/internal/birthdays`.** Only the automation's API key opens it; anyone else, an administrator included, gets `401` (the rule from ticket 03). Paged with the paging parameters every list uses, ordered by user id. One row per recipient: a user with at least one accepted friend whose birthday is on the date. A row carries the recipient's id, username and email, and the id and username of each such friend.
  - **The date** is today by UTC, or the optional `date` parameter. The parameter lets a missed day be run again and lets the 29 February rule be tested.
  - **A birthday matches on month and day.** In a year without 29 February, a 29 February birthday matches 28 February.
  - **A friendship counts in both directions,** whoever sent the request, and only when it is accepted.
  - **Deactivated and deleted accounts** are left out, as recipients and as friends, by the existing filter.
  - **The digest switch has no effect here.**
- **`POST /api/internal/notifications`.** Only the key opens it. The body is a list of recipient ids (1 to 100), a kind and a data object. The backend pushes `ReceiveNotification` with the kind and the data to each recipient's hub group, through the hub context, in the same service method, as every other push does.
  - **The only kind is `BIRTHDAY`.** Its data is the list of friends (id and username) whose birthday it is. Another kind, an empty list of recipients and a list of more than 100 are refused by validation.
  - **Nothing is stored.** A recipient who is not connected, or does not exist, receives nothing and causes no failure.

Ticket 08 also adds a route under `/api/internal`. Whichever of the two tickets lands first creates that group of routes, and the other adds to it.

Decisions are under "Internal endpoints" in `.scratch/n8n-automation/spec.md`. Notification is defined in `GLOSSARY.md`: a message, a comment or a like reaching a user is not a notification.

**Blocked by:** 03 (The automation calls the backend with its own key and can only raise a moderation status)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): the work is fully specified and the push copies an existing one, but the date rule and the two directions of a friendship must hold together.

- [x] With the key and a `date`, the list returns a row for each user with an accepted friend born on that month and day, with that friend's id and username
- [x] A user with several such friends gets one row that names them all
- [x] The friendship counts whichever of the two sent the request; a pending and a declined friendship do not count
- [x] A date on which no friend has a birthday returns an empty list
- [x] A friend born on 29 February is listed for 29 February in a leap year, for 28 February in another year, and not for 28 February in a leap year
- [ ] A deactivated recipient and a deactivated friend are left out; a user with the digest switch off is still listed
- [x] Without the `date`, the list uses today's UTC date
- [x] Paging works and the order is stable across pages
- [x] With the key, posting a `BIRTHDAY` notification for two connected users delivers `ReceiveNotification` with the kind and the data to both, and nothing to a third connected user (real SignalR clients)
- [x] An unknown recipient id and a recipient who is not connected cause no failure
- [x] An unknown kind, no recipients and 101 recipients are refused with the validation shape
- [x] Without the key, with a wrong key, with a user's token and with an administrator's token, both routes answer `401`
- [x] Each new route has its own rate-limit policy
- [x] New seed rows are appended and no existing seeded id changes
- [x] `docs/backend/controllers.md`, `signalr.md` and `automation.md` describe the two routes and the push

## Comments

**2026-11-21, files expected to collide with ticket 08** (built in parallel in the `worktree-n8n-08-digest` lane; both add routes under `/api/internal`):

- `backend/aspnetproject/Controllers/Internal/InternalController.cs`: this ticket creates it with `[Route("api/internal")]` and the `AutomationOnly` policy. If 08 creates the same file, the merge is an add/add conflict: keep one class and put both tickets' actions in it.
- `backend/aspnetproject/Extensions/RateLimitConfig.cs`: both add an `Internal` region to `Policies` and to `AddApplicationRateLimiting`.
- `backend/aspnetproject/Extensions/ApplicationServicesExtensions.cs`: both register a new service.
- `backend/aspnetproject/Common/ProjectConstants/ResponseMessages.cs` and `Constants.cs`: both append messages and constants.
- `backend/aspnetproject/Data/Repositories/UserRepository.cs` or `FriendshipRepository.cs`: both may add a list query. This ticket adds its query to `FriendshipRepository`.
- `docs/backend/controllers.md` and `docs/backend/automation.md`: both add a section on the internal routes.
- `.scratch/roadmap.md`: both tick their step and add an "Awaiting the owner's review" line.

Not expected to collide: this ticket adds no migration and no seed rows (the birthday tests insert their own rows; see below), so 08's migration, model snapshot and `TestDataSeeder` changes do not overlap.

The digest switch comes from 08 and does not exist on this branch yet. The birthday query never reads it, so "a user with the digest switch off is still listed" can be tested only after 08 merges.

**2026-11-21, done.** All boxes but one are ticked. The open box is "a user with the digest switch off is still listed": the deactivated half is tested (`GetBirthdays_LeavesOutDeactivatedAndDeletedAccountsAsRecipientsAndAsFriends`), and the digest half needs 08's switch. Once both branches are in `master`, add one test to `InternalBirthdaysTests` that turns the switch off for bob and still finds bob's row on 1 January, then tick the box. The seed-rows box holds because no seed row was added.

Beyond the ticket:

- `data.friends` must hold at least one friend (`400` otherwise). The spec says the data is the list of friends whose birthday it is, and ticket 13's toast needs a first friend's name.
- A recipient id named twice is told once.

**For ticket 12** (from the spec review):

- **The data is an object:** `{ "recipientIds": [...], "kind": "BIRTHDAY", "data": { "friends": row.friends } }`. Sending the friends list itself as `data` is refused by validation. The spec's "a data object" is the reason for the wrapper; `docs/backend/controllers.md` (`InternalController`) has the exact shape.
- **The rate limit:** `POST /api/internal/notifications` allows 60 calls a minute (`InternalSendNotifications`), and `GET /api/internal/birthdays` 30 a minute, each in the automation's own bucket. With one call per recipient, the batches and their pauses must keep the workflow under 60 calls a minute, or it gets `429` part-way through.

The spec review (Opus 5.5) found nothing missing or wrong beyond the two points above. The standards review found no hard violation; fixed after it: four parameters wrapped one per line, the access tests' ids named, a date-bound test comment rewritten, and `Constants.LastDayOfFebruaryInACommonYear` named. Left for the owner: `BirthdayRecipientDto` carries no tier in its name though it holds an email (as the automation's event DTOs do), and neither new service writes a `Log` row (as `StatisticsService` does not).
