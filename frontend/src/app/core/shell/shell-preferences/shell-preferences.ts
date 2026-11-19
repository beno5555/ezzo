import { Component, inject } from '@angular/core';
import { LanguageStore } from '../../languages/language-store';
import { LanguageSwitch } from '../../languages/language-switch/language-switch';
import { ThemeSwitch } from '../../themes/theme-switch/theme-switch';

// The language switch and the theme switch, each under its name: the middle of the user's menu, and the
// whole of a guest's language and theme menu.
@Component({
  selector: 'app-shell-preferences',
  imports: [LanguageSwitch, ThemeSwitch],
  templateUrl: './shell-preferences.html',
  styleUrl: './shell-preferences.css',
})
export class ShellPreferences {
  protected readonly text = inject(LanguageStore).text;
}
