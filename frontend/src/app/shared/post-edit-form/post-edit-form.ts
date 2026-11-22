import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideX } from '@lucide/angular';
import { map } from 'rxjs';
import { LanguageStore } from '../../core/languages/language-store';
import { LIMITS } from '../../core/limits';
import { canSavePost } from '../../features/posts/can-send-post';
import { ImageDto } from '../../features/posts/image-dto';
import { PostEdit } from '../../features/posts/post-edit';
import { Button } from '../button/button';
import { FormField } from '../form-field/form-field';
import { IconButton } from '../icon-button/icon-button';
import { inUploadOrder } from '../photos/in-upload-order';
import { TextInput } from '../text-input/text-input';

// The form that takes the place of a post card's title, text and photos while its author edits it, with
// the composer's limits. The card gives the post's photos and what the form opens with, and decides what
// a save, a cancel and a photo's removal do:
//   <app-post-edit-form [postId]="post.id" [images]="post.images" [initialEdit]="edit"
//     (save)="saveEdit($event)" (dismiss)="stopEditing()" (photoRemove)="removePhoto($event)" />
// Each photo has a remove control; it removes the photo at once, with the server, and does not wait for
// Save or come back on Cancel. Photos cannot be added to an existing post. isRemovingPhoto, true while
// one removal is on its way, holds the controls and Save, so a second one cannot start before the
// first has answered. The Save button stays disabled until canSavePost holds for the title, the text and
// the photos that are left.
@Component({
  selector: 'app-post-edit-form',
  imports: [ReactiveFormsModule, Button, FormField, IconButton, LucideX, TextInput],
  templateUrl: './post-edit-form.html',
  styleUrl: './post-edit-form.css',
})
export class PostEditForm implements OnInit {
  // Makes the fields' ids unique on a page that shows several cards.
  readonly postId = input.required<number>();
  readonly images = input.required<readonly ImageDto[]>();
  readonly initialEdit = input.required<PostEdit>();
  readonly isRemovingPhoto = input(false);
  // Whether the server holds text for the post. Without it, the last photo cannot be removed (the
  // backend's LastImageOfPostWithoutText), so its control is held rather than offered to fail.
  readonly hasSavedText = input(true);
  readonly save = output<PostEdit>();
  readonly dismiss = output();
  readonly photoRemove = output<ImageDto>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly form = inject(NonNullableFormBuilder).group({
    title: ['', [Validators.required, Validators.maxLength(LIMITS.posts.titleMaxLength)]],
    content: ['', [Validators.maxLength(LIMITS.posts.contentMaxLength)]],
  });

  private readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  protected readonly orderedImages = computed(() => inUploadOrder(this.images()));
  protected readonly canRemovePhoto = computed(() => {
    const isOnlyPhoto = this.images().length === 1;
    const isLocked = isOnlyPhoto && !this.hasSavedText();

    return !this.isRemovingPhoto() && !isLocked;
  });
  protected readonly canSave = computed(() => {
    const written = this.written();
    const isFormReady = canSavePost(written.title, written.content, this.images().length);

    return isFormReady && !this.isRemovingPhoto();
  });

  ngOnInit(): void {
    this.form.setValue(this.initialEdit());
  }

  submit(): void {
    if (this.canSave()) {
      this.save.emit(this.form.getRawValue());
    }
  }

  requestCancel(): void {
    this.dismiss.emit();
  }

  requestPhotoRemoval(image: ImageDto): void {
    this.photoRemove.emit(image);
  }
}
