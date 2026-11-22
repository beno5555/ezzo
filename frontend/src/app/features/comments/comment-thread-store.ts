import { Injectable, WritableSignal, computed, inject, signal } from '@angular/core';
import { LanguageStore } from '../../core/languages/language-store';
import { LIMITS } from '../../core/limits';
import { PagedList } from '../../core/paging/paged-list';
import { SessionStore } from '../../core/session/session-store';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { CommentApi } from './comment-api';
import { ShownComment } from './shown-comment';
import { StandardCommentDto } from './standard-comment-dto';

// The comments under one post, and everything the reader does to them. One is provided by the section
// that shows them (providers: [CommentThreadStore]) and lives and dies with it; start() tells it which post.
// What a user writes shows at once, before the server has it ("What a user writes shows at once too" in
// the spec; NewPostStore is the pattern):
//   - send: the comment shows on top, with "Sending…", and the post's count rises. The server's copy
//     takes its place. The caller's own comments come first in the list, newest first, as the server
//     returns them, so a new one is the first to be seen. A refusal removes it, lowers the count, shows a toast and keeps the text for the
//     form (takeReturnedText).
//   - edit: the new text shows at once with the same mark. A refusal puts the old text back, shows a
//     toast and keeps the new text for the comment's form (takeReturnedEdit).
//   - remove: once the user confirms, the comment leaves the list and the count falls. A refusal puts it
//     back in its place, raises the count again and shows a toast.
// A comment already on its way (an edit, a deletion) ignores a second request.
// onCountChange tells the page how the post's comment count moves, +1 and -1.
@Injectable()
export class CommentThreadStore {
  private readonly commentApi = inject(CommentApi);
  private readonly toastStore = inject(ToastStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly sessionStore = inject(SessionStore);
  private readonly text = inject(LanguageStore).text;

  private postId = 0;
  private onCountChange: (change: number) => void = () => undefined;
  // Pending comments count down from -1, so their ids never meet a server's id.
  private lastPendingId = 0;

  // The comments the server has, by pages; the page loads the next one as the reader scrolls.
  readonly list = new PagedList<StandardCommentDto>({
    loadPage: (query) => this.commentApi.getByPost(this.postId, query),
    pageSize: LIMITS.paging.defaultPageSize,
    keyOf: (comment) => comment.id,
  });

  private readonly sending = signal<readonly StandardCommentDto[]>([]);
  private readonly editingIds = signal<ReadonlySet<number>>(new Set());
  private readonly removingIds = signal<ReadonlySet<number>>(new Set());
  private readonly refusedTexts = signal<readonly string[]>([]);
  private readonly refusedEdits = signal<ReadonlyMap<number, string>>(new Map());

  // The list as the reader sees it: the new comments still on their way, newest first, then the
  // server's comments minus those being deleted.
  readonly shown = computed<readonly ShownComment[]>(() => {
    const removingIds = this.removingIds();
    const editingIds = this.editingIds();
    const onServer = this.list
      .items()
      .filter((comment) => !removingIds.has(comment.id))
      .map((comment) => ({ comment, isSending: editingIds.has(comment.id), isOnServer: true }));
    const notYetOnServer = [...this.sending()].reverse().map((comment) => ({
      comment,
      isSending: true,
      isOnServer: false,
    }));

    return [...notYetOnServer, ...onServer];
  });
  // True while a refused comment's text waits for the form to take it back.
  readonly hasReturnedText = computed(() => this.refusedTexts().length > 0);

  start(postId: number, onCountChange: (change: number) => void): void {
    this.postId = postId;
    this.onCountChange = onCountChange;
  }

  async send(content: string): Promise<void> {
    const pendingComment = this.toPendingComment(content);

    this.sending.update((comments) => [...comments, pendingComment]);
    this.onCountChange(1);
    const result = await this.commentApi.create(this.postId, content);
    this.sending.update((comments) => comments.filter((one) => one.id !== pendingComment.id));

    if (result.succeeded) {
      this.list.prepend(result.data);
    } else {
      this.onCountChange(-1);
      this.refusedTexts.update((texts) => [...texts, content]);
      this.toastStore.show(result.message);
    }
  }

  // comment is the comment as it was shown before the edit, which comes back if the server refuses.
  async edit(comment: StandardCommentDto, content: string): Promise<void> {
    const isIdle = !this.editingIds().has(comment.id);

    if (isIdle) {
      this.mark(this.editingIds, comment.id, true);
      this.list.replace({ ...comment, content });
      const result = await this.commentApi.edit(comment.id, content);
      this.mark(this.editingIds, comment.id, false);

      if (result.succeeded) {
        this.list.replace(result.data);
      } else {
        this.list.replace(comment);
        this.refusedEdits.update((edits) => new Map(edits).set(comment.id, content));
        this.toastStore.show(result.message);
      }
    }
  }

  async remove(comment: StandardCommentDto): Promise<void> {
    const isIdle = !this.removingIds().has(comment.id);

    if (isIdle) {
      const isConfirmed = await this.confirmationOpener.ask({
        question: this.text().comments.deleteConfirmation.question,
        detail: this.text().comments.deleteConfirmation.detail,
        confirmButton: this.text().comments.deleteConfirmation.confirmButton,
        isDestructive: true,
      });

      if (isConfirmed) {
        this.mark(this.removingIds, comment.id, true);
        this.onCountChange(-1);
        const result = await this.commentApi.delete(comment.id);

        if (result.succeeded) {
          this.list.remove(comment.id);
          this.mark(this.removingIds, comment.id, false);
        } else {
          this.mark(this.removingIds, comment.id, false);
          this.onCountChange(1);
          this.toastStore.show(result.message);
        }
      }
    }
  }

  // The oldest refused comment's text, for the form to fill itself with, or null when none waits.
  takeReturnedText(): string | null {
    const oldest = this.refusedTexts()[0] ?? null;

    this.refusedTexts.update((texts) => texts.slice(1));

    return oldest;
  }

  // What the author wrote in an edit the server refused, or null: for the comment's form to open with.
  returnedEdit(commentId: number): string | null {
    return this.refusedEdits().get(commentId) ?? null;
  }

  takeReturnedEdit(commentId: number): string | null {
    const returned = this.returnedEdit(commentId);

    this.refusedEdits.update((edits) => {
      const rest = new Map(edits);
      rest.delete(commentId);
      return rest;
    });

    return returned;
  }

  private mark(
    ids: WritableSignal<ReadonlySet<number>>,
    commentId: number,
    isMarked: boolean,
  ): void {
    ids.update((current) => {
      const next = new Set(current);
      if (isMarked) {
        next.add(commentId);
      } else {
        next.delete(commentId);
      }
      return next;
    });
  }

  private toPendingComment(content: string): StandardCommentDto {
    const user = this.sessionStore.user();
    this.lastPendingId -= 1;

    return {
      id: this.lastPendingId,
      content,
      author: { id: user?.id ?? null, username: user?.username ?? '' },
      uploadedAt: new Date().toISOString(),
      isHidden: false,
    };
  }
}
