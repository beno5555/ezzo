# 03: The interface speaks English and Georgian

**What to build:** Every text the frontend owns comes from a dictionary, and a visitor can switch between English and Georgian in place, without a reload (ADR 0006).

- One TypeScript dictionary file per language. English is the source; Georgian is typed against it, so a missing key fails the build.
- A language store that holds the current language as a signal, remembers the choice, and exposes the current dictionary.
- On a first visit the language is Georgian when the browser's preferred language is Georgian, and English otherwise.
- An entry that needs a number or a plural form is a function, using `Intl.PluralRules`.
- One shared formatter for dates and times that follows the current language. A date of birth is formatted in UTC, so nobody sees the previous day.
- A bare language switch on the page from ticket 02, and that page's texts moved into the dictionaries.

Later tickets add their own keys to both files. The dictionary's shape (grouping by area, naming of keys) is set here.

Decisions are under "Languages and dates" in `.scratch/frontend/spec.md`, and in "Text and languages" and "Dates" in the conventions skill's TypeScript reference.

**Blocked by:** 02 (The Angular app starts, reaches the backend through the proxy, and CI checks it)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): fully specified by ADR 0006, but nothing in the repo shows the pattern yet and every later ticket copies it.

- [x] Switching the language changes the bare page's texts in place
- [x] The choice survives a reload
- [x] With no stored choice, a browser set to Georgian starts in Georgian and any other browser in English (unit-tested)
- [x] Removing a key from the Georgian file fails the build
- [x] The formatter writes dates and times in the current language, and is unit-tested for a time and for a date of birth read west of UTC
- [x] A plural entry is unit-tested in both languages
- [x] No literal UI text is left in a template or component

## Comments

- **From ticket 02 (2026-11-15):** besides the bare page's literal texts (`features/users/user-search-page/`, `core/not-found/`), `core/http/http-failure-texts.ts` holds the fixed texts that `toAppResult` gives a failure with no message of its own (validation, `401`, `403`, `404`, no response, anything else). It is marked temporary; move them into the dictionaries. `toAppResult` is a plain function called inside `…Api` methods, so it cannot `inject()` the language store itself: either have the store's current dictionary passed in, or read the text when it is shown rather than when the failure is made. `to-app-result.spec.ts` asserts against `httpFailureTexts`, so it moves with them.
- **From ticket 03 (2026-11-15):** the language code lives in `core/languages/`. `LanguageStore.text()` is the current dictionary; a page exposes it as `protected readonly text = inject(LanguageStore).text` and reads `text().area.key`. New keys go into `english.ts` first; `georgian.ts` then fails to build until it has them. `DateFormatter.time()` and `.dateOfBirth()` format backend times. `toAppResult` takes the failure texts as its second argument (`this.languageStore.text().httpFailures`), so a fixed failure text is in the language that was current when the request was sent and does not change if the visitor switches while it is shown. Server messages never changed language anyway (ADR 0006). The switch sits in the app shell (`app.html`), where the guest shell will hold it.
- **For whoever merges ticket 04 after this one (2026-11-16):** `worktree-signin-and-stay-signedin` branched from the same `b4d1d50`, so it does not know about the dictionaries. Three files conflict:
  - `app.html`: keep both, the sign-in lane's `<header>` and `<app-language-switch />`. Its `Signed in as`, `Sign out` and `Sign in` are literal texts: move them into `english.ts` and `georgian.ts`, and give `App` a `text`.
  - `app.ts`: keep the sign-in lane's class body and imports, and add `LanguageSwitch` to `imports`.
  - `core/http/to-app-result.ts`: keep the sign-in lane's `settle()` split, but take this lane's failure texts: `toAppResult` and `toAppResultWithoutEnvelope` each take `failureTexts` as their second argument and pass it through `settle()` to `toFailure`. Drop the `http-failure-texts` import (this lane deleted that file; if the merge brings it back, delete it again).

  What git will not flag:
  - The three `toAppResultWithoutEnvelope(...)` calls in `features/auth/auth-api.ts` need `this.languageStore.text().httpFailures` as their second argument, with `LanguageStore` injected as in `user-api.ts`.
  - Any spec that still imports `httpFailureTexts` should use `english.httpFailures` instead, as `to-app-result.spec.ts` already does here.
  - The literal texts in `features/auth/sign-in-page/` and `features/admin/admin-users-page/` must move into the dictionaries ("No literal UI text" in ADR 0006).
  - `npm run build` catches the first two, but not the third.
