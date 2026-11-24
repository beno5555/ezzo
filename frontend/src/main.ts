import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { initialLanguage, loadInitialLanguage } from './app/core/languages/initial-language';

async function start(): Promise<void> {
  const language = await loadInitialLanguage();
  await bootstrapApplication(App, {
    providers: [...appConfig.providers, { provide: initialLanguage, useValue: language }],
  });
}

start().catch((err) => console.error(err));
