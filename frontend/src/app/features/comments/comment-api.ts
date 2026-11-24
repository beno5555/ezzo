import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { ListResponse } from '../../core/http/list-response';
import { PageQuery } from '../../core/http/page-query';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { FullCommentDto } from './full-comment-dto';
import { StandardCommentDto } from './standard-comment-dto';

// The backend's CommentController (/api/comments). Creating a comment goes to .../posts/{postId} and
// reading a post's comments to .../post/{postId}: the backend's two spellings, not a typo
// (docs/backend/controllers.md). Every refusal of a write, such as a hidden post or someone else's
// comment, is a 400 with a message.
@Injectable({ providedIn: 'root' })
export class CommentApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // A post's comments, oldest first, for a guest too.
  getByPost(postId: number, query: PageQuery): Promise<AppResult<StandardCommentDto[]>> {
    return toAppResult(
      this.http.get<ListResponse<StandardCommentDto>>(`/api/comments/post/${postId}`, {
        params: query,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  create(postId: number, content: string): Promise<AppResult<FullCommentDto>> {
    return toAppResult(
      this.http.post<ApplicationResponse<FullCommentDto>>(`/api/comments/posts/${postId}`, {
        content,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  edit(commentId: number, content: string): Promise<AppResult<FullCommentDto>> {
    return toAppResult(
      this.http.put<ApplicationResponse<FullCommentDto>>(`/api/comments/${commentId}`, {
        content,
      }),
      this.languageStore.text().httpFailures,
    );
  }

  // Allowed to the comment's author, the post's author and an administrator.
  delete(commentId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>(`/api/comments/${commentId}`),
      this.languageStore.text().httpFailures,
    );
  }
}
