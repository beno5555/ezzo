# 01: Signing in costs almost nothing in the test suite

**What to build:** A test that signs a seeded user in no longer pays for 100,000 rounds of password hashing, while every other environment hashes exactly as it does today and cannot be made to hash less.

- **The setting.** The number of hashing iterations becomes a setting in the password configuration, read through an options class. Its default is the current 100,000, so a settings file that does not name it changes nothing.
- **The guard.** The app refuses to start when the value is below 100,000 in any environment other than Testing, with a startup error that names the setting. Stored hashes do not record their iteration count, so a lowered value that reached production would weaken every new password and lock out every existing one; the guard makes that mistake loud instead of silent.
- **The test host** sets the value to 1, beside its other forced settings (email off, the trusted origin, the upload folder).
- **The seeder** computes the shared test password's hash and salt with the configured value, through the app's own hasher, instead of holding a hash computed at 100,000. The plaintext password that tests sign in with stays the same.

Measured on 2026-11-16 (484 tests, `Duration: 1 m 53 s`): a sign-in costs about 60 to 80 ms, and about a third of the tests sign in.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

**Difficulty:** tricky: it changes how passwords are hashed, and the guard must make a lowered value impossible outside Testing.

Runs in its own worktree, beside a frontend ticket only: it changes the seed that every backend ticket's tests rely on.

- [ ] Without the setting in any settings file, a password registered, changed or reset is hashed with 100,000 iterations, and a user registered before this change still signs in
- [ ] Starting the app in Development or Production with the value below 100,000 fails at startup with an error that names the setting; an integration test proves it
- [ ] The test host hashes with 1 iteration, and the seeder no longer holds a precomputed hash or salt
- [ ] Registration, sign-in, password change and password reset tests pass unchanged
- [ ] `docs/backend/auth.md` and the settings list in `CLAUDE.md` (Config prerequisites) name the new setting, its default and the guard
- [ ] The full suite passes; its `Duration` before and after is recorded in this ticket's comments
