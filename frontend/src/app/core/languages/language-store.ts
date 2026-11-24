import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';
import { ToastStore } from '../../shared/toasts/toast-store';
import { dictionaryLoaders } from './dictionaries';
import { Dictionary } from './dictionary';
import { initialLanguage } from './initial-language';
import { Language, languageStorageKey } from './language';
import { LanguageSelection } from './language-selection';

// The current language and its dictionary. Templates read text(), so a switch redraws in place.
@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly document = inject(DOCUMENT);
  private readonly toasts = inject(ToastStore);
  private readonly initial = inject(initialLanguage);
  private readonly current = signal(this.initial instanceof Promise ? null : this.initial);
  private latestRequest = 0;

  readonly language = computed(() => this.selection().language);
  readonly text = computed(() => this.selection().text);
  readonly ready = this.initialize();

  constructor() {
    effect(() => {
      const language = this.current()?.language;
      if (language !== undefined) {
        this.document.documentElement.lang = language;
      }
    });
  }

  async setLanguage(language: Language): Promise<void> {
    const request = ++this.latestRequest;
    const isNewLanguage = language !== this.language();
    let text: Dictionary | null;

    try {
      text = isNewLanguage ? await dictionaryLoaders[language]() : this.text();
    } catch {
      text = null;
    }

    const isLatest = request === this.latestRequest;
    if (isLatest) {
      if (text !== null) {
        this.current.set({ language, text });
        localStorage.setItem(languageStorageKey, language);
      } else {
        this.toasts.show(this.text().languages.switchFailed);
      }
    }
  }

  private async initialize(): Promise<void> {
    if (this.initial instanceof Promise) {
      this.current.set(await this.initial);
    }
  }

  private selection(): LanguageSelection {
    const selection = this.current();
    if (selection === null) {
      throw new Error('The startup dictionary has not finished loading.');
    }

    return selection;
  }
}
