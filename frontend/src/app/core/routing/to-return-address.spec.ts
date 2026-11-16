import { toReturnAddress } from './to-return-address';

describe('toReturnAddress', () => {
  it.each(['/admin/logs', '/messages/john_doe?draft=1', '/posts/7#comment-3', '/'])(
    'accepts the address inside the app %s',
    (wanted) => {
      expect(toReturnAddress(wanted)).toBe(wanted);
    },
  );

  it.each([
    { case: 'another site', wanted: 'https://evil.example/sign-in' },
    { case: 'a protocol-relative address', wanted: '//evil.example/sign-in' },
    { case: 'a backslash the parser reads as a slash', wanted: '/\\evil.example' },
    { case: 'a script address', wanted: 'javascript:alert(1)' },
    { case: 'a relative path', wanted: 'admin/logs' },
    { case: 'an empty value', wanted: '' },
    { case: 'no value', wanted: undefined },
  ])('refuses $case and gives the home address', ({ wanted }) => {
    expect(toReturnAddress(wanted)).toBe('/');
  });
});
