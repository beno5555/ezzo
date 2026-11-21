# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**WebCity** is an ASP.NET Core Web API (`net10.0`) for a small social platform: posts, comments, friendships, direct messages, presence. It uses EF Core with SQL Server, JWT auth with rotating refresh tokens, SignalR, MailKit email and background cleanup jobs. This repo is a monorepo: the backend lives in `backend/`, and the Angular 22 frontend in `frontend/`. The restructure happened **inside** the current root folder: never rename or relocate the root itself, because Claude Code's project memory is keyed to its path.

## About this file

CLAUDE.md is loaded into every session, so it holds only what an agent needs on most tasks and cannot cheaply learn from the code: commands, setup traps, cross-cutting patterns, house rules. Per-area detail goes in the docs listed under **Docs**, with a one-line pointer here at most. A temporary note (a known bug, an in-progress migration) belongs here only if it changes how an agent should work right now. Mark it **Temporary** and delete it in the same change that resolves it.

## Commands

Run the `dotnet` commands from `backend/` (the folder that holds `aspnetproject.slnx`), and `scripts/test-linux.sh` from the repo root:

```bash
dotnet build aspnetproject.slnx
dotnet run --project aspnetproject                      # Swagger UI + OpenAPI only in Development
dotnet test aspnetproject.IntegrationTests
dotnet test aspnetproject.IntegrationTests --filter "FullyQualifiedName~PostControllerTests"
dotnet test aspnetproject.IntegrationTests --filter "FullyQualifiedName~PostControllerTests.GetById_ForNonexistentPost_ReturnsNotFound"

# Linux / cloud sessions: same tests against a throwaway SQL Server in Docker. Arguments pass through to dotnet test.
scripts/test-linux.sh
scripts/test-linux.sh --filter "FullyQualifiedName~PostControllerTests"

# Migrations (requires the dotnet-ef tool). Never hand-edit Migrations/ or the model snapshot.
dotnet ef migrations add <Name> --project aspnetproject
dotnet ef database update --project aspnetproject
```

The backend has no linter or formatter. The frontend uses ESLint and Prettier.

### Frontend

Run these from `frontend/` (Node 24; run `npm ci` once after a clone):

```bash
npm start                    # dev server on http://localhost:4200, /api and /hubs proxied to the backend
npm test -- --watch=false    # Vitest unit tests, once
npm run lint                 # ESLint; fails on an un-awaited promise, on `any` and on a style that is not a design token
npm run build
npx prettier --write .       # Prettier owns formatting
```

- **Dev proxy.** `frontend/proxy.conf.json` forwards `/api` and `/hubs` (web sockets included) to `https://localhost:7102`, the backend's https port, with certificate checks off for the dev certificate. Start the backend first. Never aim the proxy at the http port: `UseHttpsRedirection` answers it with a redirect to another origin, which breaks the single origin (ADR 0001).
- **CORS.** The dev origin `http://localhost:4200` must be listed in the backend's `Cors:AllowedOrigins`, or the backend refuses the reset-password page as a return address.
- `.github/workflows/tests.yml` runs a `frontend` job (Prettier check, lint, unit tests, build) beside the backend job.

### Config prerequisites

`appsettings.json`, `appsettings.Development.json` and `appsettings.Testing.json` are all **gitignored**, live in `backend/aspnetproject/` (next to `aspnetproject.csproj`), and the repo has no example template. A fresh clone will not run until they exist. The settings they need: `ConnectionStrings:DefaultConnection`, `Jwt:{Key,AccessTokenMinutes,RefreshTokenDays}`, `EmailConfiguration:*` (including `Enabled`, which defaults to true), `PasswordConfiguration:ResetTokenMinutes`, `CleanupConfiguration:{RefreshTokens,SoftDeletedUsers,OldLogs}`, `Cors:AllowedOrigins`. Optional, with defaults in `ImageStorageConfiguration`: `ImageStorage:{UploadFolder,MaxFileSizeBytes,MaxImagesPerPost,MaxImagesPerMessage}` (default folder `Uploads/` under the project, gitignored), and, with defaults in `OrphanImagesCleanupConfiguration`, `CleanupConfiguration:OrphanImages:{Interval,MinimumAge,BatchSize}`, and, with its default in `PasswordHashingConfiguration`, `PasswordConfiguration:HashIterations` (default 100,000; startup fails below that outside Testing), and, with defaults in `AutomationEventsConfiguration`, `AutomationEvents:{Enabled,BaseUrl,SigningSecret,Timeout}` (off by default; timeout 3 seconds; with events on, startup fails without the base URL or the signing secret; details in `docs/backend/automation.md`). Never print or commit their values.

