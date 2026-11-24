# Parallel local sessions in worktrees

Give each parallel lane its own ticket branch and git worktree. Use the main checkout to integrate finished lanes.

## Start a lane

From the repo root:

```bash
claude --worktree <name>        # e.g. claude -w feed-ranking
```

Claude Code creates `.claude/worktrees/<name>/` on a new branch `worktree-<name>`, based on `origin/master` as just fetched. `.worktreeinclude` copies the gitignored settings files (the three `appsettings*.json` and `.claude/settings.local.json`) into it. Auto memory is shared by every worktree of the repo.

Pick tickets that touch different files. The ticket's "What to build" names the areas, and two tickets that change the same service, query, seeder or doc conflict on merge.

## What differs inside a worktree

- **Test databases.** By default, a linked worktree gets a pool named after its folder. See [database pool and connection overrides](../backend/testing.md#the-database-pool).
- **Sync.** Fetch from the worktree. The [pull on `master`](../../CLAUDE.md#agent-workflow) applies to the main checkout.
- **Skills.** The worktree has its own copy of `.claude/skills/`, separate from the junctions in `~/.claude/skills/` (see `skills.md`). Editing a skill there is fine: the edit is committed on the lane's branch and reaches the shared copy with that branch.

## Finish a lane

A lane never merges into `master`, and never commits on it, by any route. The owner does that later from the main checkout. A lane's job ends when its branch is known to merge into `master` without conflicts.

1. Commit on `worktree-<name>`, with the ticket's roadmap and review-queue updates in the branch (see `issue-tracker.md`).
2. Run a trial merge against the latest `master`. It writes nothing to any checkout and moves no branch:

   ```bash
   git fetch
   git merge-tree --write-tree --name-only --no-messages origin/master HEAD
   ```

   Exit code 0 means no conflicts: the output is one line, the id of the merged tree. Exit code 1 means conflicts, and every line after the first names a conflicted file.
3. If it conflicts, bring `master` into the lane's own branch with `git merge origin/master`, resolve the conflicts there (below), run the checks for each side the resolution touched (the build and the full integration suite from `backend/`, and Prettier's check, lint, the unit tests and the build from `frontend/`), and commit. Then repeat step 2 until it exits 0.
4. Push the branch (`git push -u origin HEAD`). Then report the ticket done, say that the trial merge against `origin/master` (name its commit) was clean, and stop.
5. When you exit the session, keep the worktree: removing it can delete the branch along with it, and it deletes gitignored files that exist only there (above all `frontend/.env`, the screenshot account).

### Resolving conflicts with another lane

A trial merge finds only the conflicts git can see. Before you resolve anything, read the other lane's ticket: a lane whose change will collide with another open lane adds a dated note under `## Comments` in its own ticket, saying which files collide, which side to keep, and which change git will *not* flag (for example an `.Include()` that a shared mapper now needs). Typical cases:

- Two lanes add the same new file (add/add): take one side whole with `git checkout --theirs <file>` or `--ours`, then re-add the other side's lines by hand.
- Two lanes add a bullet in the same README or doc spot: keep both.
- Something neither the ticket notes nor the docs settle: stop and ask the owner.

Comments that say a shape is "meant for ticket X to reuse" go stale once X is in `master`; update them. This Windows machine has no Python, so script edits with `sed` or use the Edit tool.

### Test databases

A worktree's test databases stay behind. Drop them once the owner says the lane's branch is in `master` (a pool on a machine with fewer than four cores has fewer databases; `IF EXISTS` skips the missing ones):

```bash
sqlcmd -S localhost -E -Q "DROP DATABASE IF EXISTS [TestSocialMediaWebApiDb_<name_with_underscores>_1], [TestSocialMediaWebApiDb_<name_with_underscores>_2], [TestSocialMediaWebApiDb_<name_with_underscores>_3], [TestSocialMediaWebApiDb_<name_with_underscores>_4]"
```

A lane started before the suite ran in parallel also left a single `TestSocialMediaWebApiDb_<name_with_underscores>`, and the main checkout a `TestSocialMediaWebApiDb`; no run uses them any more.
