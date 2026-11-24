# WebCity — n8n

The **automation** (`GLOSSARY.md`): n8n in Docker, receiving the backend's signed events (`docs/backend/automation.md`) and acting on them. Everything here starts from the repository: the workflows are committed files, imported and published on every start, so a clean start needs no click in n8n's interface. The decisions behind it are under "n8n setup" and "The six workflows" in `.scratch/n8n-automation/spec.md`.

Every command below runs from the repo root. It needs Docker Desktop running (`docker info`) and PowerShell 7.3 or later (`pwsh`). A terminal, or a Claude Code session, that was open before Docker was installed has no `docker` on its PATH: open a new one. CI does not run n8n, and the integration tests never reach it. `n8n/.env` and `n8n/credentials.json` are gitignored secrets: never print or commit them.

## What is here

| File | What it is |
|---|---|
| `compose.yaml` | n8n `2.47.7` (pinned), and the one-shot `n8n-import` service that runs before it on every start |
| `import.sh` | What the import service runs: import the credentials, import every workflow, publish each by its id |
| `workflows/*.json` | One file per workflow, each with a fixed id and no pinned test data |
| `.env.example` | The values that differ per machine, read in workflows through `$env`. Copied to `.env` (gitignored) |
| `credentials.example.json` | The credentials, with placeholders. Copied to `credentials.json` (gitignored), which the import reads and n8n encrypts |
| `setup.ps1` | Generates the secrets the backend and n8n share and writes them to both sides |
| `export-workflow.ps1` | Exports a workflow you changed in the editor back into `workflows/` |
| `send-test-exception.ps1` | Sends one signed `exception-occurred` event full of markup characters, for the checklist |
| `tools/clean-workflow.js` | Used by the export, inside the container: keeps the id, name, nodes, connections and settings, drops the rest |

## Setup

1. **The backend's development settings must exist** (`backend/aspnetproject/appsettings.Development.json`, see `CLAUDE.md`, Config prerequisites).
2. **Generate the shared secrets:**

   ```powershell
   pwsh -File n8n/setup.ps1
   ```

   It creates `n8n/.env` and `n8n/credentials.json` from their examples if they are missing, generates n8n's encryption key once, and generates the signing secret and the automation's API key. It writes both into `n8n/credentials.json` (the Crypto credential `wcSigningSecret1`, the header credential `wcAutomationKey1`) and into the backend's development settings (`AutomationEvents:SigningSecret`, `AutomationApi:Key`), and turns events on there with n8n's address (`AutomationEvents:Enabled`, `AutomationEvents:BaseUrl`). It prints which values it kept, generated or copied, never a value. Running it again changes nothing. When the two sides disagree, the backend's value wins.
3. **Fill in the remaining `change-me` values.** In `n8n/.env`: `TELEGRAM_DEVELOPERS_CHAT_ID`, `TELEGRAM_ADMINISTRATORS_CHAT_ID`, and the addresses. In `n8n/credentials.json`: the Telegram bot's `accessToken`, and the SMTP and OpenAI entries once a workflow needs them.
4. **Start n8n:**

   ```powershell
   docker compose -f n8n/compose.yaml up -d
   ```

   The import service runs first; n8n starts only once it succeeded. Its output: `docker compose -f n8n/compose.yaml logs n8n-import`.
5. **Restart the backend**, which reads its settings at startup.
6. **The first visit** to <http://localhost:5678> asks for an owner account. It is kept in the volume. The workflows are already published and run without it.

## Everyday use

