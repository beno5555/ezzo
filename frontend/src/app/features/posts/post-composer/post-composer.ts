import { Component, computed, effect, inject, output, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { Button } from '../../../shared/button/button';
import { FormField } from '../../../shared/form-field/form-field';
import { PhotoPicker } from '../../../shared/photos/photo-picker/photo-picker';
import { PhotoRules } from '../../../shared/photos/photo-rules';
import { TextInput } from '../../../shared/text-input/text-input';
import { canSendPost } from '../can-send-post';
import { NewPost } from '../new-post';
import { NewPostStore } from '../new-post-store';

// The card on the composer's page (/posts/new) where a user writes a post: a title, text and photos.
// The Post button stays disabled until canSendPost holds. Sending hands the post to the page through
// send and empties the card at once; the page publishes it through NewPostStore. A post the server
// refused comes back from the store into the card once the card is empty (the refusal's toast leads
// here), so what the user is writing now is never lost.
//   <app-post-composer (send)="publish($event)" />
@Component({
  selector: 'app-post-composer',
  imports: [ReactiveFormsModule, Button, FormField, PhotoPicker, TextInput],
  templateUrl: './post-composer.html',
  styleUrl: './post-composer.css',
})
export class PostComposer {
  private readonly newPosts = inject(NewPostStore);

  readonly send = output<NewPost>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly photoRules: PhotoRules = {
    maxCount: LIMITS.images.maxPerPost,
    maxFileSizeBytes: LIMITS.images.maxFileSizeBytes,
    acceptedTypes: LIMITS.images.acceptedTypes,
  };
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(LIMITS.posts.titleMaxLength)]],
    content: ['', [Validators.maxLength(LIMITS.posts.contentMaxLength)]],
  });
  protected readonly photos = signal<readonly File[]>([]);

  private readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  private readonly draft = computed<NewPost>(() => ({
    ...this.written(),
    photos: [...this.photos()],
  }));
  private readonly isEmpty = computed(() => {
    const draft = this.draft();

    return draft.title === '' && draft.content === '' && draft.photos.length === 0;
  });
  protected readonly canSend = computed(() => canSendPost(this.draft()));

  constructor() {
    effect(() => {
      const canTakeBack = this.newPosts.hasReturned() && this.isEmpty();

      if (canTakeBack) {
        untracked(() => {
          this.fill(this.newPosts.takeReturned());
        });
      }
    });
  }

  submit(): void {
    if (this.canSend()) {
      this.send.emit(this.draft());
      this.form.reset();
      this.photos.set([]);
    }
  }

  private fill(returned: NewPost | null): void {
    if (returned !== null) {
      this.form.setValue({ title: returned.title, content: returned.content });
      this.photos.set(returned.photos);
    }
  }
}
