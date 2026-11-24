import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { AppResult } from '../../core/http/app-result';
import { SKIP_RENEWAL } from '../../core/http/skip-renewal';
import { ApplicationResponse } from '../../core/http/application-response';
import { toAppResult, toAppResultWithoutEnvelope } from '../../core/http/to-app-result';
import { LanguageStore } from '../../core/languages/language-store';
import { AccessTokenResponse } from './access-token-response';
import { ForgotPasswordDto } from './forgot-password-dto';
import { LoginDto } from './login-dto';
import { RegisterDto } from './register-dto';
import { ResetPasswordDto } from './reset-password-dto';

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

  // Hands out no session: the register page signs in afterwards. The new user's FullUserDto is not read.
  register(registration: RegisterDto): Promise<AppResult<void>> {
    return toAppResult(
      this.http.post<ApplicationResponse<void>>('/api/auth/register', registration),
      this.languageStore.text().httpFailures,
    );
  }

  requestPasswordReset(request: ForgotPasswordDto): Promise<AppResult<void>> {
    return toAppResult(
      this.http.put<ApplicationResponse<void>>('/api/auth/request-password-reset', request),
      this.languageStore.text().httpFailures,
    );
  }

  resetPassword(reset: ResetPasswordDto): Promise<AppResult<void>> {
    return toAppResult(
      this.http.put<ApplicationResponse<void>>('/api/auth/reset-password', reset),
      this.languageStore.text().httpFailures,
    );
  }

  async refresh(): Promise<AppResult<AccessTokenResponse>> {
    const dictionaryReady = this.languageStore.ready;
    const request = toAppResultWithoutEnvelope(
      this.http.post<AccessTokenResponse>('/api/auth/refresh', null, { context: skipRenewal() }),
      async () => {
        await dictionaryReady;
        return this.languageStore.text().httpFailures;
      },
    );
    // Keep the session unpublished until effects reacting to it can read the dictionary.
    const [result] = await Promise.all([request, dictionaryReady]);

    return result;
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
