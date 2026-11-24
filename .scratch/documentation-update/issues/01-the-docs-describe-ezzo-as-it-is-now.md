# 01: The docs describe Ezzo as it is now

**What to build:** A reader of any current doc in the repository (a visitor, the academy, or an agent) finds the product as it is on hand-in day, under its name **Ezzo**. This ticket merges three pieces of documentation work into one:

- **The READMEs.** Monorepo ticket 04 (the README describes the product as full-stack) is folded in here, with its decisions unchanged: a short root README that hands off to `backend/README.md` and `frontend/README.md`. See that ticket's "Decisions" and "Acceptance" sections, which this ticket's checklist repeats.
- **The per-area docs.** Every file under `docs/backend/` and `docs/agents/`, the ADRs, `n8n/README.md` and `frontend/README.md` are checked against the code and corrected where they no longer hold. This is the "Update `README.md` and `docs/backend/*.md` for everything added" part of roadmap step 10.
- **The C4 document** (`docs/c4/`, in Georgian, for the academy). Its content was brought up to the current state on 2026-11-25 (status table, internal and moderation controllers, diagram 3a). What is left: the name, rebuilding the diagrams, and rebuilding the PDF, which was not rebuilt because pandoc was missing. Install pandoc on the owner's machine (`winget install JohnMacFarlane.Pandoc`, owner's approval given 2026-11-25), then run the two build commands in the document's last section. `playwright` resolves from `frontend/node_modules` when `NODE_PATH` points there. Commit only the diagrams whose content changed: a rebuild rewrites every PNG and every SVG's line endings.

**The rename from WebCity to Ezzo** (owner, 2026-11-25) applies to prose: every current doc, the skills' text, the code comments, and the Swagger title. **Names that something else reads stay as they are,** and renaming them is deferred: the `X-WebCity-Signature` header, n8n's `WEBCITY_*` variables (in the workflows and the owner's `n8n/.env`), the screenshot tool's `WEBCITY_SCREENSHOTS_*` variables, the browser storage keys `webcity.theme` and `webcity.language`, the session lock's name, the frontend package and Angular project name `webcity`, the ESLint plugin name `webcity/...`, the test host names `*.webcity.test`, the test upload folder, and the `webcity-conventions` skill's name (renaming a skill touches the junctions in `~/.claude/skills/` and the links in `.agents/skills/`; see `docs/agents/skills.md`). Add one entry under "After the deadline" in the roadmap for that deferred rename, listing these names.

**Records stay as they were written:** `webcity-documentation.md` (the document already sent to the academy) and the tickets, specs and comments under `.scratch/`, except the roadmap and the review queue, which describe what is ahead. Mark monorepo ticket 04 superseded by this ticket.

**The former name, once.** Agents must know that the product was called WebCity and that the deferred names keep it, so they neither "fix" those names nor wonder about them. One sentence at the top of `CLAUDE.md` says so; `AGENTS.md` sends Codex to `CLAUDE.md` first, so it needs no copy.

**The repository's name, last.** After the branch is merged and pushed, rename the GitHub repository from `webcity` to `ezzo` (`gh repo rename`) and point `origin` at the new address. GitHub redirects the old address. The local root folder is not renamed: project memory is keyed to its path (`CLAUDE.md`). Ask the owner just before the rename, because it is visible outside the repository.

The work continues on the branch that already holds the C4 update, `claude/vibrant-knuth-zfi3mt` (master is merged into it), and is merged into `master` with `--no-ff` like any ticket. It changes no behaviour, so it merges once the checks pass; the owner reads the docs after the merge.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Difficulty:** tricky: every statement must be checked against the code across some 60 files and three READMEs, and no test catches a wrong doc. The owner chose Opus 5.5 at high effort (2026-11-25).

- [ ] The root README describes Ezzo as a product, names both halves, tells a reader how to run each (backend, frontend, n8n), and links to `backend/README.md`, `frontend/README.md`, `n8n/README.md` and `DESIGN.md`
- [ ] The backend's detail is in `backend/README.md` and no longer in the root README; nothing is said in two of the READMEs
- [ ] `frontend/README.md` covers the stack, the folder layout, pages loaded on demand, the single origin through the dev proxy, and the commands, and points to `frontend/CLAUDE.md` and `DESIGN.md` instead of repeating them
- [ ] Every pointer to the old root README follows the move: the "Design Decisions" pointer and the Docs section in `CLAUDE.md`, and the "See also" line at the top of each `docs/backend/*.md`
- [ ] Every statement in the three READMEs, `docs/backend/*.md`, `docs/agents/*.md` and `n8n/README.md` is true of the code on the branch
- [ ] No current doc, skill text, code comment or the Swagger title says WebCity, apart from the one sentence in `CLAUDE.md` about the former name and the deferred names it lists
- [ ] No deferred name has changed, and the build, the full integration suite, and the frontend's Prettier check, lint, unit tests and build pass
- [ ] The C4 document and its diagrams say Ezzo; the changed diagrams and the PDF are rebuilt and the PDF is checked by eye
- [ ] The roadmap's step 10 points to this ticket instead of monorepo ticket 04, and "After the deadline" lists the deferred rename
- [ ] Monorepo ticket 04's status says it is superseded by this ticket
- [ ] After the merge and push, and with the owner's go-ahead, the GitHub repository is `ezzo` and `origin` points to it
