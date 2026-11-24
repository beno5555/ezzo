# Syncing with origin

The sync rule is "Sync first" under "Agent workflow" in the root `CLAUDE.md`. This page covers the rare case where it fails.

## A refused pull

`git pull --ff-only` on `master` refuses when git cannot fast-forward. Usually that means `master` really diverged. In a **shallow clone**, though, git cannot see the shared history, so it finds no merge base, and `git fetch` can even report `origin/master` as a forced update when nothing was force-pushed. A cloud session's clone can be shallow: it happened once, on 2026-11-17, in the cloud session for n8n ticket 01.

1. Run `git rev-parse --is-shallow-repository`. If it prints `true`, run `git fetch --unshallow`.
2. Run `git merge-base --is-ancestor master origin/master`. If it succeeds, `master` is only behind: run `git merge --ff-only origin/master`.
3. If it fails, `master` really diverged. Stop and tell the owner. Never merge, rebase or force-push to fix it.
