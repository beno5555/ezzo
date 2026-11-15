import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpStatusCode,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { signInAddress } from '../routing/sign-in-address';
import { SessionStore } from '../session/session-store';
import { SKIP_RENEWAL } from './skip-renewal';

const apiAddressPrefix = '/api/';

// Adds the access token to /api calls. A 401 leads to one refresh, shared with any other 401 meanwhile,
// and one retry. When the refresh fails, the session is cleared and the user is sent to sign-in.
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiCall = request.url.startsWith(apiAddressPrefix);
  if (!isApiCall) {
    return next(request);
  }

  const sessionStore = inject(SessionStore);
  const router = inject(Router);
  const sentToken = sessionStore.accessToken();
  const sent = next(withAccessToken(request, sentToken));

  const skipsRenewal = request.context.get(SKIP_RENEWAL);
  if (skipsRenewal) {
    return sent;
  }

  return sent.pipe(
    catchError((error: unknown) => {
      const isRejected =
        error instanceof HttpErrorResponse && error.status === HttpStatusCode.Unauthorized;
      if (!isRejected) {
        return throwError(() => error);
      }

      return from(sessionStore.renewAfterRejection(sentToken)).pipe(
        switchMap((isRenewed) => {
          if (isRenewed) {
            return next(withAccessToken(request, sessionStore.accessToken()));
          }

          void router.navigateByUrl(signInAddress(router, router.url)); // fire-and-forget: the call fails either way
          return throwError(() => error);
        }),
      );
    }),
  );
};

function withAccessToken<T>(request: HttpRequest<T>, accessToken: string | null): HttpRequest<T> {
  let authorized = request;

  if (accessToken !== null) {
    authorized = request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } });
  }

  return authorized;
}
