// A copy of the set of ids without one id. A signal holding a set is replaced, never changed in place.
export function withoutId(ids: ReadonlySet<number>, id: number): ReadonlySet<number> {
  const rest = new Set(ids);
  rest.delete(id);

  return rest;
}
