# Ezzo

Ezzo is a small social platform for people who make things as a hobby: they post what they made, get feedback in the comments, become friends and message each other in real time. The name comes from the Georgian word for a courtyard (ეზო), the shared yard where neighbours meet. The product and its audience are described in [PRODUCT.md](PRODUCT.md).

## Repository layout

```
/backend
    /aspnetproject                    the Web API (backend/README.md)
        /Controllers, /Hubs           the HTTP endpoints, and the SignalR hub that pushes live updates
        /Infrastructure               services (business logic, background jobs, email, file storage, automation), DTOs, mappers
        /Data                         entities, EF Core configurations, repositories and seed data
        /Migrations                   the database schema, one migration per change
        /Common                       constants, response messages, enums and the result wrapper every layer shares
        /Extensions                   startup: services, authentication, rate limits, CORS, error handling
    /aspnetproject.IntegrationTests   integration tests against a real SQL Server
/frontend                             the Angular app (frontend/README.md)
    /src/app/core                     what the whole app uses once: HTTP, the session, routing, live updates, themes, languages
    /src/app/features                 one folder per area (posts, messages, admin, ...) with its pages and API services
    /src/app/shared                   components used by several areas: buttons, dialogs, the post card, toasts
/n8n                                  the automation (n8n/README.md)
    /workflows                        the n8n workflows, imported when n8n starts
    compose.yaml, setup.ps1           n8n in Docker, and the script that generates its shared secrets
/docs
    /backend                          per-area backend docs: auth, controllers, data, signalr, background-jobs, automation, testing
    /adr                              architecture decision records
    /c4                               the C4 architecture document (Georgian), its diagrams and their build scripts
    /agents                           notes for coding agents
/scripts                              test-linux.sh: the integration tests against a throwaway SQL Server in Docker
/.github                              CI: the integration tests and the frontend's checks
/planning                             the specs, tickets, roadmap and review queue used during development, one folder per feature
DESIGN.md                             the frontend's visual brief: design tokens, themes, layout
PRODUCT.md                            who the product is for, its name and its voice
GLOSSARY.md                           domain terms
CLAUDE.md                             instructions for coding agents (AGENTS.md for others)
```

## Getting started

Ezzo is not hosted yet, so it runs on your own machine. Hosting is planned on a single server, where nginx serves the built frontend and forwards the API to the backend ([ADR 0001](docs/adr/0001-single-origin-for-frontend-and-backend.md)).

You need:

