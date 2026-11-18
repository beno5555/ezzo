import { Component, inject } from '@angular/core';
import { ToggleButton } from '../../../shared/toggle-button/toggle-button';
import { LanguageStore } from '../../languages/language-store';
import { Theme } from '../theme';
import { ThemeStore } from '../theme-store';

// One button per theme, named from the dictionary (themes.light, themes.dark). The current one is marked
// in accent.
@Component({
  imports: [ToggleButton],
  selector: 'app-theme-switch',
  templateUrl: './theme-switch.html',
  styleUrl: './theme-switch.css',
})
export class ThemeSwitch {
  private readonly themeStore = inject(ThemeStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly choices = Object.values(Theme);

  isCurrent(theme: Theme): boolean {
    return theme === this.themeStore.theme();
  }

  choose(theme: Theme): void {
    this.themeStore.setTheme(theme);
  }
}
