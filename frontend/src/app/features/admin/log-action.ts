// The action of a log row, written "{Service}.{Method}" (such as "FriendshipService.SendRequestAsync"),
// split so that a table can show the method as the headline and the service under it.
export interface LogAction {
  // The part before the last dot; null for an action written without one.
  service: string | null;
  method: string;
}

export function splitLogAction(action: string): LogAction {
  const dot = action.lastIndexOf('.');
  const hasService = dot > 0 && dot < action.length - 1;

  return hasService
    ? { service: action.slice(0, dot), method: action.slice(dot + 1) }
    : { service: null, method: action };
}
