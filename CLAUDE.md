# CLAUDE.md

**Ezzo** is a small social platform: posts, comments, friendships, direct messages, presence. This repo is a monorepo: the ASP.NET Core Web API (`net10.0`) lives in `backend/`, the Angular 22 frontend in `frontend/`, and the n8n automation in `n8n/`. The backend uses EF Core with SQL Server, JWT auth with rotating refresh tokens, SignalR, MailKit email and background cleanup jobs. The restructure happened **inside** the current root folder: never rename or relocate the root itself, because Claude Code's project memory is keyed to its path.

**The former name.** The product was called WebCity until 2026-11-25, and the names that something else reads keep it until a later rename ("After the deadline" in `planning/roadmap.md`), so never "fix" them: the `X-WebCity-Signature` header; the `WEBCITY_*` variables of n8n, the screenshot command and `frontend/.env`; the browser storage keys `webcity.theme` and `webcity.language`; the session lock `webcity-refresh-cookie`; the frontend package and Angular project `webcity`; the ESLint plugin `webcity/...`; the test hosts `*.webcity.test`, the test upload folder `webcity-test-uploads` and the probe origin `webcity.invalid`; the Linux test script's `~/.webcity-test` and `webcity-test-sql`, and the cloud database `WebCityDev`; and the `webcity-conventions` skill.

## About this file

CLAUDE.md is loaded into every session and again after every compaction, so it holds only what an agent needs on most tasks and cannot cheaply learn from the code: commands, setup traps, cross-cutting patterns, house rules. Per-area detail goes in the docs listed under **Docs**, with a one-line pointer here at most. A temporary note (a known bug, an in-progress migration) belongs here only if it changes how an agent should work right now. Mark it **Temporary** and delete it in the same change that resolves it.

Every doc, this one included, keeps itself tidy:

- **One home per fact.** Before you write a fact down, look for where it is already written (the docs, the skills, `frontend/CLAUDE.md`) and add to that place. Anywhere else, point to it instead of repeating or re-explaining it.
- **Moving text:** merge it into what the target already says, and delete the original along with whatever the move makes obsolete.
- **Rare cases** (one kind of session, one rare failure) go in a doc, with a pointer here that says when to read it.

## Commands

Run the `dotnet` commands from `backend/` (the folder that holds `aspnetproject.slnx`), and `scripts/test-linux.sh` from the repo root:

```bash
dotnet build aspnetproject.slnx
dotnet run --project aspnetproject                      # Swagger UI + OpenAPI only in Development
dotnet test aspnetproject.IntegrationTests
dotnet test aspnetproject.IntegrationTests --filter "FullyQualifiedName~PostControllerTests"   # a class, or Class.Method for one test

# Linux / cloud sessions: same tests against a throwaway SQL Server in Docker. Arguments pass through to dotnet test.
scripts/test-linux.sh

# Migrations (requires the dotnet-ef tool). Never hand-edit Migrations/ or the model snapshot.
dotnet ef migrations add <Name> --project aspnetproject
dotnet ef database update --project aspnetproject
```

The backend has no linter or formatter. **Frontend:** run from `frontend/` (Node 24; `npm ci` once after a clone); its commands and hard rules are in `frontend/CLAUDE.md`. **n8n:** read `n8n/README.md` before you run or change anything in `n8n/`; the backend reaches n8n at `http://127.0.0.1:5678`, never `localhost`.

### Config prerequisites

