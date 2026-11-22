import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { MinimalUserDto } from './minimal-user-dto';
import { SearchUserQuery } from './search-user-query';
import { StandardUserDto } from './standard-user-dto';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  getById(id: number): Promise<AppResult<StandardUserDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<StandardUserDto>>(`/api/users/${id}`),
      this.languageStore.text().httpFailures,
    );
  }

  // The username travels as one segment of the address, whatever characters it holds.
  getByUsername(username: string): Promise<AppResult<StandardUserDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<StandardUserDto>>(
        `/api/users/${encodeURIComponent(username)}`,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  searchUsers(query: SearchUserQuery): Promise<AppResult<MinimalUserDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<MinimalUserDto>>('/api/users/search', { params: query }),
      this.languageStore.text().httpFailures,
    );
  }
}
