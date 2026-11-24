import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { dictionaryLoaders } from './dictionaries';
import { initialLanguage } from './initial-language';
import { Language, languageStorageKey } from './language';

// The current language and its dictionary. Templates read text(), so a switch redraws in place.
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly document = inject(DOCUMENT);
  private readonly current = signal(inject(initialLanguage));
  private readonly failed = signal(false);
  private latestRequest = 0;

  readonly language = computed(() => this.current().language);
  readonly text = computed(() => this.current().text);
  readonly switchFailed = this.failed.asReadonly();

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
    });
  }

  async setLanguage(language: Language): Promise<void> {
    const request = ++this.latestRequest;
    const isNewLanguage = language !== this.language();
    this.failed.set(false);

    try {
      const text = isNewLanguage ? await dictionaryLoaders[language]() : this.text();
      const isLatest = request === this.latestRequest;
      if (isLatest) {
        localStorage.setItem(languageStorageKey, language);
        this.current.set({ language, text });
      }
    } catch {
      const isLatest = request === this.latestRequest;
      if (isLatest) {
        this.failed.set(true);
      }
    }
  }
}
