# WebCity — Integration test infrastructure

> Part of the WebCity doc set. See also: `README.md`, `data.md`, `auth.md`, `controllers.md`, `signalr.md`, `background-jobs.md`, `automation.md`, `testing.md`.

This page covers how the suite in `backend/aspnetproject.IntegrationTests` gets its databases and hosts. How to write a test class (the fixture, the reset before each test, naming, seed comments, real-time tests) is in the `webcity-conventions` skill, `references/testing.md`. The commands are in the root `CLAUDE.md`.

---

## The database pool

- **Real SQL Server, no fakes.** The suite runs against a pool of up to four real local SQL Server databases, fewer on a machine with fewer cores (`Fixtures/TestDatabaseNames`): `TestSocialMediaWebApiDb_1` to `_4`, named from `Server=localhost;Database=TestSocialMediaWebApiDb;Trusted_Connection=True`. In a git worktree the names gain the worktree's folder name, so two checkouts never share a database ("Test databases" in `docs/agents/worktrees.md`).
- **Parallel classes, borrowed databases.** Each test class is its own xUnit collection and takes `DatabaseFixture` as an `IClassFixture`, which borrows one pool database for the class's whole run (`TestDatabasePool`, `DatabaseLender`). Up to four classes run at once (`AssemblyInfo.cs`); the tests inside one class run one after another. The fixture is passed to `CustomWebApplicationFactory`, which points the app under test at the borrowed database. A class whose tests never touch the data borrows one too, because its hosts still need a database.
- **Migrations.** The first class to start migrates every pool database once per run; classes that start at the same time wait for it.

## The recorded seed

The reset before each test (shown in the skill's testing reference) reseeds the database every time. Only the first seed of a run goes through EF and `TestDataSeeder`. `SeedRecorder` records its SQL, and every later reseed replays it as one batch (`RecordedSeed`), with the seeder's `DateTime.UtcNow` times moved up to now. The recording is made fresh each run, so a change to the seeder needs nothing else; edit only the seeder. The run fails at startup (`TestDatabasePool`) if a replay does not match the EF seed table for table.

## `CustomWebApplicationFactory`

What every test host changes about the app:

- **Automation events** are off, and the HTTP handler behind `EventPublisher` is swapped for `Helpers/EventRecorder`, so no event leaves the process. A host made with `recordEvents: true` turns them on and records what was sent (Testing in `automation.md`).
- **Hosted services** are all removed. A job under test is also registered as a singleton and run once through `RunOnceAsync` ("Testing a job" in `background-jobs.md`).
- **Email:** `EmailConfiguration:Enabled` is forced to false and `EmailSender` is replaced with `Helpers/EmailRecorder`, so mail-sending flows run normally but open no SMTP connection. A test reads what was sent from `factory.EmailRecorder.Emails`.
- **Settings-file reload** is off, so a host holds no inotify instance.
- **Uploads:** `ImageStorage:UploadFolder` points at a temporary folder (`UploadFolder`) that is deleted when the host is disposed.
- **Password hashing** uses 1 iteration, as `TestDataSeeder` does, so seeded users sign in only on Testing hosts.
- **Setting overrides** passed to its constructor change a setting for one host, such as a lower `ImageStorage:MaxFileSizeBytes`.

## Linux, cloud sessions and CI

Without Windows authentication or settings files, run `scripts/test-linux.sh` (from the repo root) instead of `dotnet test`; its arguments pass through to `dotnet test`. It starts a SQL Server container in Docker, generates a database password (kept in `~/.webcity-test/`) and a JWT key, writes a secret-free `appsettings.Testing.json` only if none exists, and passes the connection string through `ConnectionStrings__DefaultConnection`; the suite builds the same pool from that database.

`.github/workflows/tests.yml` runs the same script on every push to `master` and on every pull request, beside a `frontend` job (Prettier check, lint, unit tests, build).
