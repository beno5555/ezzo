import { Component, OnInit, computed, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { LucideSendHorizontal } from '@lucide/angular';
import { LIMITS } from '../../core/limits';
import { Button } from '../button/button';
import { CharacterCounter } from '../character-counter/character-counter';
import { FormField } from '../form-field/form-field';
import { TextInput } from '../text-input/text-input';
import { canSendComment } from '../../features/comments/can-send-comment';

// A comment's text box with its buttons, for a new comment under a post and for an edit in place of a
// comment's text. The page gives the texts (they come from its dictionary) and decides what a send and a
// dismiss do:
//   <app-comment-form fieldId="new-comment" [label]="…" [contentLabel]="…" [submitLabel]="…" (send)="…" />
// The text box stops taking characters at the limit (maxlength), so a comment cannot be too long to send; a
// longer text pasted in is cut at the limit. The validator stays as a second guard.
// isCompact makes it one row with a counter of used characters and, on a phone, an icon for the submit button. With a cancelLabel, a Cancel button shows beside the submit button (the edit form) and emits dismiss.
// The submit button stays disabled until canSendComment holds, and the form empties itself once it has
// sent. initialContent fills it when it opens (an edit starts from the comment's text); fill() puts a
// refused comment's text back, and isEmpty tells the page when it may.
@Component({
  selector: 'app-comment-form',
  imports: [
    ReactiveFormsModule,
    Button,
    CharacterCounter,
    FormField,
    LucideSendHorizontal,
    TextInput,
  ],
  templateUrl: './comment-form.html',
  styleUrl: './comment-form.css',
})
export class CommentForm implements OnInit {
  // Makes the field's id unique on a page that shows several forms.
  readonly fieldId = input.required<string>();
  readonly label = input.required<string>();
  readonly contentLabel = input.required<string>();
  readonly submitLabel = input.required<string>();
  readonly cancelLabel = input<string | null>(null);
  readonly initialContent = input('');
  // One row of text box and button, low enough to stay pinned to the bottom of the screen (the new-comment
  // form). Without it the form is the roomier one with its floating label (an edit in place).
  readonly isCompact = input(false);
  readonly send = output<string>();
  readonly dismiss = output();

  protected readonly form = inject(NonNullableFormBuilder).group({
    content: ['', [Validators.maxLength(LIMITS.comments.contentMaxLength)]],
  });

  private readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue().content)),
    { initialValue: this.form.getRawValue().content },
  );
  protected readonly canSend = computed(() => canSendComment(this.written()));
  readonly isEmpty = computed(() => this.written() === '');
  // The counter in the compact form's corner: used characters out of the limit.
  protected readonly maxLength = LIMITS.comments.contentMaxLength;
  protected readonly length = computed(() => this.written().length);

  ngOnInit(): void {
    this.form.setValue({ content: this.initialContent() });
  }

  fill(content: string): void {
    this.form.setValue({ content });
  }

  submit(): void {
    if (this.canSend()) {
      this.send.emit(this.written().trim());
      this.form.reset();
    }
  }

  requestCancel(): void {
    this.dismiss.emit();
  }
}
