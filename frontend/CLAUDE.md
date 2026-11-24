# Frontend

Follow the root [CLAUDE.md](../CLAUDE.md) as well.

**Before you edit a template or a style,** read `DESIGN.md` at the repo root and the Styling section of `.claude/skills/webcity-conventions/references/typescript.md`.

## Hard rules

- **Design tokens only.** Every colour, type size, radius, shadow, column width and breakpoint is a class made from `src/design-tokens.css`; spaces use Tailwind's default scale. Write no hex code, colour function, bracketed value (`p-[13px]`), inline style, `dark:` class or `@apply`: `npm run lint` fails on each under `src/app`. It does not catch a named colour (`red`) or a `px` length in a `.css` file, so write neither. Tailwind's own palette and sizes do not exist here (`bg-blue-500` gives no style).
- **A design token changes in `src/design-tokens.css` and in `DESIGN.md` in the same commit.**
- **Responsive.** Phone first. The only breakpoints are `md:` (768 px, where the shell changes) and `lg:` (1024 px; where it is allowed: `DESIGN.md`, Layout). Maximum widths, never fixed widths. Nothing scrolls sideways at 360 px. Touch targets are at least 44 px high.
- **Check every page you build at 360, 768 and 1280 px, in both themes,** with the screenshot command (`npm run screenshots`, below), with the backend running when the page shows data. Stop both servers afterwards ("Running the app" in the root `CLAUDE.md`). The dark theme applies while `<html>` carries `data-theme="dark"`.
- **Favour the dark theme** (owner, 2026-11-24): when you check a change in the running app, take single screenshots or write a test that sets a theme, use dark about 80 % of the time and light about 20 %. A page you build still gets every width in both themes from the screenshot command.
- **Impeccable's hook** may report design findings after an edit. Follow the [hook findings procedure](../docs/agents/skills.md#impeccable) to resolve them.
- Buttons are `<button appButton look="primary">` (or `quiet`, `danger`, `danger-text`) from `src/app/shared/button/`. Import each icon from `lucide/dist/esm/icons/<name>.mjs` so it can stay with its route. Render it with `<svg [appIcon]="icons.search">` and the shared `Icon` component. Label icon-only controls on the enclosing button or link.

## Commands

Run from `frontend/` (Node 24; run `npm ci` once after a clone):

```bash
npm start                    # dev server on http://localhost:4200, /api and /hubs proxied to the backend
npm test -- --watch=false    # Vitest unit tests, once
npm run lint                 # ESLint (fails on an un-awaited promise, on `any` and on a style that is not a design token), type check of tools/ and the Vitest config, then the tests of eslint-rules/
npm run build
npx prettier --write .       # Prettier owns formatting
npm run screenshots -- / [https://example.com] [--signed-in]   # 12 images per app address into screenshots/
```

**Dev proxy.** Start the backend first. [proxy.conf.json](proxy.conf.json) forwards `/api` and `/hubs` (including WebSockets) to `https://localhost:7102`, with certificate verification disabled for the development certificate. Keep the proxy on the backend's HTTPS port so `UseHttpsRedirection` does not redirect requests to another origin. See [ADR 0001](../docs/adr/0001-single-origin-for-frontend-and-backend.md).

**Unit-test setup.** `npm test` runs through Angular's unit-test builder, which reads `vitest-base.config.mts` (`runnerConfig` in `angular.json`). Isolation stays off, so `src/test-setup.ts` clears local and session storage after every test. It also supplies the English dictionary for specs that create their own Angular injector and stands in for `IntersectionObserver`, which jsdom lacks. `VITEST_SHUFFLE=1 npm test -- --watch=false` runs the files and tests in random order to find state one leaves behind for the next.

See the [screenshot guide](../docs/agents/screenshots.md#the-screenshot-command) for setup, accounts and limits.
