// The screenshot command (docs/agents/screenshots.md). From the repo root:
//   npm run screenshots --prefix frontend -- / /sign-in               as a guest: 12 images per app address
//   npm run screenshots --prefix frontend -- /admin/users --signed-in signed in as the development account
//   npm run screenshots --prefix frontend -- https://example.com      an outside address: 3 images
// Playwright takes the pictures. This script exists because the app rotates its refresh token on every page
// load, so a saved sign-in lasts one page: the script signs in once and keeps one browser for every image.
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { type APIRequestContext, type Page, chromium, request } from 'playwright';
import proxy from '../proxy.conf.json' with { type: 'json' };
import { Language, languageStorageKey } from '../src/app/core/languages/language.ts';
import { appAddresses } from '../src/app/core/routing/app-addresses.ts';
import { Theme, themeStorageKey } from '../src/app/core/themes/theme.ts';

const appOrigin = 'http://localhost:4200';
const backendOrigin = proxy['/api'].target;
// The three widths every page is checked at (DESIGN.md, Layout), each with a usual screen height.
const viewports = [
  { width: 360, height: 780 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
];
const outputFolder = fileURLToPath(new URL('../screenshots/', import.meta.url));
const environmentFile = fileURLToPath(new URL('../.env', import.meta.url));
const userVariable = 'WEBCITY_SCREENSHOTS_USER';
const passwordVariable = 'WEBCITY_SCREENSHOTS_PASSWORD';
const signedInOption = '--signed-in';
const refreshPath = '/api/auth/refresh';
const tooManyRequests = 429;
const pageTimeoutMs = 30_000;
const quickTimeoutMs = 5_000;
const usage = `npm run screenshots -- /sign-in [https://example.com] [${signedInOption}]`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const addresses = args.filter((arg) => arg !== signedInOption);
  const appPaths = addresses.filter((arg) => arg.startsWith('/'));
  const outsideAddresses = addresses.filter((arg) => /^https?:\/\//.test(arg));
  const unreadable = addresses.find(
    (arg) => !appPaths.includes(arg) && !outsideAddresses.includes(arg),
  );
  const signsIn = args.includes(signedInOption) && appPaths.length > 0;

  if (addresses.length === 0) {
    throw new Error(`Give at least one address: ${usage}`);
  }
  if (unreadable !== undefined) {
    // Git Bash turns an argument that starts with / into a Windows path before npm sees it.
    const isWindowsPath = /^[A-Za-z]:[\\/]/.test(unreadable);
    throw new Error(
      isWindowsPath
        ? `"${unreadable}" is a Windows path: Git Bash rewrote it. Run: MSYS_NO_PATHCONV=1 ${usage}`
        : `"${unreadable}" is not an address: start it with / (an app page) or https:// (an outside page).`,
    );
  }
  if (appPaths.length > 0) {
    await checkServers();
  }
  if (signsIn && existsSync(environmentFile)) {
    // Variables already set in the environment win over the file.
    process.loadEnvFile(environmentFile);
  }

  mkdirSync(outputFolder, { recursive: true });
  const browser = await chromium.launch();
  const saved: string[] = [];
  try {
    // Reduced motion, so no transition is caught halfway.
    const appPage = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
    if (signsIn) {
      await signIn(appPage);
    }
    for (const path of appPaths) {
      saved.push(...(await photographAppPath(appPage, path, signsIn)));
    }
    // A context of its own, so an outside page sees no storage or cookie from the app.
    const outsidePage = await (await browser.newContext({ reducedMotion: 'reduce' })).newPage();
    for (const address of outsideAddresses) {
      saved.push(...(await photographOutside(outsidePage, address)));
    }
  } finally {
    await browser.close();
  }

  console.log(`Saved ${saved.length} images to ${outputFolder}`);
  for (const name of saved) {
    console.log(`  ${name}`);
  }
}

// Names each server that does not answer. Any HTTP answer, even a 404, means it is running.
async function checkServers(): Promise<void> {
  // The backend serves the development certificate, which no browser trusts.
  const client = await request.newContext({ ignoreHTTPSErrors: true });
  const down = [];
  if (!(await answers(client, appOrigin))) {
    down.push(
      `The frontend is not running at ${appOrigin}. Start it with: npm start --prefix frontend`,
    );
  }
  if (!(await answers(client, backendOrigin))) {
    down.push(
      `The backend is not running at ${backendOrigin}. ` +
        'Start it with: dotnet run --project backend/aspnetproject --launch-profile https',
    );
  }
  await client.dispose();

  if (down.length > 0) {
    throw new Error(down.join('\n'));
  }
}

async function answers(client: APIRequestContext, origin: string): Promise<boolean> {
  let doesAnswer = true;
  try {
    await client.get(origin, { timeout: quickTimeoutMs, maxRedirects: 0 });
  } catch {
    doesAnswer = false;
  }
  return doesAnswer;
}

// Signs in through the app's real sign-in form, so the refresh cookie lands in the browser as it does for a
// person. The fields are found by their autocomplete values, which a sign-in form keeps for password managers.
async function signIn(page: Page): Promise<void> {
  const user = process.env[userVariable] ?? '';
  const password = process.env[passwordVariable] ?? '';
  if (user === '' || password === '') {
    throw new Error(
      `A signed-in run needs ${userVariable} and ${passwordVariable}, in the environment or in frontend/.env.`,
    );
  }

  await page.goto(appOrigin + appAddresses.signIn);
  await page.locator('input[autocomplete="username"]').fill(user);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  // Either the form navigates away or it shows its failure message; the loser of the race must not reject.
  const leftSignIn = (url: URL) => url.pathname !== appAddresses.signIn;
  const alert = page.getByRole('alert');
  await Promise.race([
    page.waitForURL(leftSignIn).catch(() => null),
    alert.waitFor().catch(() => null),
  ]);

  if (!leftSignIn(new URL(page.url()))) {
    const shown = (await alert.textContent({ timeout: 1_000 }).catch(() => null))?.trim();
    throw new Error(
      `The sign-in form refused the development account: ${shown || 'it showed no message'}`,
    );
  }
}

// Twelve images: every theme and language, each at every width. A load is needed only per theme and
// language (4 loads, each one session refresh); the widths only resize the window.
async function photographAppPath(page: Page, path: string, signedIn: boolean): Promise<string[]> {
  const saved: string[] = [];
  // Local storage belongs to an origin; a plain file stands the page on it without starting the app.
  await page.goto(appOrigin + '/favicon.ico');

  for (const theme of Object.values(Theme)) {
    for (const language of Object.values(Language)) {
      // The same stored values the theme store and the language store read at startup.
      await page.evaluate(
        ([keys, values]) => {
          localStorage.setItem(keys[0], values[0]);
          localStorage.setItem(keys[1], values[1]);
        },
        [
          [themeStorageKey, languageStorageKey],
          [theme, language],
        ],
      );
      await page.setViewportSize(viewports[0]);
      const refresh = page
        .waitForResponse((response) => new URL(response.url()).pathname === refreshPath, {
          timeout: pageTimeoutMs,
        })
        .catch(() => null);
      await page.goto(appOrigin + path, { waitUntil: 'networkidle', timeout: pageTimeoutMs });
      const refreshStatus = (await refresh)?.status();

      if (signedIn && refreshStatus !== 200) {
        throw new Error(
          refreshStatus === tooManyRequests
            ? `${path}: the backend allows 60 session refreshes per 10 minutes; wait, or photograph fewer pages.`
            : `${path} did not load signed in (session refresh: ${refreshStatus ?? 'none'}).`,
        );
      }
      const shown = await page.evaluate(() => [
        document.documentElement.dataset['theme'],
        document.documentElement.lang,
      ]);
      if (shown[0] !== theme || shown[1] !== language) {
        throw new Error(
          `${path} showed ${shown.join('/')} instead of ${theme}/${language}. Did the storage keys change?`,
        );
      }

      const state = signedIn ? 'signed-in' : 'guest';
      saved.push(
        ...(await photographWidths(
          page,
          (width) => `${fileName(path)}--${state}--${width}-${theme}-${language}`,
        )),
      );
    }
  }

  return saved;
}

async function photographOutside(page: Page, address: string): Promise<string[]> {
  await page.setViewportSize(viewports[0]);
  await page.goto(address, { waitUntil: 'load', timeout: pageTimeoutMs });
  // An outside page may keep the network busy forever (analytics, adverts), so its quiet is waited for briefly.
  await page.waitForLoadState('networkidle', { timeout: quickTimeoutMs }).catch(() => null);
  const url = new URL(address);
  return photographWidths(
    page,
    (width) => `${fileName(url.host + url.pathname + url.search)}--${width}`,
  );
}

// One full-page image per width. Widths are padded (0360), so the images of one page sort in width order.
async function photographWidths(page: Page, name: (width: string) => string): Promise<string[]> {
  const saved: string[] = [];
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    // Fonts in, and two frames drawn, so the resize has taken effect.
    await page.evaluate(async () => {
      await document.fonts.ready;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    });
    const file = `${name(String(viewport.width).padStart(4, '0'))}.png`;
    await page.screenshot({ path: outputFolder + file, fullPage: true, animations: 'disabled' });
    saved.push(file);
  }
  return saved;
}

// An address as a file name: / and other characters a Windows file name cannot hold become _; / is "home".
function fileName(address: string): string {
  const name = address.replace(/[^A-Za-z0-9.=-]+/g, '_').replace(/^_+|_+$/g, '');
  return name === '' ? 'home' : name;
}

try {
  await main();
} catch (error: unknown) {
  // A Playwright error may quote what it typed, so the credentials are hidden in every message.
  let message = error instanceof Error ? error.message : String(error);
  for (const secret of [process.env[userVariable], process.env[passwordVariable]]) {
    if (secret) {
      message = message.replaceAll(secret, '[hidden]');
    }
  }
  console.error(message);
  process.exitCode = 1;
}
