# Ezzo — Integration test infrastructure

For test commands and reporting, see [CLAUDE.md](../../CLAUDE.md#commands). For fixture, reset and naming conventions, see the [testing reference](../../.claude/skills/webcity-conventions/references/testing.md).

## Local test settings

For a direct `dotnet test` run, have SQL Server available and create the gitignored `backend/aspnetproject/appsettings.Testing.json`. The test host loads that file in every environment it exercises. Provide `Jwt:Key`, `Jwt:AccessTokenMinutes`, `Jwt:RefreshTokenDays`, and `PasswordConfiguration:ResetTokenMinutes`. The host supplies the database connection and disables SMTP. The [Linux test script](../../scripts/test-linux.sh) shows example lifetime values and prepares these settings automatically on Linux.

## The database pool

- **SQL Server.** The pool has up to four databases, capped by the processor count. By default it uses Windows authentication on `localhost` and names the databases `TestSocialMediaWebApiDb_1` to `_4`. In a linked worktree it inserts the folder name before the number, replacing characters outside ASCII letters and digits with underscores. If `ConnectionStrings__DefaultConnection` is set, its database name is the base for the numbered pool. Use distinct base names for runs that share a SQL Server. See [TestDatabaseNames.cs](../../backend/aspnetproject.IntegrationTests/Fixtures/TestDatabaseNames.cs).
- **Parallel classes, borrowed databases.** Each test class is its own xUnit collection and takes `DatabaseFixture` as an `IClassFixture`, which borrows one pool database for the class's whole run (`TestDatabasePool`, `DatabaseLender`). Up to four classes run at once (`AssemblyInfo.cs`); the tests inside one class run one after another. The fixture is passed to `CustomWebApplicationFactory`, which points the app under test at the borrowed database. A class whose tests never touch the data borrows one too, because its hosts still need a database.
- **Migrations.** The first class to start migrates every pool database once per run; classes that start at the same time wait for it.

## The recorded seed

The reset before each test (shown in the skill's testing reference) reseeds the database every time. Only the first seed of a run goes through EF and `TestDataSeeder`. `SeedRecorder` records its SQL, and every later reseed replays it as one batch (`RecordedSeed`), with the seeder's `DateTime.UtcNow` times moved up to now. The recording is made fresh each run, so a change to the seeder needs nothing else; edit only the seeder. The run fails at startup (`TestDatabasePool`) if a replay does not match the EF seed table for table.

## `CustomWebApplicationFactory`

What every test host changes about the app:

- **Automation events** are off, and the HTTP handler behind `EventPublisher` is swapped for `Helpers/EventRecorder`, so no event leaves the process. A host made with `recordEvents: true` turns them on and records what was sent. See [automation tests](automation.md#testing).
- **Hosted services** are all removed. A test resolves a job registered as a singleton and runs a cycle through `RunOnceAsync`. See [Testing a job](background-jobs.md#testing-a-job).
- **Email:** `EmailConfiguration:Enabled` is forced to false and `EmailSender` is replaced with `Helpers/EmailRecorder`, so mail-sending flows run normally but open no SMTP connection. A test reads what was sent from `factory.EmailRecorder.Emails`.
- **Settings-file reload** is off, so a host holds no inotify instance.
- **Uploads:** `ImageStorage:UploadFolder` points at a temporary folder (`UploadFolder`) that is deleted when the host is disposed.
- **Password hashing** uses 1 iteration, as `TestDataSeeder` does, so seeded users sign in only on Testing hosts.
- **Setting overrides** passed to its constructor change a setting for one host, such as a lower `ImageStorage:MaxFileSizeBytes`.

## Linux, cloud sessions and CI

Run [scripts/test-linux.sh](../../scripts/test-linux.sh) from the repo root on Linux. It starts a SQL Server container, prepares test settings, and passes the connection string and any command-line arguments to the integration suite. It keeps the database password in `~/.webcity-test/` and preserves an existing `appsettings.Testing.json`.

[CI](../../.github/workflows/tests.yml) runs the same script and the frontend checks on pushes to `master` and on pull requests.
