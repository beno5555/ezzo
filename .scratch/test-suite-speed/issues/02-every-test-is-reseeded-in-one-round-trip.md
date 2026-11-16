# 02: Every test is reseeded in one round trip

**What to build:** Resetting the test database before a test costs one wipe and one batch, instead of a wipe and about ten separate saves, and every test sees exactly the data it sees today.

- **The wipe stays.** Respawn still empties every table except the migrations history before each test.
- **The first seed of a run goes through EF,** through the seeder as it is written today, and is recorded as SQL while it runs.
- **Every later reseed replays that recording** as one batch in one round trip, identity inserts included.
- **The seeder stays the only source of the seed.** The recording is taken fresh on every run, so a later change to the seeder needs no second edit and cannot go stale.

Measured on 2026-11-16: the wipe and reseed cost about 100 to 140 ms per test, the largest cost a test pays.

**Blocked by:** 01 (Signing in costs almost nothing in the test suite), which also changes the seeder.

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): mechanical work, but every test relies on the seeded ids, and the replayed data must match the EF seed exactly.

Runs in its own worktree, beside a frontend ticket only: it changes the seed that every backend ticket's tests rely on.

- [ ] Every test passes without a change to any test, which shows that the replayed rows and ids match the seed
- [ ] After a reseed by replay, every table holds the same rows as after a reseed through EF; a test or a check in the fixture proves it once per run
- [ ] A reseed makes one database round trip after the wipe
- [ ] A change to the seeder alone changes what the replay inserts
- [ ] The Integration tests section of `CLAUDE.md` describes the recorded seed in one or two sentences
- [ ] The full suite passes; its `Duration` before and after is recorded in this ticket's comments