### Integration tests

- They run against a **pool** of up to four **real local SQL Server** databases, fewer on a machine with fewer cores (`Fixtures/TestDatabaseNames`): `TestSocialMediaWebApiDb_1` to `_4`, named from `Server=localhost;Database=TestSocialMediaWebApiDb;Trusted_Connection=True`. In a git worktree the names gain the worktree's folder name (`TestSocialMediaWebApiDb_<worktree>_1`), so two checkouts never share a database.
- **Parallel classes, borrowed databases.** Each test class is its own xUnit collection and takes `DatabaseFixture` as an `IClassFixture`, which borrows one pool database for the class's whole run (`TestDatabasePool`, `DatabaseLender`). Up to four classes run at once (`AssemblyInfo.cs`); the tests inside one class run one after another. Pass the fixture to `CustomWebApplicationFactory`, which points the app under test at the borrowed database. A class whose tests never touch the data borrows one too, because its hosts still need a database.
- **Linux and cloud sessions** (no Windows authentication, no settings files): run `scripts/test-linux.sh` instead of `dotnet test`. It starts a SQL Server container in Docker, generates a database password (kept in `~/.webcity-test/`) and a JWT key, writes a secret-free `appsettings.Testing.json` only if none exists, and passes the connection string through `ConnectionStrings__DefaultConnection`; the suite builds the same pool from that database. It needs Docker and the .NET 10 SDK; a cloud session without a prepared environment installs the SDK first with `apt-get update && apt-get install -y dotnet-sdk-10.0`. `.github/workflows/tests.yml` runs the same script on every push to `master` and on every pull request.
- The first class to start migrates every pool database once per run; classes that start at the same time wait for it. Each test class then calls `_dbFixture.ResetAndSeedAsync()` before each test (Respawn wipes everything except `__EFMigrationsHistory`, then `Fixtures/TestDataSeeder` reseeds deterministic users and ids). Tests rely on those seeded ids, and comments in each test file describe the seed state.
- **Recorded seed.** Only the first seed of a run goes through EF and `TestDataSeeder`; `SeedRecorder` records its SQL, and every later reseed replays it as one batch (`RecordedSeed`), with the seeder's `DateTime.UtcNow` times moved up to now. Edit only the seeder: the recording is fresh each run, and the run fails at startup (`TestDatabasePool`) if a replay does not match the EF seed table for table.
- `CustomWebApplicationFactory` turns automation events off and swaps the HTTP handler behind `EventPublisher` for `Helpers/EventRecorder`, so no event leaves the process; a host made with `recordEvents: true` turns them on and records what was sent (Testing in `docs/backend/automation.md`). It removes all `IHostedService`s (a job under test is also registered as a singleton and run once through `RunOnceAsync`: Testing in `docs/backend/background-jobs.md`), forces `EmailConfiguration:Enabled` to false and replaces `EmailSender` with `Helpers/EmailRecorder`, so mail-sending flows run normally but open no SMTP connection, and a test reads what was sent from `factory.EmailRecorder.Emails`. It also turns off settings-file reload, so a host holds no inotify instance, and points `ImageStorage:UploadFolder` at a temporary folder (`UploadFolder`) that is deleted when the host is disposed. A Testing host hashes passwords with 1 iteration, as `TestDataSeeder` does, so seeded users sign in only on Testing hosts. Pass setting overrides to its constructor to change a setting for one host, such as a lower `ImageStorage:MaxFileSizeBytes`. Each test class still disposes `_client` and `_factory` in `DisposeAsync`.
- Test names follow `Method_Condition_ExpectedResult` and are grouped by endpoint.
- Whenever you report a test run to the owner, include how long it took: the `Duration:` from the summary line that `dotnet test` and `scripts/test-linux.sh` print.
- Real-time behavior is tested with `Helpers/HubTestClient`, a real SignalR client connected to the test host as a seeded user. Never mock the hub context. Details: Testing in `docs/backend/signalr.md`.

## Architecture

All application code lives in the `backend/aspnetproject/` project. Dependencies point one way: **Controllers / Hubs → Services → Repositories → `ApplicationDbContext`**. `Common/` (constants, `ResponseMessages`, enums, `ApplicationResponse`) is shared by every layer. Folders are grouped by domain area (`Users`, `Content`), and the same grouping repeats in each layer.

The important patterns, each of which spans several files:

