import { Component, inject } from '@angular/core';
import { dictionaries } from '../dictionaries';
import { Language } from '../language';
import { LanguageStore } from '../language-store';

// One button per language, each named in its own language. Bare until the design session.
@Component({
  selector: 'app-language-switch',
  templateUrl: './language-switch.html',
  styleUrl: './language-switch.css',
})
export class LanguageSwitch {
  private readonly languageStore = inject(LanguageStore);

  protected readonly text = this.languageStore.text;
  protected readonly choices = Object.values(Language).map((language) => ({
    language,
    ownName: dictionaries[language].languages.ownName,
  }));

  isCurrent(language: Language): boolean {
    return language === this.languageStore.language();
  }

  choose(language: Language): void {
    this.languageStore.setLanguage(language);
  }
}
