# The first download warns at 600 kB

The build warns when the first download (Angular's `initial` budget in `frontend/angular.json`) passes 600 kB raw, and fails at 1 MB. The 500 kB warning it replaced is Angular's default for a new project. The 600 kB limit was chosen when both dictionaries were initial assets. The app now loads the selected dictionary separately ([ADR 0010](0010-load-only-the-selected-language-at-startup.md)).

The SignalR client was moved out of the first download first (ticket 32): it loads the first time a user signs in, so a guest never downloads it. The first download went from 559.7 kB (130.6 kB compressed) to 503.7 kB (118.6 kB).

## Considered Options

- **Keep 500 kB and trim until it passes**: the next page ticket's text would put it over again.
- **Load only the language in use** was adopted later in [ADR 0010](0010-load-only-the-selected-language-at-startup.md).

## Consequences

- When the warning fires again, find out what grew (`npm run build` lists each chunk) before raising the limit. A library that only signed-in pages use can load on demand, as SignalR does.
- The 1 MB error stays, so a real mistake (a large library pulled into the first download) still fails the build.
