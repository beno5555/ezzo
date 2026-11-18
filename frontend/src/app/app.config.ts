import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, TitleStrategy, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { HubClient } from './core/hub/hub-client';
import { authInterceptor } from './core/http/auth-interceptor';
import { PageTitleStrategy } from './core/routing/page-title-strategy';
import { SessionStore } from './core/session/session-store';
import { IncomingRequestsStore } from './features/friendships/incoming-requests-store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, withComponentInputBinding()),
    // Names the browser tab after the page, in the chosen language.
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    // Restores the session before the first route activates, so the guards see who is signed in (ADR 0004).
    provideAppInitializer(() => inject(SessionStore).restore()),
    // Holds the live connection to the hub while a user is signed in.
    provideAppInitializer(() => inject(HubClient).followSession()),
    // Keeps the Friends link's count of waiting requests while a user is signed in.
    provideAppInitializer(() => inject(IncomingRequestsStore).followSession()),
  ],
};
