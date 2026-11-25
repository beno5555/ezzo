# Ezzo backend

The backend of [Ezzo](../README.md): an ASP.NET Core Web API (`net10.0`) built on EF Core with SQL Server, JWT authentication with rotating refresh tokens, SignalR, MailKit email and background cleanup jobs. It serves the [frontend](../frontend/README.md) through the frontend's proxy, and sends its events to the automation in [`n8n/`](../n8n/README.md).

For the earlier, API-only state of this repository and the history behind it, see the git tag `api-only`.

---

## What the API does

- Register and log in; JWT access tokens plus rotating refresh tokens; password reset via an emailed token
- Usernames `mine`, `search`, `account_deactivated` and `account_deleted` are reserved (any letter case) and refused wherever a username is set. A user's joined date is private: public profile reads leave it out, while the user's own profile and the admin account list keep it. The own profile also carries when the username was last changed
- Create, view, update and delete posts, with up to 10 photos (JPEG, PNG or WebP, checked by content) per post; remove a photo from a post (a post always keeps its text or a photo), and deleting a post removes its photo files; a ranked feed of friends' and other users' posts, scored by connection, activity and age. Every post read carries its like count, comment count and whether the caller liked it
- Comment on posts and edit own comments; delete a comment as its author, as the post's author, or as an administrator; live `ReceiveComment` push to the post's author
- Like and unlike posts, once per user per post; list a post's likers, newest first; live `PostLiked` push to the post's author
- Send, accept, decline and remove friend requests; view friends, pending and sent requests; search users by username
- Send, edit and delete messages between friends, with up to 5 photos per message (the same checks as post photos); live push (`ReceiveMessage`, `MessageEdited`, `MessageDeleted`, `MessageSeen`) over SignalR; paginated conversations and read receipts. A message can be edited for 20 minutes after it is sent, and the receiver sees the edit live
- Presence: `UserOnline` / `UserOffline` broadcast to friends when a user's first connection opens or last connection closes; at startup, every user still marked online is marked offline, since a restart drops every connection
- Typing indicator: a client calls `SendTyping` while its user writes to a friend, and the friend receives `UserTyping`. Only accepted friends get it; nothing is stored or logged
- View a user's profile; edit own profile
- Roles (`User`, `Administrator`): an administrator can create, update, deactivate, reactivate and soft-delete other users' accounts, delete any post or comment, and assign or remove the `Administrator` role
- Admin reads (`api/admin`): an administrator reads the `Logs` table page by page, newest first, filtered by user, authorized or not, succeeded or not, entity, action and date range, and lists accounts in any state (active, deactivated, soft-deleted), filtered by state and username. System statistics (`GET api/admin/statistics`) give one object: totals (active and deactivated accounts, posts, comments, messages, likes, reports waiting for a decision), accounts, posts, comments and messages created in the last 7 and 30 days, and how many users are online now (users with a live hub connection)
- Moderation (`api/admin`): an administrator sets a post's or a comment's status to `Visible`, `Flagged` or `Hidden`. Hidden content is readable only by its author and by administrators, and reads as not found for everyone else; flagged content reads as visible. Post and comment shapes carry an `IsHidden` flag. The moderation queue (`GET api/admin/moderation-queue/posts` and `.../comments`) pages the flagged posts or comments, oldest first, each with a snapshot (text, photos or the post's title, author, time) so the administrator can approve or hide it
- Reports (`api/reports`): a user reports a post, a comment or another user, with a reason, once per target while the report is pending. Hidden content, the caller's own content and the caller themselves cannot be reported. An administrator lists the reports page by page, newest first, filtered by status and target type, each with a snapshot of its target (or marked missing once the target is deleted), and decides a pending report: hide (the post or comment is hidden, or the user deactivated, and every pending report on that target is resolved) or reject (only that report)
- Deactivate own account; reactivate it through an emailed link (or, without a return address, an emailed token)
- Soft-delete own account; a background job later purges soft-deleted accounts and their messages and posts (with their photo files), friendships, likes and reports once a retention window has passed
- Outcome logging of service calls to the `Logs` table, plus a file log for unhandled exceptions
- Automation events: an unhandled exception, in a request or in a background job, is sent to the automation (n8n) as a signed `exception-occurred` event, and so are new accounts, posts, comments, their edits and reports (`account-created`, `post-created`, `post-edited`, `comment-created`, `comment-edited`, `report-created`). Events are off by default; a failed delivery writes a `Logs` row and nothing else. In Development, `GET api/dev/throw` throws on purpose
- Internal routes for the automation (`api/internal`, its API key only): list who gets this week's digest email and what it says, list the users with a friend whose birthday is today, and push a `ReceiveNotification` to the users it names who are connected. A user turns the digest email off with `PUT api/users/mine/digest-email`
- Rate limiting: a named policy on every endpoint except logout, and a global limiter over everything

---

## Tech Stack

- ASP.NET Core Web API (C#), target framework `net10.0`
- Entity Framework Core (SQL Server, code-first migrations)
- JWT bearer authentication
- SignalR (real-time push: messages, comments, likes, presence, typing, automation notifications)
- ASP.NET Core rate limiting middleware
- MailKit (SMTP email delivery)
- Swashbuckle and `Microsoft.AspNetCore.OpenApi` (Swagger UI and OpenAPI, Development only)
- Bogus (bulk test-data generation, `Data/Seed/BulkDataSeed.cs`)
- Integration tests: xUnit, `Microsoft.AspNetCore.Mvc.Testing`, Respawn, against a real SQL Server database

### NuGet packages (`backend/aspnetproject/aspnetproject.csproj`)

```
Bogus
MailKit
Microsoft.AspNetCore.Authentication.JwtBearer
Microsoft.AspNetCore.OpenApi
Microsoft.EntityFrameworkCore
Microsoft.EntityFrameworkCore.Design
Microsoft.EntityFrameworkCore.SqlServer
Microsoft.EntityFrameworkCore.Tools
Swashbuckle.AspNetCore
Swashbuckle.AspNetCore.Filters
System.Security.Cryptography.Pkcs
```

---

## Layout

```
aspnetproject.slnx
/aspnetproject                    the API project
/aspnetproject.IntegrationTests   integration tests against a real SQL Server
```

### The API project (`backend/aspnetproject/`)

```
/Common
    /Attributes
        UtcDateTimeDefaultValueAttribute.cs
        /DataValidation
            ValidAgeAttribute.cs
    /Domain
        ApplicationResponse.cs, ListResponse.cs, ModerationResponse.cs
    /Json
        UtcDateTimeJsonConverter.cs, and a converter per enum the API reads by name
    /ProjectConstants
        Constants.cs, EventNames.cs, FeedRanking.cs, ReservedUsernames.cs, ResponseMessages.cs
        /Enums
            AccountState.cs, ExceptionPlaceKind.cs, FriendshipStatus.cs, ModerationStatus.cs, NotificationKind.cs,
            ReportDecision.cs, ReportStatus.cs, ReportTargetType.cs, RoleName.cs
/Controllers
    /Admin
        AdminController.cs, ModerationController.cs
    /Automation
        InternalController.cs
    /Base
        BaseController.cs
    /Content
        CommentController.cs, MessageController.cs, PostController.cs, PostLikeController.cs, ReportController.cs
    /Filters
        ImageUploadRequestSizeFilter.cs, MessageUploadRequestSizeFilter.cs, PostUploadRequestSizeFilter.cs
    /Users
        AccountActivationController.cs, AccountManagementController.cs,
        AuthController.cs, FriendshipController.cs, UserController.cs
/Data
    ApplicationDbContext.cs
    /Configurations
        UserConfiguration.cs
        ...
    /Models
        BaseEntity.cs, BaseImage.cs
        Comment.cs, Friendship.cs, Log.cs, Message.cs, MessageImage.cs, Post.cs, PostImage.cs, PostLike.cs,
        RefreshToken.cs, Report.cs, Role.cs, User.cs, UserRole.cs
    /Repositories
        /Base
            BaseRepository.cs
            BaseEntityRepository.cs
        /Dtos
            BirthdayFriendProjection.cs, ConversationFriendProjection.cs, DigestPostProjection.cs,
            DigestRecipientProjection.cs, PostWithStatsProjection.cs
        /Visibility
            ModerationVisibility.cs
        UserRepository.cs
        ...
    /Seed
        BulkDataSeed.cs
        DemoDataSeeder.cs, DemoSeedSummary.cs
        DeterministicFixtureSeed.cs
/Extensions
    ApplicationServicesExtensions.cs, AuthenticationExtensions.cs, CorsExtensions.cs, DemoSeedExtensions.cs,
    DevelopmentEndpointsExtensions.cs, GlobalExceptionHandler.cs, ImageStorageExtensions.cs, RateLimitConfig.cs,
    SwaggerExtensions.cs, TestSeedExtensions.cs, UtcTimeJsonExtensions.cs
/Hubs
    MessageHub.cs
/Infrastructure
    /Dtos
        /Accounts, /Auth, /Automation, /Comments, /DatabaseLogs, /Friendships, /Images,
        /Messages, /Moderation, /Posts, /Reports, /Statistics, /UserRoles, /Users, /WebsocketsTransfer
    /Mappers
        UserMapper.cs
        ...
    /Queries
        AccountListQuery.cs, BirthdayListQuery.cs, PageQuery.cs, ReportListQuery.cs, SearchUserQuery.cs
    /Services
        /Automation
            /Authentication
            /Configuration
            EventPublisher.cs
        /BackgroundJobs
            /Base
            /Common
            /Configuration
            OldLogsCleanupService.cs, OrphanImagesCleanupService.cs, RefreshTokenCleanupService.cs,
            SoftDeletedUsersCleanupService.cs
        /BusinessLogic
            /Base
            /Content
            /Internal
            /Users
            LogService.cs, StatisticsService.cs
        /Helpers
        /Logging
        /Storage
            /Configuration
            CheckedImage.cs, ImageStorage.cs
        /Websockets
/Migrations
Program.cs
```

Folders are grouped by domain area, not by REST noun, and the grouping repeats across layers: `AuthController`, `UserController`, `FriendshipController`, `AccountManagementController` and `AccountActivationController` all live under `Controllers/Users/`, mirroring `Services/BusinessLogic/Users/`. `AdminController` (`Controllers/Admin/`) is the administrator-only area; it calls `LogService`, `StatisticsService`, `UserService` and `ModerationService` (`BusinessLogic/Content`). `ModerationController`, beside it, holds the two routes that set a moderation status, because the automation may call those with its API key too. `InternalController` (`Controllers/Automation/`) holds the routes only the automation may call: the digest list on `DigestService` (`BusinessLogic/Users`), and birthdays and notifications on `BirthdayService` and `NotificationService` (`BusinessLogic/Internal`).

---

## Running it

The first setup (prerequisites, the settings file `appsettings.Development.json`, the database and the start commands) is under [Getting started](../README.md#getting-started). The appsettings files are gitignored and stay in `backend/aspnetproject/`; a fresh clone has none. What the settings in that guide are for:

- `ConnectionStrings:DefaultConnection`: the development database.
- `Jwt:Key`, `Jwt:AccessTokenMinutes`, `Jwt:RefreshTokenDays` and `PasswordConfiguration:ResetTokenMinutes`: the account flows. Keep the signing key and connection credentials out of Git.
- `EmailConfiguration:Enabled` set to `false` sends no mail. To send it, leave it out and set `SmtpHost`, `SmtpPort`, `SenderEmail`, `Username` and `Password` for an SMTP account; `SenderName` is the sender's name users see on the backend's emails.
- `Cors:AllowedOrigins`, including `http://localhost:4200` when running the frontend, so password reset and reactivation accept links back to it.

Under either launch profile the backend listens on `https://localhost:7102`, the address the frontend's proxy uses, and on `http://localhost:5045`; the profiles differ only in which comes first ([launchSettings.json](aspnetproject/Properties/launchSettings.json)).

See the settings for [cleanup jobs](../docs/backend/background-jobs.md), [image storage](../docs/backend/controllers.md#postcontroller), [password hashing](../docs/backend/auth.md#authentication--authorization), [automation events](../docs/backend/automation.md#settings), and [automation API access](../docs/backend/auth.md#the-automations-api-key-second-scheme).

For a presentation, the demo seed (`seed-demo`, step 3 of [Getting started](../README.md#getting-started); Development only) empties the database except the administrator (Id 1), seeds a small named cast with posts, chats, friend requests and moderation work, removes every uploaded file, and exits instead of serving. Every password becomes `password123`. Times are relative to the run, so run it again on the morning of a demo. `Data/Seed/DemoDataSeeder.cs` describes what it writes.

For direct test runs, prepare the [local test settings](../docs/backend/testing.md#local-test-settings) and run `dotnet test aspnetproject.IntegrationTests` from `backend/`. On Linux, run [`scripts/test-linux.sh`](../scripts/test-linux.sh) from the repository root to provision SQL Server in Docker and run the suite.

Automation events are off by default. For a local n8n instance, use the [automation setup guide](../n8n/README.md#setup) to configure the shared secrets, enable events, and start the Docker services.

---

## Architecture

Dependencies point one way: **Controllers / Hubs → Services → Repositories → `ApplicationDbContext`**. `Common/` (constants, response messages, enums, `ApplicationResponse`) is shared by every layer.

**Models** (`Data/Models`): plain entity classes. Enums live in `Common/ProjectConstants/Enums`.

**Repositories**: concrete classes. `BaseRepository<T>` and `BaseEntityRepository<T>` provide the shared query, pagination and transaction logic; specific repositories add domain queries.

**Services**: business logic. The services under `BusinessLogic/Content`, `BusinessLogic/Internal` and `BusinessLogic/Users` inherit `BaseService` and consume repositories and mappers directly. `LogService` and `StatisticsService` also inherit `BaseService`; they serve the administrator's log and statistics reads through the repositories (`StatisticsService` also reads the online count from `UserConnectionTracker`).

**Controllers**: thin. They delegate to services and map `ApplicationResponse` outcomes to HTTP status codes. All routes are under `api/` (for example `api/posts`, `api/auth`).

**Hubs**: the SignalR transport, a tier of its own beside the controllers. One hub, `MessageHub` at `hubs/messages`, carries messages, comment and like notifications, presence, typing signals and the automation's notifications. Its one client-called method, `SendTyping`, hands the call to a service; the hub itself does no validation.

**Background jobs**: four hosted services built on `PeriodicHostedService` clean up refresh tokens, soft-deleted users, old log rows and photo files no post or message refers to.

### Startup

Startup configures SQL Server and controllers, then uses extension methods to register JWT and automation authentication and the application services. The pipeline serves uploads at `/api/images` and maps `MessageHub` at `/hubs/messages`. Rate limiting runs between authentication and authorization so per-user policies can read the caller. Development also exposes Swagger UI, OpenAPI, and the route that throws to test exception events. See [Program.cs](aspnetproject/Program.cs) for the pipeline and [ApplicationServicesExtensions.cs](aspnetproject/Extensions/ApplicationServicesExtensions.cs) for registrations and options.

---

## Design decisions

- **No interfaces.** Repositories, services and mappers are concrete classes, registered directly. Mappers are static.
- **Result wrapper.** A service method that can fail returns `ApplicationResponse` or `ApplicationResponse<T>`; the controller maps `Succeeded` to a status code. Where no failure state is possible the wrapper is left out (`AuthService.LogoutAsync`, `MessageService.MarkAsReadAsync`, `MessageService.GetUnreadConversationsCount`). Unhandled exceptions go to `GlobalExceptionHandler`, which writes the same envelope.
- **Control flow.** The house rule outside controllers and hubs is no early returns: a method has a single `return` at the end and branches with `if`/`else`. Controllers may return early, checking success first.
- **Two repository bases.** `BaseEntityRepository<T>` is for `BaseEntity` types and adds id-based operations. `UserRoleRepository` (composite key, no `Id`) and `FriendshipRepository` extend `BaseRepository<T>` directly. Subclasses override `protected virtual IQueryable<T> Query(bool track = true)` to set default `Include`s.
- **Transactions.** Services use the shared repository transaction for atomic writes. See [persistence and bulk writes](../docs/backend/data.md#savechanges-strategy).
- **Two loggers.** `BaseService` holds the `DatabaseLogger` and provides `LogResultAsync`, which writes an outcome row tagged `{ServiceName}.{MethodName}` to the `Logs` table. `SystemLogger` appends to `Logs/ErrorLogs.txt` for unhandled exceptions and for failures to write a log row. Background jobs log through `DatabaseLogger` too. Controllers do not log.
- **Account states.** Deactivation and soft-delete are two distinct states. A global query filter on `User` hides both from normal reads, so call sites do not have to remember to filter.
- **`LastUpdatedAt` carries meaning.** It is nullable and stamped by services on update, not defaulted by the database: `Message.IsEdited` is `LastUpdatedAt is not null`.
- **Mutate and notify together.** Services push SignalR events through `IHubContext` in the same method that changes the data.
- **Authorization.** `[Authorize]` is set per controller, with `[AllowAnonymous]` on public actions. `BaseController` provides `GetUserId()`, `GetUsername()` and `IsAdministrator()`. `AuthController` is the exception: every action is public, so it has no `[Authorize]` and does not inherit `BaseController`. Ownership checks are made in services.
- **One storage class for files.** `ImageStorage` checks uploads by their leading bytes, names them itself, saves, deletes and turns a stored file into its relative address under `/api/images`. Nothing else touches the disk, so moving images to cloud storage changes that one class. An upload with any bad file stores nothing.
- **Ranked feed in raw SQL.** The feed scores every post the caller did not write by connection (friend, mutual friend, anyone else), likes plus comments, and age. One raw SQL query, built from named CTEs for readability, ranks and pages them and returns the page's ids, so all posts are never loaded into memory. A second query loads that page. The weights and the decay are named constants in `FeedRanking` (see Posts in `docs/backend/controllers.md`).
- **Pagination.** List endpoints bind `PageQuery` from the query string: `PageNumber` defaults to 1 and is validated to 1–`MaxPageNumber`, and `PageSize` defaults to 10 and is validated to 1–100. A value out of range gets `400`.
- **Rate limiting.** Sliding-window policies, per-IP before login and per-user after, with a per-user global limiter as a backstop. The limiter runs between authentication and authorization, so it sees the signed-in user; a request without a valid token counts against its IP (see `docs/backend/auth.md`).

---

## Docs

Per-area detail lives in `docs/backend/`:

- [Authentication and authorization](../docs/backend/auth.md)
- [Controllers and endpoint contracts](../docs/backend/controllers.md)
- [Repositories, entities, and cascade behavior](../docs/backend/data.md)
- [SignalR, presence, and live events](../docs/backend/signalr.md)
- [Background jobs](../docs/backend/background-jobs.md)
- [Automation events and API access](../docs/backend/automation.md)
- [Integration test infrastructure](../docs/backend/testing.md)
