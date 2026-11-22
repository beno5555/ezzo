import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult, toAppResultWithoutEnvelope } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { DisplayFriendDto } from '../friendships/display-friend-dto';
import { ConversationFriendDto } from './conversation-friend-dto';
import { NewMessage } from './new-message';
import { SentMessageDto } from './sent-message-dto';
import { StandardMessageDto } from './standard-message-dto';
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

  // One page of the history with a friend: page 1 holds the newest messages, and each page lists its
  // messages oldest first. Reading any page also marks the friend's messages read.
  getConversation(otherUserId: number, query: PageQuery): Promise<AppResult<StandardMessageDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<StandardMessageDto>>(`/api/messages/conversation/${otherUserId}`, {
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

  // One multipart request: the backend stores the message and its photos together or not at all, pushes
  // ReceiveMessage to the friend, and answers with the sender's copy.
  send(receiverId: number, newMessage: NewMessage): Promise<AppResult<SentMessageDto>> {
    return toAppResult(
      this.http.post<ApplicationResponse<SentMessageDto>>(
        `/api/messages/${receiverId}`,
        toFormData(newMessage),
      ),
      this.languageStore.text().httpFailures,
    );
  }

  // Edits the user's own message, while it is less than 20 minutes old (LIMITS.messages). The friend gets
  // MessageEdited; the answer is the sender's copy. The backend names the new text NewContent.
  edit(messageId: number, content: string): Promise<AppResult<StandardMessageDto>> {
    return toAppResult(
      this.http.put<ApplicationResponse<StandardMessageDto>>(`/api/messages/${messageId}`, {
        newContent: content,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // Deletes the user's own message and its photos, however old. The friend is sent no push.
  delete(messageId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>(`/api/messages/${messageId}`),
      this.languageStore.text().httpFailures,
    );
  }

  // Marks the friend's unread messages read, for one that arrives while their conversation is open. The
  // answer is empty; the friend gets MessageSeen when something was unread.
  markAsRead(otherUserId: number): Promise<AppResult<void>> {
    return toAppResultWithoutEnvelope(
      this.http.put<void>(`/api/messages/conversation/${otherUserId}/mark-as-read`, null),
      this.languageStore.text().httpFailures,
    );
  }
}

// The field names are CreateMessageDto's. Each photo is its own Images part, in display order. The browser
// sets the multipart boundary itself, so no Content-Type header is set here.
function toFormData(newMessage: NewMessage): FormData {
  const body = new FormData();
  const hasText = newMessage.content.trim().length > 0;

  if (hasText) {
    body.append('Content', newMessage.content);
  }
  for (const photo of newMessage.photos) {
    body.append('Images', photo, photo.name);
  }

  return body;
}
