import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideX } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { IconButton } from '../../icon-button/icon-button';
import { PhotoViewerData } from '../photo-viewer-data';

// The full-screen viewer that a click on a thumbnail opens (PhotoViewerOpener). It shows one photo at a
// time, whole, with previous and next buttons and the arrow keys; Escape closes it, through the CDK.
@Component({
  selector: 'app-photo-viewer',
  imports: [IconButton, LucideChevronLeft, LucideChevronRight, LucideX],
  templateUrl: './photo-viewer.html',
  styleUrl: './photo-viewer.css',
  host: {
    class: 'flex size-full flex-col bg-surface-sunken text-ink-strong',
    '(keydown.arrowleft)': 'showPrevious()',
    '(keydown.arrowright)': 'showNext()',
  },
})
export class PhotoViewer {
  private readonly dialogRef = inject(DialogRef);
  private readonly data = inject<PhotoViewerData>(DIALOG_DATA);

  protected readonly text = inject(LanguageStore).text;
  protected readonly images = this.data.images;
  // The id PhotoViewerOpener names the dialog by.
  protected readonly titleId = this.dialogRef.config.ariaLabelledBy;
  protected readonly index = signal(this.data.startIndex);
  protected readonly image = computed(() => this.images[this.index()]);
  protected readonly hasSeveral = this.images.length > 1;

  // Previous and next go round, from the last photo to the first and back. A button that turned disabled
  // at either end would drop the keyboard focus out of the dialog, and the arrow keys with it.
  showPrevious(): void {
    this.index.update((index) => (index - 1 + this.images.length) % this.images.length);
  }

  showNext(): void {
    this.index.update((index) => (index + 1) % this.images.length);
  }

  close(): void {
    this.dialogRef.close();
  }
}
