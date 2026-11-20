import { Component, computed, inject, input } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { ImageDto } from '../../../features/posts/image-dto';
import { inUploadOrder } from '../in-upload-order';
import { PhotoGridTile } from '../photo-grid-tile';
import { photoGridTiles } from '../photo-grid-tiles';
import { PhotoViewerOpener } from '../photo-viewer-opener';

// A post's photos as up to four thumbnails, "+N" on the last when there are more; a click opens the
// viewer at that photo. One photo fills the width; with three, the first spans both columns.
//   <app-photo-grid [images]="post.images" />
@Component({
  selector: 'app-photo-grid',
  templateUrl: './photo-grid.html',
  styleUrl: './photo-grid.css',
})
export class PhotoGrid {
  private readonly photoViewerOpener = inject(PhotoViewerOpener);

  readonly images = input.required<readonly ImageDto[]>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly tiles = computed(() => photoGridTiles(this.images()));
  // Sorted once per change of the input, for the viewer, which shows every photo.
  private readonly orderedImages = computed(() => inUploadOrder(this.images()));

  // A lone photo and the first of three span the grid's two columns and are wide; every other thumbnail
  // is square.
  protected tileClass(tile: PhotoGridTile): string {
    const tileCount = this.tiles().length;
    const isLone = tileCount === 1;
    const isFirstOfThree = tileCount === 3 && tile.index === 0;
    return isLone || isFirstOfThree ? 'col-span-2 aspect-video' : 'aspect-square';
  }

  // The label replaces the button's content for screen readers, so the last one also says what "+N" means.
  protected tileLabel(tile: PhotoGridTile): string {
    const photos = this.text().shared.photos;
    const position = tile.index + 1;
    const total = this.images().length;
    return tile.moreCount > 0
      ? photos.openMoreButton(position, total, tile.moreCount)
      : photos.openButton(position, total);
  }

  open(tile: PhotoGridTile): void {
    this.photoViewerOpener.open(this.orderedImages(), tile.index);
  }
}
