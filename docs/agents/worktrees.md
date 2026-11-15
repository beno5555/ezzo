# Parallel local sessions in worktrees

Two local Claude sessions can implement two tickets at once, each in its own git worktree on its own branch. The main checkout stays on `master` and is where branches are merged.

## Start a lane

From the repo root:

```bash
claude --worktree <name>        # e.g. claude -w feed-ranking
```

Claude Code creates `.claude/worktrees/<name>/` on a new branch `worktree-<name>`, based on `origin/master` as just fetched. `.worktreeinclude` copies the gitignored settings files (the three `appsettings*.json` and `.claude/settings.local.json`) into it. Auto memory is shared by every worktree of the repo.

Pick tickets that touch different files. The ticket's "What to build" names the areas, and two tickets that change the same service, query, seeder or doc conflict on merge.

## What differs inside a worktree

- **Test database.** With `ConnectionStrings__DefaultConnection` unset, `DatabaseFixture` names the local database after the worktree folder (`TestSocialMediaWebApiDb_<name>`, with any character other than a letter or digit turned into `_`), and `CustomWebApplicationFactory` gives the app under test the same connection string. The first run creates and migrates it. The main checkout keeps `TestSocialMediaWebApiDb`. So two suites never wipe each other's data.
- **Sync.** Skip CLAUDE.md's "pull on `master`" step: `master` is checked out in the main checkout, and the worktree already starts from a fresh `origin/master`.
- **Skills.** The worktree has its own copy of `.claude/skills/`, separate from the junctions in `~/.claude/skills/` (see `skills.md`). Editing a skill there is fine: the edit is committed on the lane's branch and reaches the shared copy when the branch is merged.

## Finish a lane

1. In the worktree, commit on `worktree-<name>`.
2. In the main checkout, on `master`: `git merge --no-ff worktree-<name>`. A worktree session can do this itself: see "Merging from a worktree session" below.
3. Run the full suite on `master` once both lanes are merged, since each lane was tested only against its own base.
4. Push `master`.
5. Exit the worktree session. Claude Code asks whether to keep or remove the worktree. Deleting the branch is a separate step that the owner confirms.

### Merging from a worktree session

A session inside a worktree can do the merge itself. Git will not check out `master` in the worktree, because the main checkout already has it checked out, but no checkout is needed: run the commands in the main checkout's folder (the repo root, two levels above `.claude/worktrees/<name>/`), by `cd`-ing there or with `git -C <repo root>`. All worktrees share one repository, so the lane's commits are already visible there. Steps:

1. Make sure the main checkout is clean (`git -C <repo root> status`). If it is not, stop and ask the owner: those are someone else's changes.
2. `git merge --no-ff --no-commit worktree-<name>`, so you can fix things before the merge commit.
3. Resolve conflicts (below), then build and run the full suite **from the main checkout's `backend/`**. That uses the main test database, `TestSocialMediaWebApiDb`. If an IDE holds a file under `obj/` and the build fails with an `IOException`, add `--artifacts-path <scratch folder>` to `dotnet build` and `dotnet test`.
4. Commit the merge, push `master`, and report what conflicted and how each conflict was resolved.

**Conflicts between parallel lanes.** The lane that merges first should add a dated note under `## Comments` in its ticket for whoever merges the other lane. The note says which files will conflict, which side to keep, and which change git will *not* flag (for example an `.Include()` that a shared mapper now needs). Read that note before you resolve anything. Typical cases:

- Two lanes add the same new file (add/add): take one side whole with `git checkout --theirs <file>` or `--ours`, then re-add the other side's lines by hand.
- Two lanes add a bullet in the same README or doc spot: keep both.
- Something neither the ticket notes nor the docs settle: stop and ask the owner.

Comments that say a shape is "meant for ticket X to reuse" go stale once X is merged; update them. This Windows machine has no Python, so script edits with `sed` or use the Edit tool.

A worktree's test database stays behind. Drop it when the lane is done:

```bash
sqlcmd -S localhost -E -Q "DROP DATABASE [TestSocialMediaWebApiDb_<name_with_underscores>]"
```
