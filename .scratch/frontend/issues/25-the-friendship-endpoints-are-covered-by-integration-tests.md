# 25: The friendship endpoints are covered by integration tests

**What to build:** Every friendship endpoint gets integration tests for its success and its refusals, so the friends page builds on checked behaviour. Today only removing a friend is tested, for the photos it deletes.

- **The endpoints:** send a request; read the relationship with one user; read an accepted friendship; list my friends, my incoming requests and my sent requests; list another user's friends; accept; decline; remove.
- **The rules to pin down:** a request to oneself, to a user who does not exist or is deactivated, and a second request between the same two users; who may accept or decline (only the addressee, and only a waiting request); what each list holds before and after an accept, a decline and a remove; paging on the lists; removing a waiting request, which is how a sender cancels.
- **Expected values come from the seeded state and the docs,** not from what the code happens to return. Where the two disagree, decide which is right, fix the code or the doc, and say so in the ticket's comments.

Tests follow the house layout: grouped by endpoint, named `Method_Condition_ExpectedResult`, with the seed state described in a comment.

**Blocked by:** None (can start immediately)

**Status:** in-progress

**Difficulty:** routine (Opus 5.5 medium): many small rules hold at once (who may act, in which state, on which list), and a test that exposes a bug needs judgment to fix.

- [ ] Each of the ten friendship endpoints has at least one success test and a test for each of its refusals
- [ ] Accept, decline and remove are each checked through the lists they change
- [ ] Every bug the tests expose is fixed, or written down under Comments with the reason it stays
- [ ] The full integration suite passes
