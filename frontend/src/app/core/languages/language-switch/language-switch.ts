import { Component, inject } from '@angular/core';
import { ToggleButton } from '../../../shared/toggle-button/toggle-button';
import { Language, languageNames } from '../language';
import { LanguageStore } from '../language-store';

// One button per language, each named in its own language. The current one is marked in accent.
@Component({
  imports: [ToggleButton],
  selector: 'app-language-switch',
  templateUrl: './language-switch.html',
  styleUrl: './language-switch.css',
})
export class LanguageSwitch {
  private readonly languageStore = inject(LanguageStore);

  protected readonly text = this.languageStore.text;
  protected readonly choices = Object.values(Language).map((language) => ({
    language,
    ownName: languageNames[language],
  }));

  isCurrent(language: Language): boolean {
    return language === this.languageStore.language();
  }

  async choose(language: Language): Promise<void> {
    await this.languageStore.setLanguage(language);
  }
}
