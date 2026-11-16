// Builds an unsigned token in the shape the backend writes, for tests. The frontend never checks the signature.
const header = { alg: 'HS512', typ: 'JWT' };

export function createAccessToken(payload: Record<string, unknown>): string {
  return `${toBase64Url(header)}.${toBase64Url(payload)}.signature`;
}

function toBase64Url(value: object): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');

  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
