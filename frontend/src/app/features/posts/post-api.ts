import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { FullPostDisplayDto } from './full-post-display-dto';
import { NewPost } from './new-post';
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

  // One post, for a guest too. A post that does not exist, or that the caller may not read (hidden), is a
  // 404 with the same message.
  getById(postId: number): Promise<AppResult<FullPostDisplayDto>> {
    return toAppResult(
      this.http.get<ApplicationResponse<FullPostDisplayDto>>(`/api/posts/${postId}`),
      this.languageStore.text().httpFailures,
    );
  }

  // One multipart request: the backend stores the post and its photos together or not at all, and
  // answers with the new post (no likes, no comments).
  create(newPost: NewPost): Promise<AppResult<StandardPostDisplayDto>> {
    return toAppResult(
      this.http.post<ApplicationResponse<StandardPostDisplayDto>>(
        '/api/posts',
        toFormData(newPost),
      ),
      this.languageStore.text().httpFailures,
    );
  }
}

// The field names are CreatePostDto's. Each photo is its own Images part, in display order. The browser
// sets the multipart boundary itself, so no Content-Type header is set here.
function toFormData(newPost: NewPost): FormData {
  const body = new FormData();
  const hasText = newPost.content.trim().length > 0;

  body.append('PostTitle', newPost.title);
  if (hasText) {
    body.append('PostContent', newPost.content);
  }
  for (const photo of newPost.photos) {
    body.append('Images', photo, photo.name);
  }

  return body;
}
