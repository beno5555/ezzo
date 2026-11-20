import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { StandardPostDisplayDto } from './standard-post-display-dto';

@Injectable({ providedIn: 'root' })
export class PostApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // The ranked feed: posts by everyone but the caller, highest score first (docs/backend/controllers.md).
  getFeed(query: PageQuery): Promise<AppResult<StandardPostDisplayDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<StandardPostDisplayDto>>('/api/posts/feed', { params: query }),
      this.languageStore.text().httpFailures,
    );
  }
}
