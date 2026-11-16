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
- [x] A test that fails only some of the time is reported in the comments, not ticked as passing, and the ticket is not set to `done` while one remains
- [x] Two test classes running at the same time use different databases; a check in the fixture or a test proves it
- [x] A worktree's pool and the main checkout's pool share no database name
- [ ] CI passes on the branch
- [x] The Integration tests section of `CLAUDE.md` describes the pool, the borrowing and how the names are made
- [x] The roadmap's "After the deadline" entry about sharing one test host per class is removed
- [x] The full suite's `Duration` before and after is recorded in this ticket's comments

## Comments

**2026-11-17, implementation.** `Duration` before: 44 s (519 tests, `master` after ticket 02). After, locally (16 cores, a pool of 4): 18 s, 15 s and 18 s on three full runs in a row, then 18 s on a fourth run after the review fixes. Each run had 528 tests (519 plus 9 new) and all passed. No test failed even once, so there is no intermittent failure to report.

- `Fixtures/TestDatabaseNames` builds the pool from the base name: the database in `ConnectionStrings__DefaultConnection`, or the local default with the worktree suffix. The names are `<base>_1` to `_<n>`, where n is the smaller of 4 and the core count. Every name ends in its single-digit number, so two checkouts with different base names share none. `TestDatabaseNamesTests` checks the main pool against worktree pools, including one for a worktree named `1`.
- `Fixtures/TestDatabasePool` is a static `Lazy<Task>`, because xUnit 2 has no fixture shared by the whole assembly. The first class migrates every database, one after another: two `CREATE DATABASE` statements at once can fail on the model database's lock. It then builds a Respawner for each database, records the seed on the first, and runs ticket 02's replay check there.
- `Fixtures/DatabaseLender` lends names from a queue (a channel) and keeps a ledger of the names on loan. It throws if a database already on loan is lent again, or if one that is not out is returned. `DatabaseFixture` is now an `IClassFixture`: it borrows in `InitializeAsync` and returns in `DisposeAsync`. Before every reseed it checks that its database is still on loan and that its connection points at it. `DatabaseLenderTests` check that each database is lent only once, that a borrower waits while all are out, and that a double return is refused.
- `AssemblyInfo.cs` sets `MaxParallelThreads` to 4. On a machine with fewer cores, the extra classes wait at the lender.
- `CustomWebApplicationFactory` now takes the class's `DatabaseFixture`, and the static `ConnectionString` is gone. `OpenApiDocumentTests`, `RateLimitRejectionTests` and `PasswordHashingStartupTests` borrow a database too, because their hosts still need one. `ResetAndSeedAsync` no longer takes the unused `options` parameter.
- Docs updated: CLAUDE.md (Integration tests), `docs/agents/worktrees.md` (the pool names and the command that drops a lane's four databases), `testing.md` §2 in the conventions skill, and the comment in `test-linux.sh`. No run uses the old single databases (`TestSocialMediaWebApiDb` and `TestSocialMediaWebApiDb_<worktree>`) any more, so they can be dropped.
- **Not met yet: the Linux runs and CI.** `scripts/test-linux.sh` cannot run on the owner's Windows machine: Docker is missing, and the local SQL Server holds port 1433. CI runs that script only on a push to `master` or on a pull request, so it first runs once this branch is merged and pushed. Still to do: merge, push, rerun the CI job until it has run three times (`gh run rerun <id>`), record the three `Duration` lines here, tick the two boxes, and set the ticket to `done`. The script's behaviour did not need to change, because the suite builds the pool from its one connection string.
- **Review.** The standards reviewer (Fable 5.2) found only minor items, and these were fixed: field alignment, an unused `DatabaseName` property, and two comments that still said the fixture runs the seed check. The negative guard in `DatabaseLender.BorrowAsync` was kept: it matches `CheckReplayMatchesSeedAsync`, and the positive form would add a second exit. The spec reviewer was stopped before it reported, to save usage, so the work has not been reviewed against the ticket.
