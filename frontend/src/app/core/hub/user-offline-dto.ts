// The payload of UserOffline: an anonymous object in PresenceService, sent to each accepted friend.
export type UserOfflineDto = {
  userId: number;
  lastActiveAt: string;
};
