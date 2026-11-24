import { ContentAction } from './content-action';
import { ContentItem } from './content-item';
import { ContentViewer } from './content-viewer';

// The entries a viewer's "…" menu gets on a post or a comment, each at most once, in menu order. These are
// the rules the backend enforces, so a menu never offers a button the server refuses:
//   - a guest has no menu;
//   - the author edits and deletes, and is never offered Report on their own content;
//   - the author of a post also deletes the comments under it;
//   - an administrator deletes and hides any item, or makes it visible again once it is hidden;
//   - everyone else signed in may report.
export function contentActionsOffered(viewer: ContentViewer, item: ContentItem): ContentAction[] {
  const offered: ContentAction[] = [];
  const { userId } = viewer;
  const isSignedIn = userId !== null;
  const isAuthor = isSignedIn && item.authorId === userId;
  const isPostAuthor = isSignedIn && item.postAuthorId === userId;

  const canDelete = isAuthor || isPostAuthor || viewer.isAdministrator;
  const canReport = isSignedIn && !isAuthor;

  if (isAuthor) {
    offered.push(ContentAction.Edit);
  }
  if (canDelete) {
    offered.push(ContentAction.Delete);
  }
  if (viewer.isAdministrator) {
    offered.push(item.isHidden ? ContentAction.MakeVisible : ContentAction.Hide);
  }
  if (canReport) {
    offered.push(ContentAction.Report);
  }

  return offered;
}
