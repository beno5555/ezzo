// Tests for reading the screenshot command's arguments, run by `npm run lint` through Node's own test runner.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readCommandLine } from './read-command-line.ts';

describe('readCommandLine', () => {
  it('sorts app addresses from outside addresses and reads the signed-in option', () => {
    const outcome = readCommandLine([
      '/',
      '--signed-in',
      'https://example.com/about',
      '/admin/users',
    ]);

    assert.deepEqual(outcome, {
      succeeded: true,
      data: {
        appPaths: ['/', '/admin/users'],
        outsideAddresses: ['https://example.com/about'],
        signedIn: true,
      },
    });
  });

  it('refuses an address that is neither a path nor an http address, and names it', () => {
    const outcome = readCommandLine(['/', 'sign-in']);

    assert.equal(outcome.succeeded, false);
    assert.match(outcome.succeeded ? '' : outcome.message, /"sign-in"/);
  });

  it('explains a path that Git Bash turned into a Windows path', () => {
    const outcome = readCommandLine(['C:/Program Files/Git/sign-in']);

    assert.equal(outcome.succeeded, false);
    assert.match(outcome.succeeded ? '' : outcome.message, /MSYS_NO_PATHCONV=1/);
  });

  it('refuses a run with no address', () => {
    const outcome = readCommandLine(['--signed-in']);

    assert.equal(outcome.succeeded, false);
  });
});
