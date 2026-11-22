import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { english } from '../../core/languages/english';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostApi } from './post-api';
import { PostEditStore } from './post-edit-store';
import { StandardPostDisplayDto } from './standard-post-display-dto';

const post: StandardPostDisplayDto = {
  id: 12,
  title: 'Sunday at the lake',
  author: { id: 7, username: 'john_doe' },
  postContent: 'Cold water.',
  uploadedAt: '2026-11-21T10:00:00Z',
  images: [],
  likeCount: 0,
  commentCount: 0,
  likedByCaller: false,
  isHidden: false,
};
const written = { title: 'Monday at the lake', content: 'Warmer.' };
const serverCopy: StandardPostDisplayDto = {
  ...post,
  title: written.title,
  postContent: written.content,
};
const refusal = fail<never>('The title is too long.', 400);

// A PostApi whose answers the test gives one at a time, and a record of what it was asked.
function createPostApi() {
  const edits: { id: number; title: string; content: string }[] = [];
  const deletions: number[] = [];
  const editAnswers: ((result: AppResult<StandardPostDisplayDto>) => void)[] = [];
  const deleteAnswers: ((result: AppResult<void>) => void)[] = [];

  return {
    edits,
    deletions,
    edit: (id: number, change: { title: string; content: string }) =>
      new Promise<AppResult<StandardPostDisplayDto>>((resolve) => {
        edits.push({ id, ...change });
        editAnswers.push(resolve);
      }),
    delete: (id: number) =>
      new Promise<AppResult<void>>((resolve) => {
        deletions.push(id);
        deleteAnswers.push(resolve);
      }),
    answerEdit: (result: AppResult<StandardPostDisplayDto>) => editAnswers.shift()?.(result),
    answerDelete: (result: AppResult<void>) => deleteAnswers.shift()?.(result),
  };
}

describe('PostEditStore', () => {
  let store: PostEditStore;
  let toastStore: ToastStore;
  let postApi: ReturnType<typeof createPostApi>;
  let isDeletionConfirmed: boolean;
  let saved: StandardPostDisplayDto[];

  const toasts = () =>
    toastStore.visible().map((toast) => ({ text: toast.message, link: toast.link }));

  beforeEach(() => {
    vi.useFakeTimers();
    postApi = createPostApi();
    isDeletionConfirmed = true;
    saved = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: PostApi, useValue: postApi },
        { provide: ConfirmationOpener, useValue: { ask: async () => isDeletionConfirmed } },
      ],
    });
    store = TestBed.inject(PostEditStore);
    store.onSaved((copy) => saved.push(copy));
    toastStore = TestBed.inject(ToastStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('edit', () => {
    it('shows the post at once with the new title and text, marked as saving, under the uploading toast', () => {
      void store.edit(post, written);

      expect(store.isSaving(post.id)).toBe(true);
      expect(store.pendingEdit(post.id)).toEqual(serverCopy);
      expect(toasts()).toEqual([{ text: english.posts.composer.uploadingToast, link: null }]);
      expect(postApi.edits).toEqual([{ id: post.id, ...written }]);
    });

    it('hands the server copy to the pages listening, and the saved toast leads to the post', async () => {
      const done = store.edit(post, written);

      postApi.answerEdit(ok({ ...serverCopy, title: 'Monday at the lake (server)' }));
      await done;

      expect(store.isSaving(post.id)).toBe(false);
      expect(store.pendingEdit(post.id)).toBeNull();
      expect(saved).toEqual([{ ...serverCopy, title: 'Monday at the lake (server)' }]);
      expect(toasts()).toEqual([{ text: english.posts.edit.savedToast, link: '/posts/12' }]);
    });

    it('on a refusal stops showing the edit, and the toast gives the reason and leads to the edit page', async () => {
      const done = store.edit(post, written);

      postApi.answerEdit(refusal);
      await done;

      expect(store.pendingEdit(post.id)).toBeNull();
      expect(saved).toEqual([]);
      expect(toasts()).toEqual([{ text: 'The title is too long.', link: '/posts/12/edit' }]);
    });

    it('keeps what the author wrote after a refusal for the edit page to take once', async () => {
      const done = store.edit(post, written);

      postApi.answerEdit(refusal);
      await done;

      expect(store.takeReturnedEdit(post.id)).toEqual(written);
      expect(store.takeReturnedEdit(post.id)).toBeNull();
    });

    it('forgets what the author wrote once the edit page is left', async () => {
      const done = store.edit(post, written);

      postApi.answerEdit(refusal);
      await done;
      store.discardReturnedEdit(post.id);

      expect(store.takeReturnedEdit(post.id)).toBeNull();
    });

    it('keeps nothing for a successful edit', async () => {
      const done = store.edit(post, written);

      postApi.answerEdit(ok(serverCopy));
      await done;

      expect(store.takeReturnedEdit(post.id)).toBeNull();
    });

    it('ignores a second edit of a post whose edit is on its way', () => {
      void store.edit(post, written);
      void store.edit(post, { title: 'Another', content: 'One.' });

      expect(postApi.edits).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('does nothing when the author says no', async () => {
      isDeletionConfirmed = false;

      await store.delete(post);

      expect(postApi.deletions).toEqual([]);
      expect(store.isDeleting(post.id)).toBe(false);
      expect(store.isDeleted(post.id)).toBe(false);
    });

    it('fades the card first, then leaves it out of the lists and tells the page', async () => {
      const whenGone = vi.fn();

      void store.delete(post, whenGone);
      await vi.advanceTimersByTimeAsync(0);

      expect(store.isDeleting(post.id)).toBe(true);
      expect(store.isDeleted(post.id)).toBe(false);
      expect(whenGone).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(200);

      expect(store.isDeleting(post.id)).toBe(false);
      expect(store.isDeleted(post.id)).toBe(true);
      expect(whenGone).toHaveBeenCalledOnce();
      expect(postApi.deletions).toEqual([post.id]);
    });

    it('says the post is deleted once the server has deleted it', async () => {
      const done = store.delete(post);

      await vi.advanceTimersByTimeAsync(200);
      postApi.answerDelete(ok(undefined));
      await done;

      expect(store.isDeleted(post.id)).toBe(true);
      expect(toasts()).toEqual([{ text: english.posts.deletedToast, link: null }]);
    });

    it('brings the post back, with the reason, when the server refuses', async () => {
      const done = store.delete(post);

      await vi.advanceTimersByTimeAsync(200);
      postApi.answerDelete(fail<void>('You cannot delete this post.', 403));
      await done;

      expect(store.isDeleted(post.id)).toBe(false);
      expect(toasts()).toEqual([{ text: 'You cannot delete this post.', link: null }]);
    });

    it('ignores a second deletion of a post that is already going', async () => {
      void store.delete(post);
      await vi.advanceTimersByTimeAsync(0);
      void store.delete(post);
      await vi.advanceTimersByTimeAsync(200);

      expect(postApi.deletions).toEqual([post.id]);
    });
  });
});
