# Working with Codex beside Claude Code

The owner has a Claude plan and a ChatGPT plan. Claude Code does most of the implementing: it holds the project memory, the skills and the browser tools. Codex (OpenAI's CLI, `codex`) adds a second model. Its main job is reviewing, because a model from another vendor misses different things than the model that wrote the code. Codex reads `AGENTS.md` (root), which sends it to `CLAUDE.md` and repeats the owner's rules from Claude's memory. It finds the shared skills through the symlinks in `.agents/skills/` ("Skills for Codex" in `skills.md`).

## Review order for a branch

1. Claude implements the ticket on its branch.
2. `/spec-review` (Claude): conventions and ticket scope. Fix what it finds.
3. Codex reviews the final diff for bugs. Run it from the folder that has the branch checked out (the worktree, or the repo root):

   ```bash
   codex review --base master "Follow AGENTS.md. Hunt for correctness bugs, security holes and missing tests in this branch; for each, give file:line, a concrete failing scenario and a severity. Do not report house-style choices that webcity-conventions requires."
   ```

4. Paste the findings into the Claude session. Claude checks each finding against the code, and the owner decides which to fix ("When advice conflicts" in `AGENTS.md`).
5. Merge as usual.

Codex reviews last so that it reads the code that is actually merged. Once Codex does the bug review, Claude's `/code-review` on the same branch is mostly duplicate work. Skip it when usage is tight, but keep `/spec-review`: it needs the skills and ticket context that only the Claude side reads automatically.

## A Codex implementation lane

Use this for a self-contained ticket that touches files no other lane touches. `claude --worktree` and `.worktreeinclude` are Claude Code features, so from the repo root make the lane by hand:

```bash
git fetch
git worktree add .claude/worktrees/<name> -b worktree-<name> origin/master
for f in $(grep -v '^#' .worktreeinclude); do cp "$f" ".claude/worktrees/<name>/$f"; done
```

Then start `codex` inside `.claude/worktrees/<name>/`. Test databases are named after the folder, so the lane gets its own pool, as in `worktrees.md`. Codex cannot use Claude in Chrome. For a frontend page, a Claude session (or the owner) does the browser check before the merge. Finish the lane as in `worktrees.md`: a lane never merges into `master`.

## Keeping AGENTS.md true

`AGENTS.md` repeats the owner's rules from Claude's project memory, because Codex cannot read that memory. When a Claude session adds or changes a memory rule that applies to every agent, it updates the list in `AGENTS.md` in the same task. Everything else lives in `CLAUDE.md` and the docs, and `AGENTS.md` only points to it, so it cannot drift out of date.
