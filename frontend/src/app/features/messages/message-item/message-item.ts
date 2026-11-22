import { Component, computed, inject, input } from '@angular/core';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { PhotoGrid } from '../../../shared/photos/photo-grid/photo-grid';
import { StandardMessageDto } from '../standard-message-dto';

// One message of the open conversation: its text, its photos (a click opens the viewer), its time and
// whether it was edited. The user's own messages sit on the right and the friend's on the left; a screen
// reader hears the sender's name before the text instead. showsTime is false inside a run (historyMarks): only
// the run's last message writes its time below; the others show theirs on hover.
//   <app-message-item [message]="message" [isOwn]="isOwn" [showsTime]="mark.showsTime" />
@Component({
  selector: 'app-message-item',
  imports: [PhotoGrid],
  templateUrl: './message-item.html',
  styleUrl: './message-item.css',
})
export class MessageItem {
  readonly message = input.required<StandardMessageDto>();
  readonly isOwn = input.required<boolean>();
  readonly showsTime = input(true);

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly hasText = computed(() => this.message().content.trim() !== '');
  protected readonly hasPhotos = computed(() => this.message().images.length > 0);
  protected readonly senderLabel = computed(() => {
    const texts = this.text().messages.conversation;
    const sender = this.isOwn() ? texts.ownSender : this.message().sender.username;

    return texts.senderLabel(sender);
  });
}
