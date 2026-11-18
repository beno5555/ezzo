import type { Page } from 'playwright';
import { errorText } from './error-text.ts';
import { outsideImageName } from './image-name.ts';
import { type Outcome, fail, ok } from './outcome.ts';
import { photographWidths, useFirstWidth } from './photograph-widths.ts';
import { screenshotMessages } from './screenshot-messages.ts';
import { screenshotSettings } from './screenshot-settings.ts';

// An outside page may keep the network busy forever (analytics, adverts), so its quiet is waited for briefly.
const outsideQuietTimeoutMs = 5_000;

// Photographs outside public addresses (reference sites) at the three widths, with no theme or language.
// Resolves to the names of the saved images, or to the first address that would not load.
export async function photographOutside(
  page: Page,
  addresses: string[],
): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]> = ok([]);

  for (const address of addresses) {
    if (outcome.succeeded) {
      const photographed = await photographAddress(page, address);
      outcome = photographed.succeeded ? ok([...outcome.data, ...photographed.data]) : photographed;
    }
  }

  return outcome;
}

async function photographAddress(page: Page, address: string): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]>;
  let loadFailure: string | null = null;

  await useFirstWidth(page);
  try {
    await page.goto(address, { waitUntil: 'load', timeout: screenshotSettings.pageLoadTimeoutMs });
  } catch (error: unknown) {
    loadFailure = errorText(error);
  }
  const hasLoaded = loadFailure === null;

  if (hasLoaded) {
    await waitForQuiet(page);
    outcome = ok(await photographWidths(page, (width) => outsideImageName(address, width)));
  } else {
    outcome = fail(screenshotMessages.outsideFailed(address, String(loadFailure)));
  }

  return outcome;
}

// Gives the page a moment to finish loading images and fonts; a page that never goes quiet is photographed anyway.
async function waitForQuiet(page: Page): Promise<void> {
  try {
    await page.waitForLoadState('networkidle', { timeout: outsideQuietTimeoutMs });
  } catch {
    // Still busy: photograph it as it is.
  }
}
