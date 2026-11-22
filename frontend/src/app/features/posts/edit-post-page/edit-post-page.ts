import { HttpStatusCode } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { NotFoundPage } from '../../../core/not-found/not-found-page';
import { appAddresses } from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Button } from '../../../shared/button/button';
import { FormField } from '../../../shared/form-field/form-field';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { inUploadOrder } from '../../../shared/photos/in-upload-order';
import { TextInput } from '../../../shared/text-input/text-input';
import { canSavePost } from '../can-send-post';
import { PostApi } from '../post-api';
import { PostEditStore } from '../post-edit-store';
import { PostPageStatus } from '../post-page/post-page-status';
import { StandardPostDisplayDto } from '../standard-post-display-dto';

// Where a post's author edits it, at /posts/:postId/edit: opened from the post card's menu and from a
// refused edit's toast. It loads the post and fills a card-shaped form with its title and text, with the
// composer's limits. Another user's post, or one that does not exist, shows the not-found page. Photos
// show as they are but cannot be changed (removing and adding come later). Save goes to the post's own
// page first, where the post shows with its new text, marked as uploading; PostEditStore sends the edit
// and its toasts follow it. That page takes this one's place in the history, so Back does not return to a
// form that has been sent. Cancel leads to the post. When an edit was refused, the form opens with what the
// author wrote in it; that is dropped as soon as the page opens or closes, never kept for a later visit.
@Component({
  selector: 'app-edit-post-page',
  imports: [
    Button,
    FormField,
    LoadFailure,
    NotFoundPage,
    ReactiveFormsModule,
    RouterLink,
    TextInput,
  ],
  templateUrl: './edit-post-page.html',
  styleUrl: './edit-post-page.css',
})
export class EditPostPage {
  private readonly postApi = inject(PostApi);
  private readonly postEdits = inject(PostEditStore);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  // From the route, as the text of the address's second segment (withComponentInputBinding).
  readonly postId = input.required<string>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly PostPageStatus = PostPageStatus;
  protected readonly status = signal<PostPageStatus>(PostPageStatus.Loading);
  protected readonly post = signal<StandardPostDisplayDto | null>(null);
  protected readonly failureMessage = signal<string | null>(null);
  // The boxes stop taking characters at these (maxlength), and show the count beside their labels.
  protected readonly titleMaxLength = LIMITS.posts.titleMaxLength;
  protected readonly contentMaxLength = LIMITS.posts.contentMaxLength;
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(this.titleMaxLength)]],
    content: ['', [Validators.maxLength(this.contentMaxLength)]],
  });

  protected readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  protected readonly photos = computed(() => inUploadOrder(this.post()?.images ?? []));
  protected readonly postAddress = computed(() => appAddresses.post(this.post()?.id ?? 0));
  // Save stays disabled until the fields are valid, and until something differs from the saved post.
  protected readonly canSave = computed(() => {
    const post = this.post();
    const written = this.written();
    const isFormReady =
      post !== null && canSavePost(written.title, written.content, post.images.length);
    const isChanged =
      post !== null && (written.title !== post.title || written.content !== post.postContent);

    return isFormReady && isChanged && !this.isSaving();
  });
  protected readonly isSaving = computed(() => {
    const post = this.post();

    return post !== null && this.postEdits.isSaving(post.id);
  });

  constructor() {
    // The address can change to another post while the page stays open, so the page loads in an effect.
    effect(() => {
      const postId = this.postId();

      untracked(() => {
        void this.load(postId);
      });
    });

    // A refused edit is kept for the page its toast leads to, and not for a later visit.
    inject(DestroyRef).onDestroy(() => {
      const post = this.post();

      if (post !== null) {
        this.postEdits.discardReturnedEdit(post.id);
      }
    });
  }

  async retry(): Promise<void> {
    await this.load(this.postId());
  }

  async save(): Promise<void> {
    const post = this.post();

    if (post !== null && this.canSave()) {
      const written = this.form.getRawValue();

      await this.router.navigate(appAddresses.post(post.id), { replaceUrl: true });
      await this.postEdits.edit(post, written);
    }
  }

  private async load(postIdText: string): Promise<void> {
    const postId = Number(postIdText);
    const isPossibleId = Number.isInteger(postId) && postId > 0;

    this.status.set(PostPageStatus.Loading);
    this.post.set(null);
    if (isPossibleId) {
      const result = await this.postApi.getById(postId);
      const isStillWanted = this.postId() === postIdText;

      if (isStillWanted) {
        if (result.succeeded) {
          this.show(result.data);
        } else if (result.status === HttpStatusCode.NotFound) {
          this.status.set(PostPageStatus.NotFound);
        } else {
          this.failureMessage.set(result.message);
          this.status.set(PostPageStatus.Failed);
        }
      }
    } else {
      this.status.set(PostPageStatus.NotFound);
    }
  }

  // Only the author edits a post; to anyone else the page does not exist.
  private show(post: StandardPostDisplayDto): void {
    const userId = this.sessionStore.userId();
    const isAuthor = userId !== null && post.author.id === userId;

    if (isAuthor) {
      const returned = this.postEdits.takeReturnedEdit(post.id);

      this.form.setValue(returned ?? { title: post.title, content: post.postContent });
      this.post.set(post);
      this.status.set(PostPageStatus.Ready);
    } else {
      this.status.set(PostPageStatus.NotFound);
    }
  }
}
