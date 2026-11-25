# 02: Every test is reseeded in one round trip

**What to build:** Resetting the test database before a test costs one wipe and one batch, instead of a wipe and about ten separate saves, and every test sees exactly the data it sees today.

- **The wipe stays.** Respawn still empties every table except the migrations history before each test.
- **The first seed of a run goes through EF,** through the seeder as it is written today, and is recorded as SQL while it runs.
- **Every later reseed replays that recording** as one batch in one round trip, identity inserts included.
- **The seeder stays the only source of the seed.** The recording is taken fresh on every run, so a later change to the seeder needs no second edit and cannot go stale.

Measured on 2026-11-16: the wipe and reseed cost about 100 to 140 ms per test, the largest cost a test pays.

**Blocked by:** 01 (Signing in costs almost nothing in the test suite), which also changes the seeder.

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): mechanical work, but every test relies on the seeded ids, and the replayed data must match the EF seed exactly.

Runs in its own worktree, beside a frontend ticket only: it changes the seed that every backend ticket's tests rely on.

- [x] Every test passes without a change to any test, which shows that the replayed rows and ids match the seed
- [x] After a reseed by replay, every table holds the same rows as after a reseed through EF; a test or a check in the fixture proves it once per run
- [x] A reseed makes one database round trip after the wipe
- [x] A change to the seeder alone changes what the replay inserts
- [x] The Integration tests section of `CLAUDE.md` describes the recorded seed in one or two sentences
- [x] The full suite passes; its `Duration` before and after is recorded in this ticket's comments

## Comments

**2026-11-17, implementation.** `Duration` before: 58 s (519 tests). After: 46 s, 43 s and 42 s on three full runs, 519 tests, all passing, no test changed.

- `SeedRecorder`, an EF command interceptor, records the SQL of the run's first seed (wiped, then `TestDataSeeder` through EF). `RecordedSeed` replays it as one batch in a transaction, each command's parameters renamed apart (`@c3_p0`), `SET IDENTITY_INSERT` and `DBCC CHECKIDENT` included.
- At startup the fixture snapshots every table (rows plus `IDENT_CURRENT`) after the EF seed, wipes, replays, snapshots again, and throws if any table differs or the replay took more than one round trip (`SqlConnection` statistics). Perturbing the replay on purpose made it throw and name the tables.
- Times the seeder takes from `DateTime.UtcNow` move forward on each replay by the time since the recording finished, so fresh rows stay fresh (the 20-minute message edit window) on long runs; without it, a run past 20 minutes would see different data. The once-per-run check compares the unshifted replay; the shifted path is not compared against EF, since its times differ by design. A seeder time of `UtcNow` minus a window would not move, which `testing.md` §6 already rules out.
- Known limits, latent today: a seeded row that leaves a `GETUTCDATE()` default column unset (`Friendship.SentAt`, `RefreshToken`) would fail the startup check, loudly; a seed over 2,098 parameters fails at startup with a message (the seed uses about 450).
- `ResetAndSeedAsync` keeps its unused `options` parameter so no test class changes.
