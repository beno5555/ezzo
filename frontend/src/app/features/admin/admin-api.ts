import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { pageParams } from '../../core/http/page-params';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { CommentSnapshotDto } from '../moderation/comment-snapshot-dto';
import { PostSnapshotDto } from '../moderation/post-snapshot-dto';
import { AccountListQuery } from './account-list-query';
import { AdminUserDto } from './admin-user-dto';

// The backend's AdminController (/api/admin), administrators only. The accounts and the moderation queues
// are here; the other reads of that controller arrive with the tickets of their pages.
@Injectable({ providedIn: 'root' })
export class AdminApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // Accounts in any state, oldest first. The state goes as its name, and a filter left out or empty is
  // left out of the address, since the backend reads an empty state as no state at all and refuses it.
  getUsers(query: AccountListQuery): Promise<AppResult<AdminUserDto[]>> {
    const { state, username = '' } = query;
    const hasState = state !== undefined;
    const hasUsername = username !== '';
    let params = pageParams(query);

    if (hasState) {
      params = params.set('state', state);
    }
    if (hasUsername) {
      params = params.set('username', username);
    }

    return toAppResult(
      this.http.get<ListResponse<AdminUserDto>>('/api/admin/users', { params }),
      this.languageStore.text().httpFailures,
    );
  }

  // The posts flagged for review, oldest first. A post leaves the queue once it is Visible or Hidden.
  getFlaggedPosts(query: PageQuery): Promise<AppResult<PostSnapshotDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<PostSnapshotDto>>('/api/admin/moderation-queue/posts', {
        params: pageParams(query),
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // The comments flagged for review, oldest first.
  getFlaggedComments(query: PageQuery): Promise<AppResult<CommentSnapshotDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<CommentSnapshotDto>>('/api/admin/moderation-queue/comments', {
        params: pageParams(query),
      }),
      this.languageStore.text().httpFailures,
    );
  }
}
