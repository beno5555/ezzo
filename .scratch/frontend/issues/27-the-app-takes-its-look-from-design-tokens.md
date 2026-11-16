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

**Status:** ready-for-agent

**Difficulty:** tricky: the first styled code and a new pattern that every later ticket copies; switching off Tailwind's defaults needs care, and most of the result is checked by looking.

- [ ] Lint, the unit tests and the build pass locally and in CI
- [ ] Every design token in the header of `DESIGN.md` is in the token file under the same role name with the same value, light and dark
- [ ] Putting `data-theme="dark"` on the root element by hand turns every surface, text and border of the proof pages dark, and removing it turns them light
- [ ] A class from outside the design tokens (`bg-blue-500`, `xl:`) produces no style
- [ ] The check fails on a planted hex colour, a planted `p-[13px]`, a planted `dark:` class and a planted `@apply`, and passes once each is removed; the four runs are recorded in this ticket's comments
- [ ] English and Georgian text both render in the brief's fonts, and the browser's network panel shows no request to another origin
- [ ] The `Button` shows its three looks, its disabled state and a visible focus ring, and is 44 px high on a phone width
- [ ] `frontend/CLAUDE.md` exists and stays under about 30 lines
- [ ] The "Temporary" line is gone from the Styling section, and no value in `DESIGN.md` differs from the token file
- [ ] Checked by eye in the running app at 360, 768 and 1280 px, in both themes: nothing scrolls sideways
