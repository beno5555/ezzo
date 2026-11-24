// A row of the log as the administrator's read returns it (the backend's LogDisplayDto). createdAt is a UTC
// ISO string. userId is null for a request nobody was signed in for; details, entityId and entityName are
// null where the action has none.
export type LogDisplayDto = {
  id: number;
  createdAt: string;
  authorizedRequest: boolean;
  userId: number | null;
  action: string;
  succeeded: boolean;
  details: string | null;
  entityId: number | null;
  entityName: string | null;
};
