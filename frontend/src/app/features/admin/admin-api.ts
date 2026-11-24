import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { pageParams } from '../../core/http/page-params';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { CommentSnapshotDto } from '../moderation/comment-snapshot-dto';
import { PostSnapshotDto } from '../moderation/post-snapshot-dto';
import { AccountListQuery } from './account-list-query';
import { AdminUserDto } from './admin-user-dto';
import { LogDisplayDto } from './log-display-dto';
import { logFilterToParams } from './log-filter-address';
import { LogListQuery } from './log-list-query';
import { SystemStatisticsDto } from './system-statistics-dto';

// The backend's AdminController (/api/admin), administrators only: the accounts, the moderation queues, the
// logs and the statistics.
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

  // The log rows, newest first. An unset filter is left out of the address; the outcome and the signed-in
  // filters are false as often as true, so they are told apart from unset by `undefined`, not by truth. A
  // period the backend refuses (its end before its start) answers with the server's own sentence.
  async getLogs(query: LogListQuery): Promise<AppResult<LogDisplayDto[]>> {
    const { pageNumber, pageSize, ...filter } = query;
    let params = pageParams({ pageNumber, pageSize });

    for (const [name, value] of Object.entries(logFilterToParams(filter))) {
      params = params.set(name, value);
    }

    const result = await toAppResult(
      this.http.get<ListResponse<LogDisplayDto>>('/api/admin/logs', { params }),
      this.languageStore.text().httpFailures,
    );

    return withServerMessage(result);
  }

  // How big and how active Ezzo is: the totals, what was created in the last 7 and 30 days, and how many
  // users are online now.
  getStatistics(): Promise<AppResult<SystemStatisticsDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<SystemStatisticsDto>>('/api/admin/statistics'),
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

// A request the backend refuses for the shape of its query comes back as the framework's validation problem,
// whose sentences sit under the names of the fields. A page that has no form field to put them beside shows
// the first one as the failure's message.
function withServerMessage<T>(result: AppResult<T>): AppResult<T> {
  const [firstMessage] = result.succeeded ? [] : Object.values(result.fieldErrors ?? {}).flat();
  const hasServerMessage = !result.succeeded && firstMessage !== undefined;

  return hasServerMessage ? { ...result, message: firstMessage } : result;
}
