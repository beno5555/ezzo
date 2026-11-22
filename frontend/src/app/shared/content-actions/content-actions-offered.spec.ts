import { ContentAction } from './content-action';
import { contentActionsOffered } from './content-actions-offered';
import { ContentItem } from './content-item';
import { ContentViewer } from './content-viewer';

const guest: ContentViewer = { userId: null, isAdministrator: false };
const user: ContentViewer = { userId: 1, isAdministrator: false };
const administrator: ContentViewer = { userId: 9, isAdministrator: true };

const authorId = 2;
const postAuthorId = 3;

// A post, and a comment under someone else's post: the two shapes the menu is built for.
const post = (overrides: Partial<ContentItem> = {}): ContentItem => ({
  authorId,
  isHidden: false,
  postAuthorId: null,
  ...overrides,
});
const comment = (overrides: Partial<ContentItem> = {}): ContentItem => ({
  authorId,
  isHidden: false,
  postAuthorId,
  ...overrides,
});

describe('contentActionsOffered', () => {
  describe.each([
    ['a post', post],
    ['a comment', comment],
  ])('on %s', (_name, make) => {
    describe.each([false, true])('hidden: %s', (isHidden) => {
      const item = make({ isHidden });
      const hideOrShow = isHidden ? ContentAction.MakeVisible : ContentAction.Hide;

      it('offers a guest nothing', () => {
        expect(contentActionsOffered(guest, item)).toEqual([]);
      });

      it('offers a user who is not the author Report', () => {
        expect(contentActionsOffered(user, item)).toEqual([ContentAction.Report]);
      });

      it('offers the author Edit and Delete, and no Report', () => {
        const viewer = { ...user, userId: authorId };

        expect(contentActionsOffered(viewer, item)).toEqual([
          ContentAction.Edit,
          ContentAction.Delete,
        ]);
      });

      it('offers an administrator Delete, Hide or Make visible, and Report', () => {
        expect(contentActionsOffered(administrator, item)).toEqual([
          ContentAction.Delete,
          hideOrShow,
          ContentAction.Report,
        ]);
      });

      it('offers an administrator who is the author Edit, Delete and Hide or Make visible, and no Report', () => {
        const viewer = { ...administrator, userId: authorId };

        expect(contentActionsOffered(viewer, item)).toEqual([
          ContentAction.Edit,
          ContentAction.Delete,
          hideOrShow,
        ]);
      });
    });
  });

  describe.each([false, true])(
    'on a comment under the viewer’s own post, hidden: %s',
    (isHidden) => {
      const item = comment({ isHidden });
      const viewer = { ...user, userId: postAuthorId };
      const hideOrShow = isHidden ? ContentAction.MakeVisible : ContentAction.Hide;

      it('offers the post’s author Delete and Report', () => {
        expect(contentActionsOffered(viewer, item)).toEqual([
          ContentAction.Delete,
          ContentAction.Report,
        ]);
      });

      it('offers an administrator who is the post’s author each entry once', () => {
        expect(contentActionsOffered({ ...viewer, isAdministrator: true }, item)).toEqual([
          ContentAction.Delete,
          hideOrShow,
          ContentAction.Report,
        ]);
      });

      it('offers the comment’s author who is also the post’s author Edit and Delete only', () => {
        const own = comment({ authorId: postAuthorId, isHidden });

        expect(contentActionsOffered(viewer, own)).toEqual([
          ContentAction.Edit,
          ContentAction.Delete,
        ]);
      });
    },
  );

  it('offers Report on content of an unavailable account, which is nobody’s own', () => {
    expect(contentActionsOffered(user, post({ authorId: null }))).toEqual([ContentAction.Report]);
  });

  it('offers a guest nothing on a comment under a post whose author is unavailable', () => {
    expect(contentActionsOffered(guest, comment({ postAuthorId: null }))).toEqual([]);
  });
});
