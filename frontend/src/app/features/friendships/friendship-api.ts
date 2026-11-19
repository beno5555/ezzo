import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { StandardFriendshipDto } from './standard-friendship-dto';

@Injectable({ providedIn: 'root' })
export class FriendshipApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

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
