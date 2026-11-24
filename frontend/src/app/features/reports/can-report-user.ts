// Whether a profile offers Report: to a signed-in visitor on someone else's profile. The backend refuses
// a guest (401) and a report of oneself (CannotReportOneself), so the menu never offers either.
export function canReportUser(viewerId: number | null, profileUserId: number): boolean {
  const isSignedIn = viewerId !== null;

  return isSignedIn && viewerId !== profileUserId;
}
