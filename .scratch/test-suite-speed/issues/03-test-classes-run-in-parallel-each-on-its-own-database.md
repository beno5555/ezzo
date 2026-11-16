# 03: Test classes run in parallel, each on its own database

**What to build:** The integration suite runs several test classes at once, each against its own database, so a full run takes a fraction of today's time and no test can see another's data.

- **The pool.** Up to four test databases, or as many as the machine has cores if that is fewer. Each is named after the checkout's base test database with a number (`…_1` to `…_4`). The base name comes from where it comes today: the worktree suffix in a local checkout, and the database in `ConnectionStrings__DefaultConnection` on Linux, in the cloud and in CI. A worktree's pool therefore keeps its suffix, and two lanes never share a database.
- **Migration.** Each database in the pool is migrated once at the start of a run.
- **Borrowing.** A test class borrows one database from the pool for its whole run and returns it when done. xUnit runs as many classes at once as the pool holds; the tests inside one class still run one after another.
- **Unchanged.** Each test still gets its own test host and a fresh seed before it runs. The host under test uses the borrowed database, not a shared static value.
- **Linux and CI.** `scripts/test-linux.sh` and the CI job create and use the same pool from their one connection string.

Measured on 2026-11-16: every test class shares one xUnit collection, so all 484 tests run one after another.

**Blocked by:** 02 (Every test is reseeded in one round trip), which also changes the database fixture.

**Status:** in-progress

**Difficulty:** tricky: concurrency and a new fixture pattern, a change to every test class, the Linux script and CI must build the same pool, and tests that fail only sometimes may need debugging.

Runs in its own worktree, beside a frontend ticket only: it changes the constructor of every test class.

- [ ] The full suite passes three times in a row locally and three times in a row through `scripts/test-linux.sh`; the six `Duration` lines are recorded in this ticket's comments
- [ ] A test that fails only some of the time is reported in the comments, not ticked as passing, and the ticket is not set to `done` while one remains
- [ ] Two test classes running at the same time use different databases; a check in the fixture or a test proves it
- [ ] A worktree's pool and the main checkout's pool share no database name
- [ ] CI passes on the branch
- [ ] The Integration tests section of `CLAUDE.md` describes the pool, the borrowing and how the names are made
- [ ] The roadmap's "After the deadline" entry about sharing one test host per class is removed
- [ ] The full suite's `Duration` before and after is recorded in this ticket's comments
