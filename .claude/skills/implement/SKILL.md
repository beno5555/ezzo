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

When working from a ticket, append the round report below to the ticket before you commit.

Commit your work to the current branch, including the ticket's status update and its round report, but only when the build and the full test suite pass. If either fails, don't commit: report the failures and stop.

## The round report

The owner gives feedback on the work in a fresh session, through `/revise`, which has none of this conversation. So everything the owner needs to look at the work and answer goes into the ticket, not only into the chat.

Append it under the ticket's `## Comments` as `**<date>, round 1: implementation (<model>).**`, followed by bullets. Write what this ticket has; leave out any part that has nothing to say, and never pad a part to fill it:

- **What was built,** in a few lines, and every place it departs from the ticket or adds to it, with the reason.
- **Checks:** which ran and their results, which did not run and why (no backend change, for example), and any warning left standing.
- **The running app:** what was tried, at which widths, themes and languages, and with how many accounts; what failed, and what was not tried.
- **The review:** what it found and what was fixed; a finding left alone, and why.
- **Open decisions:** each choice the ticket did not settle, the choice made for now, and your recommendation.
- **Left over:** what waits for another ticket, and which one.
- **Screenshots:** where they are.
- **The branch:** committed, pushed, waiting for the owner's review or merged, and the trial merge's result for a lane.

Leave out test durations and the list of changed files: they belong in the chat, and git holds them. Do not repeat the ticket or an earlier comment; point to it.

**Screenshots** go to `.scratch/<feature>/shots/<ticket number>/` in the main checkout, which Git ignores, so that they outlive the session's scratchpad and a lane's worktree. From a worktree, the main checkout is `$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")`. Copy there the images you looked at, from `frontend/screenshots/` or the browser tool's folder.

The chat report covers the same ground, and adds the test durations and the changed files grouped by kind.

If the work adds a database migration, read it before committing. If it drops or renames a table or column, or changes a column's type (in EF Core: `DropTable`, `DropColumn`, `RenameColumn`, `AlterColumn` with a new type), don't commit: list those operations and ask the user to confirm the data loss is intended. Otherwise commit as usual, and note in your summary that the migration has to be applied to the user's dev database.
