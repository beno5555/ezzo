import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';

// The backend's AccountActivationController (/api/accounts): a deactivated user asks for a code by email,
// then sends it back to reactivate the account. The activated user's FullUserDto is not read.
@Injectable({ providedIn: 'root' })
export class AccountActivationApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  requestActivation(email: string): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>('/api/accounts/request-activate', { email }),
      this.languageStore.text().httpFailures,
    );
  }

  // The code from the email is the activation token.
  activate(activationToken: string): Promise<AppResult<void>> {
    return toAppResult(
      this.http.patch<ApplicationResponse<void>>('/api/accounts/activate', { activationToken }),
      this.languageStore.text().httpFailures,
    );
  }
}
