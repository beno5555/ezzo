import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';

import { ActivationRequestDto } from './activation-request-dto';

// The backend's AccountActivationController (/api/accounts): a deactivated user asks for an email with a
// link, then the page the link opens sends its token back to reactivate the account; an administrator
// deactivates or reactivates an account at once. The activated user's FullUserDto is not read.
@Injectable({ providedIn: 'root' })
export class AccountActivationApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  requestActivation(request: ActivationRequestDto): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>('/api/accounts/request-activate', request),
      this.languageStore.text().httpFailures,
    );
  }

  // The token from the email's link.
  activate(activationToken: string): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>('/api/accounts/activate', { activationToken }),
      this.languageStore.text().httpFailures,
    );
  }

  // The signed-in user deactivates their own account. The backend revokes every refresh token, so the
  // caller signs out afterwards.
  deactivateOwnAccount(): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>('/api/accounts/mine/deactivate', null),
      this.languageStore.text().httpFailures,
    );
  }

  // The administrator's calls, by account id.
  deactivateAccount(accountId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>(`/api/accounts/${accountId}/deactivate`, null),
      this.languageStore.text().httpFailures,
    );
  }

  reactivateAccount(accountId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>(`/api/accounts/${accountId}/activate`, null),
      this.languageStore.text().httpFailures,
    );
  }
}
