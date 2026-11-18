import type { Page } from 'playwright';

// Waits until the fonts are in and the page has drawn twice, so a resize has taken effect before a photo.
export async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}
