# Frontend

Claude Code loads this file when you open a file in `frontend/`. The repo's root `CLAUDE.md` still applies.

**Before you edit a template or a style,** read `DESIGN.md` at the repo root and the Styling section of `.claude/skills/webcity-conventions/references/typescript.md`.

## Hard rules

- **Design tokens only.** Every colour, type size, radius, shadow, column width and breakpoint is a class made from `src/design-tokens.css`; spaces use Tailwind's default scale. Write no hex code, colour function, bracketed value (`p-[13px]`), inline style, `dark:` class or `@apply`: `npm run lint` fails on each under `src/app`. It does not catch a named colour (`red`) or a `px` length in a `.css` file, so write neither. Tailwind's own palette and sizes do not exist here (`bg-blue-500` gives no style).
- **A design token changes in `src/design-tokens.css` and in `DESIGN.md` in the same commit.**
- **Responsive.** Phone first. The only breakpoints are `md:` (768 px, where the shell changes) and `lg:` (1024 px, only on a page with a real second column). Maximum widths, never fixed widths. Nothing scrolls sideways at 360 px. Touch targets are at least 44 px high.
- **Check every page you build at 360, 768 and 1280 px, in both themes,** in Chrome through the Claude in Chrome extension, with the backend running when the page shows data. Stop both servers afterwards ("Running the app" in the root `CLAUDE.md`). The dark theme applies while `<html>` carries `data-theme="dark"`.
- Buttons are `<button appButton look="primary">` (or `quiet`, `danger`) from `src/app/shared/button/`. Icons come from `@lucide/angular` only.

## Commands

Run from `frontend/`:

```bash
npm start                    # dev server on http://localhost:4200, /api and /hubs proxied to the backend
npm test -- --watch=false    # Vitest unit tests, once
npm run lint                 # ESLint, including the design token rule, then that rule's own tests
npm run build
npx prettier --write .       # Prettier owns formatting
```
