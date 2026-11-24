import { Component, computed, inject, input } from '@angular/core';
import LucideClock from 'lucide/dist/esm/icons/clock.mjs';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { beforeDeadline } from '../../../core/time/before-deadline';
import { DeletingNotice } from '../../../shared/deleting-notice/deleting-notice';
import { FadeOut } from '../../../shared/fade-out/fade-out';
import { Icon } from '../../../shared/icon/icon';
import { Menu } from '../../../shared/menu/menu';
import { MenuEntry } from '../../../shared/menu/menu-entry';
import { PhotoGrid } from '../../../shared/photos/photo-grid/photo-grid';
import { ConversationsStore } from '../conversations-store';
import { messageEditDeadline } from '../message-edit-deadline';
import { StandardMessageDto } from '../standard-message-dto';

// One message of the open conversation: its text, its photos (a click opens the viewer), its time and
// whether it was edited. The user's own messages sit on the right and the friend's on the left; a screen
// reader hears the sender's name before the text instead. showsTime is false inside a run (historyMarks): only
// the run's last message writes its time below; the others show theirs on hover. A message on its way
// (isSending: a new one, or one whose edit is on its way) shows a clock where its time goes; its accessible
// label says "Sending". The user's last message that the friend has read (isLastSeen) says "Seen" below.
//   <app-message-item [message]="message" [isOwn]="isOwn" [showsTime]="mark.showsTime" [isSending]="…" [isWaitingToDelete]="…" [isFading]="…" [isLastSeen]="…" />
//
// The user's own message has a "…" menu at the end of its bubble; on a device with a mouse it shows while
// the pointer is over the message or the keyboard is in it, and always on a touch screen. Edit is offered
// for 20 minutes after sending (LIMITS) and vanishes at that moment, even while the conversation stays
// open (beforeDeadline). Only the text changes, never the photos; a photo-only message can be given a
// caption. Delete is always offered, and asks first. A message on its way, being deleted or fading out has
// no menu. Edit moves the text into the message box under the conversation (MessageForm) and outlines the
// bubble meanwhile; saving shows the new text at once with the clock. A message being deleted says
// "Deleting…" until the server answers and then fades out (FadeOut) before it leaves.
@Component({
  selector: 'app-message-item',
  imports: [DeletingNotice, FadeOut, Menu, PhotoGrid, Icon],
  templateUrl: './message-item.html',
  styleUrl: './message-item.css',
})
export class MessageItem {
  protected readonly icons = { clock: LucideClock };

  private readonly conversationsStore = inject(ConversationsStore);

  readonly message = input.required<StandardMessageDto>();
  readonly isOwn = input.required<boolean>();
  readonly showsTime = input(true);
  readonly isSending = input(false);
  readonly isWaitingToDelete = input(false);
  readonly isFading = input(false);
  readonly isLastSeen = input(false);

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  // True while the message box holds an edit of this message: the bubble is outlined.
  protected readonly isBeingEdited = computed(
    () => this.conversationsStore.editDraft()?.message.id === this.message().id,
  );

  protected readonly hasText = computed(() => this.message().content.trim() !== '');
  protected readonly hasPhotos = computed(() => this.message().images.length > 0);
  // The clock or the time, at the start of the line below the message.
  protected readonly showsClockOrTime = computed(() => this.isSending() || this.showsTime());
  protected readonly hasLineBelow = computed(
    () => this.showsClockOrTime() || this.message().isEdited || this.isLastSeen(),
  );
  protected readonly senderLabel = computed(() => {
    const texts = this.text().messages.conversation;
    const sender = this.isOwn() ? texts.ownSender : this.message().sender.username;

    return texts.senderLabel(sender);
  });

  private readonly isInEditWindow = beforeDeadline(() => messageEditDeadline(this.message()));
  private readonly isChangeable = computed(
    () => this.isOwn() && !this.isSending() && !this.isWaitingToDelete() && !this.isFading(),
  );
  private readonly canEdit = computed(() => this.isChangeable() && this.isInEditWindow());
  protected readonly menuEntries = computed<readonly MenuEntry[]>(() => {
    const labels = this.text().messages.menu;
    const entries: MenuEntry[] = [];

    if (this.canEdit()) {
      entries.push({
        label: labels.editEntry,
        isDestructive: false,
        choose: () => this.startEditing(),
      });
    }
    if (this.isChangeable()) {
      entries.push({
        label: labels.deleteEntry,
        isDestructive: true,
        choose: () => void this.remove(),
      });
    }

    return entries;
  });

  // Edit hands the message to the message box under the conversation (ConversationsStore.startEditing).
  startEditing(): void {
    this.conversationsStore.startEditing(this.message());
  }

  async remove(): Promise<void> {
    await this.conversationsStore.deleteMessage(this.message());
  }
}
