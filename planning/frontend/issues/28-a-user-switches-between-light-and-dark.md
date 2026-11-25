# 28: A user switches between light and dark

**What to build:** A visitor sees WebCity in the theme their operating system asks for, can switch to the other one in place, and finds their choice still there after a reload, with no flash of the wrong theme while the page loads.

- **A theme store in `core/`,** built like the language store from ticket 03. It holds the current theme as a signal and is the only code that writes the `data-theme` marker on the root element.
- **The first visit follows the operating system.** While the visitor has made no choice, the theme is the operating system's setting at each load.
- **A choice is remembered.** Once the visitor uses the switch, that theme is stored in the browser and wins over the operating system from then on. A stored value that is not a known theme is ignored.
- **A theme switch component,** built like the language switch, with its texts in the English and Georgian dictionaries. It sits beside the language switch on the bare page until ticket 07 moves both into the menu.
- **No flash on load.** The marker is on the root element before the browser paints anything, so a reload in the dark theme never shows a light page first. The store starts too late for that, because it runs only after the app's code has loaded. The usual answer is a few lines of script in the page's head that read the stored choice and the operating system's setting; that script and the store must agree on the storage key and the rule.
- **The browser's own controls follow the theme:** scrollbars, and the calendar of a date input, which the register form will use.

Decisions are in `DESIGN.md` (Colors) and under "Across the whole frontend" in `planning/frontend/spec.md`.

**Blocked by:** 27 (The app takes its look from design tokens)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): the store copies the language store and is unit-tested, but a flash of the wrong theme on load is something no test catches.

- [x] The store is unit-tested: no stored choice with a dark operating system gives dark, and with a light one gives light; a stored choice wins over the operating system; switching stores the choice and changes the signal and the marker; an unknown stored value is ignored
- [x] The switch changes every colour of the page in place, without a reload
- [x] A reload in the dark theme shows no light flash, checked by eye with the network slowed in the browser's developer tools
- [x] With no stored choice, changing the operating system's setting and reloading changes the theme
- [ ] Scrollbars and a date input's calendar are dark in the dark theme
- [x] The switch's texts come from the dictionaries, and it works with the keyboard
- [x] No component names a theme: the lint check from ticket 27 still passes

## Comments

**2026-11-18, implementing session (Opus 5.5; review on Fable 5.2).**

- **Box left open: scrollbars and the date calendar.** The Chrome extension was not connected, so checks ran in headless Chrome over the DevTools protocol. Headless Chrome draws no scrollbars and cannot open the date picker. Verified instead: the root's computed `color-scheme` is `dark` in the dark theme (the property Chrome draws both from), and the date input's own icon renders light on dark. The owner looks at both once.
- **How the flash box was checked.** On a production build (`ng serve --configuration production`), with the network throttled to 400 ms latency and 50 kB/s and the cache off, a reload in dark was recorded frame by frame, starting from a magenta page: the first WebCity frame is already dark. With every script held back, the page is dark before the app boots.
- **Critical CSS inlining is off** (`optimization.styles.inlineCritical: false` in `angular.json`, production). The spec review found that inlining kept only the light values and loaded the full stylesheet without blocking the first paint, so the production build flashed light. The dev server does not inline, which is why it did not show there. The reason is recorded in the Themes section of the conventions' TypeScript reference.
- **`ToggleButton` (`shared/toggle-button/`)** now carries the look both switches share (`aria-pressed` marks the current one), per "a look that is used twice becomes a component in `shared/`". Ticket 07's menu can reuse it.
- **The head script and the store share a rule.** `theme-boot.spec.ts` runs the script from `index.html` (imported as text) for each stored value and operating system setting, and fails when it disagrees with `ThemeStore`.
- Not built, because the ticket does not ask for it: following a live change of the operating system's setting without a reload.
