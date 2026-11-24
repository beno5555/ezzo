# Ezzo frontend

The Angular app for [Ezzo](../README.md): every page a user sees, from the landing page with its sign-in form to the admin panel. The rules for working on it are in [CLAUDE.md](CLAUDE.md), and the visual brief (design tokens, themes, layout) in [DESIGN.md](../DESIGN.md).

## Stack

- **Angular 22** without zone.js: standalone components, signals for state, and the router binding route parameters to component inputs.
- **Tailwind CSS 4** for every look, drawn only from the design tokens in `src/design-tokens.css`, and **Angular CDK** for overlays, dialogs, menus and focus handling. No component kit ([ADR 0007](../docs/adr/0007-tailwind-with-angular-cdk-and-no-component-kit.md)).
- **`@microsoft/signalr`** for the live connection, **Lucide** icons, and self-hosted fonts (Bricolage Grotesque, Noto Sans, Noto Sans Georgian).
- **API services return promises of results**, never Observables: a caller awaits and branches on success ([ADR 0003](../docs/adr/0003-frontend-api-services-return-promises-of-results.md)).
- **The access token lives in memory**, so every page load restores the session with one refresh request ([ADR 0004](../docs/adr/0004-access-token-in-memory-session-restored-by-refresh.md)).
- **Vitest** unit tests, ESLint, Prettier.

## Layout

```
/src
    /app
        /core         what the whole app uses once: HTTP and the result type, the hub client and live toasts,
                      languages, routing and guards, the session, the shell (bars, menus), themes, paging, time
        /features     one folder per area: accounts, admin, auth, comments, friendships, messages,
                      moderation, posts, reports, users, with that area's pages, API services and DTOs
        /shared       components used by several features: buttons, dialogs, the post card, photos, user rows, toasts
        app.routes.ts every address and the page it loads
    design-tokens.css the Tailwind theme: every colour, size and radius, by role
/eslint-rules         the design-tokens-only lint rule and its tests
/tools                screenshots.ts, the screenshot command
proxy.conf.json       the development proxy to the backend
```

## Loaded on demand

The first download holds the shell and what starts the app. Everything else arrives when it is first needed:

- **Every page** is its own chunk, loaded when its address is first opened (`loadComponent` in `app.routes.ts`).
- **The SignalR client** loads when a user first signs in, so a guest never downloads it ([ADR 0009](../docs/adr/0009-the-first-download-warns-at-600-kb.md)).
- **One dictionary,** the language in use, loads at startup beside the session refresh; another language loads when the user switches to it ([ADR 0010](../docs/adr/0010-load-only-the-selected-language-at-startup.md)).

The build warns when the first download passes 600 kB and fails at 1 MB.

## One origin through the dev proxy

The refresh token is a `SameSite=Strict` cookie, so the browser must see the pages and the API on one origin ([ADR 0001](../docs/adr/0001-single-origin-for-frontend-and-backend.md)). In development, `npm start` serves the app on <http://localhost:4200> and its proxy ([proxy.conf.json](proxy.conf.json)) forwards `/api` and `/hubs`, WebSockets included, to the backend at `https://localhost:7102`, accepting the development certificate. The app calls only relative addresses.

## Commands

Start the [backend](../backend/README.md#running-it) first. The commands (install, the dev server on <http://localhost:4200>, unit tests, lint, build, formatting, screenshots) are under Commands in [CLAUDE.md](CLAUDE.md#commands).

Password reset and reactivation links come back to the app only if its origin is in the backend's `Cors:AllowedOrigins` ([backend settings](../backend/README.md#running-it)).
