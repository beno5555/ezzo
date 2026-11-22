# 36: Icons used only by on-demand pages stay out of the first download

**What to build:** An icon that only an on-demand page uses ships in that page's chunk, not in the first download. So a page ticket that adds an icon no longer grows what every visitor downloads first.

**Measured on `master` at `4f6a74f` (2026-11-22).** `npm run build` warns that the first download is 600.17 kB raw (129.36 kB compressed), 174 bytes over the 600 kB limit of ADR 0009. `@lucide/angular` takes 141.6 kB of it, the largest share after Angular's core (159.5 kB). Frontend ticket 22 alone added 20.1 kB of it (121.4 to 141.6 kB). The icons that only on-demand pages use are defined in `main-*.js` anyway: `lucideFlag`, `lucideScrollText`, `lucideChartColumn` and `lucideShieldCheck` (the admin layout), and `lucideHeart` (the feed).

- **Find the cause first.** `@lucide/angular` has one entry point: one fesm file, marked `sideEffects: false`. So there are no per-icon imports to switch to, and the cause is not confirmed. Find out why icons used only by lazy pages end up in `main`. Two places to start: how esbuild splits that module between chunks, and whether each icon component counts as having side effects. Record the cause in the ticket's comments before you choose a fix.
- **Then fix it.** No direction is decided. One option is a project-owned wrapper per icon; another is whatever the investigation shows. Weigh them against the cause you found, and record the choice and why. If possible, templates keep working with the same icon names.
- **Prove it holds.** Show that an icon added only to an on-demand page lands in that page's chunk and leaves `main-*.js` the same size.
- **Leave ADR 0009's limit alone.** Re-measure the first download once the fix is done, and record it in the ticket's comments.

To see what is in the first download: run `npx ng build --stats-json` in `frontend/`, read `dist/webcity/browser-stats.json`, and follow the static imports from the `main-*.js` output. Commit `2c198fc` only stubbed the icons for the unit tests; it did not change the shipped bundle.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Difficulty:** tricky. The cause is unconfirmed, so the ticket starts with debugging how the bundler splits a library, and the fix is a new pattern that every later page ticket will copy.

- [ ] The ticket's comments say why icons from lazy pages were in `main`, with the evidence
- [ ] The ticket's comments record the chosen fix and the options it was weighed against
- [ ] `lucideFlag`, `lucideScrollText`, `lucideChartColumn`, `lucideShieldCheck` and `lucideHeart` are no longer defined in `main-*.js`, unless a page in the first download also uses them
- [ ] An icon added only to an on-demand page does not change the size of `main-*.js`
- [ ] Every icon still shows where it did, in both themes, checked with the screenshot command
- [ ] ADR 0009's limit is unchanged, and the first download's raw and compressed sizes, before and after, are in the ticket's comments
- [ ] The unit tests, lint, Prettier and the build pass
