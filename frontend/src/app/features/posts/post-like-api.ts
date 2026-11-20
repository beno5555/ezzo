import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';

// The backend's PostLikeController (/api/posts/{postId}/likes). Neither call returns the new count; the
// caller works it out (toggledLike). The list of who liked is not built (spec, Out of Scope).
@Injectable({ providedIn: 'root' })
export class PostLikeApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  // A repeated like also succeeds, and adds nothing.
  like(postId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.post<ApplicationResponse<void>>(`/api/posts/${postId}/likes`, null),
      this.languageStore.text().httpFailures,
    );
  }

  // Fails with 404 when the caller has not liked the post.
  unlike(postId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>(`/api/posts/${postId}/likes`),
      this.languageStore.text().httpFailures,
    );
  }
}
