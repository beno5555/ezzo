import type { Page } from 'playwright';
import { languageStorageKey } from '../../src/app/core/languages/language.ts';
import { themeStorageKey } from '../../src/app/core/themes/theme.ts';
import type { AppLoad } from './app-load.ts';
import { appImageName } from './image-name.ts';
import { type Outcome, fail, ok } from './outcome.ts';
import { photographWidths, useFirstWidth } from './photograph-widths.ts';
import { screenshotMessages } from './screenshot-messages.ts';
import { screenshotSettings } from './screenshot-settings.ts';

const okStatus = 200;
const tooManyRequestsStatus = 429;

// Photographs every app address at every width, theme and language: twelve images per address. Resolves
// to the names of the saved images, or to the first failure.
export async function photographApp(
  page: Page,
  paths: string[],
  signedIn: boolean,
): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]> = ok([]);
  const loads: AppLoad[] = paths.flatMap((path) =>
    screenshotSettings.themes.flatMap((theme) =>
      screenshotSettings.languages.map((language) => ({ path, signedIn, theme, language })),
    ),
  );

  await openAppOrigin(page);
  for (const load of loads) {
    if (outcome.succeeded) {
      const photographed = await photographLoad(page, load);
      outcome = photographed.succeeded ? ok([...outcome.data, ...photographed.data]) : photographed;
    }
  }

  return outcome;
}

// Local storage belongs to an origin, so the page must stand on the app's origin before the first load.
// A file that does not start the app costs no session refresh.
async function openAppOrigin(page: Page): Promise<void> {
  const isOnAppOrigin = new URL(page.url()).origin === screenshotSettings.appOrigin;

  if (!isOnAppOrigin) {
    await page.goto(screenshotSettings.appOrigin + screenshotSettings.quietAppFile);
  }
}

async function photographLoad(page: Page, load: AppLoad): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]>;

  await useFirstWidth(page);
  // The same stored values ThemeStore and LanguageStore read at startup, written as their setters write them.
  await page.evaluate(
    ([keys, values]) => {
      localStorage.setItem(keys[0], values[0]);
      localStorage.setItem(keys[1], values[1]);
    },
    [
      [themeStorageKey, languageStorageKey],
      [load.theme, load.language],
    ],
  );

  const refresh = page
    .waitForResponse(
      (response) => new URL(response.url()).pathname === screenshotSettings.refreshPath,
      { timeout: screenshotSettings.pageLoadTimeoutMs },
    )
    .catch(() => null);
  await page.goto(screenshotSettings.appOrigin + load.path, {
    waitUntil: 'networkidle',
    timeout: screenshotSettings.pageLoadTimeoutMs,
  });
  const refreshStatus = (await refresh)?.status() ?? null;

  const marker = await page.evaluate(() => ({
    theme: document.documentElement.dataset['theme'],
    language: document.documentElement.lang,
  }));
  const tookSettings = marker.theme === load.theme && marker.language === load.language;
  const isSessionRestored = !load.signedIn || refreshStatus === okStatus;

  if (tookSettings && isSessionRestored) {
    outcome = ok(await photographWidths(page, (width) => appImageName({ ...load, width })));
  } else if (!tookSettings) {
    outcome = fail(
      screenshotMessages.settingsNotTaken(
        load.path,
        `theme "${marker.theme}" and language "${marker.language}"`,
        `"${load.theme}" and "${load.language}"`,
      ),
    );
  } else {
    outcome = fail(sessionFailure(load.path, refreshStatus));
  }

  return outcome;
}

function sessionFailure(path: string, refreshStatus: number | null): string {
  let message: string;
  const madeNoRefresh = refreshStatus === null;
  const wasRateLimited = refreshStatus === tooManyRequestsStatus;

  if (madeNoRefresh) {
    message = screenshotMessages.noRefresh(path);
  } else if (wasRateLimited) {
    message = screenshotMessages.refreshLimited(path);
  } else {
    message = screenshotMessages.refreshFailed(path, refreshStatus);
  }

  return message;
}
