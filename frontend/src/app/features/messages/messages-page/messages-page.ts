import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterOutlet, isActive } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { ConversationList } from '../conversation-list/conversation-list';
import { ConversationsStore } from '../conversations-store';

// The chat's one layout, around both of its addresses. On a desktop the list and the open conversation
// (the child route: ConversationPage, or NoConversationPage at /messages) sit side by side. On a phone
// they are two screens: /messages is the list alone and /messages/:username the conversation alone, so
// the browser's back button returns from the conversation to the list. The layout stays while the user
// moves between conversations, so the list keeps its place.
@Component({
  selector: 'app-messages-page',
  imports: [RouterOutlet, ConversationList],
  templateUrl: './messages-page.html',
  styleUrl: './messages-page.css',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class MessagesPage implements OnInit {
  private readonly conversationsStore = inject(ConversationsStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly isOnList = isActive(appAddresses.messages, inject(Router), {
    paths: 'exact',
    queryParams: 'ignored',
    fragment: 'ignored',
    matrixParams: 'ignored',
  });

  // The list is not live yet (ticket 19), so each visit reads it again.
  async ngOnInit(): Promise<void> {
    await this.conversationsStore.loadConversations();
  }
}
