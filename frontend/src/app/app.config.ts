import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withRouterConfig,
} from '@angular/router';
import { routes } from './app.routes';
import { HubClient } from './core/hub/hub-client';
import { authInterceptor } from './core/http/auth-interceptor';
import { PageTitleStrategy } from './core/routing/page-title-strategy';
import { NavigationHistoryStore } from './core/routing/navigation-history-store';
import { routerConfig } from './core/routing/router-config';
import { SessionStore } from './core/session/session-store';
import { IncomingRequestsStore } from './features/friendships/incoming-requests-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, withComponentInputBinding(), withRouterConfig(routerConfig)),
    // Names the browser tab after the page, in the chosen language.
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    // Counts the pages behind the one shown, so a "Back" link knows whether the browser can go back.
    provideAppInitializer(() => inject(NavigationHistoryStore).follow()),
    // Restores the session before the first route activates, so the guards see who is signed in (ADR 0004).
    provideAppInitializer(() => inject(SessionStore).restore()),
    // Holds the live connection to the hub while a user is signed in.
    provideAppInitializer(() => inject(HubClient).followSession()),
    // Keeps the Friends link's count of waiting requests while a user is signed in.
    provideAppInitializer(() => inject(IncomingRequestsStore).followSession()),
  ],
};
