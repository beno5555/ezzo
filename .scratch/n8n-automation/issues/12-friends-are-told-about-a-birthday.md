# 12: Friends are told about a birthday

**What to build:** Every day at 09:00 Tbilisi time, each user who has a friend with a birthday that day gets one notification in WebCity, if they are connected, and one email. A user with several such friends gets one of each, naming them together.

- **The workflow** starts from a schedule, daily at 09:00. It reads `GET /api/internal/birthdays` with the API key credential, page by page, until a page comes back short. It sends no `date`, so the backend uses today's UTC date. 09:00 in Tbilisi is 05:00 UTC, the same UTC day.
- **For each row,** two things:
  - one call to `POST /api/internal/notifications` for that recipient, with the kind `BIRTHDAY` and the row's friends as the data;
  - one email built from an HTML template that names the friends and links to WebCity. The product's name and the address come from `.env`. The text is English (ADR 0006). n8n's attribution line is off.
- **Batches.** Rows are worked through in groups with a pause between them, so a day with many birthdays does not hit the SMTP account's limit at once.
- **The email does not follow the digest switch.**
- **The checklist** for this workflow is added to the `n8n/` README. It is run by starting the workflow by hand, with a test account's date of birth set to today.

Until ticket 13 is built, the notification can be seen arriving in the browser's developer tools, on the hub connection.

Birthdays are second on the roadmap's "Last in line" list, after the digest.

Runs on the owner's machine: it needs Docker running and the SMTP account in n8n's credentials file. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" in `.scratch/n8n-automation/spec.md`. Notification is defined in `GLOSSARY.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 11 (The backend lists today's birthdays and delivers notifications)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): it copies the paged read and the email of ticket 09 where that exists, but no test catches a broken workflow; it is proven only by running it.

- [ ] Started by hand, with one test account born today, each of its accepted friends gets one email that names it, and nobody else gets one
- [ ] A friend who is connected to WebCity receives `ReceiveNotification` with the kind `BIRTHDAY` and the friend's id and username
- [ ] A user with two friends born today gets one email and one notification that name both
- [ ] A friend who is not connected still gets the email, and the run does not fail
- [ ] On a day with no birthdays the run ends without sending anything
- [ ] The schedule is daily at 09:00 in `Asia/Tbilisi`
- [ ] The email carries no n8n attribution line
- [ ] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [ ] The owner ran the checklist on their machine
