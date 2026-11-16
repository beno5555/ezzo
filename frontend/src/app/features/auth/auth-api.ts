import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { SKIP_RENEWAL } from '../../core/http/skip-renewal';
import { toAppResultWithoutEnvelope } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { AccessTokenResponse } from './access-token-response';
import { LoginDto } from './login-dto';

// The refresh token travels as an HttpOnly cookie on these calls; frontend code never reads it (ADR 0004).
@Injectable({ providedIn: 'root' })
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly languageStore = inject(LanguageStore);

  signIn(login: LoginDto): Promise<AppResult<AccessTokenResponse>> {
    return toAppResultWithoutEnvelope(
      this.http.post<AccessTokenResponse>('/api/auth/login', login, { context: skipRenewal() }),
      this.languageStore.text().httpFailures,
    );
  }

  refresh(): Promise<AppResult<AccessTokenResponse>> {
    return toAppResultWithoutEnvelope(
      this.http.post<AccessTokenResponse>('/api/auth/refresh', null, { context: skipRenewal() }),
      this.languageStore.text().httpFailures,
    );
  }

  signOut(): Promise<AppResult<void>> {
    return toAppResultWithoutEnvelope(
      this.http.patch<void>('/api/auth/logout', null, { context: skipRenewal() }),
      this.languageStore.text().httpFailures,
    );
  }
}

// A 401 from these calls is the answer itself, never a reason to refresh and retry. Each runs while its tab
// holds the refresh cookie lock, so a refresh asked for from inside one would wait on that lock forever.
function skipRenewal(): HttpContext {
  return new HttpContext().set(SKIP_RENEWAL, true);
}
