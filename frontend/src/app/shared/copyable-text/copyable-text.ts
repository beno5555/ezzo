import { Component, inject, input } from '@angular/core';
import { LucideCopy } from '@lucide/angular';
import { LanguageStore } from '../../core/languages/language-store';
import { IconButton } from '../icon-button/icon-button';
import { ToastLook } from '../toasts/toast-look';
import { ToastStore } from '../toasts/toast-store';

// A short piece of text, such as a username or an email, that is cut with an ellipsis when its place is
// too narrow and can be copied: a click on the text copies it, and so does the copy button beside it.
//   <app-copyable-text [value]="row.email" />
// The caller sets the room, with a maximum width on the component's parent. The full value is the text's
// title. A screen reader meets only the button, which names the value; the text is a mouse shortcut.
@Component({
  selector: 'app-copyable-text',
  imports: [IconButton, LucideCopy],
  templateUrl: './copyable-text.html',
  host: { class: 'flex min-w-0 items-center gap-1' },
})
export class CopyableText {
  private readonly toastStore = inject(ToastStore);

  readonly value = input.required<string>();

  protected readonly text = inject(LanguageStore).text;

  protected async copy(): Promise<void> {
    const texts = this.text().shared.copy;

    try {
      await navigator.clipboard.writeText(this.value());
      this.toastStore.show(texts.copied, { look: ToastLook.Success });
    } catch {
      this.toastStore.show(texts.failed);
    }
  }
}
