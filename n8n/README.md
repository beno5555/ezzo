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

## What was checked against the real n8n

The spec's n8n facts came from the documentation and source at `2.47.7`. Ticket 02 ran them on this machine (2026-11-21); its Comments hold the details.

- **Confirmed:** importing the credentials and the workflows, then publishing each by id, from a one-shot service before n8n starts; a second start with the volume kept; the Crypto node's HMAC of the raw body matching the backend's signature; `$env` in expressions and in the Code node; the timezone; reaching a backend that listens on `localhost` through `host.docker.internal`; Docker restarting n8n after its process dies, without running the import again.
- **Replaced:** the backend reaches n8n at `http://127.0.0.1:5678`, not `http://localhost:5678` (see Addresses). `docker kill` is not a way to test the restart, because Docker treats it as a stop by hand: the test kills n8n's process inside the container instead.
