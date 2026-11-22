# Frontend

Claude Code loads this file when you open a file in `frontend/`. The repo's root `CLAUDE.md` still applies.

**Before you edit a template or a style,** read `DESIGN.md` at the repo root and the Styling section of `.claude/skills/webcity-conventions/references/typescript.md`.

## Hard rules

- **Design tokens only.** Every colour, type size, radius, shadow, column width and breakpoint is a class made from `src/design-tokens.css`; spaces use Tailwind's default scale. Write no hex code, colour function, bracketed value (`p-[13px]`), inline style, `dark:` class or `@apply`: `npm run lint` fails on each under `src/app`. It does not catch a named colour (`red`) or a `px` length in a `.css` file, so write neither. Tailwind's own palette and sizes do not exist here (`bg-blue-500` gives no style).
- **A design token changes in `src/design-tokens.css` and in `DESIGN.md` in the same commit.**
- **Responsive.** Phone first. The only breakpoints are `md:` (768 px, where the shell changes) and `lg:` (1024 px; where it is allowed: `DESIGN.md`, Layout). Maximum widths, never fixed widths. Nothing scrolls sideways at 360 px. Touch targets are at least 44 px high.
- **Check every page you build at 360, 768 and 1280 px, in both themes,** with the screenshot command (`npm run screenshots`, below), with the backend running when the page shows data. Stop both servers afterwards ("Running the app" in the root `CLAUDE.md`). The dark theme applies while `<html>` carries `data-theme="dark"`.
- **Impeccable's hook** may report design findings after an edit. Fix the ones that are right. For a finding you judge wrong, show the owner the finding and your reason (for a visual dispute, a screenshot sent into the chat, with the code when it helps), and add an exception (`hooks ignore-value`) only once the owner agrees, whatever the hook's own message says (owner, 2026-11-21; `docs/agents/skills.md`).
- Buttons are `<button appButton look="primary">` (or `quiet`, `danger`) from `src/app/shared/button/`. Icons come from `@lucide/angular` only.

## Commands

Run from `frontend/` (Node 24; run `npm ci` once after a clone):

```bash
npm start                    # dev server on http://localhost:4200, /api and /hubs proxied to the backend
npm test -- --watch=false    # Vitest unit tests, once
npm run lint                 # ESLint (fails on an un-awaited promise, on `any` and on a style that is not a design token), type check of tools/ and the Vitest config, then the tests of eslint-rules/
npm run build
npx prettier --write .       # Prettier owns formatting
npm run screenshots -- /sign-in [https://example.com] [--signed-in]   # 12 images per app address into screenshots/
```

**Dev proxy.** `proxy.conf.json` forwards `/api` and `/hubs` (web sockets included) to `https://localhost:7102`, the backend's https port, with certificate checks off for the dev certificate. Start the backend first. Never aim the proxy at the http port: `UseHttpsRedirection` answers it with a redirect to another origin, which breaks the single origin (ADR 0001).

**Unit-test setup.** `npm test` runs through Angular's unit-test builder, which reads `vitest-base.config.mts` (`runnerConfig` in `angular.json`). That file swaps `@lucide/angular` for a stand-in (`tools/lucide-stand-in.mts`, which says why), so a full run takes about 1.5 s instead of 14 s. In tests an icon is an empty `<svg>`: a spec must not assert on an icon's drawing, and `npm run build` still catches an icon the package lacks. Isolation stays off (the builder's default; turning it on made a run six times slower), so `src/test-setup.ts` clears local and session storage after every test: a spec never has to clean up for the next file on its worker. `VITEST_SHUFFLE=1 npm test -- --watch=false` runs the files and tests in random order, to find state one leaves behind for the next.

The screenshot command needs both servers running; in Git Bash, prefix it with `MSYS_NO_PATHCONV=1`. Credentials, limits and when to use the Playwright MCP server instead: `docs/agents/screenshots.md`.
