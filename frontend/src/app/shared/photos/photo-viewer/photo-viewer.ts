import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, computed, inject, signal } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight, LucideTrash2, LucideX } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { Button } from '../../button/button';
import { IconButton } from '../../icon-button/icon-button';
import { PhotoViewerData } from '../photo-viewer-data';

// The full-screen viewer that a click on a thumbnail opens (PhotoViewerOpener). It shows one photo at a
// time, whole, with previous and next buttons and the arrow keys; Escape closes it, through the CDK. Opened
// on picked photos, it also removes them one by one, and closes once none is left.
@Component({
  selector: 'app-photo-viewer',
  imports: [Button, IconButton, LucideChevronLeft, LucideChevronRight, LucideTrash2, LucideX],
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
  protected readonly images = signal(this.data.images);
  // The id PhotoViewerOpener names the dialog by.
  protected readonly titleId = this.dialogRef.config.ariaLabelledBy;
  protected readonly index = signal(this.data.startIndex);
  protected readonly image = computed(() => this.images()[this.index()]);
  protected readonly hasSeveral = computed(() => this.images().length > 1);
  protected readonly canRemove = this.data.onRemove !== undefined;

  // Previous and next go round, from the last photo to the first and back. A button that turned disabled
  // at either end would drop the keyboard focus out of the dialog, and the arrow keys with it.
  showPrevious(): void {
    const count = this.images().length;
    this.index.update((index) => (index - 1 + count) % count);
  }

  showNext(): void {
    const count = this.images().length;
    this.index.update((index) => (index + 1) % count);
  }

  // The next photo takes the removed one's place; after the last, the one before it.
  remove(): void {
    const removed = this.image();
    const left = this.images().filter((image) => image !== removed);
    const isEmpty = left.length === 0;

    this.data.onRemove?.(removed);
    this.images.set(left);
    if (isEmpty) {
      this.close();
    } else {
      this.index.update((index) => Math.min(index, left.length - 1));
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
