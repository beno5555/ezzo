import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { ModerationStatus } from './moderation-status';

// The backend's ModerationController (/api/admin/.../moderation), open to an administrator. The status goes
// as its name in the body. An id the server does not find is a 404 with a message.
@Injectable({ providedIn: 'root' })
export class ModerationApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  setPostStatus(postId: number, status: ModerationStatus): Promise<AppResult<void>> {
    return this.setStatus(`/api/admin/posts/${postId}/moderation`, status);
  }

  setCommentStatus(commentId: number, status: ModerationStatus): Promise<AppResult<void>> {
    return this.setStatus(`/api/admin/comments/${commentId}/moderation`, status);
  }

  private setStatus(address: string, status: ModerationStatus): Promise<AppResult<void>> {
    return toAppResult(
      this.http.put<ApplicationResponse<void>>(address, { status }),
      this.languageStore.text().httpFailures,
    );
  }
}
