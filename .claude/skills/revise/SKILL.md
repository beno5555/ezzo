---
name: revise
description: "Apply the owner's feedback to a finished ticket in a fresh session, starting from the ticket's round reports."
argument-hint: "<ticket reference>"
disable-model-invocation: true
---

A ticket built with `/implement` is done, but the owner wants changes. This session starts fresh, with no memory of the implementation: the ticket's round reports carry what it needs.

## 1. Find the work

Fetch the ticket from the issue tracker and state its title. If the reference is ambiguous, ask.

Work on the ticket's branch, never on `master`. If this session is not on it, find where it is checked out (`git worktree list`), tell the owner, and stop.

Note the commit you start from (`git rev-parse HEAD`). It is this round's fixed point.

## 2. Show the owner where it stands

Read the ticket in full: its text, its boxes and every round report under `## Comments`. The newest report says what is still open. Read the spec sections the ticket points to only when a question needs them.

Then tell the owner, briefly:

- what was built, and where it departs from the ticket;
- the open decisions, each with the choice made for now and the recommendation;
- what was not checked, and any warning left standing;
- the screenshots' folder, written as a full path;
- the files the branch changes, grouped by kind, from `git diff --stat master...HEAD`.

Then stop and wait for the owner's feedback. Do not start the grilling skill.

## 3. Take the feedback

The owner answers the open decisions and asks for changes, possibly over several messages. Ask when something is unclear.

Before you change code, append the round's heading to the ticket under `## Comments`, `**<date>, round <n>: revision (<model>).**`, with the owner's decisions as its first bullets. They become part of what the review checks. If a decision changes what a box says, rewrite the box to match.

## 4. Make the changes

Follow the `webcity-conventions` skill. Call the Skill tool with "tdd" where a change has a seam worth a test.

Run the checks for each side you touched: from `frontend/`, Prettier's check, lint, the unit tests and the build; from `backend/`, the build and the full integration suite. Check each change in the running app at the widths it affects, and retake the screenshots of the pages you changed into the ticket's shots folder (as in `implement`).

## 5. Review

Call the Skill tool with "spec-review" on the changes since this round's fixed point, against the ticket with the owner's decisions. Fix the findings that are right.

## 6. Report and commit

Finish the round's comment in the ticket, under the same rules as the round report in the `implement` skill (`.claude/skills/implement/SKILL.md`): what changed, the checks, the running app, the review, new open decisions, what is left over, the screenshots and the branch. The status stays `done`; tick or untick the boxes to match the work.

Commit to the branch when the build and the full test suite pass. If either fails, don't commit: report the failures and stop. Push the branch. Do not merge it: the owner decides when.

In the chat, report the same ground, with the test durations and this round's changed files grouped by kind (`git diff --stat <fixed point>`).

If the owner gives more feedback after the report, that is a new round: go back to step 3, with a new fixed point and a new comment. Once the conversation has grown long, suggest a fresh session instead.
