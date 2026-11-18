import { type APIRequestContext, request } from 'playwright';
import { type Outcome, fail, ok } from './outcome.ts';
import { screenshotMessages } from './screenshot-messages.ts';
import { screenshotSettings } from './screenshot-settings.ts';

// Confirms the frontend and the backend both answer, and names each one that does not.
export async function checkServers(): Promise<Outcome<void>> {
  let outcome: Outcome<void>;
  // The backend serves the development certificate, which no browser trusts.
  const client = await request.newContext({ ignoreHTTPSErrors: true });

  const frontendAnswers = await answers(client, screenshotSettings.appOrigin);
  const backendAnswers = await answers(client, screenshotSettings.backendOrigin);
  await client.dispose();

  if (frontendAnswers && backendAnswers) {
    outcome = ok(undefined);
  } else {
    const missing = [
      frontendAnswers ? null : screenshotMessages.frontendDown,
      backendAnswers ? null : screenshotMessages.backendDown,
    ].filter((line) => line !== null);
    outcome = fail(missing.join('\n'));
  }

  return outcome;
}

// Any HTTP answer, even a 404, means a server is listening; only a refused or timed-out connection does not.
async function answers(client: APIRequestContext, origin: string): Promise<boolean> {
  let doesAnswer: boolean;

  try {
    await client.get(origin, { timeout: screenshotSettings.serverCheckTimeoutMs, maxRedirects: 0 });
    doesAnswer = true;
  } catch {
    doesAnswer = false;
  }

  return doesAnswer;
}
