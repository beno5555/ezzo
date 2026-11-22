import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { AcceptedFriendshipDto } from './accepted-friendship-dto';
import { StandardFriendshipDto } from './standard-friendship-dto';

@Injectable({ providedIn: 'root' })
export class FriendshipApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

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
