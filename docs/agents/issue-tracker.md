# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The spec is `.scratch/<feature-slug>/spec.md`
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- State is recorded as a `Status:` line near the top of each issue file: `ready-for-agent` (new, the value `/to-tickets` writes), then `in-progress`, then `done`
- Each ticket also carries a `Difficulty:` line that decides which model implements it:
  - `routine`: Sonnet 5.5 at high effort
  - `routine (Opus 5.5 medium)`: Opus 5.5 at medium effort, for work that is fully specified but where Sonnet is likely to slip
  - `tricky`: Opus 5.5 at high effort
- The rules for choosing a level are in the `/to-tickets` skill. The review at the end of `/implement` runs on Opus 5.5 at high effort whatever model implemented the ticket (`/spec-review`, step 4)
- Sessions that decide rather than build run on Opus 5.5 at high effort: a grilling, the conversation before `/to-spec`, a naming or brand session, a review of the schedule. Implementing a ticket follows its `Difficulty:` level, because a finished ticket has already had its judgment done; a ticket that turns out to need a decision it does not make goes back to the owner
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- A ticket is implemented on its own branch (named after the ticket, e.g. `frontend-01-reserved-usernames`), not on `master`, and once the ticket is `done` a local session in the main checkout merges the branch into `master` with `--no-ff`. A cloud session pushes the branch and opens a pull request into `master` instead, and never merges into or pushes to `master` itself; the owner merges the pull request. When asked to implement a ticket while on `master`, the agent reminds the owner of this first and offers the branch; it works on `master` only if the owner says so. A session in a worktree under `.claude/worktrees/` is already on its own branch, and never merges it: it ends with a clean trial merge (see "Finish a lane" in `worktrees.md`)
- **Cloud sessions open a pull request for every ticket,** visual or not, and leave the merge to the owner. The open pull request takes the place of a roadmap line, so a cloud session adds none to `.scratch/roadmap.md`. The rest of this list is for local sessions.
- **When a done ticket is merged depends on what it changes.** The owner reviews every ticket, but not always before the merge:
  - **Visual work** (a page, a shared component, styles, design tokens; any frontend ticket whose result is checked by looking) waits for the owner's review before it is merged. A session in the main checkout lists its branch under "Not merged yet" in `.scratch/roadmap.md` and stops. A worktree lane cannot commit on `master`, so it writes no such line: its report names the waiting branch, and `git branch --no-merged master` lists it afterwards.
  - **Everything else** (backend, tests, tooling, frontend plumbing with no visual part) is merged as soon as the build, the full test suite and `/spec-review` pass. Before the merge, the session adds a line on the branch under "Awaiting the owner's review" in `.scratch/roadmap.md` that says what to look at, and the owner reviews it after the merge

- **The roadmap is updated on the ticket's branch, before the merge** (owner, 2026-11-19). The roadmap changes a ticket causes (ticking its step, marking it merged in the lanes table, rewriting what it unblocks, the "Awaiting the owner's review" line) go into a commit on the branch, so the merge brings them to `master`. No roadmap commit follows on `master` after the merge. A visual branch from the main checkout is the one exception: its "Not merged yet" line has to be on `master` while the branch waits, so that line is committed on `master`. When the owner approves, the merge commit (`git merge --no-ff --no-commit`) deletes it.

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed).

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md` (the Notes / Decisions-so-far / Fog body).
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`, with the question in the body. A `Type:` line records the ticket type (`research`/`prototype`/`grilling`/`task`); a `Status:` line records `claimed`/`resolved`.
- **Blocking**: a `Blocked by: NN, NN` line near the top. A ticket is unblocked when every file it lists is `resolved`.
- **Frontier**: scan `.scratch/<effort>/issues/` for files that are open, unblocked, and unclaimed; first by number wins.
- **Claim**: set `Status: claimed` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `Status: resolved`, then append a context pointer (gist + link) to the map's Decisions-so-far in `map.md`.
