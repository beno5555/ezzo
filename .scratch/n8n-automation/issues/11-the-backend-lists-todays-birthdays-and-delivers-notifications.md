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

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the work is fully specified and the push copies an existing one, but the date rule and the two directions of a friendship must hold together.

- [ ] With the key and a `date`, the list returns a row for each user with an accepted friend born on that month and day, with that friend's id and username
- [ ] A user with several such friends gets one row that names them all
- [ ] The friendship counts whichever of the two sent the request; a pending and a declined friendship do not count
- [ ] A date on which no friend has a birthday returns an empty list
- [ ] A friend born on 29 February is listed for 29 February in a leap year, for 28 February in another year, and not for 28 February in a leap year
- [ ] A deactivated recipient and a deactivated friend are left out; a user with the digest switch off is still listed
- [ ] Without the `date`, the list uses today's UTC date
- [ ] Paging works and the order is stable across pages
- [ ] With the key, posting a `BIRTHDAY` notification for two connected users delivers `ReceiveNotification` with the kind and the data to both, and nothing to a third connected user (real SignalR clients)
- [ ] An unknown recipient id and a recipient who is not connected cause no failure
- [ ] An unknown kind, no recipients and 101 recipients are refused with the validation shape
- [ ] Without the key, with a wrong key, with a user's token and with an administrator's token, both routes answer `401`
- [ ] Each new route has its own rate-limit policy
- [ ] New seed rows are appended and no existing seeded id changes
- [ ] `docs/backend/controllers.md`, `signalr.md` and `automation.md` describe the two routes and the push
