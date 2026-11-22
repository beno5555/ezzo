import { Injectable, WritableSignal, inject, signal } from '@angular/core';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { ConfirmationOpener } from '../../shared/confirmation/confirmation-opener';
import { inUploadOrder } from '../../shared/photos/in-upload-order';
import { ToastStore } from '../../shared/toasts/toast-store';
import { ImageDto } from './image-dto';
import { PostApi } from './post-api';
import { PostChange } from './post-change';
import { PostEdit } from './post-edit';
import { StandardPostDisplayDto } from './standard-post-display-dto';

// Everything an author does to a post that already exists: edit its title and text, remove one of its
// photos, delete it. Every page that shows post cards gives the card's outputs to this store (the feed,
// the post's own page, later a profile's posts), and each shows the result at once, as the spec's
// "What a user writes shows at once too" and "Quick actions show their result at once" ask. NewPostStore
// and CommentThreadStore are the patterns. The page passes show, which applies a PostChange to the post
// in the page's list.
//   - edit: the new title and text show at once and the card is marked as uploading; a toast says the
//     post is uploading and stays until the server answers. Then the server's text takes its place and
//     a second toast says it is saved and leads to the post. On a refusal the old title and text come
//     back, and the toast says why and leads to the post's page, where the edit form opens filled with
//     what the author wrote (returnedEdit). The store lives as long as the app, so the toasts tell even
//     after the author has left the page.
//   - removePhoto: the photo leaves at once and comes back, with a toast, if the server refuses.
//   - delete: once the author confirms, the post is deleted and every list leaves it out; if the server
//     refuses it comes back, with a toast.
// A post with a request on its way ignores another edit or photo removal, so the answers never cross.
@Injectable({ providedIn: 'root' })
export class PostEditStore {
  private readonly postApi = inject(PostApi);
  private readonly toastStore = inject(ToastStore);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly text = inject(LanguageStore).text;

  private readonly savingIds = signal<ReadonlySet<number>>(new Set());
  private readonly removingPhotoIds = signal<ReadonlySet<number>>(new Set());
  private readonly deletedIds = signal<ReadonlySet<number>>(new Set());
  private readonly refusedEdits = signal<ReadonlyMap<number, PostEdit>>(new Map());

  // True while the post's edit is on its way: its card shows it as uploading.
  isSaving(postId: number): boolean {
    return this.savingIds().has(postId);
  }

  // True while one of the post's photos is being removed: the edit form's controls wait.
  isRemovingPhoto(postId: number): boolean {
    return this.removingPhotoIds().has(postId);
  }

  // True once the author confirmed the deletion, until the server refuses it. A list leaves such a post
  // out of what it shows (a post's id is never used again, so a deleted post needs no cleaning up).
  isDeleted(postId: number): boolean {
    return this.deletedIds().has(postId);
  }

  // What the author wrote in an edit the server refused, or null: for the post's card to open its form with.
  returnedEdit(postId: number): PostEdit | null {
    return this.refusedEdits().get(postId) ?? null;
  }

  takeReturnedEdit(postId: number): PostEdit | null {
    const returned = this.returnedEdit(postId);

    this.refusedEdits.update((edits) => {
      const rest = new Map(edits);
      rest.delete(postId);
      return rest;
    });

    return returned;
  }

  // post is the post as it was shown before the edit, whose title and text come back if the server refuses.
  async edit(
    post: StandardPostDisplayDto,
    written: PostEdit,
    show: (apply: PostChange) => void,
  ): Promise<void> {
    if (this.isIdle(post.id)) {
      const toastId = this.toastStore.showLasting(this.text().posts.composer.uploadingToast);
      const address = appAddresses.post(post.id).join('/');

      this.takeReturnedEdit(post.id);
      this.mark(this.savingIds, post.id, true);
      show((current) => ({ ...current, title: written.title, postContent: written.content }));
      const result = await this.postApi.edit(post.id, written);
      this.mark(this.savingIds, post.id, false);

      if (result.succeeded) {
        show((current) => ({
          ...current,
          title: result.data.title,
          postContent: result.data.postContent,
        }));
        this.toastStore.replace(toastId, this.text().posts.edit.savedToast, address);
      } else {
        show((current) => ({ ...current, title: post.title, postContent: post.postContent }));
        this.refusedEdits.update((edits) => new Map(edits).set(post.id, written));
        this.toastStore.replace(toastId, result.message, address);
      }
    }
  }

  async removePhoto(
    post: StandardPostDisplayDto,
    image: ImageDto,
    show: (apply: PostChange) => void,
  ): Promise<void> {
    if (this.isIdle(post.id)) {
      this.mark(this.removingPhotoIds, post.id, true);
      show((current) => ({
        ...current,
        images: current.images.filter((one) => one.id !== image.id),
      }));
      const result = await this.postApi.removeImage(post.id, image.id);
      this.mark(this.removingPhotoIds, post.id, false);

      const isRefused = !result.succeeded;

      if (isRefused) {
        show((current) => ({ ...current, images: inUploadOrder([...current.images, image]) }));
        this.toastStore.show(result.message);
      }
    }
  }

  // Asks first. whenConfirmed runs as soon as the author says yes, before the server has answered: the
  // post's own page uses it to lead to the feed.
  async delete(
    post: StandardPostDisplayDto,
    whenConfirmed: () => void = () => undefined,
  ): Promise<void> {
    const canAsk = this.isIdle(post.id) && !this.isDeleted(post.id);

    if (canAsk) {
      const labels = this.text().posts.deleteConfirmation;
      const isConfirmed = await this.confirmationOpener.ask({
        question: labels.question,
        detail: labels.detail,
        confirmButton: labels.confirmButton,
        isDestructive: true,
      });

      if (isConfirmed) {
        this.mark(this.deletedIds, post.id, true);
        whenConfirmed();
        const result = await this.postApi.delete(post.id);

        const isRefused = !result.succeeded;

        if (isRefused) {
          this.mark(this.deletedIds, post.id, false);
          this.toastStore.show(result.message);
        }
      }
    }
  }

  private isIdle(postId: number): boolean {
    return !this.isSaving(postId) && !this.isRemovingPhoto(postId);
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
