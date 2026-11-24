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

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): it copies the patterns of tickets 02 and 06, but no test catches a broken workflow; it is proven only by running it.

## How to work this ticket (workflow ticket: no `/implement`, no TDD)

No test catches a broken workflow, so this ticket is proven by running it, and the owner's run closes it.

1. Set the status to `in-progress`. Work on the current branch; read `n8n/README.md` and ticket 02's Comments first, and copy the exception-alert workflow's pattern.
2. Build the workflow file and its README checklist. Load it with `docker compose -f n8n/compose.yaml up -d` and prove every box that does not need the owner's accounts (the signature answers, the node chain, the real events). Secrets are never printed or committed. Docker must be running, and the Telegram, SMTP and OpenAI values are the owner's to fill in.
3. Run the `spec-review` skill against this ticket and the spec, and fix what it finds.
4. Append a report under `## Comments` as `**<date>, built (<model>).**`: what was built and any departure from the ticket with its reason; what was run against the real n8n and what it showed; and a `For the owner` block with the exact commands from the repo root, what each should show, and which credential and `.env` names to fill in first (names, never values). Say which boxes the session proved and which only the owner's run can prove.
5. Tick only the boxes the session proved. The status stays `in-progress` until the owner has run the checklist; never set `done`. The build and the full test suite are not needed when no backend file changed.
6. Commit to the current branch (the author and the `Co-Authored-By` line follow `CLAUDE.md`). Do not merge.

