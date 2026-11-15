import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ListResponse } from '../../core/http/list-response';
import { toAppResult } from '../../core/http/to-app-result';
import { MinimalUserDto } from './minimal-user-dto';
import { SearchUserQuery } from './search-user-query';

@Injectable({ providedIn: 'root' })
export class UserApi {
  private readonly http = inject(HttpClient);

  searchUsers(query: SearchUserQuery): Promise<AppResult<MinimalUserDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<MinimalUserDto>>('/api/users/search', { params: query }),
    );
  }
}
