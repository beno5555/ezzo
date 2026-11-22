import {
  Component,
  ElementRef,
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
import {
  LucideCheck,
  LucideImagePlus,
  LucidePencil,
  LucideSendHorizontal,
  LucideX,
} from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { Button } from '../../../shared/button/button';
import { CharacterCounter } from '../../../shared/character-counter/character-counter';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { PhotoPicker } from '../../../shared/photos/photo-picker/photo-picker';
import { PhotoRules } from '../../../shared/photos/photo-rules';
import { TextInput } from '../../../shared/text-input/text-input';
import { canSendMessage } from '../can-send-message';
import { EditDraft } from '../edit-draft';
import { isSendKey } from '../is-send-key';
import { messageEditDeadline } from '../message-edit-deadline';
import { ConversationsStore } from '../conversations-store';
import { NewMessage } from '../new-message';
import { TypingSender } from '../typing-sender';

// The box under the open conversation: text, up to 5 photos, or both. One row of a photo button, a text
// box that grows with what is typed and the Send button, with a row of small thumbnails of the chosen
// photos above it, so that it stays low on a phone. The box takes no character past the limit (maxlength),
// and Send stays disabled until canSendMessage holds; Enter sends and Shift+Enter starts a new line. Sending hands the message to the page through send and empties
// the box at once:
//   <app-message-form [friendId]="friend.id" (send)="send($event)" />
// ConversationPage stays while the user moves to another conversation, so the box empties when friendId
// changes. A message the server refused comes back from ConversationsStore into its own conversation's
// box once that box is empty, so what the user is writing now is never overwritten.
//
// The box is also where a message is edited (ConversationsStore.editDraft): Edit on a message puts its text
// into the box, with a line "Editing message" above, Cancel where the photo button was and Save where Send
// was; Enter saves, Escape cancels, and the edit ends by itself when its 20 minutes pass. The photos cannot
// be changed, so the picker is hidden meanwhile. What the user had been writing comes back when the edit
// ends, and no typing signal goes to the friend.
@Component({
  selector: 'app-message-form',
  imports: [
    ReactiveFormsModule,
    Button,
    CharacterCounter,
    IconButton,
    PhotoPicker,
    TextInput,
    LucideCheck,
    LucideImagePlus,
    LucidePencil,
    LucideSendHorizontal,
    LucideX,
  ],
  templateUrl: './message-form.html',
  styleUrl: './message-form.css',
})
export class MessageForm {
  private readonly conversationsStore = inject(ConversationsStore);
  private readonly typingSender = inject(TypingSender);
  private readonly picker = viewChild.required(PhotoPicker);
  private readonly field = viewChild.required<ElementRef<HTMLTextAreaElement>>('field');

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
  // The edit this box holds, when it is one of this conversation's.
  protected readonly editing = computed(() => {
    const draft = this.conversationsStore.editDraft();
    const isOfThisConversation = draft !== null && draft.message.receiverId === this.friendId();

    return isOfThisConversation ? draft : null;
  });
  // An edit needs text (a message's photos cannot be changed); a new message needs text or a photo.
  protected readonly canSend = computed(() =>
    canSendMessage(this.written(), this.editing() === null ? this.photos().length : 0),
  );
  protected readonly isFull = computed(() => this.picker().isFull());
  // The counter in the text box's corner: used characters out of the limit.
  protected readonly length = computed(() => this.written().length);
  // The thumbnails or a refusal sit above the row, apart from it.
  protected readonly pickerHasContent = computed(
    () => this.editing() === null && this.picker().hasContent(),
  );
  // What the user was writing before the edit took the box, which comes back when the edit ends.
  private stashed: NewMessage | null = null;

  constructor() {
    effect(() => {
      this.friendId();
      untracked(() => {
        this.stashed = null;
        this.empty();
      });
    });
    effect(() => {
      const canTakeBack =
        this.conversationsStore.returnedMessage() !== null &&
        this.isEmpty() &&
        this.editing() === null;

      if (canTakeBack) {
        untracked(() => {
          this.fill(this.conversationsStore.takeReturned());
        });
      }
    });
    effect(() => {
      const draft = this.editing();

      untracked(() => {
        this.showEdit(draft);
      });
    });
    // The 20 minutes end an edit that is still open: saving it would only be refused. An edit the server
    // refused for being late comes back here already past its time and ends again at once.
    effect((onCleanup) => {
      const draft = this.editing();

      if (draft !== null) {
        const remaining = Math.max(0, messageEditDeadline(draft.message) - Date.now());
        const timer = setTimeout(() => this.conversationsStore.stopEditing(), remaining);

        onCleanup(() => clearTimeout(timer));
      }
    });
  }

  // The Cancel button, and Escape in the box.
  cancelEdit(): void {
    this.conversationsStore.stopEditing();
  }

  // The photo button: the picker opens the browser's file chooser.
  openPhotos(): void {
    this.picker().openFiles();
  }

  // Every change the user makes to the text: the friend is told they are writing (TypingSender sends at
  // most one signal every 2 seconds). Programmatic changes, such as emptying the box after a send, do not
  // fire an input event.
  typed(): void {
    if (this.editing() === null) {
      this.typingSender.typed(this.friendId());
    }
  }

  // Enter sends, Shift+Enter starts a new line. An Enter that cannot send yet still adds no line.
  sendOnEnter(event: KeyboardEvent): void {
    if (isSendKey(event)) {
      event.preventDefault();
      this.submit();
    }
  }

  submit(): void {
    const draft = this.editing();

    if (this.canSend()) {
      if (draft !== null) {
        this.saveEdit(draft);
      } else {
        this.send.emit({ content: this.written().trim(), photos: [...this.photos()] });
        this.empty();
      }
    }
  }

  // An edit that changes nothing sends nothing. The box gets its own text back through showEdit, once the
  // store has dropped the draft.
  private saveEdit(draft: EditDraft): void {
    const content = this.written().trim();

    if (content === draft.message.content) {
      this.conversationsStore.stopEditing();
    } else {
      void this.conversationsStore.edit(draft.message, content);
    }
  }

  // An edit takes the box with the message's text in it (what the user was writing is kept); when the edit
  // ends the box has that back.
  private showEdit(draft: EditDraft | null): void {
    if (draft !== null) {
      this.stashed ??= { content: this.form.getRawValue().content, photos: [...this.photos()] };
      this.form.setValue({ content: draft.content });
      this.field().nativeElement.focus();
    } else if (this.stashed !== null) {
      this.fill(this.stashed);
      this.stashed = null;
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