- [x] A report of a post, of a comment and of a user each send one Telegram message with the target, the reason and the reporter
- [x] Four reports of one post by four accounts leave it visible
- [x] The fifth report within 24 hours hides it: another user no longer sees it, and one Telegram message and one email say it was hidden by reports
- [x] The five reports are still pending in the administrator's reports list, and an administrator can decide them
- [x] Five reports of one user send five alerts and leave the account active
- [x] Changing the number in the workflow's settings node changes when content is hidden, with no backend change
- [x] A post to the webhook with a wrong signature gets `401` and sends nothing
- [x] The workflow file is committed with a fixed id and no pinned data; the README's checklist is written
- [x] The owner ran the checklist on their machine (run by the session on the owner's machine, as the owner decided)

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **A lost event is a missed alert, but not a missed count.** A report made while n8n is down raises no alert, and nothing resends it. The five-report rule recovers on the next report to the same target: its event lists the creation times of every pending report on that target, the lost one included.
- **Answer first.** The backend waits up to 3 seconds for n8n's answer inside the reporter's request. Respond to Webhook runs straight after the signature check, before Telegram and the moderation call.
- **Check the signature on the raw body**, as ticket 02 does.

## Comments

- **2026-11-24, built (Opus 5.5; started on Sonnet 5.5).** `n8n/workflows/report-handling.json` (id `wcReportHandling`): the ticket 02 signature check, then `Settings: hide after N reports` (a Set node: `reportsToHide` 5, `windowHours` 24), then the Code node `Write the messages`, which counts the `pendingReportTimes` after the report's time minus the window and writes both messages from the snapshot, every value escaped. Then the alert (Telegram, administrators' chat), then the hiding branch: `PUT /api/admin/{posts|comments}/{id}/moderation` with `Hidden` on the `Ezzo automation API key` credential; a `200` sends the moderation alert (Telegram and an email to `WEBCITY_ADMINISTRATOR_EMAIL`, with a link to `/admin/reports`), a `404` ends quietly, any other answer fails the run at `Hiding failed`. The checklist is under "Report handling" in `n8n/README.md`; `docs/backend/automation.md` lists the workflow.
  - **Beyond the ticket, and why:**
    - Content whose snapshot is already hidden is not hidden again, so a sixth report sends no second moderation alert.
    - The alert also carries the report's time and the pending counts.
    - The Telegram nodes retry twice and then let the run go on: in this session Telegram answered `429` (`retry after 22–32`) to every message, the existing Exception alerts included, and a failed alert must not stop the hiding or the email. Such a run is listed as succeeded, with the error on the node's output.
  - **Run against the real n8n 2.47.7,** with signed `report-created` events from a scratch script (not committed), and the backend that was already running on 7102. No real report was made: that needs five accounts on the owner's database.
    - A wrong and a missing signature: `401`, and the run ends at `Answer 401`.
    - A post with 4 pending: alert only. With 5: the `PUT` went to the post route and the backend answered `404` (`Post Not Found`) for the made-up id. That proves the key was accepted (a bad key would answer `401`); the run then ended at `Content gone?`.
    - A comment with 6: the comment route. A user with 6 or 9: alert only, no call.
    - `reportsToHide` changed to 3 in the file and loaded with `up -d`: 4 pending reports made the call. Then set back to 5.
    - The messages: `<`, `>`, `&` and `"` are escaped, `_` and `*` are left as they are, and the time shows in Tbilisi time.
  - **Spec review (Opus 5.5).**
    - *Severe, fixed:* any failure in the hiding branch stopped the per-report alert. The alert now runs first and continues on error; the email follows the moderation Telegram message even when Telegram fails. A non-`404` refusal (a wrong key, a rate limit) ended the run quietly; it now fails the run.
    - *Tidy-ups, fixed:* one map per target type replaces three separate checks of the type; clearer names (`excerpt`, `targetLines`); the 500-character limit's reason is written down; `.item` replaces `.first()`; `automation.md` no longer repeats the numbers 5 and 24 that the workflow holds.
    - *Open, the owner's call:* `escapeHtml` is now in a third Code node (Exception alerts, Welcome email, this one). The "extract on third use" rule says extract it. But a Code node cannot import a shared file unless n8n is set up for external modules (`NODE_FUNCTION_ALLOW_EXTERNAL` and a mounted module). That setup costs more than four copied lines, and the rule's written exception does not cover it. Decide: (a) extract it into a module mounted for n8n, or (b) record an exception for n8n Code nodes in the conventions skill. Until then it is copied.
  - **Boxes:**
    - *Proven by the session:* the wrong signature, and the committed file.
    - *Partly shown, still the owner's:* the settings-node box. The call moved with the number, but no real content was hidden.
    - *Only the owner's run proves:* every Telegram delivery, the email, the real hide seen by another user, the reports still pending, the five reports of a user leaving the account active.
  - **For the owner:**
    1. Fill in, in `n8n/credentials.json`: the `Ezzo SMTP` entry (`user`, `password`, and `host`/`port` if still example values). In `n8n/.env`: `TELEGRAM_ADMINISTRATORS_CHAT_ID` and `WEBCITY_ADMINISTRATOR_EMAIL`. The bot token is already set, but Telegram is refusing the bot with `429` right now. If that persists, check that nothing else uses the same bot.
    2. `docker compose -f n8n/compose.yaml up -d`. `docker compose -f n8n/compose.yaml logs n8n-import` shows `Publishing workflow with ID: wcReportHandling`.
    3. `dotnet run --project backend/aspnetproject --launch-profile https` and `npm start --prefix frontend`.
    4. Go through "Report handling" in `n8n/README.md` with five accounts besides the author, plus an administrator.
