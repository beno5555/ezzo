import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { english } from '../../core/languages/english';
import { SessionStore } from '../../core/session/session-store';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import {
  deleteFadeMilliseconds,
  deleteNoticeMinimumMilliseconds,
} from '../../shared/fade-out/delete-fade';
import { ToastStore } from '../../shared/toasts/toast-store';
import { CommentApi } from './comment-api';
import { CommentThreadStore } from './comment-thread-store';
import { FullCommentDto } from './full-comment-dto';
import { StandardCommentDto } from './standard-comment-dto';

// How long a deletion takes when the server answers at once: the notice's minimum, then the fade.
const settleMilliseconds = deleteNoticeMinimumMilliseconds + deleteFadeMilliseconds;
const postId = 3;
const me = { id: 7, username: 'john_doe', roles: [] };

const comment = (id: number, content = `comment ${id}`): StandardCommentDto => ({
  id,
  content,
  author: { id: 8, username: 'jane_roe' },
  uploadedAt: '2026-11-19T09:00:00Z',
  isHidden: false,
});

const fullComment = (id: number, content: string): FullCommentDto => ({
  ...comment(id, content),
  author: { id: me.id, username: me.username },
  postId,
  lastUpdatedAt: null,
});

// A call whose answer the test gives when it chooses.
function deferred<T>() {
  let resolve!: (value: AppResult<T>) => void;
  const promise = new Promise<AppResult<T>>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

describe('CommentThreadStore', () => {
  let thread: CommentThreadStore;
  let commentApi: {
    getByPost: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    edit: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let confirmationOpener: { ask: ReturnType<typeof vi.fn> };
  let countChanges: number[];

  const shownTexts = () => thread.shown().map((shown) => shown.comment.content);
  const countNow = () => countChanges.reduce((sum, change) => sum + change, 0);
  const toastMessages = () =>
    TestBed.inject(ToastStore)
      .visible()
      .map((toast) => toast.message);

  async function loadComments(...comments: StandardCommentDto[]): Promise<void> {
    commentApi.getByPost.mockResolvedValue(ok(comments));
    await thread.list.loadNext();
  }

  beforeEach(() => {
    vi.useFakeTimers();
    commentApi = {
      getByPost: vi.fn(),
      create: vi.fn(),
      edit: vi.fn(),
      delete: vi.fn(),
    };
    confirmationOpener = { ask: vi.fn().mockResolvedValue(true) };
    countChanges = [];
    TestBed.configureTestingModule({
      providers: [
        CommentThreadStore,
        { provide: CommentApi, useValue: commentApi },
        { provide: ConfirmationOpener, useValue: confirmationOpener },
        { provide: SessionStore, useValue: { user: signal(me) } },
      ],
    });
    thread = TestBed.inject(CommentThreadStore);
    thread.start(postId, (change) => countChanges.push(change));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reads the comments of its post page by page', async () => {
    await loadComments(comment(1), comment(2));

    expect(commentApi.getByPost).toHaveBeenCalledWith(
      postId,
      expect.objectContaining({ pageNumber: 1 }),
    );
    expect(shownTexts()).toEqual(['comment 1', 'comment 2']);
    expect(thread.shown().every((shown) => !shown.isSending)).toBe(true);
  });

  describe('send', () => {
    it('shows the comment on top at once as sending, raises the count, then swaps in the server copy', async () => {
      await loadComments(comment(1));
      const answer = deferred<FullCommentDto>();
      commentApi.create.mockReturnValue(answer.promise);

      const sending = thread.send('Looks cold!');

      expect(commentApi.create).toHaveBeenCalledWith(postId, 'Looks cold!');
      expect(shownTexts()).toEqual(['Looks cold!', 'comment 1']);
      expect(thread.shown()[0]).toMatchObject({ isSending: true, isOnServer: false });
      expect(thread.shown()[0].comment.author).toEqual({ id: me.id, username: me.username });
      expect(countNow()).toBe(1);

      answer.resolve(ok(fullComment(40, 'Looks cold!')));
      await sending;

      expect(shownTexts()).toEqual(['Looks cold!', 'comment 1']);
      expect(thread.shown()[0]).toMatchObject({ isSending: false, isOnServer: true });
      expect(thread.shown()[0].comment.id).toBe(40);
      expect(countNow()).toBe(1);
    });

    it('removes a refused comment, lowers the count, shows a toast and gives the text back', async () => {
      await loadComments(comment(1));
      commentApi.create.mockResolvedValue(fail('Post not found', 400));

      await thread.send('Looks cold!');

      expect(shownTexts()).toEqual(['comment 1']);
      expect(countNow()).toBe(0);
      expect(toastMessages()).toEqual(['Post not found']);
      expect(thread.hasReturnedText()).toBe(true);
      expect(thread.takeReturnedText()).toBe('Looks cold!');
      expect(thread.hasReturnedText()).toBe(false);
      expect(thread.takeReturnedText()).toBeNull();
    });

    it('shows both when two comments are on their way at once, each swapped in as it arrives', async () => {
      const first = deferred<FullCommentDto>();
      const second = deferred<FullCommentDto>();
      commentApi.create.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

      const sendingFirst = thread.send('one');
      const sendingSecond = thread.send('two');
      second.resolve(ok(fullComment(41, 'two')));
      await sendingSecond;
      expect(shownTexts()).toEqual(['one', 'two']);
      first.resolve(ok(fullComment(40, 'one')));
      await sendingFirst;

      // A comment the server answers before an older one lands below it until the page is reloaded.
      expect(shownTexts()).toEqual(['one', 'two']);
      expect(countNow()).toBe(2);
    });
  });

  describe('edit', () => {
    it('shows the new text at once as sending, then the server copy', async () => {
      await loadComments(comment(1), comment(2));
      const answer = deferred<FullCommentDto>();
      commentApi.edit.mockReturnValue(answer.promise);

      const saving = thread.edit(comment(2), 'Warm, actually.');

      expect(commentApi.edit).toHaveBeenCalledWith(2, 'Warm, actually.');
      expect(shownTexts()).toEqual(['comment 1', 'Warm, actually.']);
      expect(thread.shown()[1].isSending).toBe(true);
      expect(thread.shown()[0].isSending).toBe(false);

      answer.resolve(ok(fullComment(2, 'Warm, actually (server).')));
      await saving;

      expect(shownTexts()).toEqual(['comment 1', 'Warm, actually (server).']);
      expect(thread.shown()[1].isSending).toBe(false);
    });

    it('puts the old text back on a refusal, shows a toast and gives the text back', async () => {
      await loadComments(comment(1), comment(2));
      commentApi.edit.mockResolvedValue(fail('Comment not found', 400));

      await thread.edit(comment(2), 'Warm, actually.');

      expect(shownTexts()).toEqual(['comment 1', 'comment 2']);
      expect(thread.shown()[1].isSending).toBe(false);
      expect(toastMessages()).toEqual(['Comment not found']);
      expect(thread.returnedEdit(2)).toBe('Warm, actually.');
      expect(thread.returnedEdit(1)).toBeNull();
      expect(thread.takeReturnedEdit(2)).toBe('Warm, actually.');
      expect(thread.returnedEdit(2)).toBeNull();
    });

    it('ignores a second edit of a comment while its first is on its way', async () => {
      await loadComments(comment(2));
      const answer = deferred<FullCommentDto>();
      commentApi.edit.mockReturnValue(answer.promise);

      const saving = thread.edit(comment(2), 'first');
      await thread.edit(comment(2), 'second');
      answer.resolve(ok(fullComment(2, 'first')));
      await saving;

      expect(commentApi.edit).toHaveBeenCalledTimes(1);
      expect(shownTexts()).toEqual(['first']);
    });
  });

  describe('remove', () => {
    it('asks first, and does nothing when the answer is no', async () => {
      await loadComments(comment(1), comment(2));
      confirmationOpener.ask.mockResolvedValue(false);

      await thread.remove(comment(2));

      expect(confirmationOpener.ask).toHaveBeenCalledWith(
        expect.objectContaining({
          question: english.comments.deleteConfirmation.question,
          isDestructive: true,
        }),
      );
      expect(commentApi.delete).not.toHaveBeenCalled();
      expect(shownTexts()).toEqual(['comment 1', 'comment 2']);
      expect(countNow()).toBe(0);
    });

    it('says "Deleting…" until the server answers, then fades the comment out, takes it off the list and lowers the count', async () => {
      await loadComments(comment(1), comment(2));
      const answer = deferred<void>();
      commentApi.delete.mockReturnValue(answer.promise);

      const removing = thread.remove(comment(1));
      await vi.advanceTimersByTimeAsync(deleteNoticeMinimumMilliseconds * 5);

      expect(commentApi.delete).toHaveBeenCalledWith(1);
      expect(shownTexts()).toEqual(['comment 1', 'comment 2']);
      expect(thread.shown().map((shown) => shown.isWaitingToDelete)).toEqual([true, false]);
      expect(thread.shown().map((shown) => shown.isFading)).toEqual([false, false]);
      expect(countNow()).toBe(0);

      answer.resolve(ok(undefined));
      await vi.advanceTimersByTimeAsync(0);

      expect(thread.shown().map((shown) => shown.isWaitingToDelete)).toEqual([false, false]);
      expect(thread.shown().map((shown) => shown.isFading)).toEqual([true, false]);

      await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
      await removing;

      expect(shownTexts()).toEqual(['comment 2']);
      expect(countNow()).toBe(-1);
    });

    it('says the comment is deleted once the server has deleted it', async () => {
      await loadComments(comment(1), comment(2));
      commentApi.delete.mockResolvedValue(ok(undefined));

      const removing = thread.remove(comment(1));
      await vi.advanceTimersByTimeAsync(settleMilliseconds);
      await removing;

      expect(toastMessages()).toEqual([english.comments.deletedToast]);
    });

    it('keeps a refused deletion in its place, leaves the count and shows a toast', async () => {
      await loadComments(comment(1), comment(2), comment(3));
      commentApi.delete.mockResolvedValue(fail('Comment not found', 400));

      const removing = thread.remove(comment(2));
      await vi.advanceTimersByTimeAsync(settleMilliseconds);
      await removing;

      expect(shownTexts()).toEqual(['comment 1', 'comment 2', 'comment 3']);
      expect(thread.shown().map((shown) => shown.isWaitingToDelete)).toEqual([false, false, false]);
      expect(thread.shown().map((shown) => shown.isFading)).toEqual([false, false, false]);
      expect(countNow()).toBe(0);
      expect(toastMessages()).toEqual(['Comment not found']);
    });

    it('ignores a second deletion of a comment that is already being deleted', async () => {
      await loadComments(comment(1));
      commentApi.delete.mockResolvedValue(ok(undefined));

      void thread.remove(comment(1));
      await vi.advanceTimersByTimeAsync(0);
      void thread.remove(comment(1));
      await vi.advanceTimersByTimeAsync(settleMilliseconds);

      expect(confirmationOpener.ask).toHaveBeenCalledTimes(1);
      expect(commentApi.delete).toHaveBeenCalledTimes(1);
    });
  });
});
