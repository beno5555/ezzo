import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ListResponse } from '../../core/http/list-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { AccountListQuery } from './account-list-query';
import { AdminUserDto } from './admin-user-dto';

// The backend's AdminController (/api/admin), administrators only. The accounts are here; the other
// reads of that controller arrive with the tickets of their pages.
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
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

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
}
