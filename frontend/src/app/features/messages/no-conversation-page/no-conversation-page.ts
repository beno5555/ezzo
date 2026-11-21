import { Component, inject } from '@angular/core';
import { LucideMessagesSquare } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { EmptyState } from '../../../shared/empty-state/empty-state';

// /messages on a desktop: the place beside the list where a conversation opens, until one is chosen.
// MessagesPage hides it on a phone, where /messages is the list alone.
@Component({
  selector: 'app-no-conversation-page',
  imports: [EmptyState, LucideMessagesSquare],
  templateUrl: './no-conversation-page.html',
  styleUrl: './no-conversation-page.css',
  host: { class: 'flex min-h-0 flex-1 flex-col' },
})
export class NoConversationPage {
  protected readonly text = inject(LanguageStore).text;
}
