import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { RegisterDto } from '../auth/register-dto';
import { EditUserDto } from './edit-user-dto';
import { FullUserDto } from './full-user-dto';
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

  searchUsers(query: SearchUserQuery): Promise<AppResult<MinimalUserDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<MinimalUserDto>>('/api/users/search', { params: query }),
      this.languageStore.text().httpFailures,
    );
  }

  // An administrator creates an account with the fields of registration. The new account is not
  // signed in, and answers with its full shape.
  create(registration: RegisterDto): Promise<AppResult<FullUserDto>> {
    return toAppResult(
      this.http.post<ApplicationResponse<FullUserDto>>('/api/users', registration),
      this.languageStore.text().httpFailures,
    );
  }

  // An administrator edits another account's profile. The backend keeps usernames in lower case, so the
  // answer holds the name as stored.
  edit(id: number, profile: EditUserDto): Promise<AppResult<FullUserDto>> {
    return toAppResult(
      this.http.put<ApplicationResponse<FullUserDto>>(`/api/users/${id}`, profile),
      this.languageStore.text().httpFailures,
    );
  }
}
