// The totals of the statistics (the backend's StatisticsTotalsDto).
export type StatisticsTotalsDto = {
  activeAccounts: number;
  deactivatedAccounts: number;
  posts: number;
  comments: number;
  messages: number;
  likes: number;
  pendingReports: number;
};
