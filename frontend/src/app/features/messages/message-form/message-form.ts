import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { map } from 'rxjs';
import { LucideImagePlus, LucideSendHorizontal } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { Button } from '../../../shared/button/button';
import { CharacterCounter } from '../../../shared/character-counter/character-counter';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { PhotoPicker } from '../../../shared/photos/photo-picker/photo-picker';
import { PhotoRules } from '../../../shared/photos/photo-rules';
import { TextInput } from '../../../shared/text-input/text-input';
import { canSendMessage } from '../can-send-message';
import { isSendKey } from '../is-send-key';
import { ConversationsStore } from '../conversations-store';
import { NewMessage } from '../new-message';

// The box under the open conversation: text, up to 5 photos, or both. One row of a photo button, a text
// box that grows with what is typed and the Send button, with up to three small thumbnails of the chosen
// photos above it, so that it stays low on a phone. The box takes no character past the limit (maxlength),
// and Send stays disabled until canSendMessage holds; Enter sends and Shift+Enter starts a new line. Sending hands the message to the page through send and empties
// the box at once:
//   <app-message-form [friendId]="friend.id" (send)="send($event)" />
// ConversationPage stays while the user moves to another conversation, so the box empties when friendId
// changes. A message the server refused comes back from ConversationsStore into its own conversation's
// box once that box is empty, so what the user is writing now is never overwritten.
@Component({
  selector: 'app-message-form',
  imports: [
    ReactiveFormsModule,
    Button,
    CharacterCounter,
    IconButton,
    PhotoPicker,
    TextInput,
    LucideImagePlus,
    LucideSendHorizontal,
  ],
  templateUrl: './message-form.html',
  styleUrl: './message-form.css',
})
export class MessageForm {
  private readonly conversationsStore = inject(ConversationsStore);
  private readonly picker = viewChild.required(PhotoPicker);

  readonly friendId = input.required<number>();
  readonly send = output<NewMessage>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly photoRules: PhotoRules = {
    maxCount: LIMITS.images.maxPerMessage,
    maxFileSizeBytes: LIMITS.images.maxFileSizeBytes,
    acceptedTypes: LIMITS.images.acceptedTypes,
  };
  protected readonly maxLength = LIMITS.messages.contentMaxLength;
  protected readonly form = inject(NonNullableFormBuilder).group({
    content: ['', [Validators.maxLength(LIMITS.messages.contentMaxLength)]],
  });
  protected readonly photos = signal<readonly File[]>([]);

  private readonly written = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue().content)),
    { initialValue: this.form.getRawValue().content },
  );
  private readonly isEmpty = computed(() => this.written() === '' && this.photos().length === 0);
  protected readonly canSend = computed(() => canSendMessage(this.written(), this.photos().length));
  protected readonly isFull = computed(() => this.picker().isFull());
  // The counter in the text box's corner: used characters out of the limit.
  protected readonly length = computed(() => this.written().length);
  // The thumbnails or a refusal sit above the row, apart from it.
  protected readonly pickerHasContent = computed(() => this.picker().hasContent());

  constructor() {
    effect(() => {
      this.friendId();
      untracked(() => {
        this.empty();
      });
    });
    effect(() => {
      const canTakeBack = this.conversationsStore.returnedMessage() !== null && this.isEmpty();

      if (canTakeBack) {
        untracked(() => {
          this.fill(this.conversationsStore.takeReturned());
        });
      }
    });
  }

  // The photo button: the picker opens the browser's file chooser.
  openPhotos(): void {
    this.picker().openFiles();
  }

  // Enter sends, Shift+Enter starts a new line. An Enter that cannot send yet still adds no line.
  sendOnEnter(event: KeyboardEvent): void {
    if (isSendKey(event)) {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    if (this.canSend()) {
      this.send.emit({ content: this.written().trim(), photos: [...this.photos()] });
      this.empty();
    }
  }

  private empty(): void {
    this.form.reset();
    this.photos.set([]);
  }

  private fill(returned: NewMessage | null): void {
    if (returned !== null) {
      this.form.setValue({ content: returned.content });
      this.photos.set(returned.photos);
    }
  }
}
