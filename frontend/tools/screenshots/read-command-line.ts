import { type Outcome, fail, ok } from './outcome.ts';
import { screenshotMessages } from './screenshot-messages.ts';
import type { ScreenshotRequest } from './screenshot-request.ts';
import { screenshotSettings } from './screenshot-settings.ts';

const { signedInOption } = screenshotSettings;

const outsideProtocols = ['http:', 'https:'];
const windowsPath = /^[A-Za-z]:[\\/]/;

// Reads the command's arguments: app addresses (/sign-in), outside addresses (https://…) and the options.
export function readCommandLine(args: string[]): Outcome<ScreenshotRequest> {
  let outcome: Outcome<ScreenshotRequest>;
  const addresses = args.filter((arg) => arg !== signedInOption);
  const unreadable = addresses.find((address) => !isAppPath(address) && !isOutsideAddress(address));
  const hasAddress = addresses.length > 0;

  if (unreadable === undefined && hasAddress) {
    outcome = ok({
      appPaths: addresses.filter(isAppPath),
      outsideAddresses: addresses.filter(isOutsideAddress),
      signedIn: args.includes(signedInOption),
    });
  } else if (!hasAddress) {
    outcome = fail(screenshotMessages.noAddress);
  } else {
    outcome = fail(unreadableMessage(String(unreadable)));
  }

  return outcome;
}

// Git Bash rewrites an argument that starts with / into a Windows path (C:/Program Files/Git/sign-in)
// before npm sees it, so such a path is almost always an app address that was meant.
function unreadableMessage(unreadable: string): string {
  const isWindowsPath = windowsPath.test(unreadable);
  return isWindowsPath
    ? screenshotMessages.rewrittenByGitBash(unreadable)
    : screenshotMessages.notAnAddress(unreadable);
}

function isAppPath(address: string): boolean {
  return address.startsWith('/');
}

function isOutsideAddress(address: string): boolean {
  const isUrl = URL.canParse(address);
  return isUrl && outsideProtocols.includes(new URL(address).protocol);
}
