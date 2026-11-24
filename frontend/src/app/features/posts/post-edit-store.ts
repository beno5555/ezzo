import { Injectable, inject, signal } from '@angular/core';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { DeleteFade } from '../../shared/fade-out/delete-fade';
import { ToastLook } from '../../shared/toasts/toast-look';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostApi } from './post-api';
import { PostEdit } from './post-edit';
import { StandardPostDisplayDto } from './standard-post-display-dto';

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
//   - delete: asks first. Once the author confirms, the post's card says "Deleting…" until the server
//     answers. On a yes it fades out, every list leaves it out and a toast says it is deleted; if the
//     server refuses, the card stays as it was, with a toast.
// A post with a request on its way ignores another edit or deletion, so the answers never cross.
@Injectable({ providedIn: 'root' })
export class PostEditStore {
  private readonly postApi = inject(PostApi);
  private readonly toastStore = inject(ToastStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly text = inject(LanguageStore).text;

  private readonly pending = signal<ReadonlyMap<number, StandardPostDisplayDto>>(new Map());
  // The fade-out of a deleted post's card, shared with comments and messages (DeleteFade).
  private readonly deleteFade = new DeleteFade();
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

  // True from the author's confirmation until the server has answered: the card says "Deleting…".
  isWaitingToDelete(postId: number): boolean {
    return this.deleteFade.isWaiting(postId);
  }

  // True from the server's yes until the card has faded out and left.
  isFadingOut(postId: number): boolean {
    return this.deleteFade.isFading(postId);
  }

  // True while the deletion is under way: the card takes no actions.
  isDeleting(postId: number): boolean {
    return this.isWaitingToDelete(postId) || this.isFadingOut(postId);
  }

  // True once the card has faded out. A list leaves such a post out of what it shows (a post's id is never
  // used again, so it needs no cleaning up).
  isDeleted(postId: number): boolean {
    return this.deleteFade.isGone(postId);
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
        this.toastStore.replace(toastId, this.text().posts.edit.savedToast, {
          link: address,
          look: ToastLook.Success,
        });
      } else {
        this.refusedEdits.update((edits) => new Map(edits).set(post.id, written));
        this.toastStore.replace(toastId, result.message, {
          link: appAddresses.editPost(post.id).join('/'),
        });
      }
    }
  }

  // Asks first. The card then says "Deleting…" until the server answers; on a yes it fades out, whenGone
  // runs (the post's own page uses it to lead to the feed) and a toast says it is deleted. A refusal leaves
  // the card as it was, with a toast.
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
        const result = await this.deleteFade.delete(post.id, () => this.postApi.delete(post.id));

        if (result.succeeded) {
          whenGone();
          this.toastStore.show(this.text().posts.deletedToast, { look: ToastLook.Success });
        } else {
          this.toastStore.show(result.message);
        }
      }
    }
  }

  private isIdle(postId: number): boolean {
    const isBusy = this.isSaving(postId) || this.deleteFade.isBusy(postId);

    return !isBusy;
  }
}
