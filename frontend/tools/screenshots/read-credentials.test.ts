// Tests for reading the development account's credentials, run by `npm run lint` through Node's own test runner.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readCredentials } from './read-credentials.ts';

describe('readCredentials', () => {
  it('reads the account and the password from the environment', () => {
    const outcome = readCredentials({
      WEBCITY_SCREENSHOTS_USER: 'dev.account',
      WEBCITY_SCREENSHOTS_PASSWORD: 'correct horse',
    });

    assert.deepEqual(outcome, {
      succeeded: true,
      data: { uniqueIdentifier: 'dev.account', password: 'correct horse' },
    });
  });

  it('names the missing variable and never shows a value', () => {
    const outcome = readCredentials({ WEBCITY_SCREENSHOTS_USER: 'dev.account' });
    const message = outcome.succeeded ? '' : outcome.message;

    assert.equal(outcome.succeeded, false);
    assert.match(message, /WEBCITY_SCREENSHOTS_PASSWORD/);
    assert.doesNotMatch(message, /dev\.account/);
  });
});
