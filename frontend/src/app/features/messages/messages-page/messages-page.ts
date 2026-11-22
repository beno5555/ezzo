import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, isActive } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LucideSquarePen } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Button } from '../../../shared/button/button';
import { DialogOpener } from '../../../shared/dialog/dialog-opener';
import { ConversationList } from '../conversation-list/conversation-list';
import { ConversationListStore } from '../conversation-list-store';
import { NewMessageDialog } from '../new-message-dialog/new-message-dialog';

// The chat's one layout, around both of its addresses. On a desktop the list and the open conversation
// (the child route: ConversationPage, or NoConversationPage at /messages) sit side by side. On a phone
// they are two screens: /messages is the list alone and /messages/:username the conversation alone, so
// the browser's back button returns from the conversation to the list. The layout stays while the user
// moves between conversations, so the list keeps its place. The New message button, fixed under the
// list, opens the friends without a conversation, and choosing one opens theirs.
@Component({
  selector: 'app-messages-page',
  imports: [RouterOutlet, Button, ConversationList, LucideSquarePen],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.css',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class MessagesPage implements OnInit {
  private readonly conversationListStore = inject(ConversationListStore);
  private readonly dialogOpener = inject(DialogOpener);
  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;
  protected readonly isOnList = isActive(appAddresses.messages, this.router, {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  });

  // The hub keeps the list right while the user is connected; each visit still reads it again, which
  // also brings in what arrived while the connection was down.
  async ngOnInit(): Promise<void> {
    await this.conversationListStore.load();
  }

  async startConversation(): Promise<void> {
    const dialogRef = this.dialogOpener.open<string, null, NewMessageDialog>(
      NewMessageDialog,
      null,
    );
    const username = await firstValueFrom(dialogRef.closed, { defaultValue: undefined });

    if (username !== undefined) {
      await this.router.navigate(appAddresses.conversation(username));
    }
  }
}
