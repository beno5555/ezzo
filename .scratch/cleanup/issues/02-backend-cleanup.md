# 02: Clean up account purge and friendship comments

**What to build:** Make the account purge and friendship persistence rules clear to maintainers while preserving the existing data operations.

**Blocked by:** None (can start immediately).

**Status:** done

**Difficulty:** routine: The affected comments can be checked directly against the purge and the friendship service callers. In Codex, use GPT-6.2 Sol at medium effort.

- [x] Correct the message and friendship configuration comments to reflect that the background purge deletes those rows before deleting the user.
- [x] Remove the commented-out save call from the friendship repository and explain that its callers persist the tracked changes.
- [x] Review nearby repository and service comments for stale wording and repetition, keeping explanations of transaction boundaries, query filters, and other constraints that are easy to miss.
- [x] Verify the updated comments against the existing code and run the backend build and integration suite. Record the test duration.
- [x] Run `$spec-review` on the ticket branch against `cleanup` after verification. The Standards reviewer applies `webcity-conventions` and the applicable project rules. The Spec reviewer checks this ticket's acceptance criteria, including that the comments match the code and the data operations are preserved. Address confirmed findings before merging.

**Branch:** Start from `cleanup` and target `cleanup` for integration. A worktree session finishes with a trial merge against `cleanup` and leaves the actual merge to the main checkout.

## Comments

### 2026-11-24 verification and spec review

- The backend build passed with zero warnings and errors. The final integration run passed all 898 tests in 37 s, with zero failures or skips.
- Verified the purge order and both friendship status-update callers against the code. Non-comment source matched `cleanup` across all seven edited C# files.
- Standards found no violations or code smells. Spec found two wording gaps. The comments now specify incoming messages across all pages and distinguish a filtered-out friend navigation from the foreign-key reference. Both reviews rechecked the revisions and closed with no open findings.
