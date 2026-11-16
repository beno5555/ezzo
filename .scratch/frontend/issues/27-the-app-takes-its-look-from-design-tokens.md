# 27: The app takes its look from design tokens

**What to build:** Someone who writes a class such as `bg-surface-page` in a template gets the colour that `DESIGN.md` gives that role, in the light theme and in the dark theme, and has no way to write a colour or a size that is not a design token. This is the first styled code in the frontend, and every later ticket copies it.

- **The toolset.** Tailwind v4 in the Angular build, Angular CDK, and the icon package `@lucide/angular` (ADR 0007). If the icon package does not work in this zone-less app, use `lucide-static`, the same icons as plain files, and say so in this ticket's comments.
- **The token file.** Every design token in the header of `DESIGN.md` exists as a Tailwind theme value under the same role name, with the same value. The light values are the default. The dark values apply when the root element carries `data-theme="dark"`; ticket 28 sets that marker, and this ticket only proves it by hand.
- **Nothing but design tokens.** Tailwind's own colour palette, type sizes, radii, shadows and breakpoints are switched off and replaced by ours, so a class such as `bg-blue-500` or `xl:` does not exist. The only breakpoints are `md` (768 px) and `lg` (1024 px). Tailwind's default spacing scale stays.
- **The fonts.** Noto Sans and Noto Sans Georgian, in the weights the brief uses, served by the app itself. No request for a font leaves the origin.
- **A `Button` in `shared/`,** with three looks (primary, quiet, danger), a disabled state and a visible focus ring. It is the first shared component and the pattern for the rest.
- **Proof on the existing pages.** The user search page, the not-found page and the language switch take their colours, type and spacing from design tokens, and the bare page shows the three buttons.
- **A check that fails.** `npm run lint`, and therefore CI, fails when a template, a component style or a component class under the app folder holds a hex colour, a colour function such as `rgb(`, a bracketed Tailwind value such as `p-[13px]`, a `dark:` class or an `@apply`. The token file is the only place exempt.
- **`frontend/CLAUDE.md`.** A short file that Claude Code loads when an agent opens a file in `frontend/`. It holds the few hard rules (design tokens only; the responsive rules; check every page at 360, 768 and 1280 px in both themes), the frontend's commands, and one instruction: read `DESIGN.md` and the Styling section of the conventions before editing a template or a style.

Ideas this relies on, for a reader who knows C# better than CSS: a Tailwind theme value is a CSS variable, and Tailwind makes a class for each one; the dark theme is the same variables given other values under an attribute selector, which is why no component names a theme.

Decisions are in `DESIGN.md`, ADR 0007, and under "Styling" in the conventions skill's TypeScript reference. The "Temporary" line at the top of that Styling section is deleted by this ticket.

**Blocked by:** None (can start immediately). Tickets 02 and 03 are done.

**Status:** done

**Difficulty:** tricky: the first styled code and a new pattern that every later ticket copies; switching off Tailwind's defaults needs care, and most of the result is checked by looking.

- [ ] Lint, the unit tests and the build pass locally and in CI
- [x] Every design token in the header of `DESIGN.md` is in the token file under the same role name with the same value, light and dark
- [x] Putting `data-theme="dark"` on the root element by hand turns every surface, text and border of the proof pages dark, and removing it turns them light
- [x] A class from outside the design tokens (`bg-blue-500`, `xl:`) produces no style
- [x] The check fails on a planted hex colour, a planted `p-[13px]`, a planted `dark:` class and a planted `@apply`, and passes once each is removed; the four runs are recorded in this ticket's comments
- [x] English and Georgian text both render in the brief's fonts, and the browser's network panel shows no request to another origin
- [x] The `Button` shows its three looks, its disabled state and a visible focus ring, and is 44 px high on a phone width
- [x] `frontend/CLAUDE.md` exists and stays under about 30 lines
- [x] The "Temporary" line is gone from the Styling section, and no value in `DESIGN.md` differs from the token file
- [x] Checked by eye in the running app at 360, 768 and 1280 px, in both themes: nothing scrolls sideways

## Comments

**The check, planted and removed (2026-11-16).** Each breach was planted alone in the not-found page, `npm run lint` was run, the breach was removed and lint was run again.

| Breach | Planted in | With the breach | Reported (line:column, message id) | Removed |
|---|---|---|---|---|
| hex colour `#ff0000` | `not-found-page.css` | exit 1 | 2:10 `hexColour` | exit 0 |
| `p-[13px]` | `not-found-page.html` | exit 1 | 3:6 `bracketedValue` | exit 0 |
| `dark:text-ink-strong` | `not-found-page.html` | exit 1 | 3:6 `darkClass` | exit 0 |
| `@apply p-4` | `not-found-page.css` | exit 1 | 2:3 `apply` | exit 0 |

A fifth run planted `shadow-[0_0_0_rgb(0_0_0)]` in a component class (`button.ts`) and was caught as `bracketedValue`. All five runs were repeated after the review fixes below, with the same results. The rule lives in `frontend/eslint-rules/design-tokens-only.js`, and its 39 RuleTester cases run as part of `npm run lint`.

