import { Dialog } from '@angular/cdk/dialog';
import { Injectable, inject } from '@angular/core';
import { ImageDto } from '../../features/posts/image-dto';
import { PhotoViewer } from './photo-viewer/photo-viewer';
import { PhotoViewerData } from './photo-viewer-data';

// One viewer is open at a time, so its heading needs no number (DialogOpener numbers its dialogs).
const titleId = 'app-photo-viewer-title';

// The pane fills the screen, unlike DialogOpener's column-wide one. The CDK's own pane style sets max-width
// and max-height outside any cascade layer, where it beats every Tailwind class, hence the important (!).
const panelClasses = ['size-full', 'max-w-none!', 'max-h-none!'];
const backdropClasses = ['bg-surface-sunken', 'duration-150', 'motion-reduce:transition-none'];

// Opens a post's or a message's photos full screen, at the one clicked. From the CDK dialog it gets the
// rest: Escape closes it, the focus stays inside and returns to the thumbnail, the page does not scroll.
@Injectable({ providedIn: 'root' })
export class PhotoViewerOpener {
  private readonly dialog = inject(Dialog);

  open(images: readonly ImageDto[], startIndex: number): void {
    this.dialog.open<void, PhotoViewerData, PhotoViewer>(PhotoViewer, {
      data: { images, startIndex },
      ariaModal: true,
      ariaLabelledBy: titleId,
      panelClass: panelClasses,
      backdropClass: backdropClasses,
    });
  }
}