- **No interfaces.** Repositories, services and mappers are concrete classes, registered directly in `Extensions/ApplicationServicesExtensions.cs`. `Program.cs` composes startup only through `Add*` extension methods in `Extensions/`.
- **Result wrapper.** Services that can fail return `ApplicationResponse` or `ApplicationResponse<T>` (`Common/Domain`). Controllers map `Succeeded` to HTTP status codes at each call site. Unexpected exceptions go to `GlobalExceptionHandler`, which writes the same envelope. Clients see two failure shapes: the envelope and the framework's validation `ProblemDetails`. Status codes and edge cases: `auth.md`.
- **Two loggers.** Services inherit `BaseService` and call `LogResultAsync`, which writes `{Service}.{Method}` outcome rows to the `Log` table through `DatabaseLogger`. `SystemLogger` (files under `Logs/`) is for unhandled exceptions and for failures to write a `Log` row. Background jobs log through `DatabaseLogger`. Controllers never log.
- **Repositories.** `BaseRepository<T>` is for keyless or composite-key types like `UserRole`. `BaseEntityRepository<T>` is for `BaseEntity` types with an `Id`. Subclasses override `protected virtual Query(bool track = true)` to set default `Include`s. `ExecuteInTransactionAsync` can be called from any repository, because all repositories share the scoped `DbContext`. Bulk cleanup uses `ExecuteDeleteAsync`.
- **Account states.** A global query filter on `User` hides deactivated (`AccountDeactivatedAt`) and soft-deleted (`AccountDeletedAt`) users from normal reads. A background job hard-purges soft-deleted users past their retention window. `LastUpdatedAt` is nullable and stamped by services; it carries meaning (`Message.IsEdited`).
- **Real-time.** One hub (`MessageHub` at `hubs/messages`) carries messages, comment notifications, presence and typing signals. Services push through `IHubContext` in the same method that mutates data, and hubs do no validation. `UserConnectionTracker` is a thread-safe singleton. The JWT is read from the query string for hub connections (`AuthenticationExtensions`).
- **Auth.** `BaseController` provides `GetUserId()`, `GetUsername()` and `IsAdministrator()`. `[Authorize]` is set per controller, with `[AllowAnonymous]` overrides. Nearly every action has `[EnableRateLimiting(RateLimitConfig.Policies.X)]`: per-IP before login, per-user after. `UseRateLimiter` sits between `UseAuthentication` and `UseAuthorization`; keep it there, or every per-user limit silently falls back to the IP.
- **Frontend integration points.** `Cors:AllowedOrigins` drives both the `OriginPolicy` CORS policy (with credentials) and `UrlSecurityService`'s check of the return addresses in password-reset and reactivation emails; with no origins configured, every redirect URL is rejected. Details: `auth.md`.
- **Files.** `ImageStorage` (`Infrastructure/Services/Storage`) is the only code that touches uploaded files: content check by leading bytes, server-made names, save, delete, address. Images are served as static files at `/api/images/{name}`, and the database stores that relative address. Details: Images in `docs/backend/controllers.md`.
- **DTO tiers.** Output DTOs come in Minimal, Standard and Full tiers by audience, built by static mappers in `Infrastructure/Mappers`. Entities are never returned.

## Code style

Follow the project skill `.claude/skills/webcity-conventions` (it overrides the global `coding-conventions` baseline). The most important rules:

- **Outside controllers and hubs:** a single `return` at the end of each method, the success path nested inside a positive `if`, and conditions extracted into named booleans. Controllers may return early, checking success first.
- One type per file. No magic literals: use `Constants`, `ResponseMessages` or options classes. UTC times. Always use braces.

## Docs

`README.md` describes the backend as it is now: features, stack, layout, architecture and design decisions. `docs/backend/*.md` (`auth`, `controllers`, `data`, `signalr`, `background-jobs`, `automation`) holds per-area detail. Update the relevant doc when you change behavior it describes.

`DESIGN.md` at the repo root is the frontend's visual brief (design tokens, themes, layout rules). Read it before you edit a template or a style in `frontend/`. `frontend/CLAUDE.md` holds the frontend's hard styling rules.

## Agent workflow

