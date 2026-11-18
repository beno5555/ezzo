import { screenshotSettings } from './screenshot-settings.ts';

const usage = `npm run screenshots -- /sign-in [https://example.com] [${screenshotSettings.signedInOption}]`;
const docsPage = 'docs/agents/screenshots.md';
// How often the backend lets one machine refresh a session (RateLimitConfig, Policies.Refresh).
const refreshLimit = '60 refreshes per 10 minutes from one machine';

// Every message the screenshot command prints, in one place.
export const screenshotMessages = {
  noAddress: `Give at least one address: ${usage}`,
  notAnAddress: (argument: string) =>
    `"${argument}" is not an address. Give an app address that starts with / (such as /sign-in) ` +
    'or an outside address that starts with https://.',
  rewrittenByGitBash: (argument: string) =>
    `"${argument}" is a Windows path: Git Bash rewrote an app address that starts with /. ` +
    `Run the command as: MSYS_NO_PATHCONV=1 ${usage}`,
  frontendDown:
    `The frontend is not running at ${screenshotSettings.appOrigin}. ` +
    'Start it with: npm start --prefix frontend',
  backendDown:
    `The backend is not running at ${screenshotSettings.backendOrigin}. ` +
    'Start it with: dotnet run --project backend/aspnetproject --launch-profile https',
  missingCredentials: (variables: string[]) =>
    `A signed-in run needs ${variables.join(' and ')}. Set ${variables.length === 1 ? 'it' : 'them'} in the environment or in frontend/.env ` +
    `(${docsPage}).`,
  chromiumMissing:
    "Playwright's Chromium is not installed. " +
    'Install it with: npm exec --prefix frontend -- playwright install chromium',
  signInRefused: (shownMessage: string) =>
    `The sign-in form refused the development account: ${shownMessage === '' ? 'it showed no message' : shownMessage}`,
  settingsNotTaken: (path: string, shown: string, expected: string) =>
    `${path} showed ${shown} instead of ${expected}. Have the storage keys in theme.ts or language.ts changed?`,
  noRefresh: (path: string) =>
    `${path} did not load signed in: the app made no session refresh while it loaded.`,
  refreshLimited: (path: string) =>
    `${path} did not load signed in: the backend limits refreshes to ${refreshLimit}; ` +
    'wait a few minutes, or photograph fewer addresses.',
  refreshFailed: (path: string, status: number) =>
    `${path} did not load signed in: the session refresh answered ${status}.`,
  outsideFailed: (address: string, reason: string) => `${address} would not load: ${reason}`,
  saved: (count: number) => `Saved ${count} images to ${screenshotSettings.outputFolder}`,
} as const;
