// Who is looking at a post or a comment: the signed-in user's id (null for a guest) and whether they are an
// administrator.
export type ContentViewer = {
  userId: number | null;
  isAdministrator: boolean;
};
