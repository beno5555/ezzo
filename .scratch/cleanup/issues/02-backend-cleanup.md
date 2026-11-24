# 02: Clean up account purge and friendship comments

**What to build:** Make the account purge and friendship persistence rules clear to maintainers while preserving the existing data operations.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Difficulty:** routine: The affected comments can be checked directly against the purge and the friendship service callers. In Codex, use GPT-6.2 Sol at medium effort.

- [ ] Correct the message and friendship configuration comments to reflect that the background purge deletes those rows before deleting the user.
- [ ] Remove the commented-out save call from the friendship repository and explain that its callers persist the tracked changes.
- [ ] Review nearby repository and service comments for stale wording and repetition, keeping explanations of transaction boundaries, query filters, and other constraints that are easy to miss.
- [ ] Verify the updated comments against the existing code and run the backend build and integration suite. Record the test duration.
- [ ] Run `$spec-review` on the ticket branch against `cleanup` after verification. The Standards reviewer applies `webcity-conventions` and the applicable project rules. The Spec reviewer checks this ticket's acceptance criteria, including that the comments match the code and the data operations are preserved. Address confirmed findings before merging.

**Branch:** Start from `cleanup` and target `cleanup` for integration. A worktree session finishes with a trial merge against `cleanup` and leaves the actual merge to the main checkout.
