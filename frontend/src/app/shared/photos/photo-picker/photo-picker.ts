import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { LucideCircleExclamationPoint, LucideImagePlus, LucideX } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { ImageDto } from '../../../features/posts/image-dto';
import { Button } from '../../button/button';
import { IconButton } from '../../icon-button/icon-button';
import { checkPhotos } from '../check-photos';
import { PhotoGridTile } from '../photo-grid-tile';
import { photoGridTiles } from '../photo-grid-tiles';
import { PhotoPreview } from '../photo-preview';
import { PreviewAddressMaker } from '../preview-address-maker';
import { photoRefusalMessage } from '../photo-refusal-message';
import { PhotoRules } from '../photo-rules';
import { PhotoViewerOpener } from '../photo-viewer-opener';

// The compact picker's thumbnails: enough for a phone's message box to stay low.
const maxCompactTiles = 3;

// Choose, check, preview and remove photos before they are sent: the post composer with 10 at most, the
// chat's message box with 5. The form owns the chosen files through [(photos)], so it can send them, empty
// the picker after sending, and put a refused post's or message's photos back; the picker follows, making
// a preview address for each new file and releasing the address of each file that left.
//   <app-photo-picker [rules]="photoRules" [(photos)]="photos" />
// A file the checks refuse is not added, and a message under the thumbnails names it and says why, until
// the next pick or removal. The compact picker ([compact]="true", the message box) keeps a low box: no
// Add photos button (the form puts its own control in its row and calls openFiles()), and small
// thumbnails, three at most, that open the viewer, where each photo can be removed.
@Component({
  selector: 'app-photo-picker',
  imports: [Button, IconButton, LucideCircleExclamationPoint, LucideImagePlus, LucideX],
  templateUrl: './photo-picker.html',
  styleUrl: './photo-picker.css',
})
export class PhotoPicker {
  private readonly previewAddressMaker = inject(PreviewAddressMaker);
  private readonly photoViewerOpener = inject(PhotoViewerOpener);
  // Each chosen file's preview address, kept until the file leaves the selection.
  private readonly addresses = new Map<File, string>();
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  readonly rules = input.required<PhotoRules>();
  readonly compact = input(false);
  // In the order the post or message will show them.
  readonly photos = model.required<readonly File[]>();

  protected readonly text = inject(LanguageStore).text;
  protected readonly previews = signal<readonly PhotoPreview[]>([]);
  protected readonly refusalMessages = signal<readonly string[]>([]);
  // Read by a form that puts its own add control in its row.
  readonly isFull = computed(() => this.photos().length >= this.rules().maxCount);
  protected readonly acceptedTypes = computed(() => this.rules().acceptedTypes.join(','));
  // The previews as the viewer and the grid helper take photos: in the order chosen, which is upload order.
  private readonly previewImages = computed<ImageDto[]>(() =>
    this.previews().map((preview, index) => ({
      id: index + 1,
      address: preview.address,
      orderIndex: index,
    })),
  );
  protected readonly compactTiles = computed(() =>
    photoGridTiles(this.previewImages(), maxCompactTiles),
  );
  // Whether anything shows without the add button: thumbnails or a refusal.
  readonly hasContent = computed(
    () => this.previews().length > 0 || this.refusalMessages().length > 0,
  );

  constructor() {
    effect(() => {
      this.followPhotos(this.photos());
    });
    inject(DestroyRef).onDestroy(() => {
      this.followPhotos([]);
    });
  }

  // The add button, or the form's own control: the hidden file input opens the browser's file chooser.
  openFiles(): void {
    this.fileInput().nativeElement.click();
  }

  // The file input's change event: adds the files that pass the checks after those already chosen.
  pick(fileInput: HTMLInputElement): void {
    const picked = Array.from(fileInput.files ?? []);
    const check = checkPhotos(picked, this.photos().length, this.rules());
    const refusalTexts = this.text().shared.photos.refusals;

    // Emptied, so that a file removed a moment ago can be picked again.
    fileInput.value = '';
    this.refusalMessages.set(
      check.refusals.map((refusal) => photoRefusalMessage(refusal, this.rules(), refusalTexts)),
    );
    if (check.accepted.length > 0) {
      this.photos.update((photos) => [...photos, ...check.accepted]);
    }
  }

  // The others keep their order.
  remove(removed: PhotoPreview): void {
    this.refusalMessages.set([]);
    this.photos.update((photos) => photos.filter((photo) => photo !== removed.file));
  }

  // A compact thumbnail: every picked photo in the viewer, at that one, each with a Remove button.
  openViewer(index: number): void {
    this.photoViewerOpener.open(this.previewImages(), index, (image) => {
      const removed = this.previews().find((preview) => preview.address === image.address);

      if (removed !== undefined) {
        this.remove(removed);
      }
    });
  }

  // The label stands for the thumbnail, so the last one also says what "+N" means.
  protected tileLabel(tile: PhotoGridTile): string {
    const photos = this.text().shared.photos;
    const position = tile.index + 1;
    const total = this.previews().length;

    return tile.moreCount > 0
      ? photos.openMoreButton(position, total, tile.moreCount)
      : photos.openButton(position, total);
  }

  private followPhotos(photos: readonly File[]): void {
    const chosen = new Set(photos);

    for (const [file, address] of this.addresses) {
      const hasLeft = !chosen.has(file);

      if (hasLeft) {
        this.previewAddressMaker.release(address);
        this.addresses.delete(file);
      }
    }
    this.previews.set(photos.map((file) => ({ file, address: this.addressOf(file) })));
  }

  private addressOf(file: File): string {
    const address = this.addresses.get(file) ?? this.previewAddressMaker.create(file);

    this.addresses.set(file, address);

    return address;
  }
}
