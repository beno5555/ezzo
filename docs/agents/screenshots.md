# Looking at pages: the screenshot command and the Playwright MCP server

Two tools let an agent see the frontend; both are built on Playwright.

- **The screenshot command** (`frontend/tools/screenshots.ts`, one script) photographs a list of addresses at every width, theme and language a page must be checked in (`frontend/CLAUDE.md`, `DESIGN.md` Layout). Use it to check a page you built and to hand the owner pictures to approve.
- **The Playwright MCP server** gives both agents browser tools to open a page, click, type, read the page, and take a screenshot. Use it for a flow or a state that the screenshot command cannot reach, such as an open menu or a form with an error.

Use the [frontend theme guidance](../../frontend/CLAUDE.md#hard-rules) for single screenshots.

The Claude in Chrome extension is the fallback when the server is not available ("Running the app" in the root `CLAUDE.md`).

## The screenshot command

Start the backend and the frontend first ("Running the app"), then, from the repo root:

```bash
npm run screenshots --prefix frontend -- / /register                # as a guest
npm run screenshots --prefix frontend -- / /friends --signed-in      # signed in as the development account
npm run screenshots --prefix frontend -- https://example.com        # an outside address
```

- **Git Bash** rewrites an argument that starts with `/` into a Windows path (`C:/Program Files/Git/register`) before npm sees it. Put `MSYS_NO_PATHCONV=1` before the command; the command says so when it gets such a path.
- **Twelve images per app address:** widths 360, 768 and 1280 × themes light and dark × languages English and Georgian. An outside address gets three images, one per width, with no theme or language.
- **Names** sort by address and show what each image is: `admin_users--signed-in--0768-dark-ka.png`, `www.example.com_about--1280.png`.
- **The images go to `frontend/screenshots/`,** which Git ignores. Each run adds to the folder and overwrites images of the same name; delete it when it gets in the way. The images the owner should see for a ticket are copied to its shots folder (the round report in `.claude/skills/implement/SKILL.md`).
- **Theme and language** are written to the same stored values (`webcity.theme`, `webcity.language`) the theme store and the language store read, and the command checks after each load that the page shows them. If the app changes how it stores either, the command fails instead of saving wrong images.
- **Other ports.** A worktree lane whose servers run on other ports names them before the command: `WEBCITY_SCREENSHOTS_APP_ORIGIN=http://localhost:4300 WEBCITY_SCREENSHOTS_BACKEND_ORIGIN=https://localhost:7202`. Its frontend then needs a copy of `proxy.conf.json` aimed at that backend port, passed to `npx ng serve --port 4300 --proxy-config <copy>`.
- **A missing server** ends the run with a message that names it and the command that starts it.
- **Rate limits.** A signed-in run signs in once (sign-in allows 20 per 15 minutes per IP) and loads each address 4 times (once per theme and language; the widths only resize the window). Each load restores the session through `/api/auth/refresh`, which allows 60 per 10 minutes per IP, so photograph at most about a dozen addresses per signed-in run. The command stops with an explanation when the backend answers 429.
- **To watch a run,** put `PWDEBUG=console` before the command: the browser opens in a window instead of running hidden.
- **Why a script, when Playwright has `npx playwright screenshot`:** the app rotates its refresh token on every page load, so a saved sign-in lasts one image. The script signs in once and keeps one browser open for all of them.
- **Chromium.** The command uses Playwright's own Chromium. If it is missing, Playwright says so; install it with `npm exec --prefix frontend -- playwright install chromium`.
- CI does not run the command.

### The development account

A signed-in run signs in through the app's real sign-in form as a development account in your development database. Its credentials come from two environment variables:

- `WEBCITY_SCREENSHOTS_USER`: the account's username or email
- `WEBCITY_SCREENSHOTS_PASSWORD`: its password

Set them in the environment, or put them in `frontend/.env` (gitignored), one `NAME=value` per line; a variable already set in the environment wins. The command never prints them: any message that would contain one shows `[hidden]` instead.

Register a development account for the database you use and save its credentials in `frontend/.env` in the main checkout. Copy the file into any worktree that needs a signed-in run. Before removing a worktree, copy its `frontend/.env` to the main checkout if the worktree has the only copy. Removing the worktree deletes its gitignored files.

**An administrator account** for checking the administrator's side of a page lives beside it in the same file: `WEBCITY_ADMIN_USER` and `WEBCITY_ADMIN_PASSWORD`. The screenshot command does not read them; sign in with them through the sign-in form. A new development database needs a new one: register the account, then give it the role with the `INSERT INTO UserRoles` statement in `cloud-backend.md` (for the local database: `sqlcmd -S localhost -d SocialMediaWebApiDb -E -C`).

## The Playwright MCP server (on trial)

`.mcp.json` (Claude Code) and `.codex/config.toml` (Codex) start the same pinned `@playwright/mcp` with `--isolated`. Each session starts signed out with an empty browser profile and opens the installed Google Chrome in a window.

- **First use:** In Claude Code, approve `playwright` when prompted or through `/mcp`. In Codex, open the repo as a trusted project and check `/mcp` in a new session.
- **Signing in:** type the development account's credentials into the sign-in form through the tools. Do not paste them into a message or a file.
- The server is started through `cmd /c npx`, which only works on Windows. A Linux cloud session shows it as failed and goes on without it.

### Ending the trial

If the server fills the context with tool output or goes unused, remove the Playwright entries from `.mcp.json` and `.codex/config.toml` and update "Running the app" in `CLAUDE.md` and the browser instructions in `AGENTS.md` in the same commit. Keep the screenshot command available.
