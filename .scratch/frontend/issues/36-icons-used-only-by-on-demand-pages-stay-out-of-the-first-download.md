# 36: Icons used only by on-demand pages stay out of the first download

**What to build:** An icon that only an on-demand page uses ships in that page's chunk, not in the first download. So a page ticket that adds an icon no longer grows what every visitor downloads first.

**Measured on `master` at `4f6a74f` (2026-11-22).** `npm run build` warns that the first download is 600.17 kB raw (129.36 kB compressed), 174 bytes over the 600 kB limit of ADR 0009. `@lucide/angular` takes 141.6 kB of it, the largest share after Angular's core (159.5 kB). Frontend ticket 22 alone added 20.1 kB of it (121.4 to 141.6 kB). The icons that only on-demand pages use are defined in `main-*.js` anyway: `lucideFlag`, `lucideScrollText`, `lucideChartColumn` and `lucideShieldCheck` (the admin layout), and `lucideHeart` (the feed).

- **Find the cause first.** `@lucide/angular` has one flattened JavaScript entry point. Check how esbuild assigns it to initial and lazy chunks, and record the evidence in the comments.
- **Then fix it.** No direction is decided. One option is a project-owned wrapper per icon; another is whatever the investigation shows. Weigh them against the cause you found, and record the choice and why. If possible, templates keep working with the same icon names.
- **Prove it holds.** Show that an icon added only to an on-demand page lands in that page's chunk and leaves `main-*.js` the same size.
- **Leave ADR 0009's limit alone.** Re-measure the first download once the fix is done, and record it in the ticket's comments.

To see what is in the first download: run `npx ng build --stats-json` in `frontend/`, read `dist/webcity/browser-stats.json`, and follow the static imports from the `main-*.js` output. Commit `2c198fc` only stubbed the icons for the unit tests; it did not change the shipped bundle.

**Blocked by:** None (can start immediately)

**Status:** done

**Difficulty:** tricky. The fix changes how each page imports icons.

- [x] The ticket's comments say why icons from lazy pages were in `main`, with the evidence
- [x] The ticket's comments record the chosen fix and the options it was weighed against
- [x] `lucideFlag`, `lucideScrollText`, `lucideChartColumn`, `lucideShieldCheck` and `lucideHeart` are no longer defined in `main-*.js`, unless a page in the first download also uses them
- [x] An icon added only to an on-demand page does not change the size of `main-*.js`
- [x] The new renderer uses the same 46 SVG definitions. The screenshot command checks the landing page and feed in both themes
- [x] ADR 0009's limit is unchanged, and the first download's raw and compressed sizes, before and after, are in the ticket's comments
- [x] The unit tests, lint, Prettier and the build pass

## Comments

### 2026-11-24 investigation and implementation

- On `1cff984`, build stats attributed about 172 kB of initial JavaScript to the single `@lucide/angular` module. The production build removed unused icons but placed the used icon implementations in an initial shared chunk. Importing named exports from the plain `lucide` entry reduced the size but still moved a new admin-only icon into an initial chunk.
- The owner approved using the official Lucide SVG data. Import each icon's module directly and render it on the existing SVG through one shared Angular component. This keeps the same paths and accessible labels and avoids generating or maintaining a wrapper per icon. The package is pinned because the imports use its published file layout. The old Angular icon test stand-in is no longer needed.
- In the final stats, Flag, ScrollText, ChartColumn and ShieldCheck occur in lazy chunks. Heart also serves shared startup UI. Adding Antenna only to Admin Logs put the icon in that page's chunk while leaving `main` at 160,009 bytes and the raw initial total at 562,047 bytes. The probe was removed after the check.
- Compared all 46 icon definitions with the old library at the same release. All matched. The landing page and feed matched pixel for pixel in 24 fixture screenshots across three widths, both themes and both languages.
- With the language change in ticket 37, the initial total went from 773.59 kB raw and 162.23 kB estimated transfer at `1cff984` to 562.05 kB raw and 146.82 kB estimated transfer. The 600 kB warning and 1 MB error stayed in place. Prettier, lint, 981 unit tests, and the production build passed.
