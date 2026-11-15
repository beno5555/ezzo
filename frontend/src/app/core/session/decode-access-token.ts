import { AccessTokenClaims } from './access-token-claims';

// The short claim names .NET's JwtSecurityTokenHandler writes for the claims TokenGenerator sets (ADR 0004).
// A change to TokenGenerator must be matched here.
type AccessTokenPayload = {
  nameid?: unknown;
  unique_name?: unknown;
  role?: unknown;
  exp?: unknown;
};

const millisecondsPerSecond = 1000;
const tokenSegmentCount = 3;
const payloadSegmentIndex = 1;
const base64BlockLength = 4;

// Reads the signed-in user and the expiry from an access token, or gives null for a token it cannot read.
// It does not check the signature: the decoded values decide only what the UI shows.
export function decodeAccessToken(token: string): AccessTokenClaims | null {
  let claims: AccessTokenClaims | null = null;
  const payload = readPayload(token);

  if (payload !== null) {
    const id = Number(payload.nameid);
    const { unique_name: username, exp } = payload;

    const isComplete =
      Number.isInteger(id) && typeof username === 'string' && typeof exp === 'number';
    if (isComplete) {
      claims = {
        id,
        username,
        roles: toRoles(payload.role),
        expiresAt: exp * millisecondsPerSecond,
      };
    }
  }

  return claims;
}

function readPayload(token: string): AccessTokenPayload | null {
  let payload: AccessTokenPayload | null = null;
  const segments = token.split('.');

  const hasAllSegments = segments.length === tokenSegmentCount;
  if (hasAllSegments) {
    const parsed = parsePayloadSegment(segments[payloadSegmentIndex]);
    const isObject = typeof parsed === 'object' && parsed !== null;
    if (isObject) {
      payload = parsed;
    }
  }

  return payload;
}

// A role claim is missing when the user has no role, a string when there is one, an array when there are more.
function toRoles(role: unknown): string[] {
  let roles: string[] = [];

  if (typeof role === 'string') {
    roles = [role];
  } else if (Array.isArray(role)) {
    roles = role.filter((entry): entry is string => typeof entry === 'string');
  }

  return roles;
}

// atob throws on characters outside base64, and JSON.parse on text that is not JSON. For a malformed token
// both are expected inputs here, not bugs, so either gives null.
function parsePayloadSegment(segment: string): unknown {
  let parsed: unknown;

  try {
    parsed = JSON.parse(fromBase64Url(segment));
  } catch {
    parsed = null;
  }

  return parsed;
}

// base64url uses "-" and "_" and drops the padding; atob needs neither. The bytes are UTF-8.
function fromBase64Url(segment: string): string {
  const base64 = segment.replaceAll('-', '+').replaceAll('_', '/');
  const padded = base64.padEnd(
    Math.ceil(base64.length / base64BlockLength) * base64BlockLength,
    '=',
  );
  const bytes = Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}
