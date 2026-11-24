import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideChevronRight,
  LucideCircleCheck,
  LucideCircleX,
  LucideCloudUpload,
  LucideHeart,
  LucideMessageCircle,
  LucideMessageSquareText,
  LucideX,
} from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { Avatar } from '../../avatar/avatar';
import { IconButton } from '../../icon-button/icon-button';
import { ToastLook } from '../toast-look';
import { Toast } from '../toast';
import { ToastStore } from '../toast-store';

// The badge's colour on a person's picture: a like is red, the others are the accent. Online has no
// badge of this kind: it is the green dot.
const badgeColors: Partial<Record<ToastLook, string>> = {
  [ToastLook.Like]: 'bg-danger',
  [ToastLook.Comment]: 'bg-accent',
  [ToastLook.Message]: 'bg-accent',
};

// Where the toasts appear, placed once in the app shell. On a phone they sit at the top, clear of the
// bottom bar and of the on-screen keyboard; from 768 px, at the bottom end, clear of the top bar. The
// region is always there and polite, so a screen reader reads each toast as it arrives without
// breaking off what it was reading. Toasts lie under an open dialog: a dialog is modal.
// A toast with a link opens it on a click, and leaves at once. The close button (DESIGN.md, Components)
// discards any toast. A toast slides in from the edge it sits at (DESIGN.md, Do's and Don'ts),
// and stays still under "reduce motion".
@Component({
  imports: [
    Avatar,
    IconButton,
    NgTemplateOutlet,
    RouterLink,
    LucideChevronRight,
    LucideCircleCheck,
    LucideCircleX,
    LucideCloudUpload,
    LucideHeart,
    LucideMessageCircle,
    LucideMessageSquareText,
    LucideX,
  ],
  selector: 'app-toast-list',
  templateUrl: './toast-list.html',
  styleUrl: './toast-list.css',
})
export class ToastList {
  private readonly toastStore = inject(ToastStore);

  protected readonly text = inject(LanguageStore).text;
  protected readonly toasts = this.toastStore.visible;
  protected readonly ToastLook = ToastLook;

  dismiss(toast: Toast): void {
    this.toastStore.dismiss(toast.id);
  }

  protected badgeColorOf(look: ToastLook): string {
    return badgeColors[look] ?? '';
  }
}
