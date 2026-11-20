# The first download warns at 600 kB

The build warns when the first download (Angular's `initial` budget in `frontend/angular.json`) passes 600 kB raw, and fails at 1 MB. The 500 kB warning it replaced is Angular's default for a new project, not a standard anyone measured WebCity against. The first download is about 120 kB compressed, which is light for a web app. It also grows on purpose: both dictionaries ship in it (ADR 0006), so every page ticket adds its text in two languages. A warning that fires on every build hides the one jump that matters, so the limit leaves room for that growth.

The SignalR client was moved out of the first download first (ticket 32): it loads the first time a user signs in, so a guest never downloads it. The first download went from 559.7 kB (130.6 kB compressed) to 503.7 kB (118.6 kB).

## Considered Options

- **Keep 500 kB and trim until it passes**: the next page ticket's text would put it over again.
- **Load only the language in use**: halves the dictionaries' share, but changes ADR 0006. Left for later.

## Consequences

- When the warning fires again, find out what grew (`npm run build` lists each chunk) before raising the limit. A library that only signed-in pages use can load on demand, as SignalR does.
- The 1 MB error stays, so a real mistake (a large library pulled into the first download) still fails the build.
