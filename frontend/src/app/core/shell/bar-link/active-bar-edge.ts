// The edge of a bar link that carries the bar marking the page the visitor is on: the bottom edge in
// the top bar, the top edge in the phone's bottom bar (where the bar meets the page), the start edge in
// a vertical list such as the admin panel's navigation.
export const ActiveBarEdge = { Bottom: 'bottom', Top: 'top', Start: 'start' } as const;
export type ActiveBarEdge = (typeof ActiveBarEdge)[keyof typeof ActiveBarEdge];
