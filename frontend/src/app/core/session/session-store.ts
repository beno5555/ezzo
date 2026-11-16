import { Injectable, computed, inject, signal } from '@angular/core';
import { AccessTokenResponse } from '../../features/auth/access-token-response';
import { AuthApi } from '../../features/auth/auth-api';
import { LoginDto } from '../../features/auth/login-dto';
import { AppResult } from '../http/app-result';
import { AccessTokenClaims } from './access-token-claims';
import { decodeAccessToken } from './decode-access-token';
import { RoleName } from './role-name';
import { SessionUser } from './session-user';

type Session = { accessToken: string; claims: AccessTokenClaims };

// The one lock every tab takes before a call that changes the refresh cookie. Refresh tokens rotate,
// so two tabs refreshing with the same cookie would leave one of them holding a revoked token (ADR 0004).
const refreshCookieLockName = 'webcity-refresh-cookie';

// The signed-in user and the access token, held in memory only: never in localStorage or sessionStorage (ADR 0004).
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly authApi = inject(AuthApi);

  private readonly session = signal<Session | null>(null);
  // The refresh in flight in this tab, shared by every caller that asks for one meanwhile.
  private pendingRefresh: Promise<boolean> | null = null;

  readonly accessToken = computed(() => this.session()?.accessToken ?? null);
  readonly user = computed<SessionUser | null>(() => toUser(this.session()));
  readonly isSignedIn = computed(() => this.session() !== null);
  readonly isAdministrator = computed(
    () => this.session()?.claims.roles.includes(RoleName.Administrator) ?? false,
  );

  // Every page load starts signed out, and the refresh cookie signs the user back in.
  async restore(): Promise<void> {
    await this.refresh();
  }

  async signIn(login: LoginDto): Promise<AppResult<AccessTokenResponse>> {
    const result = await this.inTurn(() => this.authApi.signIn(login));

    if (result.succeeded) {
      this.start(result.data.accessToken);
    }

    return result;
  }

  // Swaps the refresh cookie for a new access token, or clears the session when it cannot.
  // Resolves to whether the user is still signed in.
  refresh(): Promise<boolean> {
    this.pendingRefresh ??= this.refreshInTurn();

    return this.pendingRefresh;
  }

  // Called after a 401 to a call sent with rejectedToken. When the session has moved on to another token
  // since then (a refresh that finished meanwhile, or a new sign-in), that token is used without refreshing.
  async renewAfterRejection(rejectedToken: string | null): Promise<boolean> {
    let isRenewed: boolean;
    const currentToken = this.accessToken();

    const hasNewerToken = currentToken !== null && currentToken !== rejectedToken;
    if (hasNewerToken) {
      isRenewed = true;
    } else {
      isRenewed = await this.refresh();
    }

    return isRenewed;
  }

  async signOut(): Promise<void> {
    // Logout answers success even without a cookie, and the session ends here whatever it answers.
    await this.inTurn(() => this.authApi.signOut());
    this.session.set(null);
  }

  private async refreshInTurn(): Promise<boolean> {
    try {
      const result = await this.inTurn(() => this.authApi.refresh());

      if (result.succeeded) {
        this.start(result.data.accessToken);
      } else {
        this.session.set(null);
      }

      return this.isSignedIn();
    } finally {
      this.pendingRefresh = null;
    }
  }

  private start(accessToken: string): void {
    const claims = decodeAccessToken(accessToken);
    this.session.set(claims !== null ? { accessToken, claims } : null);
  }

  private inTurn<T>(work: () => Promise<T>): Promise<T> {
    return navigator.locks.request(refreshCookieLockName, work);
  }
}

function toUser(session: Session | null): SessionUser | null {
  let user: SessionUser | null = null;

  if (session !== null) {
    const { id, username, roles } = session.claims;
    user = { id, username, roles };
  }

  return user;
}
