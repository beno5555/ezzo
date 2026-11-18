import type { LoginDto } from '../../src/app/features/auth/login-dto.ts';
import { type Outcome, fail, ok } from './outcome.ts';
import { screenshotMessages } from './screenshot-messages.ts';

// Where a signed-in run finds the development account: in the environment, or in the gitignored frontend/.env.
export const credentialVariables = {
  uniqueIdentifier: 'WEBCITY_SCREENSHOTS_USER',
  password: 'WEBCITY_SCREENSHOTS_PASSWORD',
} as const;

// The development account's username (or email) and password. A message names a missing variable, never a value.
export function readCredentials(environment: NodeJS.ProcessEnv): Outcome<LoginDto> {
  let outcome: Outcome<LoginDto>;
  const uniqueIdentifier = environment[credentialVariables.uniqueIdentifier] ?? '';
  const password = environment[credentialVariables.password] ?? '';
  const missing = [
    uniqueIdentifier === '' ? credentialVariables.uniqueIdentifier : null,
    password === '' ? credentialVariables.password : null,
  ].filter((variable) => variable !== null);

  const hasBoth = missing.length === 0;

  if (hasBoth) {
    outcome = ok({ uniqueIdentifier, password });
  } else {
    outcome = fail(screenshotMessages.missingCredentials(missing));
  }

  return outcome;
}
