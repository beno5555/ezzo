// Which way a paged list grows: downward, with the next page below (a feed), or upward, with the next page
// above (a chat's history, whose older messages load as the reader scrolls up).
export const SentinelSide = { Below: 'below', Above: 'above' } as const;
export type SentinelSide = (typeof SentinelSide)[keyof typeof SentinelSide];
