# Ezzo

Ezzo is a small social platform for people who make things as a hobby: they post what they made, get feedback in the comments, become friends and message each other in real time. The name comes from the Georgian word for a courtyard (ეზო), the shared yard where neighbours meet. The product and its audience are described in [PRODUCT.md](PRODUCT.md).

## Features

- **Accounts:** register, sign in, reset a forgotten password through an emailed link, deactivate an account and reactivate it through an emailed link, delete an account.
- **Posts:** text and photos, a ranked feed of friends' and other people's posts, likes, comments, editing and deleting your own.
- **People:** profiles with a bio, search by username, friend requests, friend lists.
- **Chat** between friends: photos, editing a message shortly after it is sent, deleting it, read receipts, a typing indicator, who is online, and live toasts for new messages, comments, likes and friends coming online.
- **Reports and moderation:** anyone signed in can report a post, a comment or a user. Administrators have a panel for accounts, reports, the moderation queue, logs and statistics.
- **Automation:** a welcome email, AI moderation of new and edited posts and comments, hiding content after several reports, and Telegram alerts for administrators and developers.
- **Interface** in English and Georgian, light and dark themes, from a phone to a desktop. A guest can read profiles and posts.

## How it is built

Ezzo has two halves: the backend, an ASP.NET Core Web API ([backend/README.md](backend/README.md)), and the frontend, an Angular single-page app ([frontend/README.md](frontend/README.md)). The browser reaches both from one origin ([ADR 0001](docs/adr/0001-single-origin-for-frontend-and-backend.md)). The automation is n8n in Docker: the backend sends it signed events, and it calls the backend back with its own API key ([n8n/README.md](n8n/README.md)).

## Repository layout

```
/backend          the Web API and its integration tests (backend/README.md)
/frontend         the Angular app (frontend/README.md)
/n8n              the automation: compose file, workflows, setup scripts (n8n/README.md)
/docs
    /backend      per-area backend docs: auth, controllers, data, signalr, background-jobs, automation, testing
    /adr          architecture decision records
    /c4           the C4 architecture document (Georgian), its diagrams and their build scripts
    /agents       notes for coding agents
/scripts          test-linux.sh: the integration tests against a throwaway SQL Server in Docker
/.github          CI: the integration tests and the frontend's checks
DESIGN.md         the frontend's visual brief: design tokens, themes, layout
PRODUCT.md        who the product is for, its name and its voice
GLOSSARY.md       domain terms
CLAUDE.md         instructions for coding agents (AGENTS.md for others)
```

## Running it

Start the parts in this order:

1. **The backend.** Settings, the database and the start command: [backend/README.md](backend/README.md#running-it).
2. **The frontend.** Install once, then start the dev server: [frontend/README.md](frontend/README.md#commands). Open <http://localhost:4200>.
3. **The automation**, if you need its emails, moderation and alerts: [n8n/README.md](n8n/README.md#setup). The app runs without it.

## More

- [backend/README.md](backend/README.md): what the API does, its packages, layout, architecture and design decisions.
- [frontend/README.md](frontend/README.md): the frontend's stack, layout and commands.
- [n8n/README.md](n8n/README.md): the automation's setup, workflows and checklists.
- [DESIGN.md](DESIGN.md): how the interface looks and why.
- [docs/c4/](docs/c4/): the architecture in the C4 model, for the academy.
- [docs/adr/](docs/adr/): architecture decisions, and [GLOSSARY.md](GLOSSARY.md) for domain terms.
