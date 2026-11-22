---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Read the repo's issue tracker doc (see CLAUDE.md, usually `docs/agents/issue-tracker.md`) for its status convention. When working from a ticket, set its status to `in-progress` before you start.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, call the Skill tool with "spec-review" to review the work against the spec/tickets and the repo's standards.

When working from a ticket, once the review is done, set its status to `done` and tick its acceptance checkboxes that are met. Report any box that is not met instead of ticking it.

Commit your work to the current branch, including the ticket's status update and its round report (below), but only when the build and the full test suite pass. If either fails, don't commit: report the failures and stop.

If the work adds a database migration, read it before committing. If it drops or renames a table or column, or changes a column's type (in EF Core: `DropTable`, `DropColumn`, `RenameColumn`, `AlterColumn` with a new type), don't commit: list those operations and ask the user to confirm the data loss is intended. Otherwise commit as usual, and note in your summary that the migration has to be applied to the user's dev database.

## The round report

When working from a ticket, append a round report to it before you commit, under `## Comments` as `**<date>, round 1: implementation (<model>).**`. The owner gives feedback in a fresh `/revise` session with none of this conversation, so the report holds everything needed to judge the work and answer. Cover only what applies: what was built and each departure from the ticket, with the reason; the checks run and not run, and any warning left standing; what was tried in the running app (widths, themes, languages, accounts) and what failed or was not tried; review findings fixed and left alone; open decisions, each with the choice made for now and your recommendation; what waits for another ticket; the screenshots' folder; the branch's state. Point to the ticket or an earlier comment rather than repeat it. Test durations and the changed files go only in the chat report, which covers the rest too.

Copy the screenshots you looked at to `.scratch/<feature>/shots/<ticket number>/` in the main checkout. Git ignores it, and it outlives the session and a lane's worktree. From a worktree, the main checkout is `$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")`.