- the [.NET 10 SDK](https://dotnet.microsoft.com/download) and [Node.js 24](https://nodejs.org/);
- SQL Server, installed and running;
- the Entity Framework tool, installed once with `dotnet tool install --global dotnet-ef`.

Run every command below from the repository root.

1. **Create the settings file** `backend/aspnetproject/appsettings.Development.json`. Git ignores it, so it never leaves your machine.

   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Server=localhost;Database=Ezzo;Trusted_Connection=True;TrustServerCertificate=True"
     },
     "Jwt": { "Key": "<signing key>", "AccessTokenMinutes": 5, "RefreshTokenDays": 7 },
     "PasswordConfiguration": { "ResetTokenMinutes": 15 },
     "EmailConfiguration": {
       "SmtpHost": "smtp.gmail.com",
       "SmtpPort": 587,
       "SenderEmail": "<your email address>",
       "SenderName": "Ezzo",
       "Username": "<your email address>",
       "Password": "<your app password>"
     },
     "Cors": { "AllowedOrigins": [ "http://localhost:4200" ] }
   }
   ```

   - **Connection string:** your local SQL Server, signed in with your Windows account. Step 2 creates the database `Ezzo`.
   - **Signing key:** generate one with `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`. Anyone who knows it can sign in as any user.
   - **Email:** your own account, so password reset and reactivation links arrive. For Gmail, turn on 2-Step Verification and create an [app password](https://myaccount.google.com/apppasswords); other providers work if they accept STARTTLS on port 587. Without email, use `"EmailConfiguration": { "Enabled": false }`: nothing is sent, though the app still reports the links as sent.

2. **Create the database** with its tables and an administrator account:

   ```bash
   dotnet ef database update --project backend/aspnetproject -- --environment Development
   ```

3. **Add demo data (optional).** This empties the database, keeps the administrator, adds sample people, posts, chats and reports, and exits:

   ```bash
   dotnet run --project backend/aspnetproject --launch-profile https -- seed-demo
   ```

4. **Start the backend** and leave it running. If it reports a missing HTTPS development certificate, run `dotnet dev-certs https` once and start it again.

   ```bash
   dotnet run --project backend/aspnetproject --launch-profile https
   ```

5. **Start the frontend** in a second terminal. The first command is needed only once:

   ```bash
   npm --prefix frontend ci
   npm --prefix frontend start
   ```

6. **Open <http://localhost:4200>** and sign in as the administrator, `sandro_beno` with the password `password123`, or register a new account. The demo accounts from step 3 use the same password.

The automation (the welcome email, AI moderation and Telegram alerts) is optional; the app runs without it. To add it, follow [n8n/README.md](n8n/README.md#setup). To run the tests, see [backend/README.md](backend/README.md#running-it) and [frontend/README.md](frontend/README.md#commands).

## Features

**Accounts.** People register with an email, a username and a password, and stay signed in between visits. A forgotten password is reset through an emailed link. On the settings page, people edit their profile, choose the language, ask for a password reset link, and deactivate or delete their account. A deactivated account is hidden from everyone until it is reactivated through an emailed link. A deleted one is removed for good, with its posts, messages and photos, after a waiting period.

**Posts and the feed.** A post has text and up to ten photos. The feed shows everyone's posts, not only friends', ranked by how close you are to the author, how much activity the post has and how new it is, so friends' posts come first. Posts collect likes and comments, and authors can edit or delete their own. A comment can be deleted by its author, by the post's author or by an administrator. Guests can read profiles and posts without an account.

**People.** A profile shows the person's bio, posts and friends. Search finds people by username. A friend request is accepted or declined, and either side can end the friendship later.

**Chat.** Friends message each other in real time, photos included. A message can be edited for 20 minutes after it is sent, and deleted. Read receipts, a typing indicator and who is online (or when they were last seen) update live, and small pop-ups announce new messages, comments, likes and friends coming online.

**Reports and moderation.** Anyone signed in can report a post, a comment or a user. An administrator reviews each report in the admin panel and either hides what was reported or rejects the report. An administrator can also delete any post or comment, or hide it from its "…" menu and make it visible again; hidden content stays visible to its author and to administrators. The admin panel creates, edits, deactivates, reactivates and deletes accounts, gives or removes the administrator role, holds the queue of flagged content, and shows the logs and statistics.

**Automation** (optional). New accounts get a welcome email. AI moderation checks new and edited posts and comments, and flags or hides harmful ones. Five reports within 24 hours hide a post or comment. Administrators get a Telegram message for every report, developers for every server error.

**Interface.** English and Georgian, light and dark themes, from a phone to a desktop.

**Planned:**

- **A weekly digest email.** The backend part is done: it lists who gets the digest and what it says, and lets a user switch it off. The n8n workflow that sends it and the switch on the settings page are not started.
- **Birthday notifications.** The backend part is done: it lists the users with a friend whose birthday is today, and delivers a notification to those who are online. The n8n workflow that sends them and the pop-up that shows them are not started.
- **Who liked a post.** The API lists the people who liked a post; the page that shows them is not started.
- **Hidden content in the moderation page, and flagging from the "…" menu.** Not started.

## How it is built

Ezzo has two halves: the backend, an ASP.NET Core Web API ([backend/README.md](backend/README.md)), and the frontend, an Angular single-page app ([frontend/README.md](frontend/README.md)). The browser reaches both from one origin ([ADR 0001](docs/adr/0001-single-origin-for-frontend-and-backend.md)). The automation is n8n in Docker: the backend sends it signed events, and it calls the backend back with its own API key ([n8n/README.md](n8n/README.md)).

Nearly every endpoint is rate-limited: by IP address before sign-in, by user after it, with one global limit over all requests on top ([docs/backend/auth.md](docs/backend/auth.md#rate-limiting)).

## More

- [backend/README.md](backend/README.md): what the API does, its packages, layout, architecture and design decisions.
- [frontend/README.md](frontend/README.md): the frontend's stack, layout and commands.
- [n8n/README.md](n8n/README.md): the automation's setup, workflows and checklists.
- [DESIGN.md](DESIGN.md): how the interface looks and why.
- [docs/c4/](docs/c4/): the architecture in the C4 model, for the academy.
- [docs/adr/](docs/adr/): architecture decisions, and [GLOSSARY.md](GLOSSARY.md) for domain terms.
