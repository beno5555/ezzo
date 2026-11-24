# Load only the selected language at startup

Each TypeScript dictionary is a separate production chunk. Startup, including a direct visit to an account page, chooses the saved language when available and otherwise uses Georgian for a Georgian browser and English for other browsers. The dictionary and session refresh load in parallel. The app waits for both before rendering so every consumer of `LanguageStore.text()` has a complete dictionary from the start. English still defines the shape the compiler checks, and server text continues to be shown as received.

This supersedes [ADR 0006](0006-ui-text-is-translated-in-the-frontend-server-text-stays-english.md).

## Considered options

- Shipping both dictionaries with the initial JavaScript avoids a separate request but makes every visitor download and parse the other dictionary.
- Prefetching the other dictionary after startup could make the first switch faster. Waiting for a switch saves that transfer for visits that use only one language.

## Consequences

- The current interface stays visible while the next dictionary loads. A successful switch updates the interface, document language and saved choice. A failed switch keeps the current language and preference.
- The browser reuses loaded dictionary modules on subsequent switches during the visit.
