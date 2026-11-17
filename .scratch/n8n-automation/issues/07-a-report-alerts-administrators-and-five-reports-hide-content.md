# 07: A report alerts administrators, and five reports hide content

**What to build:** Every new report reaches the administrators on Telegram at once. A post or a comment that collects five pending reports within 24 hours is hidden until an administrator decides, and the administrators are told.

- **The workflow** listens on `report-created`, starting with the signature check from ticket 02.
- **The alert,** for every report: one Telegram message to the administrators' chat with what was reported (from the target snapshot in the event), the reason and the reporter.
- **Hiding.** For a post or a comment, the workflow counts how many of the pending report times in the event fall within the last 24 hours. At five or more it sets Hidden through the backend's moderation route with the API key credential, and sends the moderation alert: one Telegram message to the administrators' chat and one email to the administrator address. The five and the 24 hours sit in one clearly named node at the top of the workflow.
- **The reports stay pending.** The moderation route does not touch reports, so the administrator still decides each one.
- **A reported user** only raises the alert. The automation never deactivates an account and cannot reach the routes that do.
- **The checklist** for this workflow is added to the `n8n/` README. One user can hold only one pending report on a target, so reaching five takes five accounts.

If time runs short, hiding by reports is on the roadmap's "Last in line" list and the alert is not: the alert is finished first.

Runs on the owner's machine: it needs Docker running. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" in `.scratch/n8n-automation/spec.md`. Report, Flagged and Hidden are defined in `GLOSSARY.md`: a user reports; an administrator or the automation flags.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 03 (The automation calls the backend with its own key and can only raise a moderation status), 04 (The backend tells the automation about new accounts, content and reports)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): it copies the patterns of tickets 02 and 06, but no test catches a broken workflow; it is proven only by running it.

- [ ] A report of a post, of a comment and of a user each send one Telegram message with the target, the reason and the reporter
- [ ] Four reports of one post by four accounts leave it visible
- [ ] The fifth report within 24 hours hides it: another user no longer sees it, and one Telegram message and one email say it was hidden by reports
- [ ] The five reports are still pending in the administrator's reports list, and an administrator can decide them
- [ ] Five reports of one user send five alerts and leave the account active
- [ ] Changing the number in the workflow's settings node changes when content is hidden, with no backend change
- [ ] A post to the webhook with a wrong signature gets `401` and sends nothing
- [ ] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [ ] The owner ran the checklist on their machine

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **A lost event is a missed alert, but not a missed count.** A report made while n8n is down raises no alert, and nothing resends it. The five-report rule recovers on the next report to the same target: its event lists the creation times of every pending report on that target, the lost one included.
- **Answer first.** The backend waits up to 3 seconds for n8n's answer inside the reporter's request. Respond to Webhook runs straight after the signature check, before Telegram and the moderation call.
- **Check the signature on the raw body**, as ticket 02 does.
