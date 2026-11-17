import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult, toAppResultWithoutEnvelope } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { ConversationFriendDto } from './conversation-friend-dto';
import { UnreadCountResponse } from './unread-count-response';

@Injectable({ providedIn: 'root' })
export class MessageApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // Friends the user has a conversation with, the most recent conversation first.
  getConversationFriends(query: PageQuery): Promise<AppResult<ConversationFriendDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<ConversationFriendDto>>('/api/messages/friends/conversation', {
        params: query,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  getNonConversationFriends(query: PageQuery): Promise<AppResult<DisplayFriendDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<DisplayFriendDto>>('/api/messages/friends/no-conversation', {
        params: query,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // Counts conversations with unread messages, not messages.
  getUnreadCount(): Promise<AppResult<UnreadCountResponse>> {
    return toAppResultWithoutEnvelope(
      this.http.get<UnreadCountResponse>('/api/messages/conversations/unread'),
      this.languageStore.text().httpFailures,
    );
  }
}