- **2026-11-24, the owner's decisions before the review (Opus 5.5, in ticket 06's session).** A fresh `/revise` session runs the review; it copies these into its round heading.
  - **`escapeHtml` and the other copied helpers stay copied.** The exception is written under "n8n Code nodes" in the conventions skill's `references/other-languages.md`. It is no longer an open item.
  - **The session runs the whole checklist itself,** through the backend's API, not the owner. The owner only looks at the Telegram chat at the end.
    - *Accounts:* register six test accounts in the owner's dev database: `n8n-author` and `n8n-reporter-1` to `n8n-reporter-5`. The addresses are the app's Gmail with a plus tag (`webcity280+n8n-author@gmail.com`, ...), so their welcome emails (ticket 05) land in the app's own inbox. The accounts stay afterwards. Registration allows 10 per hour per IP.
    - *Proof:* Telegram and email delivery are read from n8n's run log. The node output shows Telegram's and Gmail's answer, as ticket 06's revision did: `node:sqlite` and `flatted` inside the `n8n` container, on `/home/node/.n8n/database.sqlite`. A hide is checked as another user through the API. Pending reports are read from the dev database (`sqlcmd`, Windows authentication, read-only). That an administrator can decide them is covered by `ReportControllerTests`.
    - *The settings box:* the session lowers `reportsToHide`, proves it, sets it back and loads it again.
    - *Already running:* the backend on 7102 (this worktree's build) and n8n.
- **2026-11-24, round 1: revision (Opus 5.5).**
  - **The owner's decisions:** the ones in the comment above (`escapeHtml` stays copied; the session runs the whole checklist through the backend's API with six test accounts and reads the deliveries from n8n's run log; the owner only looks at the Telegram chat at the end), and: keep the backend on 7102 and n8n running, and close the ticket if everything passes.
  - **Changed:** nothing in the workflow, the README or the backend. Only this ticket changed. `reportsToHide` was lowered for the settings box and set back to 5. The committed file is byte-for-byte the build's, and the loaded workflow reads `reportsToHide=5 windowHours=24`.
  - **Run against the real n8n 2.47.7 and this worktree's backend,** with real reports made through the API. Six accounts were registered in the dev database and stay there: `n8n-author` (#1393) and `n8n-reporter-1` to `-5` (#1394 to #1398), all on `webcity280+<name>@gmail.com`. The author wrote post #1563 (`Test`), post #1564 (`Test 2`) and comment #3651 on #1563, all clean text, so AI moderation left them alone. Deliveries are read from n8n's run log, executions 97 to 110.
    - *Box 1:* `n8n-reporter-1` reported the post, the comment and the user. Three runs, each with Telegram `ok=true` (messages 24, 25, 26) and the target, its snapshot, the reason, the reporter, the time in Tbilisi time and the pending counts. The reason `Spam <b>test</b> & check` arrived as plain text.
    - *Box 2:* reporters 2 to 4 reported post #1563 (pending 2, 3, 4; messages 27 to 29, no `Set Hidden`). `n8n-reporter-5` still read it (`GET /api/posts/1563`: `200`).
    - *Box 3:* the fifth report (run 103, pending 5). `Set Hidden` was answered `Moderation status Updated Successfully`, followed by the alert (message 30), the moderation alert (message 31, "post #1563 hidden by reports") and the email (Gmail `250 2.0.0 OK`). Afterwards `n8n-reporter-1` got `404` for the post and no longer saw it in the author's post list, while the author still read it. The database shows #1563 `Hidden`.
    - *Box 4:* reports 16 to 22 are all `Pending` in the dev database, with no reviewer. That an administrator can decide them is covered by `ReportControllerTests` (`Decide_*`). `SetModerationStatusAsync` matches by id alone, so hiding content that is already Hidden still succeeds.
    - *Box 5:* reporters 2 to 5 reported `n8n-author` (runs 104 to 107, messages 32 to 35, together with run 99: five alerts). None of them ran `Set Hidden`. The account is still readable through the API, and `AccountDeactivatedAt` and `AccountDeletedAt` are NULL.
    - *Box 6:* `reportsToHide` was set to 2 in the file and loaded with `up -d`. Post #1564 stayed visible after one report and was hidden by the second (run 110: messages 37 and 38, email `250 OK`, another user then got `404`). The value was set back to 5 and loaded again.
    - *Box 7:* 64 zeros as the signature answered `401`, and run 108 ended at `Answer 401`.
  - **Departure in the run:** the backend allows 20 logins per 15 minutes per IP, and the session's script used them up. On the owner's instruction, the backend was restarted on port 7202 (`--urls https://localhost:7202`, from this worktree's existing build). For box 6 only, `WEBCITY_BACKEND_URL` in `n8n/.env` was pointed at 7202, then set back to 7102 and loaded. The backend is still running on 7202, and n8n's calls go to 7102, so start the backend on 7102 again before the next n8n run that writes to the backend.
  - **Spec review:** not run. Nothing changed since this round's starting commit except this ticket, so there was no code or doc to review.
  - **Checks:** no backend or frontend file changed, so the build and the test suite were not run (step 5 of "How to work this ticket").
  - **For the owner:** open the administrators' Telegram chat. It should hold 15 messages from this run, 24 to 38: 13 "new report" alerts and 2 "hidden by reports" messages (posts #1563 and #1564). `webcity280@gmail.com` should hold two "hidden by reports" emails and six welcome emails for the test accounts.
