import { Component, effect, inject, input, signal } from '@angular/core';
import LucideEye from 'lucide/dist/esm/icons/eye.mjs';
import LucideEyeOff from 'lucide/dist/esm/icons/eye-off.mjs';
import { LanguageStore } from '../../core/languages/language-store';
import { Icon } from '../icon/icon';
import { IconButton } from '../icon-button/icon-button';

// The eye button at the end of a password box: it shows the password as plain text and hides it again.
// The eye shows the state: closed while the password is hidden (the start), open while it shows.
// It sits inside the box (the field's control area is positioned), so the box keeps room at its end:
//   <input #password appTextInput class="pe-12" id="password" type="password" formControlName="password" />
//   <app-password-toggle [target]="password" />
// The label stays "Show password" and aria-pressed says whether it is on. Submitting the form hides the
// password again, so the browser still sees a password field when it offers to save it.
@Component({
  selector: 'app-password-toggle',
  imports: [Icon, IconButton],
  templateUrl: './password-toggle.html',
  host: { class: 'absolute end-1.5 top-1/2 -translate-y-1/2' },
})
export class PasswordToggle {
  protected readonly icons = { eye: LucideEye, eyeOff: LucideEyeOff };
  protected readonly text = inject(LanguageStore).text;

  readonly target = input.required<HTMLInputElement>();
  protected readonly isShown = signal(false);

  constructor() {
    effect((onCleanup) => {
      const form = this.target().form;

      if (form !== null) {
        const hide = (): void => this.show(false);
        form.addEventListener('submit', hide);
        onCleanup(() => form.removeEventListener('submit', hide));
      }
    });
  }

  protected toggle(): void {
    this.show(!this.isShown());
  }

  private show(shown: boolean): void {
    this.isShown.set(shown);
    this.target().type = shown ? 'text' : 'password';
  }
}
