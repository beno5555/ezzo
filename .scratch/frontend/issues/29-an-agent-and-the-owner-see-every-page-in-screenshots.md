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

**Status:** ready-for-agent

**Difficulty:** tricky: new tooling that drives a browser against two running servers on Windows, with a sign-in that must survive between pages; it will need debugging, and every page ticket depends on it.

- [ ] One command produces twelve images for one address, and the names show the address, width, theme and language
- [ ] It photographs a guest address and a signed-in address; the signed-in image shows the signed-in state
- [ ] No credential is in the repo, in the command's output or in an image's name, and the image folder is ignored by Git
- [ ] With the frontend or the backend stopped, the command ends with a message that names what is not running
- [ ] It photographs one outside public address at the three widths
- [ ] An agent reads one of the images it produced and describes what the page shows; the description is recorded in this ticket's comments
- [ ] `.mcp.json` is committed, and a new session lists the Playwright tools
- [ ] The "Running the app" line in the root `CLAUDE.md` names the Playwright MCP server as an agent's first way to look at a page, with the Claude in Chrome extension as the fallback (owner's decision, 2026-11-17). A side-by-side trial of the two is not needed
- [ ] The new page in `docs/agents/` and the line in `frontend/CLAUDE.md` exist
