# 01: Clean up frontend comments and route parsing

**What to build:** Make client-side route handling easier to maintain and correct comments in the frontend areas sampled in the audit. Preserve the behavior of each affected feature.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): Four route checks share the same parsing rule, and their callers need separate verification. In Codex, use GPT-6.2 Sol at high effort.

- [ ] Share the rule that strips the query or fragment from a route address across sign-in, landing-page detection, account-page detection, and the post-delete route check. Keep each caller's matching and normalization rules, including its handling of leading slashes and encoded paths.
- [ ] Verify the callers through the existing feature tests and normal app flows for any uncovered cases. Check that sign-in keeps the complete return address, page detection works with query strings and fragments, and deleting a post only navigates away when the user is still on that post.
- [ ] Correct the admin logs comment to reflect automatic search after a typing pause and the profile picture comment to explain that an unavailable account shows the default silhouette with a grey ring.
- [ ] Review nearby comments for obsolete claims and redundant narration. Keep the explanations of constraints and timing that the code alone does not make clear.
- [ ] Run the frontend formatting check, lint, unit tests, and build. Record the feature checks and their results.
- [ ] Run `$spec-review` on the ticket branch against `cleanup` after verification. The Standards reviewer applies `webcity-conventions` and the applicable project rules. The Spec reviewer checks this ticket's acceptance criteria, including behavior at all four route callers. Address confirmed findings before merging.

**Branch:** Start from `cleanup` and target `cleanup` for integration. A worktree session finishes with a trial merge against `cleanup` and leaves the actual merge to the main checkout.
