import type { Page } from 'playwright';
import type { LoginDto } from '../../src/app/features/auth/login-dto.ts';
import { type Outcome, fail, ok } from './outcome.ts';
import { screenshotMessages } from './screenshot-messages.ts';
import { screenshotSettings } from './screenshot-settings.ts';

// The failure message is already shown when it is read, so reading it needs no long wait.
const shownMessageTimeoutMs = 1_000;

// Signs in through the app's own sign-in form, so the refresh cookie lands in the browser context exactly
// as it does for a person; every later page load in that context restores the session from it.
// The fields are found by their autocomplete values, which any sign-in form keeps for password managers.
export async function signIn(page: Page, credentials: LoginDto): Promise<Outcome<void>> {
  let outcome: Outcome<void>;
  const failureMessage = page.getByRole('alert');

  await page.goto(screenshotSettings.appOrigin + screenshotSettings.signInPath);
  await page.locator('input[autocomplete="username"]').fill(credentials.uniqueIdentifier);
  await page.locator('input[autocomplete="current-password"]').fill(credentials.password);
  await page.locator('form button[type="submit"]').click();

  // The form either navigates away or shows its failure message. The wait that loses the race goes on
  // until it times out or the browser closes, so each one handles its own rejection: an unhandled one
  // would end the whole command.
  await Promise.race([
    page.waitForURL((url) => url.pathname !== screenshotSettings.signInPath).catch(() => undefined),
    failureMessage.waitFor().catch(() => undefined),
  ]);
  const isSignedIn = new URL(page.url()).pathname !== screenshotSettings.signInPath;

  if (isSignedIn) {
    outcome = ok(undefined);
  } else {
    const shownMessage =
      (await failureMessage.textContent({ timeout: shownMessageTimeoutMs }).catch(() => null)) ??
      '';
    outcome = fail(screenshotMessages.signInRefused(shownMessage.trim()));
  }

  return outcome;
}
