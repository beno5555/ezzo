import { join } from 'node:path';
import type { Page } from 'playwright';
import { screenshotSettings } from './screenshot-settings.ts';
import { settle } from './settle.ts';

// Photographs the loaded page at each of the three widths: resizing does not reload it, so a width costs
// no new request. Resolves to the names of the saved images, each given by imageName.
export async function photographWidths(
  page: Page,
  imageName: (width: number) => string,
): Promise<string[]> {
  const names: string[] = [];

  for (const viewport of screenshotSettings.viewports) {
    await page.setViewportSize(viewport);
    await settle(page);
    const name = imageName(viewport.width);
    await page.screenshot({
      path: join(screenshotSettings.outputFolder, name),
      fullPage: true,
      animations: 'disabled',
    });
    names.push(name);
  }

  return names;
}

// Every page is loaded at the first width, then resized to the others.
export async function useFirstWidth(page: Page): Promise<void> {
  const [firstViewport] = screenshotSettings.viewports;
  await page.setViewportSize(firstViewport);
}
