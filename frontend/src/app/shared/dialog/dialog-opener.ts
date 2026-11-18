import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/portal';
import { Injectable, inject } from '@angular/core';
import { DialogRole } from './dialog-role';

// Each dialog's heading gets its own id, which names the dialog for screen readers (aria-labelledby).
const titleIdPrefix = 'app-dialog-title-';

// The pane that holds the dialog: as wide as the reading column at most, with room around it on a phone,
// and scrolled when the dialog is taller than the screen. It lets clicks through, so a click on that
// room reaches the backdrop and closes the dialog; DialogFrame takes clicks again. The CDK's own pane
// style sets max-width and pointer-events outside any cascade layer, where it beats every Tailwind
// class, hence the important modifier (!) on those two.
const panelClasses = ['w-full', 'max-w-column!', 'overflow-y-auto', 'p-4', 'pointer-events-none!'];
// The page under the dialog sinks out of use, in its own theme's surface-sunken. The CDK's 400 ms fade
// is cut to Tailwind's 150 ms, and turned off under "reduce motion" (DESIGN.md, Do's and Don'ts).
const backdropClasses = ['bg-surface-sunken/80', 'duration-150', 'motion-reduce:transition-none'];

// Opens a dialog over the page, with the behaviour of Angular CDK's dialog: the keyboard focus moves to
// the first control inside and stays there, Escape and a click outside close it, the page behind does
// not scroll, and on closing the focus returns to the control that opened it. The content component
// wraps its template in <app-dialog-frame> and reads its data through inject(DIALOG_DATA):
//   const dialogRef = this.dialogOpener.open<Result, Data, ReportDialog>(ReportDialog, data);
// dialogRef.closed gives the result once, or undefined when the dialog was closed without one.
@Injectable({ providedIn: 'root' })
export class DialogOpener {
  private readonly dialog = inject(Dialog);
  private lastTitleNumber = 0;

  open<Result, Data, Content>(
    content: ComponentType<Content>,
    data: Data,
    role: DialogRole = DialogRole.Dialog,
  ): DialogRef<Result, Content> {
    this.lastTitleNumber += 1;

    return this.dialog.open<Result, Data, Content>(content, {
      data,
      role,
      ariaModal: true,
      ariaLabelledBy: `${titleIdPrefix}${this.lastTitleNumber}`,
      panelClass: panelClasses,
      backdropClass: backdropClasses,
    });
  }
}
