# 29: An agent and the owner see every page in screenshots

**What to build:** One command photographs a list of addresses of the running app at every width, theme and language that a page must be checked in, so that an agent can look at what it built and the owner can approve a page from the pictures. An agent can also open a page in a browser and click through it.

- **The screenshot command,** run from `frontend/`, built on Playwright. For each address it saves one full-page image per combination of width (360, 768, 1280 px), theme (light, dark) and language (English, Georgian): twelve images per address, named so that they sort by address.
- **As a guest or signed in.** A signed-in run signs in through the app's real sign-in form with the credentials of a development account. They come from environment variables and are never written to the repo or printed.
- **Theme and language are set the way the app sets them,** through the same stored values the theme store and the language store read, so the command and the app cannot drift apart.
- **It expects the frontend and the backend to be running,** and says clearly which one is missing when one is not.
- **It also photographs an outside public address,** at the three widths, with no theme or language. The name session uses this to look at reference sites.
- **The images go to a folder that Git ignores.**
- **Playwright's own Chromium is used.** CI does not run this command.
- **The Playwright MCP server, on trial.** A committed `.mcp.json` at the repo root adds the server, so that an agent in a later session can click through a page step by step. If it bloats context or goes unused, the owner deletes that one file.
- **A page in `docs/agents/`** says when to use the command and when the server, how to give the credentials, and how to end the trial. `frontend/CLAUDE.md` gains the command.

Note in this ticket's comments whether the command also runs in a Linux cloud session. It does not have to.

Decisions are in `.scratch/roadmap.md` under "Settled on 2026-11-16", and the three widths are in `DESIGN.md` (Layout).

**Blocked by:** 28 (A user switches between light and dark), 04 (A user signs in and stays signed in)

**Status:** done

**Difficulty:** tricky: new tooling that drives a browser against two running servers on Windows, with a sign-in that must survive between pages; it will need debugging, and every page ticket depends on it.

- [x] One command produces twelve images for one address, and the names show the address, width, theme and language
- [x] It photographs a guest address and a signed-in address; the signed-in image shows the signed-in state
- [x] No credential is in the repo, in the command's output or in an image's name, and the image folder is ignored by Git
- [x] With the frontend or the backend stopped, the command ends with a message that names what is not running
- [x] It photographs one outside public address at the three widths
- [x] An agent reads one of the images it produced and describes what the page shows; the description is recorded in this ticket's comments
- [ ] `.mcp.json` is committed, and a new session lists the Playwright tools
- [x] The "Running the app" line in the root `CLAUDE.md` names the Playwright MCP server as an agent's first way to look at a page, with the Claude in Chrome extension as the fallback (owner's decision, 2026-11-17). A side-by-side trial of the two is not needed
- [x] The new page in `docs/agents/` and the line in `frontend/CLAUDE.md` exist

## Comments

**2026-11-18, an agent's description of one image** (`home--signed-in--1280-light-en.png`, from `npm run screenshots -- / --signed-in`): the light theme at 1280 px, in English. A white header bar runs across the top: on the left "Signed in as" and the development account's name in small grey text and an outlined "Sign out" button; on the right two button pairs, "Light" (filled blue, the current choice) and "Dark", then "English" (filled blue) and "ქართული". Below the header, on the light grey page, a line of small grey text reads "0 conversations with unread messages" and "No friends online". Under it sits a row of four sample buttons: "Primary" (filled blue), "Quiet" (outlined), "Danger" (red outline and text) and "Disabled" (greyed). The main column is centred: a bold "WebCity" heading, a "Search users" label, a wide outlined text box and a grey "Search" button with a magnifier icon. The rest of the page is empty. The guest images of `/sign-in` show the sign-in form's labels with no visible input boxes: the template has no classes yet and Tailwind's base styles remove the browser's borders, so the images are faithful.

**2026-11-18, Linux cloud sessions:** not tried. Nothing in the command is Windows-only (it is Node and the `playwright` package; the `MSYS_NO_PATHCONV=1` prefix is only for Git Bash), so an outside address should work once Chromium and its system libraries are installed (`npm exec --prefix frontend -- playwright install --with-deps chromium`). App addresses also need the backend and the frontend running in the session: the backend needs a SQL Server and the gitignored settings files, and `scripts/test-linux.sh` prepares those only for the integration tests, not for running the app. The Playwright MCP server in `.mcp.json` starts through `cmd /c`, so a Linux session shows it as failed and carries on without it.

**2026-11-18, the unticked box:** `.mcp.json` is in this commit, and the server it starts answers over the MCP protocol with 25 `browser_*` tools (checked by starting it by hand). `claude mcp list` shows it as "Pending approval": Claude Code asks each person once before it runs a server from a project `.mcp.json`. The owner approves `playwright` in a new session (or through `/mcp`) and ticks the box once that session lists the tools.
