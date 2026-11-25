# AGENTS.md

This file is for agents other than Claude Code, such as OpenAI's Codex. Claude Code reads `CLAUDE.md` instead. This file adds nothing to `CLAUDE.md`. It tells you how to read `CLAUDE.md` without Claude Code's tools, and it repeats the owner's rules that only Claude's private memory holds. How Codex fits into the workflow: `docs/agents/codex.md`.

## Read first

1. **`CLAUDE.md`** at the repo root. It is this project's instructions, and every rule in it applies to you. Where it names a Claude Code feature, follow the translation below.
2. **Code style:** the `webcity-conventions` skill. Use it on every code change, reading `references/control-flow.md` and the file for the language you are editing as its "How to use this skill" section says.
3. **Frontend work:** `frontend/CLAUDE.md` (its hard styling rules) and `DESIGN.md`, before you edit a template or a style.
4. **Per-area docs:** the files under `docs/backend/` and `docs/agents/` that `CLAUDE.md` points to for the area you touch.

## Claude Code terms and what to do instead

- **Skills:** Discover project skills through `.agents/skills/`, which links to their shared instructions in `.claude/skills/`. Only the owner starts an explicit-only workflow, using `$<skill-name>` in Codex. When an invoked workflow calls Claude Code's Skill tool, read the named linked skill and follow its instructions. An explicit invocation covers the steps of that workflow, including the grilling interview in `$grill-with-docs`.
- **Reviews:** Use `gpt-6.2-sol` at `high` effort for Codex reviews. When a skill calls for subagents, give them fresh contexts. For `spec-review`, run Standards and Spec in parallel.
- **Browser checks:** Use the project's Playwright MCP server for interactive checks and the screenshot command in `frontend/CLAUDE.md` for the required captures. If the server is unavailable, use the screenshot command. If neither is available, report that browser verification is pending.
- **`claude --worktree`:** a Codex lane makes its own worktree under `.claude/worktrees/` (steps in `docs/agents/codex.md`).
- **Commit attribution:** the owner is the author, as `CLAUDE.md` says. End the message with `Co-Authored-By: Codex <noreply@openai.com>` instead of the Claude line, and add nothing after it.

## The owner's working rules

Claude Code keeps these in a memory you cannot read. They apply to you too.

- **Commit finished work directly** when there is nothing for the owner to check. Ask first when the change needs the owner's judgement or testing.
- **Push once, when a task is done**, not after every commit. Ordinary pushes only: force-pushes and history rewrites always need the owner.
- **Never delete a branch, tag or remote ref** without asking the owner right before you do it, naming the exact refs. This holds even when the owner told you to earlier. Deleting ordinary files needs no prompt, but look at a file before you delete it.
- **No pull requests from a local session:** in the main checkout, merge the finished branch into `master` with `git merge --no-ff`, run the checks `CLAUDE.md` asks for, then push. A lane in a worktree under `.claude/worktrees/` never merges: it ends with a clean trial merge (`docs/agents/worktrees.md`).
- **Tickets are made only when the owner invokes `/to-tickets` in Claude Code or `$to-tickets` in Codex.** Outside that workflow, put findings in your reply as input for it.
- **When the owner asks "should I ...?", answer and stop.** Don't start the workflow yourself.
- **When advice conflicts with a project document,** give both arguments and let the owner decide. A document does not win by default.
- **Stop every browser and script you started** before you report, not only the servers `CLAUDE.md` names.
- **When you change a rule in the docs,** also look for what the change makes obsolete or contradicts, and remove it in the same edit. Don't only add.
- **Never edit an appsettings file while the backend runs** (ports 7102, 5045) without asking the owner first. The backend reloads settings live: a changed `Jwt:Key` signs new tokens with a key the validator rejects, and every request gets `401` until a restart. Check which file supplies a value by its full section path, not by a bare key name.
- **Favour the dark theme** in single screenshots and in tests that set a theme: about 80 % dark, 20 % light (`frontend/CLAUDE.md`).
- **After a ticket,** end your report with every file you changed, grouped by kind (services, tests, docs, ...), with new files marked.
## Working beside Claude Code

- Claude and you share no memory. What one of you knows reaches the other only through commits, `.scratch/` tickets and the roadmap, and the docs. Write down there anything the other needs.
- Never edit a branch that another session has checked out. `git worktree list` shows them.
- **As a reviewer:** report findings and change nothing, unless the owner asks for fixes. For each bug, include a file and line, a concrete failing scenario, and a severity. The house style is deliberate: concrete classes with no interfaces, one `return` per method outside controllers, the `ApplicationResponse` wrapper and the rest of `webcity-conventions`. Never report it as a defect. Report a rule broken by the code, not a rule you would prefer.
