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

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): fully specified by ADR 0006, but nothing in the repo shows the pattern yet and every later ticket copies it.

- [ ] Switching the language changes the bare page's texts in place
- [ ] The choice survives a reload
- [ ] With no stored choice, a browser set to Georgian starts in Georgian and any other browser in English (unit-tested)
- [ ] Removing a key from the Georgian file fails the build
- [ ] The formatter writes dates and times in the current language, and is unit-tested for a time and for a date of birth read west of UTC
- [ ] A plural entry is unit-tested in both languages
- [ ] No literal UI text is left in a template or component
