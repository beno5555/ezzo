// What the logs table is filtered by (the backend's LogQueryDto). A filter left out matches every row, and
// the ones set combine with AND. action matches any part of the action's name and entityName is exact.
// from and to are UTC ISO strings, both inclusive.
export type LogFilter = {
  userId?: number;
  authorizedRequest?: boolean;
  succeeded?: boolean;
  action?: string;
  entityName?: string;
  entityId?: number;
  from?: string;
  to?: string;
};