- **Sync first:** cloud sessions push to `origin` too, so the local clone can be behind. At the start of every session, before you read tickets or the roadmap or change anything, run `git fetch` and then `git pull --ff-only` on `master`. If the pull refuses, first check whether `master` really diverged: in a shallow clone (`git rev-parse --is-shallow-repository` prints `true`) run `git fetch --unshallow`, then `git merge-base --is-ancestor master origin/master`; if that succeeds, `git merge --ff-only origin/master`. Only a real divergence means stop and tell the owner instead of merging or rebasing. A session in a worktree under `.claude/worktrees/` skips the pull. Then run `git branch --no-merged master` and tell the owner about any branch it lists: it is finished work waiting for a merge, and a worktree lane's visual branch leaves no roadmap line.
- **Never force-push `master`**, not even when a fetch reports it as a forced update, with `--force` or `--force-with-lease`. If a push to `master` is refused, stop and write why in the ticket's comments.
- **Commit attribution:** the owner is the author of every commit, `beno5555 <159558340+beno5555@users.noreply.github.com>`, and Claude is only a co-author: end the message with `Co-Authored-By: Claude <model> <noreply@anthropic.com>` and nothing after it. Never add a `Claude-Session:` line or any other session link, in a commit or a pull request. A cloud session's git identity is Claude, so before its first commit it runs `git config user.name "beno5555"` and `git config user.email "159558340+beno5555@users.noreply.github.com"`. This rule overrides any attribution the harness suggests.
- **One branch per ticket:** implement a ticket on its own branch, never directly on `master`, When it is done, a local session in the main checkout merges it into `master` with `--no-ff`. The ticket's roadmap update is committed on the branch before the merge, never as a separate commit on `master` afterwards (exception for a waiting visual branch: `issue-tracker.md`). A cloud session pushes the branch and opens a pull request into `master` instead, and never merges into or pushes to `master` itself; the owner merges the pull request. If the owner asks you to implement a ticket while the checkout is on `master`, remind them of this before touching anything and offer a branch name (`git switch -c <ticket-slug>`); continue on `master` only if they say so. Details: `docs/agents/issue-tracker.md`.
- **Worktree lanes never merge:** a session in `.claude/worktrees/<name>/` never merges into `master` or commits on it. When its ticket is done, it checks with a trial merge that its branch merges into `master` without conflicts, resolves any on its own branch, pushes the branch to `origin`, and stops. Steps: "Finish a lane" in `docs/agents/worktrees.md`.
- **Checks on a merge into `master`:** CI runs only after the push, so a red merge lands on the `master` that every session pulls. If `master` has not moved since the branch left it (`git merge-base --is-ancestor master <branch>` succeeds), the merge holds exactly the branch's files, which passed on the branch: push without running the checks again and let CI confirm. If `master` has moved, run the checks before the push, for each side the merge touches: the build and the full integration suite from `backend/`, and Prettier's check, lint, the unit tests and the build from `frontend/`. A red CI run on `master` is fixed forward with a new commit, never a force-push.
- **Parallel lanes:** two local sessions can run in parallel with `claude --worktree <name>`, each on its own branch and test database. See `docs/agents/worktrees.md`.
- **Running the app:** look at a page first through the Playwright MCP server (`.mcp.json`; **Temporary**: on trial, see "Ending the trial" in `docs/agents/screenshots.md`), and photograph it at every width, theme and language with the screenshot command (`docs/agents/screenshots.md`). When the server's tools are not available, fall back to the owner's Chrome through the Claude in Chrome extension (call `tabs_context_mcp` first). If a page needs data, start the backend as well (`dotnet run --project aspnetproject --launch-profile https` from `backend/`) instead of checking it without data. Stop every server you started before you report, then confirm ports 4200 and 7102 are free (`netstat -ano | grep LISTENING`): earlier sessions left stale runs behind. On Windows, stopping the background `npm start` task can leave its `ng serve` child holding 4200; end it with `taskkill //PID <pid> //T //F`.
- **Commands for the owner** assume the owner is at the repo root. Write each command so it runs from there as written: no "in `frontend/`, run ..." steps.
- **Skills:** Matt Pocock's skills in `.claude/skills/` are linked from `~/.claude/skills/` by Windows junctions (`webcity-conventions` and the design skill `frontend-design` are not). `.agents/skills/` holds git symlinks to the skills Codex may use. Never remove one with `rm -rf` (it can delete the repo copy); read `docs/agents/skills.md` before touching either folder.
- **Issue tracker:** issues and specs live as local markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.
- **Domain docs:** single-context, one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
- **Codex:** OpenAI's Codex reviews branches and can run a lane. It reads `AGENTS.md`, which repeats the owner's rules from your project memory. When you add or change a memory rule that applies to every agent, update that list in the same task. See `docs/agents/codex.md`.
