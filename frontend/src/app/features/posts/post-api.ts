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
import { PostEdit } from './post-edit';
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

  // One user's posts, newest first, for a guest too. Posts that moderation hid are left out unless the
  // caller is their author or an administrator.
  getByUser(userId: number, query: PageQuery): Promise<AppResult<StandardPostDisplayDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<StandardPostDisplayDto>>(`/api/posts/user/${userId}`, {
        params: query,
      }),
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

  // Text only, as JSON: the title and the text. An empty text is refused unless the post has photos.
  edit(postId: number, change: PostEdit): Promise<AppResult<FullPostDisplayDto>> {
    return toAppResult(
      this.http.put<ApplicationResponse<FullPostDisplayDto>>(`/api/posts/${postId}`, {
        title: change.title,
        content: change.content,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // Allowed to the post's author and an administrator; the post's comments, likes and photos go with it.
  delete(postId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>(`/api/posts/${postId}`),
      this.languageStore.text().httpFailures,
    );
  }

  // Removes one photo and answers with the post without it. The backend refuses, with a message, the
  // last photo of a post that has no text, so a post never ends up empty.
  removeImage(postId: number, imageId: number): Promise<AppResult<FullPostDisplayDto>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<FullPostDisplayDto>>(
        `/api/posts/${postId}/images/${imageId}`,
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
