import { Injectable, computed, inject, signal } from '@angular/core';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { SessionStore } from '../../core/session/session-store';
import { PreviewAddressMaker } from '../../shared/photos/preview-address-maker';
import { ToastStore } from '../../shared/toasts/toast-store';
import { ImageDto } from './image-dto';
import { NewPost } from './new-post';
import { PostApi } from './post-api';
import { StandardPostDisplayDto } from './standard-post-display-dto';

// Sends the posts the composer writes, so that the user never waits for one ("What a user writes shows
// at once too" in the spec). The post shows at once on top of the feed as a pending post, with the moment
// it was sent as its time and its photos from the browser's previews, and a toast says it is uploading
// until the server answers. Then the server's copy takes its place and a second toast leads to it; or,
// on a refusal, the toast says why and what the user wrote waits in takeReturned() for the composer.
// The store lives as long as the app, so an upload finishes, and its toast tells, even after the user
// leaves the feed. Comments, messages and edits copy this pattern.
//   protected readonly newPosts = inject(NewPostStore);
//   async publish(newPost: NewPost): Promise<void> {
//     await this.newPosts.publish(newPost, (created) => this.feed.prepend(created));
//   }
@Injectable({ providedIn: 'root' })
export class NewPostStore {
  private readonly postApi = inject(PostApi);
  private readonly toastStore = inject(ToastStore);
  private readonly previewAddressMaker = inject(PreviewAddressMaker);
  private readonly sessionStore = inject(SessionStore);
  private readonly text = inject(LanguageStore).text;

  private readonly uploading = signal<readonly StandardPostDisplayDto[]>([]);
  private readonly refused = signal<readonly NewPost[]>([]);
  // Pending posts count down from -1, so their ids never meet a server's id.
  private lastPendingId = 0;

  // The posts on their way, newest first. Their ids are negative and their photo addresses are previews.
  readonly pending = this.uploading.asReadonly();
  // True while a refused post waits for the composer to take it back.
  readonly hasReturned = computed(() => this.refused().length > 0);

  // show puts the server's copy in the page's list once it arrives.
  async publish(newPost: NewPost, show: (created: StandardPostDisplayDto) => void): Promise<void> {
    const previewAddresses = newPost.photos.map((photo) => this.previewAddressMaker.create(photo));
    const pendingPost = this.toPendingPost(newPost, previewAddresses);
    const toastId = this.toastStore.showLasting(this.text().posts.composer.uploadingToast);

    this.uploading.update((posts) => [pendingPost, ...posts]);
    const result = await this.postApi.create(newPost);
    this.uploading.update((posts) => posts.filter((post) => post.id !== pendingPost.id));

    if (result.succeeded) {
      show(result.data);
      this.toastStore.replace(
        toastId,
        this.text().posts.composer.publishedToast,
        appAddresses.post(result.data.id).join('/'),
      );
    } else {
      this.refused.update((posts) => [...posts, newPost]);
      this.toastStore.replace(toastId, result.message);
    }
    // The pending card has left the list, so no <img> shows these addresses any more.
    for (const address of previewAddresses) {
      this.previewAddressMaker.release(address);
    }
  }

  // The oldest refused post, for the composer to fill itself with, or null when none waits.
  takeReturned(): NewPost | null {
    const oldest = this.refused()[0] ?? null;

    this.refused.update((posts) => posts.slice(1));

    return oldest;
  }

  private toPendingPost(newPost: NewPost, previewAddresses: string[]): StandardPostDisplayDto {
    const user = this.sessionStore.user();
    // Negative, as the post's id is: a preview has no id on the server.
    const images: ImageDto[] = previewAddresses.map((address, index) => ({
      id: -(index + 1),
      address,
      orderIndex: index,
    }));
    this.lastPendingId -= 1;

    return {
      id: this.lastPendingId,
      title: newPost.title,
      author: { id: user?.id ?? null, username: user?.username ?? '' },
      postContent: newPost.content,
      uploadedAt: new Date().toISOString(),
      images,
      likeCount: 0,
      commentCount: 0,
      likedByCaller: false,
      isHidden: false,
    };
  }
}
