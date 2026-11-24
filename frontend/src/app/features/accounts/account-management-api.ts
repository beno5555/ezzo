import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';

// The administrator's calls of the backend's AccountManagementController (/api/accounts): grant and
// remove the administrator role, and delete an account. A deleted account is only marked: the backend's
// cleanup job removes its data later. The role granted is not read.
@Injectable({ providedIn: 'root' })
export class AccountManagementApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  assignAdministrator(accountId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.put<ApplicationResponse<void>>(
        `/api/accounts/${accountId}/assign-administrator`,
        null,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  removeAdministrator(accountId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.put<ApplicationResponse<void>>(
        `/api/accounts/${accountId}/remove-administrator`,
        null,
      ),
      this.languageStore.text().httpFailures,
    );
  }

  // The signed-in user deletes their own account (soft: the cleanup job removes the data after the
  // retention period). The caller signs out afterwards.
  deleteOwnAccount(): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>('/api/accounts/mine'),
      this.languageStore.text().httpFailures,
    );
  }

  deleteAccount(accountId: number): Promise<AppResult<void>> {
    return toAppResult(
      this.http.delete<ApplicationResponse<void>>(`/api/accounts/${accountId}`),
      this.languageStore.text().httpFailures,
    );
  }
}