- **Stop:** `docker compose -f n8n/compose.yaml stop`. **Start again:** `docker compose -f n8n/compose.yaml up -d`.
- **Load a changed workflow file, `.env` or `credentials.json`:** `docker compose -f n8n/compose.yaml up -d`. The import runs again and publishes every workflow; for about two seconds the webhooks answer `404`. A change to `.env` also recreates the n8n container.
- **The import overwrites the editor's version.** Every start imports the committed files by id, so a change made in the editor and not exported is lost at the next start.
- **Export a changed workflow** after you saved it in the editor, then review the diff:

  ```powershell
  pwsh -File n8n/export-workflow.ps1 -Id wcExceptionAlert
  ```

  A new workflow gets its fixed id in its file before its first import (16 letters and digits, the shape of n8n's own ids, e.g. `wcExceptionAlert`), and `-File <name>.json` on its first export.
- **Never change `N8N_ENCRYPTION_KEY`** once n8n has started with it. The volume's credentials are encrypted with it, and n8n refuses to start with another key. To start over: `docker compose -f n8n/compose.yaml down -v` (this deletes the volume: the owner account and the run history), then `up -d`.
- **What a crash does.** n8n has `restart: unless-stopped`: Docker starts it again when its process dies, and the import does not run again. `docker kill` and `docker stop` count as stopping it by hand, so after either one it stays down until the next `up -d`.

## Addresses

- **The backend reaches n8n at `http://127.0.0.1:5678`,** not `localhost`. .NET tries `localhost`'s IPv6 address first, where Docker Desktop publishes nothing; the attempt hangs until the publisher's timeout, and every event is lost. The port is published on `127.0.0.1` only.
- **n8n reaches the backend at `https://host.docker.internal:7102`** (`WEBCITY_BACKEND_URL`), although the backend listens on `localhost`. The development certificate is self-signed and issued for `localhost`, so a call from n8n must ignore certificate problems (the HTTP Request node's option), or it fails with `DEPTH_ZERO_SELF_SIGNED_CERT`.

## Workflows

### Exception alerts (`workflows/exception-alerts.json`, id `wcExceptionAlert`)

`POST /webhook/exception-occurred`. Like every webhook here, it starts by checking the event:

1. **The webhook** has the raw body option on, so the exact bytes the backend signed arrive as binary data.
2. **Sign the raw body:** a Crypto node computes the HMAC-SHA256 of those bytes, in hex, with the Crypto credential.
3. **Signature matches?** compares it with the `X-WebCity-Signature` header. A missing header counts as a mismatch.
4. **Answer 401** on a mismatch, and nothing else happens. **Answer 200** otherwise, before any further work, because the backend waits for this answer (up to 3 seconds) before it answers the failed request.

Then one Telegram message to the developers' chat (`TELEGRAM_DEVELOPERS_CHAT_ID`): the product's name, the exception's type, its message (cut to 1000 characters), the place and its kind, the time in `Asia/Tbilisi`, and the stack lines (cut to 2500 characters, as Telegram refuses a message over 4096). The message is sent with parse mode HTML, every inserted value is escaped (`&`, `<`, `>`, which are the only markup in HTML mode, so `_` and `*` stay plain text), and n8n's attribution line is off.

**Checklist.** The first two steps prove the setup itself, so every later workflow can rely on it. Fill in the bot token and the developers' chat id first, and run the backend with `dotnet run --project backend/aspnetproject --launch-profile https`.

- [ ] A clean start: `docker compose -f n8n/compose.yaml down -v` (this deletes the owner account and the run history), then `docker compose -f n8n/compose.yaml up -d`. `docker compose -f n8n/compose.yaml logs n8n-import` ends with a publish line for `wcExceptionAlert`, and <http://localhost:5678> lists Exception alerts as published, with no click.
- [ ] The container reaches the backend: `docker compose -f n8n/compose.yaml exec -T n8n node -e "process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'; fetch(process.env.WEBCITY_BACKEND_URL + '/api/posts').then(r => console.log('backend answered', r.status))"` prints `backend answered` with a status code (a warning about certificate checks is expected).
- [ ] Open <https://localhost:7102/api/dev/throw/7>, or run `curl.exe -k https://localhost:7102/api/dev/throw/7`. One message arrives in the developers' chat with the type, the message, the place (`GET /api/dev/throw/7`), the time and the stack lines, all readable.
- [ ] `pwsh -File n8n/send-test-exception.ps1` prints `n8n answered 200`, and the message shows `_`, `*`, `<b>`, `&` and the backticks as plain text, with nothing missing.
- [ ] `pwsh -File n8n/send-test-exception.ps1 -Signature Wrong` and `pwsh -File n8n/send-test-exception.ps1 -Signature None` each print `n8n answered 401`, and no message arrives.

### Welcome email (`workflows/welcome-email.json`, id `wcWelcomeEmail01`)

`POST /webhook/account-created`, sent by the backend when a registration succeeds or an administrator creates an account. It starts with the same signature check as the exception alerts (raw body, Crypto node, comparison, `401` or `200` before any work). Then one HTML email goes to the new account's address: a greeting with the username, two sentences on what the product is for, and a link to `WEBCITY_FRONTEND_URL`. The text and the layout are in the Code node `Write the email`, so changing the wording means editing that node and exporting the workflow (`export-workflow.ps1 -Id wcWelcomeEmail01`), not rebuilding the backend. The product's name (`WEBCITY_PRODUCT_NAME`), the link's address and the sender (`WEBCITY_SENDER_NAME`, `WEBCITY_SENDER_EMAIL`) come from `.env`; the username is escaped, and n8n's attribution line is off. The SMTP account is the `Ezzo SMTP` entry in `credentials.json`: fill in the same account the backend uses (`EmailConfiguration`) before this workflow can send.

**Checklist.** Fill in the SMTP entry of `n8n/credentials.json` and the sender values in `n8n/.env`, run `docker compose -f n8n/compose.yaml up -d`, and run the backend and the frontend (`npm start` in `frontend/`).

- [ ] Register a new account in the running app with an address you can read. The welcome email arrives with the username, the product's name and a link that opens the app.
- [ ] Create an account as an administrator (the admin panel's create-user form). The new address gets the same email.
- [ ] Change `WEBCITY_PRODUCT_NAME` in `n8n/.env`, run `docker compose -f n8n/compose.yaml up -d`, and register again: the email carries the new name, and no workflow file changed.
- [ ] The email has no "sent automatically with n8n" line.
- [ ] Stop n8n (`docker compose -f n8n/compose.yaml stop`) and register: the registration still succeeds (the welcome email is lost, and a `Log` row records it).
- [ ] A post with a wrong signature gets `401` and sends no email: change `$eventName` in a copy of `send-test-exception.ps1` to `account-created`, or send any body to `http://127.0.0.1:5678/webhook/account-created` with an `X-WebCity-Signature` of 64 zeros.

### Report handling (`workflows/report-handling.json`, id `wcReportHandling`)

`POST /webhook/report-created`, sent by the backend when a user reports a post, a comment or a user. It starts with the same signature check (raw body, Crypto node, comparison, `401` or `200` before any work). Then:

1. **`Settings: hide after N reports`** holds the two numbers the owner may tune: `reportsToHide` (5) and `windowHours` (24). Change them in this node and export the workflow; the backend does not change.
2. **`Write the messages`** (Code node) counts the event's `pendingReportTimes` that fall within `windowHours` before the report's time, and writes the alert and the moderation alert from the target snapshot in the event, every inserted value escaped.
3. **The alert,** for every report: one Telegram message to the administrators' chat (`TELEGRAM_ADMINISTRATORS_CHAT_ID`) with what was reported (its id, author, title and text, or a user's name and bio), the reason, the reporter, the time and the pending counts. A reported user gets the alert and nothing else.
4. **Hiding,** for a post or a comment only, when the count reaches `reportsToHide` and the snapshot is not already hidden: `PUT {WEBCITY_BACKEND_URL}/api/admin/posts/{id}/moderation` (or `comments`) with `Hidden`, with the `Ezzo automation API key` credential and certificate problems ignored. A `200` sends the moderation alert: one Telegram message to the administrators' chat and one email to `WEBCITY_ADMINISTRATOR_EMAIL`, each with a link to the reports list. A `404` (the content was deleted) ends the run quietly. Any other answer (a wrong key, a rate limit) fails the run at `Hiding failed`, which names the status. The moderation route does not touch reports, so they stay pending for an administrator.

**When Telegram refuses.** Each Telegram node retries twice, five seconds apart (Telegram answers `429` to a burst), and then lets the run go on, so a failed alert never stops the hiding or the email. Such a run is listed as succeeded: the error is on the Telegram node's output in the run.

**Checklist.** Fill in the bot token, `TELEGRAM_ADMINISTRATORS_CHAT_ID`, the SMTP entry and `WEBCITY_ADMINISTRATOR_EMAIL`, run `docker compose -f n8n/compose.yaml up -d`, and run the backend and the frontend. One user can hold only one pending report on a target, so reaching five takes five accounts besides the content's author, and an administrator account to check the reports list.

- [ ] Report a post, a comment and a user, one each. Each sends one Telegram message with the target, the reason and the reporter.
- [ ] Report one post from four accounts: it stays visible to a fifth user.
- [ ] Report it from a fifth account: within seconds another user no longer sees it, and one Telegram message and one email say it was hidden by reports.
- [ ] The five reports are still pending in the admin panel's reports list (<http://localhost:4200/admin/reports>), and an administrator can decide them.
- [ ] Report one user from five accounts: five alerts arrive, and the account is still active.
- [ ] Change `reportsToHide` to 2 in the settings node (in the editor, then `pwsh -File n8n/export-workflow.ps1 -Id wcReportHandling`, or in the file), run `docker compose -f n8n/compose.yaml up -d`, and report a new post from two accounts: the second report hides it. Set it back to 5 and load it again.
- [ ] A post with a wrong signature gets `401` and sends nothing: send any body to `http://127.0.0.1:5678/webhook/report-created` with an `X-WebCity-Signature` of 64 zeros.

### AI moderation (`workflows/ai-moderation.json`, id `wcAiModeration01`)

`POST /webhook/post-created`, `post-edited`, `comment-created` and `comment-edited`: four webhooks sharing one signature check (raw body, Crypto node, comparison, `401` or `200` before any work). Then:

1. **`Settings: moderation`** holds what the owner may tune: `hideScore` (0.9) and `judgeModel` (`gpt-5.4-mini`). Change them in this node and export the workflow; the backend does not change.
2. **`Not hidden yet?`** ends the run for content that arrives already Hidden: it is not checked, so a hidden post edited into clean text stays hidden.
3. **`List the checks`** (Code node): the text (a post's title and text) is one check; each photo of a new post is a check of its own, because OpenAI refuses more than one image in a call (`too_many_images`). An edit is checked on its text alone. Direct messages send no event, so they never reach OpenAI.
4. **Photos** are downloaded from `WEBCITY_BACKEND_URL` plus the relative address and sent as base64 data URLs. A photo that answers `404` was deleted after the event, and its check is dropped; any other answer fails the run.
5. **`Ask OpenAI`** calls `https://api.openai.com/v1/moderations` with model `omni-moderation-latest`, once per check, on the `Ezzo OpenAI` credential. It retries twice, five seconds apart; a third failure fails the run.
6. **`Score the checks`** (Code node): the classifier's outcome. The highest result across the checks decides: any category score at or above `hideScore` hides; otherwise any check OpenAI marks as violating flags. Clean content, and content that already has that status (a Flagged post edited and flagged again), ends the run at `Caught by the classifier?`.
7. **`Write the judge's question`** (Code node) and **`Ask the AI judge`** send what the classifier caught (the text, every photo sent, and the deciding categories) to `https://api.openai.com/v1/chat/completions` with `judgeModel`, on the same credential. The classifier reads words, not intent: it flags a negation ("I would never say ...") or "`<country>` is bad". The judge reads the content in context and answers `clean`, `doubtful` or `violating`, with a one-sentence reason.
   - **Instructions inside a post.** The text is fenced in tags with its angle brackets escaped, so a post cannot close the fence. Text inside a photo cannot be fenced, so the judge is told that content which tries to instruct it is at least doubtful. A post that still talks the judge round can lower a hide to a flag, or clear a flag.
   - **The model** must accept `reasoning_effort` (the gpt-5 family). Another model answers `400`, the classifier then decides every time, and each alert's judge line says so.
   - **Cost.** Unlike the moderation endpoint, these calls are charged to the account's credits: a few hundred tokens each, and only for caught content.
8. **`Decide`** (Code node): the judge may confirm the classifier's outcome or lower it one step (Hidden to Flagged, Flagged to nothing), never raise it. When the judge gives no usable answer (no credits left, a model that refuses the request, a timeout), the classifier's outcome stands, and the alert says why. It writes the alert: the text, the author, the outcome, the classifier's outcome with its deciding categories (their scores and the check they came from: `text`, `photo 1`, ...) and the judge's verdict, every inserted value escaped.
9. **Acting:** `PUT {WEBCITY_BACKEND_URL}/api/admin/posts/{id}/moderation` (or `comments`) with the outcome, on the `Ezzo automation API key` credential. A `200` sends one Telegram message to the administrators' chat and one email to `WEBCITY_ADMINISTRATOR_EMAIL`, with a link to the moderation queue (Flagged) or to the post (Hidden). A `404` (deleted meanwhile) or a `403` (the status may not be lowered) ends the run quietly. Any other answer fails the run at `Setting the status failed`. The Telegram node retries and then lets the run go on, as in Report handling.

**Checklist.** Fill in the `Ezzo OpenAI` key (`apiKey`), the bot token, `TELEGRAM_ADMINISTRATORS_CHAT_ID`, the SMTP entry and `WEBCITY_ADMINISTRATOR_EMAIL`, run `docker compose -f n8n/compose.yaml up -d`, and run the backend and the frontend. Use two accounts (an author and a reader) and an administrator. Texts that scored as noted on 2026-11-24: `I hope you get hit by a bus.` is flagged below 0.9, and the judge calls it violating (Flagged); `I will punch you in the face if I see you.` scores 0.95 for violence (Hidden); `I would never say I hope you get hit by a bus.` is flagged by the classifier and cleared by the judge. A post's title is checked with its text, so keep the title neutral (`Test`).

- [ ] Publish a post with clean text (`A lovely walk in the park today.`): it stays visible, and no alert arrives.
- [ ] Publish a post with the flagging text: it stays visible to the reader, appears in the administrator's moderation queue (<http://localhost:4200/admin/moderation>), and one Telegram message and one email say it was flagged, with the text, the author and the categories.
- [ ] Publish a post with the hiding text: within seconds the reader no longer sees it, its author sees it marked hidden, and one Telegram message and one email say it was hidden.
- [ ] Publish a post with the cleared text: it stays visible, is not in the moderation queue, and no alert arrives.
- [ ] Publish a post with clean text and a violating photo (for example a picture of a weapon pointed at someone, or of a bloody wound): it is flagged or hidden, and the alert's categories name `photo 1`.
- [ ] Write a comment with the flagging text, and another with the hiding text: the first is flagged, the second hidden, each with one Telegram message and one email.
- [ ] Edit a clean post into the hiding text: it is hidden after the edit.
- [ ] Edit that hidden post back into clean text: it stays hidden, and no alert arrives.
- [ ] Publish a post with the hiding text and delete it at once: the run in n8n's executions list (<http://localhost:5678>) is listed as succeeded.
- [ ] Change `hideScore` to 0.5 in the settings node (in the editor, then `pwsh -File n8n/export-workflow.ps1 -Id wcAiModeration01`, or in the file), run `docker compose -f n8n/compose.yaml up -d`, and publish a post with the flagging text: it is hidden instead (the judge calls it violating, so it keeps the hide). Set it back to 0.9 and load it again.
- [ ] Change `judgeModel` to `no-such-model` the same way, load it, and publish a post with the cleared text: it is flagged, because the classifier decides, and the alert's judge line says `HTTP 404`. Set it back and load it again.
- [ ] A post with a wrong signature gets `401` and sends nothing: send any body to `http://127.0.0.1:5678/webhook/post-created` with an `X-WebCity-Signature` of 64 zeros.

## What was checked against the real n8n

The spec's n8n facts came from the documentation and source at `2.47.7`. Ticket 02 ran them on this machine (2026-11-21); its Comments hold the details.

- **Confirmed:** importing the credentials and the workflows, then publishing each by id, from a one-shot service before n8n starts; a second start with the volume kept; the Crypto node's HMAC of the raw body matching the backend's signature; `$env` in expressions and in the Code node; the timezone; reaching a backend that listens on `localhost` through `host.docker.internal`; Docker restarting n8n after its process dies, without running the import again.
- **Replaced:** the backend reaches n8n at `http://127.0.0.1:5678`, not `http://localhost:5678` (see Addresses). `docker kill` is not a way to test the restart, because Docker treats it as a stop by hand: the test kills n8n's process inside the container instead.
