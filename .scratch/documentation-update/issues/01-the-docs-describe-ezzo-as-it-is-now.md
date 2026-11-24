# 01: The docs describe Ezzo as it is now

**What to build:** A reader of any current doc in the repository (a visitor, the academy, or an agent) finds the product as it is on hand-in day, under its name **Ezzo**. This ticket merges three pieces of documentation work into one:

- **The READMEs.** Monorepo ticket 04 (the README describes the product as full-stack) is folded in here, with its decisions unchanged: a short root README that hands off to `backend/README.md` and `frontend/README.md`. See that ticket's "Decisions" and "Acceptance" sections, which this ticket's checklist repeats.
- **The per-area docs.** Every file under `docs/backend/` and `docs/agents/`, the ADRs, `n8n/README.md` and `frontend/README.md` are checked against the code and corrected where they no longer hold. This is the "Update `README.md` and `docs/backend/*.md` for everything added" part of roadmap step 10.
- **The C4 document** (`docs/c4/`, in Georgian, for the academy). Its content was brought up to the current state on 2026-11-25 (status table, internal and moderation controllers, diagram 3a). What is left: the name, rebuilding the diagrams, and rebuilding the PDF, which was not rebuilt because pandoc was missing. Pandoc 3.14 is installed (2026-11-25) at `C:\Users\admin\AppData\Local\Pandoc\`; a shell started before the install lacks it on its PATH, so prepend that folder if `pandoc` is not found. Run the two build commands in the document's last section. `playwright` resolves from `frontend/node_modules` when `NODE_PATH` points there. Commit only the diagrams whose content changed: a rebuild rewrites every PNG and every SVG's line endings.

**The rename from WebCity to Ezzo** (owner, 2026-11-25) applies to prose: every current doc, the skills' text, the code comments, and the Swagger title. **Names that something else reads stay as they are,** and renaming them is deferred: the `X-WebCity-Signature` header, n8n's `WEBCITY_*` variables (in the workflows and the owner's `n8n/.env`), the screenshot tool's `WEBCITY_SCREENSHOTS_*` variables, the browser storage keys `webcity.theme` and `webcity.language`, the session lock's name, the frontend package and Angular project name `webcity`, the ESLint plugin name `webcity/...`, the test host names `*.webcity.test`, the test upload folder, and the `webcity-conventions` skill's name (renaming a skill touches the junctions in `~/.claude/skills/` and the links in `.agents/skills/`; see `docs/agents/skills.md`). Add one entry under "After the deadline" in the roadmap for that deferred rename, listing these names.

**Records stay as they were written:** `webcity-documentation.md` (the document already sent to the academy) and the tickets, specs and comments under `.scratch/`, except the roadmap and the review queue, which describe what is ahead. Mark monorepo ticket 04 superseded by this ticket.

**The former name, once.** Agents must know that the product was called WebCity and that the deferred names keep it, so they neither "fix" those names nor wonder about them. One sentence at the top of `CLAUDE.md` says so; `AGENTS.md` sends Codex to `CLAUDE.md` first, so it needs no copy.

**The repository's name, last.** After the branch is merged and pushed, rename the GitHub repository from `webcity` to `ezzo` (`gh repo rename`) and point `origin` at the new address. GitHub redirects the old address. The local root folder is not renamed: project memory is keyed to its path (`CLAUDE.md`). Ask the owner just before the rename, because it is visible outside the repository.

The work continues on the branch that already holds the C4 update, `claude/vibrant-knuth-zfi3mt` (master is merged into it), and is merged into `master` with `--no-ff` like any ticket. It changes no behaviour, so it merges once the checks pass; the owner reads the docs after the merge.

**Blocked by:** None (can start immediately).

**Status:** done

**Difficulty:** tricky: every statement must be checked against the code across some 60 files and three READMEs, and no test catches a wrong doc. The owner chose Opus 5.5 at high effort (2026-11-25).

- [x] The root README describes Ezzo as a product, names both halves, tells a reader how to run each (backend, frontend, n8n), and links to `backend/README.md`, `frontend/README.md`, `n8n/README.md` and `DESIGN.md`
- [x] The backend's detail is in `backend/README.md` and no longer in the root README; nothing is said in two of the READMEs
- [x] `frontend/README.md` covers the stack, the folder layout, pages loaded on demand, the single origin through the dev proxy, and the commands, and points to `frontend/CLAUDE.md` and `DESIGN.md` instead of repeating them
- [x] Every pointer to the old root README follows the move: the "Design Decisions" pointer and the Docs section in `CLAUDE.md`, and the "See also" line at the top of each `docs/backend/*.md`
- [x] Every statement in the three READMEs, `docs/backend/*.md`, `docs/agents/*.md` and `n8n/README.md` is true of the code on the branch
- [x] No current doc, skill text, code comment or the Swagger title says WebCity, apart from the one sentence in `CLAUDE.md` about the former name and the deferred names it lists
- [x] No deferred name has changed, and the build, the full integration suite, and the frontend's Prettier check, lint, unit tests and build pass
- [x] The C4 document and its diagrams say Ezzo; the changed diagrams and the PDF are rebuilt and the PDF is checked by eye
- [x] The roadmap's step 10 points to this ticket instead of monorepo ticket 04, and "After the deadline" lists the deferred rename
- [x] Monorepo ticket 04's status says it is superseded by this ticket
- [x] After the merge and push, and with the owner's go-ahead, the GitHub repository is `ezzo` and `origin` points to it

## Comments

**2026-11-25, round 1: implementation (Opus 5.5).**

- **Built.**
  - The old root README is now `backend/README.md`, moved with its history and corrected against the code: the API tree, the run command with `--launch-profile https`, and relative links.
  - A new root README describes Ezzo as a product, names the two halves with a link to each, gives the three steps to run it, and links `DESIGN.md`.
  - `frontend/README.md` is rewritten.
  - The proxy explanation moved out of `frontend/CLAUDE.md` into the frontend README; `frontend/CLAUDE.md` keeps the rule.
  - `CLAUDE.md` has the former-name sentence and the new README pointers.
  - WebCity is now Ezzo in the docs, ADRs, glossary, `PRODUCT.md`, `DESIGN.md`, the skill text, three code comments, the Swagger title and the C4 document.
- **Truth check, stale facts corrected:**
  - ADR 0004: the `Refresh` limit is raised.
  - ADR 0005: the UTC converter exists.
  - `controllers.md`: the automation's moderation already uses the flag routes.
  - `auth.md`: the internal routes' limits, and the open forwarded-headers gap names readiness ticket 07.
  - `signalr.md`: all six services that push through `IHubContext`, and the missing `EditedAt`.
- **"See also" lines.** `docs/backend` has none, so that part of the pointer box had nothing to move.
- **Departures:**
  - The C4 files are renamed to `docs/c4/ezzo-c4.md` and `.pdf`, so the document sent to the academy carries the product's name. No current file pointed to the old name.
  - The former-name sentence and the roadmap entry list four deferred names beyond the ticket's list, because something reads each of them: the probe origin `webcity.invalid`, `~/.webcity-test` and `webcity-test-sql` in `scripts/test-linux.sh`, and the cloud database `WebCityDev`.
  - The sample exception names in `n8n/send-test-exception.ps1` say Ezzo; nothing parses them.
- **Open decision.** The frontend's commands live only in `frontend/CLAUDE.md`; the frontend README points there, to keep one home per fact. Recommendation: keep it that way.
- **Checks, all green:**
  - backend: the build and the full integration suite (963 tests)
  - frontend: the Prettier check, lint, the unit tests (989) and the build
- **C4.** All six diagrams changed, and in the text only where the name appears, so all six are rebuilt and committed. The PDF was viewed in Chrome: the title, the body text and the diagrams say Ezzo.
- **Review findings fixed:**
  - Both reviews: `backend/README.md` falsely said a plain `dotnet run` cannot be reached by the proxy; both profiles listen on 7102.
  - Standards review:
    - The root README's paragraph repeated both halves' stacks; it now names each half with a link.
    - The frontend README repeated the commands from `frontend/CLAUDE.md`.
    - The roadmap entry repeated the deferred-name list.
    - `PRODUCT.md` did not mention records.
    - `build.mjs` kept the variable `webcity`.
  - Spec review: the API tree was missing `UtcDateTimeDefaultValueAttribute.cs`.
- **Review findings left alone:**
  - The former-name sentence is not marked **Temporary**: the former name stays true after the deferred rename, and only the list will shrink.
  - The root README's feature list overlaps the API's feature list in `backend/README.md`. One is for users, the other for API consumers.
- **For the owner.** Your gitignored `appsettings.json` and `appsettings.Testing.json` set `EmailConfiguration:SenderName` to WebCity, so users see that name on the emails. The ticket does not change local settings.
- **Branch.** Merged into `master` with `--no-ff` and pushed. With the owner's go-ahead the repository is renamed to `beno5555/ezzo` and `origin` is `git@github.com:beno5555/ezzo.git`. The owner deferred renaming the local root folder until after the deadline (roadmap).
