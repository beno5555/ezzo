# AGENTS.md

This file is for agents other than Claude Code, such as OpenAI's Codex. Claude Code reads `CLAUDE.md` instead. This file adds nothing to `CLAUDE.md`. It tells you how to read `CLAUDE.md` without Claude Code's tools, and it repeats the owner's rules that only Claude's private memory holds. How Codex fits into the workflow: `docs/agents/codex.md`.

## Read first

1. **`CLAUDE.md`** at the repo root. It is this project's instructions, and every rule in it applies to you. Where it names a Claude Code feature, follow the translation below.
2. **Code style:** `.claude/skills/webcity-conventions/SKILL.md`. Do what its "How to use this skill" section says: read `references/control-flow.md` and the file for the language you are editing, then run its checklist before you finish.
3. **Frontend work:** `frontend/CLAUDE.md` (its hard styling rules) and `DESIGN.md`, before you edit a template or a style.
4. **Per-area docs:** the files under `docs/backend/` and `docs/agents/` that `CLAUDE.md` points to for the area you touch.

## Claude Code terms and what to do instead

- **A skill** (`/name`, or "the X skill"): read `.claude/skills/<name>/SKILL.md` and follow it. Never run a skill whose front matter has `disable-model-invocation: true` (`implement`, `to-spec`, `to-tickets`, `handoff`, `grill-with-docs`, `setup-matt-pocock-skills`). Only the owner starts those.
- **Subagents** (for example, the two parallel reviews in `spec-review`): do each part yourself, one after another.
- **Claude in Chrome and the Playwright MCP server:** if you have no browser tool, use the screenshot command (`npm run screenshots` in `frontend/CLAUDE.md`, once it is on `master`). If neither exists, say the page was not checked in a browser. Never claim it was.
- **`claude --worktree`:** a Codex lane makes its own worktree under `.claude/worktrees/` (steps in `docs/agents/codex.md`).
- **Commit attribution:** the owner is the author, as `CLAUDE.md` says. End the message with `Co-Authored-By: Codex <noreply@openai.com>` instead of the Claude line, and add nothing after it.

## The owner's working rules

Claude Code keeps these in a memory you cannot read. They apply to you too.

- **Commit finished work directly** when there is nothing for the owner to check. Ask first when the change needs the owner's judgement or testing.
- **Push once, when a task is done**, not after every commit. Ordinary pushes only: force-pushes and history rewrites always need the owner.
- **Never delete a branch, tag or remote ref** without asking the owner right before you do it, naming the exact refs. This holds even when the owner told you to earlier. Deleting ordinary files needs no prompt, but look at a file before you delete it.
- **No pull requests from a local session:** merge the finished branch into `master` with `git merge --no-ff`, run the suite, then push.
- **Tickets are made only by the owner's `/to-tickets` run.** Never write a ticket file by hand. Put findings in your reply as input for `/to-tickets`.
- **When the owner asks "should I ...?", answer and stop.** Don't start the workflow yourself.
- **When advice conflicts with a project document,** give both arguments and let the owner decide. A document does not win by default.
- **Stop every server, browser and script you started** before you report. Confirm that ports 4200 and 7102 are free.
- **After a ticket,** end your report with every file you changed, grouped by kind (services, tests, docs, ...), with new files marked.
- **When you report a test run,** include its `Duration:`.

## Working beside Claude Code

- Claude and you share no memory. What one of you knows reaches the other only through commits, `.scratch/` tickets and the roadmap, and the docs. Write down there anything the other needs.
- Never edit a branch that another session has checked out. `git worktree list` shows them.
- **As a reviewer:** report findings and change nothing, unless the owner asks for fixes. The house style is deliberate: concrete classes with no interfaces, one `return` per method outside controllers, the `ApplicationResponse` wrapper and the rest of `webcity-conventions`. Never report it as a defect. Report a rule broken by the code, not a rule you would prefer.