**Review fixes (spec review, 2026-11-16).**
- Tailwind scanned all of `frontend/`, so the forbidden samples in the rule's test file (`p-[13px]`, `dark:...`) were compiled into the product stylesheet. `@import 'tailwindcss' source('.')` in `src/styles.css` limits the scan to `src/`. The built CSS no longer holds them.
- The rule flagged text that is not a style (`title="Post #123"`, `querySelector('[data-theme]')`). In a template it now reads only class attributes (`class`, `[class]`, `[class.x]`, `[ngClass]`). A class opening with a bracket counts only in Tailwind's own arbitrary forms (`[prop:value]`, `[&>svg]:`). Specs, `testing/` helpers and the top-level files of `core/languages/` (dictionaries, the store) are left out of the rule in `eslint.config.js`.
- The rule now also bans an inline style in a template (`style="..."`, `[style]`, `[style.width.px]`, `[attr.style]`), message id `inlineStyle`.
- `DESIGN.md` gained `primary-dark: "#8fb0ff"`, so the token file's dark `primary` has its counterpart. The layout prose now says "steps of 0.25rem (4 px)".
- The Button's hover and press used `enabled:`, which never matches an `<a>`, so `<a appButton>` had no hover. They now use `not-disabled:`.

**Non-token classes.** A build with `bg-blue-500 xl:flex text-7xl rounded-xl shadow-lg sm:p-4 max-w-3xl font-black font-light tracking-wide leading-tight font-sans` planted in a template produced no CSS for any of them, while `md:p-4` and `lg:p-6` did.

**The icon package** `@lucide/angular` works in this zone-less app (it is signal-based), so `lucide-static` was not needed.

**The look in the browser (2026-11-16).** Headless Chrome, driven over the DevTools Protocol, visited the search, sign-in and not-found pages in English and Georgian at 360, 768 and 1280 px. On each page it added `data-theme="dark"` to `<html>` and then removed it, 54 measurements in all. In every case nothing scrolled sideways (`scrollWidth` equalled the viewport width), and the body went from `#f4f4f5`/`#1b1b1f` to `#141416`/`#f1f1f3` and back. Every `appButton` and language-switch button was 44 px high at 360 px. Pressing Tab gave each control a `2px solid` outline in `focus` with a 2 px offset. The loaded fonts were Noto Sans 400/600/700 and Noto Sans Georgian, all served from `localhost:4200`, and none of the 119 requests went to another origin. Screenshots were checked by eye. The backend was not running, so the search page's result list and failure message were not rendered. A script also compared all 66 values in the header of `DESIGN.md` (colours light and dark, discs, type sizes, radii, spacing) with the token file and found no difference.

**Decisions to confirm.**
- **Danger is an outlined button** (danger border and text on the raised surface): the brief has no on-danger or danger-hover design token for a filled one.
- **`primary` in the dark theme is `accent-dark`** (`#8fb0ff`), because the brief says primary is the same colour as accent.
- **The spacing unit is `0.25rem`,** not `4px`, in both files, because Tailwind's default scale is in rem and stays. `DESIGN.md` was changed to match. Breakpoints are likewise `48rem` and `64rem` (768 and 1024 px).
- **The `components:` entries** of the brief (`button-primary`, `card`, `input`, ...) are not theme values: shared components such as `Button` realize them out of the colour, radius and size design tokens.
- **Font weights are reset to 400, 600 and 700,** and Tailwind's leading, tracking and container scales are switched off, because the brief uses only those. Line heights travel with each type size. The only container widths are `max-w-column` (42rem) and `max-w-wide` (75rem).
- **The check bans every bracketed form,** arbitrary variants included (`data-[state=open]:`, `[&>svg]:`). A CDK ticket that styles an open state can use Tailwind's bare forms, such as `data-open:` or `aria-expanded:`.
- **A shared component that dresses a native element takes an attribute selector** (`button[appButton]`, `a[appButton]`). `@angular-eslint/component-selector` now accepts a camelCase `app` attribute beside the kebab-case element, and the conventions' Styling section says so. The Button also sits on an `<a routerLink>` that is a screen's main action (the not-found page's home link, the sign-in link).
- **The shell in `app.html` is the least the proof needs:** a bordered top bar with the session controls and the language switch, the button samples, and a `<main>` in the `column` width. Ticket 07 owns the real shell. **The button samples and their `buttonSamples` dictionary entries are scaffolding that ticket 07 should remove.**
- **Fonts come from `@fontsource/noto-sans` and `@fontsource/noto-sans-georgian`,** which the build copies into the app's own `media/` folder. `@eslint/css` was added so ESLint can read component `.css` files.

**Known gaps.**
- The check does not catch a CSS named colour (`red`) or a literal `px` length in a component `.css` file. Component `.css` files are meant to stay nearly empty. `src/index.html` and `src/styles.css` are outside `src/app` and so outside the check.
- The language switch marks the current language by a filled versus outlined button plus `aria-pressed`. A review asked whether that is "colour alone"; the fill changes the shape's contrast, not only its hue, so it was left as is.
- The sign-in page is not restyled. Under Tailwind's reset its inputs have no border and its submit is 25 px high, until ticket 08 styles it. Ticket 08 is blocked by 07, 28 and 29, so this lasts several tickets.
- CI has not yet run this change: it runs when `master` is pushed.
