# 04: The frontend unit tests spend their time on tests, not on building pages

**What to build:** A full run of the frontend unit tests takes a fraction of today's time, with every test still in place and passing, so a session checks a change in a few seconds.

Measured on 2026-11-20: 243 tests in 32 files take 29.66 s, and Vitest's summary splits the time into environment 91%, import 4%, setup 3%, transform 1%. Almost all of it is spent building a fresh fake browser page (jsdom) for each test file; the tests themselves cost almost nothing. The backend's 749 integration tests take about the same time because each test class starts its host once and runs many tests on it.

- **Measure first.** Record today's `Duration` and phase split from three full runs before changing anything.
- **Try the known levers, one at a time,** and record each one's `Duration`:
  - a lighter fake browser (happy-dom) in place of jsdom;
  - test files sharing one page per worker instead of each building its own (Vitest's isolation turned off);
  - the number of workers.
- **Find how to set them.** The tests run through Angular's unit-test builder, not Vitest directly. Find whether the builder takes these settings itself or through a Vitest config file of its own, and use the supported way.
- **Keep the fastest setting that stays honest.** No test is deleted, skipped or weakened to gain time. If a lever breaks tests (a browser feature happy-dom lacks, state one file leaves behind for the next), either fix the cause in the test's setup or drop the lever, and say which in the comments.
- **Unchanged.** `npm test -- --watch=false` stays the command, and CI's frontend job runs it as today.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Difficulty:** tricky: the builder's support for these settings is unknown, and sharing a page across files can make tests fail only in some orders, which needs debugging.

Tooling only, with no visual part: it can run in a cloud session or a worktree beside any ticket that does not change the test setup.

- [ ] Today's `Duration` and phase split, from three runs, are recorded in this ticket's comments
- [ ] Each lever tried has its `Duration` recorded in the comments, kept or dropped with the reason
- [ ] The full run passes three times in a row with the chosen setting, and once with the test files in shuffled order; the `Duration` lines are recorded
- [ ] The test count is the same as before (243 at the time of writing, plus any added since), and no test is skipped
- [ ] CI's frontend job passes on the branch
- [ ] If a command or setting a session needs to know changes, `frontend/CLAUDE.md` or the root `CLAUDE.md` says so