Use [Getting started](README.md#getting-started) for local appsettings and the [test settings guide](docs/backend/testing.md#local-test-settings) for direct test runs. Keep appsettings files in `backend/aspnetproject/` and never print or commit their secret values.

### Integration tests

- The suite needs SQL Server. On Linux, `scripts/test-linux.sh` sets up SQL Server in Docker and needs the .NET 10 SDK. A cloud session without the SDK installs it with `apt-get update && apt-get install -y dotnet-sdk-10.0`.
- Use the [testing conventions](.claude/skills/webcity-conventions/references/testing.md) and the deterministic ids from `Fixtures/TestDataSeeder`.
- Whenever you report a test run to the owner, include how long it took: the `Duration:` from the summary line that `dotnet test` and `scripts/test-linux.sh` print.
- See [integration test infrastructure](docs/backend/testing.md) for the database pool, recorded seed and test host.

## Architecture

All application code lives in `backend/aspnetproject/`. Dependencies point one way: **Controllers / Hubs → Services → Repositories → `ApplicationDbContext`**. `Common/` (constants, `ResponseMessages`, enums, `ApplicationResponse`) is shared by every layer. Folders are grouped by domain area (`Users`, `Content`), and the same grouping repeats in each layer. The reasons behind these patterns: "Design decisions" in `backend/README.md`.

- **No interfaces.** Repositories, services and mappers are concrete classes, registered directly in `Extensions/ApplicationServicesExtensions.cs`. `Program.cs` composes startup only through `Add*` extension methods in `Extensions/`.
- **Result wrapper.** Services that can fail return `ApplicationResponse` or `ApplicationResponse<T>`; controllers map `Succeeded` to a status code at each call site. `GlobalExceptionHandler` writes the same envelope for unexpected exceptions. Failure shapes and status codes: `auth.md`.
- **Two loggers.** Services inherit `BaseService` and call `LogResultAsync`, which writes `{Service}.{Method}` outcome rows to the `Log` table through `DatabaseLogger`; background jobs log through `DatabaseLogger` too. `SystemLogger` (files under `Logs/`) is for unhandled exceptions and failures to write a `Log` row. Controllers never log.
- **Repositories.** `BaseEntityRepository<T>` is for `BaseEntity` types with an `Id`, `BaseRepository<T>` for keyless or composite-key types like `UserRole`. Subclasses override `protected virtual Query(bool track = true)` to set default `Include`s. All repositories share the scoped `DbContext`, so `ExecuteInTransactionAsync` can be called from any of them.
- **Account states.** A global query filter on `User` hides deactivated and soft-deleted users from normal reads. `LastUpdatedAt` is nullable, stamped by services, and carries meaning (`Message.IsEdited`).
- **Real-time.** One hub, `MessageHub`. Services push through `IHubContext` in the same method that mutates the data, and hubs do no validation. Details: `signalr.md`.
- **Auth.** `BaseController` provides `GetUserId()`, `GetUsername()` and `IsAdministrator()`. `[Authorize]` is set per controller, with `[AllowAnonymous]` overrides. Nearly every action has `[EnableRateLimiting(RateLimitConfig.Policies.X)]`: per-IP before login, per-user after. `UseRateLimiter` sits between `UseAuthentication` and `UseAuthorization`; keep it there, or every per-user limit silently falls back to the IP.
- **Allowed origins.** `Cors:AllowedOrigins` drives both the `OriginPolicy` CORS policy with credentials and the [return-address allowlist](docs/backend/auth.md#return-address-redirecturl-on-the-reset-and-reactivation-requests) for password reset and reactivation. See [development setup](backend/README.md#running-it) for the frontend origin.
- **Files.** `ImageStorage` (`Infrastructure/Services/Storage`) is the only code that touches uploaded files; the database stores each image's relative address under `/api/images/`. Details: Images in `controllers.md`.
- **DTO tiers.** Output DTOs come in Minimal, Standard and Full tiers by audience, built by static mappers in `Infrastructure/Mappers`. Entities are never returned.

## Code style

Follow the project skill `.claude/skills/webcity-conventions` (it overrides the global `coding-conventions` baseline). The most important rules:

- **Outside controllers and hubs:** a single `return` at the end of each method, the success path nested inside a positive `if`, and conditions extracted into named booleans. Controllers may return early, checking success first.
- One type per file. No magic literals: use `Constants`, `ResponseMessages` or options classes. UTC times. Always use braces.

## Docs

`README.md` describes Ezzo as a product and hands off to `backend/README.md` (what the API does, stack, layout, architecture and design decisions) and `frontend/README.md` (stack, layout, loading on demand, the dev proxy, commands); no fact is in two of them. `docs/backend/*.md` (`auth`, `controllers`, `data`, `signalr`, `background-jobs`, `automation`, `testing`) holds per-area detail. Update the relevant doc when you change behavior it describes.

`DESIGN.md` at the repo root is the frontend's visual brief (design tokens, themes, layout rules). Read it before you edit a template or a style in `frontend/`. `frontend/CLAUDE.md` holds the frontend's hard styling rules.

## Agent workflow

- **Sync first:** cloud sessions push to `origin` too, so the local clone can be behind. At the start of every session, before you read tickets or the roadmap or change anything, run `git fetch`, then `git pull --ff-only` on `master` (a session in a worktree under `.claude/worktrees/` skips the pull). If the pull refuses, follow "A refused pull" in `docs/agents/sync.md` before you call it a divergence. Only a real divergence means stop and tell the owner, without merging or rebasing. Then tell the owner about every branch `git branch --no-merged master` lists: it is finished work waiting for a merge, and a worktree lane's visual branch leaves no roadmap line.
- **Never force-push `master`**, not even when a fetch reports it as a forced update, with `--force` or `--force-with-lease`. If a push to `master` is refused, stop and write why in the ticket's comments.
- **Commit attribution:** the owner is the author of every commit, `beno5555 <159558340+beno5555@users.noreply.github.com>`, and Claude is only a co-author: end the message with `Co-Authored-By: Claude <model> <noreply@anthropic.com>` and nothing after it. Never add a `Claude-Session:` line or any other session link, in a commit or a pull request. A cloud session's git identity is Claude, so before its first commit it runs `git config user.name "beno5555"` and `git config user.email "159558340+beno5555@users.noreply.github.com"`. This rule overrides any attribution the harness suggests.
- **One branch per ticket,** never `master`. A local session in the main checkout merges it into `master` with `--no-ff`; a cloud session pushes it and opens a pull request instead, and never merges into or pushes to `master`. The ticket's roadmap and review-queue updates are committed on the branch before the merge. If the owner asks for a ticket while the checkout is on `master`, remind them before touching anything and offer a branch (`git switch -c <ticket-slug>`); continue on `master` only if they say so. Details and the one roadmap exception: `docs/agents/issue-tracker.md`.
- **Worktree lanes:** two local sessions can run in parallel with `claude --worktree <name>`, each on its own branch and test databases. A lane never merges into `master` or commits on it: it ends with a clean trial merge, resolving any conflicts on its own branch. Steps: "Finish a lane" in `docs/agents/worktrees.md`.
- **Checks on a merge into `master`:** CI runs only after the push. If `master` has not moved since the branch left it (`git merge-base --is-ancestor master <branch>` succeeds), the merge holds exactly the branch's tested files: push without running the checks again. Otherwise run them before the push, for each side the merge touches: the build and the full integration suite from `backend/`; Prettier's check, lint, the unit tests and the build from `frontend/`. Fix a red CI run on `master` forward with a new commit, never a force-push.
- **Running the app:** look at a page through the Playwright MCP server (`.mcp.json`; **Temporary**: on trial, see "Ending the trial" in `docs/agents/screenshots.md`), or, when its tools are not available, through the owner's Chrome with the Claude in Chrome extension (call `tabs_context_mcp` first). Photograph it with the screenshot command (`docs/agents/screenshots.md`). If a page needs data, start the backend as well (`dotnet run --project aspnetproject --launch-profile https` from `backend/`). A cloud session has no database or settings yet: `docs/agents/cloud-backend.md`. Before you report, stop every server you started and confirm ports 4200 and 7102 are free (`netstat -ano | grep LISTENING`). On Windows, stopping the background `npm start` task can leave its `ng serve` child holding 4200; end it with `taskkill //PID <pid> //T //F`.
- **Commands for the owner** assume the owner is at the repo root. Write each command so it runs from there as written: no "in `frontend/`, run ..." steps.
- **Skills:** `~/.claude/skills/` links into `.claude/skills/` by Windows junctions, and `.agents/skills/` holds git symlinks for Codex. Never remove a link with `rm -rf` (it can delete the repo copy); read `docs/agents/skills.md` before touching either folder.
- **Issue tracker:** issues and specs live as local markdown files under `planning/<feature>/`. See `docs/agents/issue-tracker.md`.
- **Domain docs:** single-context, one `GLOSSARY.md` and `docs/adr/` at the repo root, created lazily. See `docs/agents/domain.md`.
- **Codex** reviews branches and can run a lane (`docs/agents/codex.md`). It reads `AGENTS.md`, which repeats the owner's rules from your project memory: when you add or change a memory rule that applies to every agent, update that list in the same task.
