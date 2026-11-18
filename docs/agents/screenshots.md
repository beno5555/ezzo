# Looking at pages: the screenshot command and the Playwright MCP server

Two tools let an agent see the frontend; both are built on Playwright.

- **The screenshot command** (`frontend/tools/screenshots.ts`, one script) photographs a list of addresses at every width, theme and language a page must be checked in (`frontend/CLAUDE.md`, `DESIGN.md` Layout). Use it to check a page you built and to hand the owner pictures to approve.
- **The Playwright MCP server** (`.mcp.json` at the repo root) gives a session browser tools: open a page, click, type, read the page, take one screenshot. Use it to click through a flow step by step, or to look at one state the command does not reach (an open menu, a form with an error).

The Claude in Chrome extension is the fallback when the server is not available ("Running the app" in the root `CLAUDE.md`).

## The screenshot command

Start the backend and the frontend first ("Running the app"), then, from the repo root:

```bash
npm run screenshots --prefix frontend -- /sign-in /admin/users      # as a guest
npm run screenshots --prefix frontend -- / /admin/users --signed-in # signed in as the development account
npm run screenshots --prefix frontend -- https://example.com        # an outside address
```

- **Git Bash** rewrites an argument that starts with `/` into a Windows path (`C:/Program Files/Git/sign-in`) before npm sees it. Put `MSYS_NO_PATHCONV=1` before the command; the command says so when it gets such a path.
- **Twelve images per app address:** widths 360, 768 and 1280 × themes light and dark × languages English and Georgian. An outside address gets three images, one per width, with no theme or language.
- **Names** sort by address and show what each image is: `admin_users--signed-in--0768-dark-ka.png`, `www.example.com_about--1280.png`.
- **The images go to `frontend/screenshots/`,** which Git ignores. Each run adds to the folder and overwrites images of the same name; delete it when it gets in the way.
- **Theme and language** are written to the same stored values (`webcity.theme`, `webcity.language`) the theme store and the language store read, and the command checks after each load that the page shows them. If the app changes how it stores either, the command fails instead of saving wrong images.
- **A missing server** ends the run with a message that names it and the command that starts it.
- **Rate limits.** A signed-in run signs in once (sign-in allows 10 per hour per IP) and loads each address 4 times (once per theme and language; the widths only resize the window). Each load restores the session through `/api/auth/refresh`, which allows 60 per 10 minutes per IP, so photograph at most about a dozen addresses per signed-in run. The command stops with an explanation when the backend answers 429.
- **To watch a run,** put `PWDEBUG=console` before the command: the browser opens in a window instead of running hidden.
- **Why a script, when Playwright has `npx playwright screenshot`:** the app rotates its refresh token on every page load, so a saved sign-in lasts one image. The script signs in once and keeps one browser open for all of them.
- **Chromium.** The command uses Playwright's own Chromium. If it is missing, Playwright says so; install it with `npm exec --prefix frontend -- playwright install chromium`.
- CI does not run the command.

### The development account

A signed-in run signs in through the app's real sign-in form as a development account in your development database. Its credentials come from two environment variables:

- `WEBCITY_SCREENSHOTS_USER`: the account's username or email
- `WEBCITY_SCREENSHOTS_PASSWORD`: its password

Set them in the environment, or put them in `frontend/.env` (gitignored), one `NAME=value` per line; a variable already set in the environment wins. The command never prints them: any message that would contain one shows `[hidden]` instead.

Register the account through the dev backend's register endpoint and write its name and password to `frontend/.env` in the main checkout. The first one, registered on 2026-11-18, was lost on 2026-11-19 along with its worktree's `.env`, so the next signed-in run starts by registering a new one. A new worktree does not get that file, so copy it in by hand. **Before you remove a worktree, copy its `frontend/.env` to the main checkout if the main checkout has none:** `git worktree remove --force` deletes gitignored files too, and they exist nowhere else. A fresh development database needs a new account.

## The Playwright MCP server (on trial)

`.mcp.json` starts `@playwright/mcp` (pinned version) with `--isolated`, so each session starts with an empty browser profile, signed out. It opens the installed Google Chrome in a window.

- **First use:** Claude Code asks each person once to approve a server from a project `.mcp.json`. Approve `playwright` when a new session asks (or through `/mcp`); after that the session lists the `browser_*` tools.
- **Signing in:** type the development account's credentials into the sign-in form through the tools. Do not paste them into a message or a file.
- The server is started through `cmd /c npx`, which only works on Windows. A Linux cloud session shows it as failed and goes on without it.

### Ending the trial

If the server fills the context with tool output, or goes unused, delete `.mcp.json` and the line about it in "Running the app" in the root `CLAUDE.md`, in one commit. Nothing else depends on it: the screenshot command is separate.
