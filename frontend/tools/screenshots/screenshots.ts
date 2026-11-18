// The screenshot command (docs/agents/screenshots.md). From frontend/:
//   npm run screenshots -- / /sign-in               the app as a guest: twelve images per address
//   npm run screenshots -- /admin/users --signed-in  signed in as the development account
//   npm run screenshots -- https://example.com       an outside address: three images
// main is the boundary of the tool, so it may return early, like a controller.
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { type Browser, chromium } from 'playwright';
import type { LoginDto } from '../../src/app/features/auth/login-dto.ts';
import { checkServers } from './check-servers.ts';
import { errorText } from './error-text.ts';
import { type Outcome, fail, ok } from './outcome.ts';
import { photographApp } from './photograph-app.ts';
import { photographOutside } from './photograph-outside.ts';
import { readCommandLine } from './read-command-line.ts';
import { readCredentials } from './read-credentials.ts';
import type { ScreenshotRequest } from './screenshot-request.ts';
import type { ScreenshotRun } from './screenshot-run.ts';
import { screenshotMessages } from './screenshot-messages.ts';
import { screenshotSettings } from './screenshot-settings.ts';
import { signIn } from './sign-in.ts';

// What replaces a credential that turns up in any message this command prints.
const redaction = '[hidden]';

async function main(): Promise<void> {
  const prepared = await prepareRun(process.argv.slice(2));

  if (prepared.succeeded) {
    const photographed = await photograph(prepared.data);
    if (photographed.succeeded) {
      return report(photographed.data);
    }

    return stop(photographed.message, prepared.data.credentials);
  }

  stop(prepared.message);
}

// Reads the command line, then checks that the servers answer and that a signed-in run has its credentials.
async function prepareRun(args: string[]): Promise<Outcome<ScreenshotRun>> {
  let outcome: Outcome<ScreenshotRun>;
  const commandLine = readCommandLine(args);

  if (commandLine.succeeded) {
    const request = commandLine.data;
    const photographsApp = request.appPaths.length > 0;
    const servers = photographsApp ? await checkServers() : ok(undefined);

    if (servers.succeeded) {
      const credentials = readRunCredentials(request);
      outcome = credentials.succeeded
        ? ok({ ...request, credentials: credentials.data })
        : fail(credentials.message);
    } else {
      outcome = fail(servers.message);
    }
  } else {
    outcome = fail(commandLine.message);
  }

  return outcome;
}

// The development account for a signed-in run of app addresses; null when the run signs in to nothing.
function readRunCredentials(request: ScreenshotRequest): Outcome<LoginDto | null> {
  let outcome: Outcome<LoginDto | null>;
  const signsIn = request.signedIn && request.appPaths.length > 0;

  if (signsIn) {
    // Variables already set in the environment win over the file.
    if (existsSync(screenshotSettings.environmentFile)) {
      process.loadEnvFile(screenshotSettings.environmentFile);
    }
    outcome = readCredentials(process.env);
  } else {
    outcome = ok(null);
  }

  return outcome;
}

// Takes every image the run asks for. Resolves to their names, or to the first failure; an unexpected error
// from Playwright becomes a failure too, so that main can hide any credential it quotes.
async function photograph(run: ScreenshotRun): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]>;
  const browser = await launchBrowser();

  if (browser !== null) {
    try {
      await mkdir(screenshotSettings.outputFolder, { recursive: true });
      const app = await photographAppPaths(browser, run);
      if (app.succeeded) {
        const outside = await photographOutsideAddresses(browser, run.outsideAddresses);
        outcome = outside.succeeded ? ok([...app.data, ...outside.data]) : outside;
      } else {
        outcome = app;
      }
    } catch (error: unknown) {
      outcome = fail(errorText(error));
    } finally {
      await browser.close();
    }
  } else {
    outcome = fail(screenshotMessages.chromiumMissing);
  }

  return outcome;
}

// One context for all app addresses: it holds the refresh cookie, so the sign-in survives between pages.
async function photographAppPaths(
  browser: Browser,
  run: ScreenshotRun,
): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]> = ok([]);
  const photographsApp = run.appPaths.length > 0;

  if (photographsApp) {
    const context = await browser.newContext(screenshotSettings.contextOptions);
    const page = await context.newPage();
    const signsIn = run.credentials !== null;
    const session = run.credentials === null ? ok(undefined) : await signIn(page, run.credentials);

    outcome = session.succeeded
      ? await photographApp(page, run.appPaths, signsIn)
      : fail(session.message);
    await context.close();
  }

  return outcome;
}

// A context of its own, so an outside page sees no storage or cookie from the app.
async function photographOutsideAddresses(
  browser: Browser,
  addresses: string[],
): Promise<Outcome<string[]>> {
  let outcome: Outcome<string[]> = ok([]);
  const hasOutsideAddresses = addresses.length > 0;

  if (hasOutsideAddresses) {
    const context = await browser.newContext(screenshotSettings.contextOptions);
    outcome = await photographOutside(await context.newPage(), addresses);
    await context.close();
  }

  return outcome;
}

async function launchBrowser(): Promise<Browser | null> {
  let browser: Browser | null = null;

  try {
    // Playwright's own Chromium, never the Chrome the owner browses with.
    browser = await chromium.launch();
  } catch (error: unknown) {
    const isMissingBrowser = errorText(error).includes("Executable doesn't exist");
    if (!isMissingBrowser) {
      throw error;
    }
  }

  return browser;
}

function report(names: string[]): void {
  console.log(screenshotMessages.saved(names.length));
  for (const name of names) {
    console.log(`  ${name}`);
  }
}

// Ends the run with a message and a failing exit code. Any credential in the message is hidden, because an
// unexpected error from Playwright may quote what it was doing.
function stop(message: string, credentials: LoginDto | null = null): void {
  const secrets = credentials === null ? [] : [credentials.password, credentials.uniqueIdentifier];
  const safeMessage = secrets.reduce((text, secret) => text.replaceAll(secret, redaction), message);
  console.error(safeMessage);
  process.exitCode = 1;
}

await main();
