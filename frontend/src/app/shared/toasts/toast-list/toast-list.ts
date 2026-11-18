import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideChevronRight } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { Toast } from '../toast';
import { ToastStore } from '../toast-store';

// Where the toasts appear, placed once in the app shell. On a phone they sit at the top, clear of the
// bottom bar and of the on-screen keyboard; from 768 px, at the bottom end, clear of the top bar. The
// region is always there and polite, so a screen reader reads each toast as it arrives without
// breaking off what it was reading. Toasts lie under an open dialog: a dialog is modal.
// A toast with a link opens it on a click, and leaves at once.
@Component({
  imports: [RouterLink, LucideChevronRight],
  selector: 'app-toast-list',
  templateUrl: './toast-list.html',
  styleUrl: './toast-list.css',
})
export class ToastList {
  private readonly toastStore = inject(ToastStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly toasts = this.toastStore.visible;

  dismissFollowed(toast: Toast): void {
    this.toastStore.dismiss(toast.id);
  }
}
