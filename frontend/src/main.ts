import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initialLanguage, loadInitialLanguage } from './app/core/languages/initial-language';

bootstrapApplication(App, {
  providers: [
    ...appConfig.providers,
    { provide: initialLanguage, useFactory: loadInitialLanguage },
  ],
}).catch((err) => console.error(err));
