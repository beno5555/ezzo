import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostApi } from './post-api';
import { PostEdit } from './post-edit';
import { StandardPostDisplayDto } from './standard-post-display-dto';

// How long a post card takes to fade out once its deletion is confirmed (the card's duration-200).
const deleteFadeMilliseconds = 200;

// What an author does to a post that already exists: edit its title and text on the edit page, delete it.
// Both show their result at once, as the spec's "What a user writes shows at once too" and "Quick actions
// show their result at once" ask; NewPostStore and CommentThreadStore are the patterns.
//   - edit: the edit page sends the author to the post's own page first, where the post shows with the new
//     title and text, marked as uploading (pendingEdit), and a toast says the post is uploading until the
//     server answers. Then the server's copy goes to every page listening (onSaved) and a second toast says
//     it is saved and leads to the post. On a refusal the post shows as it was, and the toast says why and
//     leads to the edit page, which opens filled with what the author wrote (takeReturnedEdit). The store
//     lives as long as the app, so the toasts tell even after the author has left the page. An author's own
//     posts are not shown in the feed, so no list is told about an edit that is on its way.
//   - delete: asks first. Once the author confirms, the post's card fades out and every list leaves it
//     out; a toast says it is deleted. If the server refuses, the post comes back, with a toast.
// A post with a request on its way ignores another edit or deletion, so the answers never cross.
@Injectable({ providedIn: 'root' })
export class PostEditStore {
  private readonly postApi = inject(PostApi);
  private readonly toastStore = inject(ToastStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly text = inject(LanguageStore).text;

  private readonly pending = signal<ReadonlyMap<number, StandardPostDisplayDto>>(new Map());
  private readonly deletingIds = signal<ReadonlySet<number>>(new Set());
  private readonly deletedIds = signal<ReadonlySet<number>>(new Set());
  private readonly refusedEdits = signal<ReadonlyMap<number, PostEdit>>(new Map());
  // The pages showing posts, each told of every server copy that arrives while it listens.
  private readonly listeners = new Set<(saved: StandardPostDisplayDto) => void>();

  // The post as it shows while its edit is on its way, with the new title and text, or null.
  pendingEdit(postId: number): StandardPostDisplayDto | null {
    return this.pending().get(postId) ?? null;
  }

  // True while the post's edit is on its way: its card shows it as uploading.
  isSaving(postId: number): boolean {
    return this.pending().has(postId);
  }

  // True from the author's confirmation until the card has faded out: the card is fading.
  isDeleting(postId: number): boolean {
    return this.deletingIds().has(postId);
  }

  // True from the moment the card has faded out, until the server refuses the deletion. A list leaves
  // such a post out of what it shows (a post's id is never used again, so it needs no cleaning up).
  isDeleted(postId: number): boolean {
    return this.deletedIds().has(postId);
  }

  // show puts a server's copy of an edited post on the page as it arrives. Returns the call that
  // stops it, for the page to make when it is destroyed.
  onSaved(show: (saved: StandardPostDisplayDto) => void): () => void {
    this.listeners.add(show);

    return () => {
      this.listeners.delete(show);
    };
  }

  // What the author wrote in an edit the server refused, or null: for the edit page to open its form with.
  // Taking it removes it, and so does leaving the edit page (discardReturnedEdit): a refused edit is only
  // kept for the page the toast leads to, not for a visit the author makes later.
  takeReturnedEdit(postId: number): PostEdit | null {
    const returned = this.refusedEdits().get(postId) ?? null;

    this.discardReturnedEdit(postId);

    return returned;
  }

  discardReturnedEdit(postId: number): void {
    this.refusedEdits.update((edits) => {
      const rest = new Map(edits);
      rest.delete(postId);
      return rest;
    });
  }

  // post is the post as the server holds it: it stays what the feed shows if the server refuses.
  async edit(post: StandardPostDisplayDto, written: PostEdit): Promise<void> {
    if (this.isIdle(post.id)) {
      const toastId = this.toastStore.showLasting(this.text().posts.composer.uploadingToast);
      const address = appAddresses.post(post.id).join('/');
      const shown = { ...post, title: written.title, postContent: written.content };

      this.pending.update((edits) => new Map(edits).set(post.id, shown));
      const result = await this.postApi.edit(post.id, written);
      this.pending.update((edits) => {
        const rest = new Map(edits);
        rest.delete(post.id);
        return rest;
      });

      if (result.succeeded) {
        for (const show of this.listeners) {
          show(result.data);
        }
        this.toastStore.replace(toastId, this.text().posts.edit.savedToast, address);
      } else {
        this.refusedEdits.update((edits) => new Map(edits).set(post.id, written));
        this.toastStore.replace(toastId, result.message, appAddresses.editPost(post.id).join('/'));
      }
    }
  }

  // Asks first. whenGone runs once the card has faded out, before the server has answered: the post's
  // own page uses it to lead to the feed.
  async delete(
    post: StandardPostDisplayDto,
    whenGone: () => void = () => undefined,
  ): Promise<void> {
    if (this.isIdle(post.id)) {
      const labels = this.text().posts.deleteConfirmation;
      const isConfirmed = await this.confirmationOpener.ask({
        question: labels.question,
        detail: labels.detail,
        confirmButton: labels.confirmButton,
        isDestructive: true,
      });

      if (isConfirmed) {
        this.mark(this.deletingIds, post.id, true);
        await new Promise((resolve) => setTimeout(resolve, deleteFadeMilliseconds));
        this.mark(this.deletedIds, post.id, true);
        this.mark(this.deletingIds, post.id, false);
        whenGone();
        const result = await this.postApi.delete(post.id);

        if (result.succeeded) {
          this.toastStore.show(this.text().posts.deletedToast);
        } else {
          this.mark(this.deletedIds, post.id, false);
          this.toastStore.show(result.message);
        }
      }
    }
  }

  private isIdle(postId: number): boolean {
    const isBusy = this.isSaving(postId) || this.isDeleting(postId) || this.isDeleted(postId);

    return !isBusy;
  }

  private mark(ids: WritableSignal<ReadonlySet<number>>, postId: number, isMarked: boolean): void {
    ids.update((current) => {
      const next = new Set(current);
      if (isMarked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  }
}
