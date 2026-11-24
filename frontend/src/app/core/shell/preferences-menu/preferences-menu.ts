import { Component, inject } from '@angular/core';
import LucideLanguages from 'lucide/dist/esm/icons/languages.mjs';
import { Icon } from '../../../shared/icon/icon';
import { LanguageStore } from '../../languages/language-store';
import { ShellPopover } from '../shell-popover/shell-popover';
import { ShellPreferences } from '../shell-preferences/shell-preferences';

// A guest's language and theme switches, behind one button: beside the logo, the search box, Sign in and
// Register, the two switches do not fit one row at 768 px, nor at all on a phone.
@Component({
  selector: 'app-preferences-menu',
  imports: [ShellPopover, ShellPreferences, Icon],
  templateUrl: './preferences-menu.html',
  styleUrl: './preferences-menu.css',
})
export class PreferencesMenu {
  protected readonly icons = { languages: LucideLanguages };

  protected readonly text = inject(LanguageStore).text;
}
