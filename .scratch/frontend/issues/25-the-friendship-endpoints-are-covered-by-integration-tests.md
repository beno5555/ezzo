# 25: The friendship endpoints are covered by integration tests

**What to build:** Every friendship endpoint gets integration tests for its success and its refusals, so the friends page builds on checked behaviour. Today only removing a friend is tested, for the photos it deletes.

- **The endpoints:** send a request; read the relationship with one user; read an accepted friendship; list my friends, my incoming requests and my sent requests; list another user's friends; accept; decline; remove.
- **The rules to pin down:** a request to oneself, to a user who does not exist or is deactivated, and a second request between the same two users; who may accept or decline (only the addressee, and only a waiting request); what each list holds before and after an accept, a decline and a remove; paging on the lists; removing a waiting request, which is how a sender cancels.
- **Expected values come from the seeded state and the docs,** not from what the code happens to return. Where the two disagree, decide which is right, fix the code or the doc, and say so in the ticket's comments.

Tests follow the house layout: grouped by endpoint, named `Method_Condition_ExpectedResult`, with the seed state described in a comment.

**Blocked by:** None (can start immediately)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): many small rules hold at once (who may act, in which state, on which list), and a test that exposes a bug needs judgment to fix.

- [x] Each of the ten friendship endpoints has at least one success test and a test for each of its refusals
- [x] Accept, decline and remove are each checked through the lists they change
- [x] Every bug the tests expose is fixed, or written down under Comments with the reason it stays
- [x] The full integration suite passes

## Comments

**Full suite:** `scripts/test-linux.sh`, 640 passed, 0 failed, Duration: 40 s. The friendship test class alone: 99 tests, up from 1.

**Bugs the tests exposed, all fixed:**

1. **The four lists had no order**, so paging could repeat a row or skip one (SQL Server gives no order without `ORDER BY`). `accepted`, `pending`, `sent` and `user/{userId}` are now ordered by `Friendship.Id`, lowest first. The docs did not say; I added the order to `docs/backend/controllers.md`. Note that a declined request the same sender sends again keeps its id, so the order is by row, not by `SentAt`.
2. **`GET accepted/{friendId}` answered 500 for a friend with a deactivated or soft-deleted account**: the user query filter hid the included user and the service dereferenced it. The docs and the lists show such friends under the placeholder names (`account_deactivated`, `account_deleted`), so the endpoint now does the same (`FriendshipService.ResolveOtherUserAsync`, `UsernameMapper` in `FriendshipMapper.ToAcceptedDisplay`). Open point for the owner: the response still carries that user's `LastActiveAt`.
3. **`GetFriendsOf` declared `ListResponse<MinimalUserDto>` but returns `StandardFriendshipDto` rows.** Only the declared type (the OpenAPI schema) was wrong; the declaration now matches the docs and the data.

**Where code and docs agreed, and what the tests pin down:** a request to oneself, to a missing, deactivated or soft-deleted user, or a second request between a pair (waiting either way round, or already friends) is a 400 with the documented message; resend after a decline follows the documented rules (same row reopened for the original sender, row replaced with the roles reversed for the original addressee); only the addressee can accept or decline, and only a waiting request (everything else is 400, `PendingRequestNotFound`); removing works for accepted, waiting (sender cancels, addressee dismisses) and declined rows, and 404 otherwise; `user/{userId}` is 404 for an unavailable user.

**Not changed, on purpose:**

- Several tests sign in as a second user in the middle of the checks, to read the other side's lists. The repo's testing rule wants the act phase apart from the asserts; two clients per test would be needed to keep that, and the tests read more plainly with the sign-in in place.
- `SignInAsync` is a private copy in this file, as in four other test classes. Moving all of them into `AuthTestHelper` is a separate, test-only clean-up.
- The accept and decline refusal theories share rows, and the three page-size tests share a shape; kept apart so each failure names its endpoint.

**Spec review** (Fable 5.2, high effort): the standards findings (a named condition in the service, `nameof` and `Constants.MaxPageSize` instead of literals, the DELETE group split in two, an unaligned constant, a repository helper named `OldestFirst`) and the spec findings (paging refusals only on one list, "same row" not proven, deletion of the message history not asserted, deactivated and deleted friends not on the lists) were fixed. The weak tests it named (reopen of the same row, second accept) now check the row id, `SentAt`, the first accept's result and the message.
