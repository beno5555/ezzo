// An empty bio (or one of only spaces) is sent as none, since the backend refuses an empty one.
export function bioOrNull(bio: string): string | null {
  const hasBio = bio.trim() !== '';

  return hasBio ? bio : null;
}
