# Working with Codex beside Claude Code

Claude Code does most of the implementing, and Codex adds a second model for review or takes an implementation lane. Codex reads `AGENTS.md`, which points to `CLAUDE.md` and repeats the owner's rules from Claude's project memory. It discovers the shared skills through `.agents/skills/` ("Skills for Codex" in `skills.md`).

## Review order for a branch

1. Claude implements the ticket on its branch.
2. `/spec-review` (Claude): conventions and ticket scope. Fix what it finds.
3. Codex reviews the final diff for bugs. Run it from the folder that has the branch checked out (the worktree, or the repo root):

   ```bash
   codex review --base master -c 'review_model="gpt-6.2-sol"' -c 'model_reasoning_effort="high"'
   ```

4. Paste the findings into the Claude session. Claude checks each finding against the code, and the owner decides which to fix ("When advice conflicts" in `AGENTS.md`).
5. Merge as usual.

Codex reviews the final diff for bugs after the separate standards and ticket-scope checks. If Codex implements the ticket, it runs those two checks through `spec-review` before handing off the branch.

## A Codex implementation lane

Use `codex --worktree` from the repo root, or `/worktree` in an open Codex session, to start a managed worktree. For a ticket lane with a named branch under `.claude/worktrees/` and local test settings, run this from the repo root in PowerShell:

```powershell
$name = 'feature-name'
$lane = ".claude/worktrees/$name"
git fetch
if ($LASTEXITCODE -ne 0) { throw 'git fetch failed' }
git worktree add $lane -b "worktree-$name" origin/master
if ($LASTEXITCODE -ne 0) { throw 'git worktree add failed' }
Get-Content .worktreeinclude | Where-Object { $_ -match '^\s*[^#\s]' } | ForEach-Object {
    Copy-Item -LiteralPath $_ -Destination (Join-Path $lane $_) -ErrorAction Stop
}
codex -C $lane
```

Choose a ticket whose scope fits alongside the other active lanes. See [worktree setup and handoff](worktrees.md) for test databases and the trial merge. For frontend checks, use the [Playwright MCP server and screenshot command](screenshots.md).

## Keeping AGENTS.md true

`AGENTS.md` repeats the owner's rules from Claude's project memory, because Codex cannot read that memory. When a Claude session adds or changes a memory rule that applies to every agent, it updates the list in `AGENTS.md` in the same task. Everything else lives in `CLAUDE.md` and the docs, and `AGENTS.md` only points to it, so it cannot drift out of date.
