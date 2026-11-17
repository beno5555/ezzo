# 02: n8n starts from the repository and sends that failure to Telegram

**What to build:** The owner runs one command, n8n starts in Docker with its workflow already imported and published, and an exception in the running backend arrives as a message in the developers' Telegram chat. This ticket builds the whole n8n setup and proves it with the first workflow. Every later workflow copies what it establishes.

- **The `n8n/` folder** at the repo root: the compose file, the workflow files, the example files for the secrets, and a README.
- **The compose file** pins `docker.n8n.io/n8nio/n8n:2.47.7`, keeps n8n's data in a named volume, sets the timezone to `Asia/Tbilisi`, and turns off n8n's block on environment access so workflows can read `$env`. A one-shot service imports the credentials, imports the workflows and publishes each workflow by its fixed id, before n8n starts.
- **Secrets.** Credentials come from a gitignored file that the import reads; a committed example lists the entries with placeholders (SMTP, the Telegram bot, the OpenAI key, the API key as a header credential, the signing secret as a Crypto credential). Values that differ per machine come from a gitignored `.env`, with a committed example: the backend's address as the container sees it, the frontend's address, the product's name, the two Telegram chat ids, the administrator address, the sender's address and name, and n8n's encryption key.
- **The setup script,** run by the owner from the repo root on Windows. It generates the signing secret and the automation's API key, writes them into n8n's credentials file and into the backend's development settings, turns events on there with n8n's address, and prints no secret. Running it again keeps the existing values.
- **The exception-alert workflow.** A webhook on `exception-occurred` with the raw body option on; a Crypto node that computes the HMAC of the raw body with the Crypto credential; a comparison with the `X-WebCity-Signature` header; a Respond to Webhook node that answers `401` on a mismatch and `200` otherwise; then one Telegram message to the developers' chat with the exception type, the message, the place, the time and the stack lines. The message sets its parse mode explicitly, escapes what it inserts, and has n8n's attribution line off.
- **The README** gives the setup steps as commands that run from the repo root, the way to export a changed workflow back into the repository without pinned test data, and this workflow's checklist.

Nothing here has been run against a real n8n. The facts come from n8n's documentation and source at 2.47.7 and are listed under "Further Notes" in the spec. Where one turns out wrong, find the replacement here, record it in this ticket's comments and in the README, and correct the spec, before any other workflow is built.

Runs on the owner's machine: it needs Docker running, the Telegram bot token and the owner's chat id. A session that was open before Docker was installed does not have `docker` on its PATH. This ticket is not done until the owner has run the checklist.

Decisions are under "n8n setup" and "The six workflows" in `.scratch/n8n-automation/spec.md`.

**Blocked by:** 01 (A failure in the backend leaves as a signed event)

**Status:** ready-for-agent

**Difficulty:** tricky: nothing in the setup has been tried on a real n8n, the import and the signature check rest on unproven claims, and debugging is likely.

- [ ] From a clean start (no volume), one command brings n8n up with the workflow imported and published, and no click in n8n's interface
- [ ] A second start with the volume kept also succeeds
- [ ] A request to the backend's throwing route produces one Telegram message in the developers' chat, with the type, the message, the place, the time and the stack lines readable
- [ ] An exception whose text contains characters Telegram treats as markup (`_`, `*`, `<`) still arrives intact
- [ ] A post to the webhook with a wrong signature, and one with none, gets `401` and sends no message
- [ ] From inside the container, the backend answers at the address in `.env` (proves `host.docker.internal` reaches a backend that listens on `localhost`)
- [ ] With n8n stopped, a failing request to the backend still gets its usual answer, and a `Log` row records the lost event
- [ ] The setup script writes both secrets to both sides, prints neither, and a second run changes nothing
- [ ] The credentials file is gitignored; `git status` shows no secret after the setup; the committed workflow file has a fixed id and no pinned data
- [ ] Each claim from the spec's "Nothing here was run against a real n8n" note is marked confirmed or replaced in this ticket's comments
- [ ] `CLAUDE.md` names the `n8n/` folder, its commands and what a session needs to run them; `README.md` and `docs/backend/automation.md` describe the setup
- [ ] The owner ran the checklist on their machine

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **Events are lost while n8n is down.** Each event gets one attempt: no retry, no queue (spec, Out of Scope). An exception while n8n is stopped never reaches Telegram; the backend only writes a `Log` row (action `EventPublisher.PublishAsync`, `Succeeded = false`, the event's name in the details). The checklist starts n8n before it triggers the route.
- **Check the signature on the raw body.** It is HMAC-SHA256 over the exact bytes sent. JSON that n8n parsed and wrote again has different bytes, so every valid event would get `401`. There is no timestamp, so a captured event can be replayed (out of scope).
- **Answer first.** The backend waits for n8n's answer, up to `AutomationEvents:Timeout` (3 seconds), before it answers the failed request. Respond to Webhook runs straight after the signature check, before the Telegram call.
- **What does not alert.** Only exceptions that reach `GlobalExceptionHandler` and failed `PeriodicHostedService` cycles send an event. Exceptions in SignalR hub methods, startup failures and `4xx` answers send nothing. Whether hub failures should alert is an open decision for the owner.
- **The message can quote user input.** `message` is the exception's own text, and some exceptions repeat what a user typed. It goes to the developers' chat only.
- **`place` and `fingerprint` differ.** `place` is the real address (`GET /api/posts/5`); `fingerprint` uses the route's template (`System.InvalidOperationException|GET /api/posts/{id:int}`). The message shows `place`.
- **The throwing route** is `GET api/dev/throw`, optionally with an id (`api/dev/throw/7`), Development only, 30 requests a minute per IP.
