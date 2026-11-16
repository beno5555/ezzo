import { decodeAccessToken } from './decode-access-token';
import { createAccessToken } from './testing/create-access-token';

// exp is in seconds; 1900000000 is 2030-03-17T17:46:40Z.
const exp = 1900000000;
const expiresAt = 1900000000000;

describe('decodeAccessToken', () => {
  it('reads the id, username, roles and expiry from the four claim names', () => {
    const token = createAccessToken({
      nameid: '12',
      unique_name: 'john_doe',
      role: ['User', 'Administrator'],
      exp,
    });

    expect(decodeAccessToken(token)).toEqual({
      id: 12,
      username: 'john_doe',
      roles: ['User', 'Administrator'],
      expiresAt,
    });
  });

  it('gives no roles when the role claim is missing', () => {
    const token = createAccessToken({ nameid: '12', unique_name: 'john_doe', exp });

    expect(decodeAccessToken(token)?.roles).toEqual([]);
  });

  it('gives one role when the role claim is a string', () => {
    const token = createAccessToken({ nameid: '12', unique_name: 'john_doe', role: 'User', exp });

    expect(decodeAccessToken(token)?.roles).toEqual(['User']);
  });

  it('drops a role the frontend does not know', () => {
    const token = createAccessToken({
      nameid: '12',
      unique_name: 'john_doe',
      role: ['Moderator', 'Administrator'],
      exp,
    });

    expect(decodeAccessToken(token)?.roles).toEqual(['Administrator']);
  });

  it('reads a base64url payload that holds UTF-8 text', () => {
    // Written by hand from Node's Buffer: a "_" where base64 has "/", no padding, a Georgian username.
    const payload =
      'eyJuYW1laWQiOiI3IiwidW5pcXVlX25hbWUiOiLhg5zhg5jhg5zhg51fb2s_PiIsInJvbGUiOlsiVXNlciIsIkFkbWluaXN0cmF0b3IiXSwiZXhwIjoxOTAwMDAwMDAwfQ';
    const token = `eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.${payload}.signature`;

    expect(decodeAccessToken(token)).toEqual({
      id: 7,
      username: 'ნინო_ok?>',
      roles: ['User', 'Administrator'],
      expiresAt,
    });
  });

  it.each([
    { case: 'not three segments', token: 'not-a-token' },
    { case: 'a payload that is not JSON', token: 'header.bm90IGpzb24.signature' },
    {
      case: 'a payload without the username',
      token: createAccessToken({ nameid: '12', exp }),
    },
  ])('gives null for $case', ({ token }) => {
    expect(decodeAccessToken(token)).toBeNull();
  });
});
