import { fileURLToPath } from 'node:url';
import proxy from '../../proxy.conf.json' with { type: 'json' };
import { appAddresses } from '../../src/app/core/routing/app-addresses.ts';
import { Language } from '../../src/app/core/languages/language.ts';
import { Theme } from '../../src/app/core/themes/theme.ts';

// Everything the screenshot command assumes about the app and the machine, in one place.
export const screenshotSettings = {
  // The dev server (npm start).
  appOrigin: 'http://localhost:4200',
  // The backend, read from the dev proxy so the two cannot disagree.
  backendOrigin: proxy['/api'].target,
  // The three widths every page is checked at (DESIGN.md, Layout), each with a usual screen height.
  viewports: [
    { width: 360, height: 780 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
  ],
  // The option that photographs the app addresses signed in.
  signedInOption: '--signed-in',
  themes: Object.values(Theme),
  languages: Object.values(Language),
  // Where the images go: frontend/screenshots/, which Git ignores.
  outputFolder: fileURLToPath(new URL('../../screenshots/', import.meta.url)),
  // The gitignored file that may hold the development account's credentials (read-credentials.ts).
  environmentFile: fileURLToPath(new URL('../../.env', import.meta.url)),
  // A same-origin file that does not start the app, so storage can be set before the first real load.
  quietAppFile: '/favicon.ico',
  signInPath: appAddresses.signIn,
  // The call that restores the session on every page load (AuthApi.refresh).
  refreshPath: '/api/auth/refresh',
  // Every browser context: reduced motion, so no transition is caught halfway.
  contextOptions: { reducedMotion: 'reduce' },
  serverCheckTimeoutMs: 5_000,
  pageLoadTimeoutMs: 30_000,
} as const;
