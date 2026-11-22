import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { AcceptedFriendshipDto } from './accepted-friendship-dto';
import { MinimalFriendshipDto } from './minimal-friendship-dto';
import { StandardFriendshipDto } from './standard-friendship-dto';

@Injectable({ providedIn: 'root' })
export class FriendshipApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // The signed-in user's relationship with one person, in any state, with who sent the request. Answers
  // 404 when there is none.
  getRelationship(userId: number): Promise<AppResult<StandardFriendshipDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<StandardFriendshipDto>>(`/api/friendships/${userId}`),
      this.languageStore.text().httpFailures,
    );
  }

  // Every refusal (oneself, a user who is gone, a request that already waits, friends already) is a 400
  // with a message. A request the other person declined is reopened.
  sendRequest(addresseeId: number): Promise<AppResult<MinimalFriendshipDto>> {
    return toAppResult(
      this.http.post<ApplicationResponse<MinimalFriendshipDto>>(
        `/api/friendships/${addresseeId}`,
        null,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  // Only the addressee of a waiting request may answer it; anything else is a 400.
  accept(requesterId: number): Promise<AppResult<StandardFriendshipDto>> {
    return toAppResult(
      this.http.put<ApplicationResponse<StandardFriendshipDto>>(
        `/api/friendships/${requesterId}/accept`,
        null,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  decline(requesterId: number): Promise<AppResult<StandardFriendshipDto>> {
    return toAppResult(
      this.http.put<ApplicationResponse<StandardFriendshipDto>>(
        `/api/friendships/${requesterId}/decline`,
        null,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  // Removes the relationship in any state: a friend, a waiting request the caller sent (cancelling it) or
  // received, a declined one. Between friends it also deletes their messages. Answers 404 when there is none.
  remove(userId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>(`/api/friendships/${userId}`),
      this.languageStore.text().httpFailures,
    );
  }

  // Any user's friends, for a signed-in caller; 404 for a user who is deactivated or gone. Rows are read
  // for that user, so isRequester is theirs, not the caller's.
  getFriendsOf(userId: number, query: PageQuery): Promise<AppResult<StandardFriendshipDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<StandardFriendshipDto>>(`/api/friendships/user/${userId}`, {
        params: query,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // Answers 404 unless the two are friends now.
  getAcceptedFriendship(friendId: number): Promise<AppResult<AcceptedFriendshipDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<AcceptedFriendshipDto>>(
        `/api/friendships/accepted/${friendId}`,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  // Requests other users sent to the signed-in user, which wait for an answer. The list carries no total:
  // its totalCount is the length of the page it returns.
  getPendingRequests(query: PageQuery): Promise<AppResult<StandardFriendshipDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<StandardFriendshipDto>>('/api/friendships/pending', {
        params: query,
      }),
      this.languageStore.text().httpFailures,
    );
  }
}
