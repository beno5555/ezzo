// The path as written, keeping its leading slash and percent-encoding.
export function routePath(address: string): string {
  return address.split(/[?#]/, 1)[0];
}
