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
import LucideCircleExclamationPoint from 'lucide/dist/esm/icons/circle-exclamation-point.mjs';
import LucideImagePlus from 'lucide/dist/esm/icons/image-plus.mjs';
import LucideX from 'lucide/dist/esm/icons/x.mjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { ImageDto } from '../../../features/posts/image-dto';
import { Button } from '../../button/button';
import { IconButton } from '../../icon-button/icon-button';
import { Icon } from '../../icon/icon';
import { checkPhotos } from '../check-photos';
import { fittingTileCount } from '../fitting-tile-count';
import { PhotoGridTile } from '../photo-grid-tile';
import { photoGridTiles } from '../photo-grid-tiles';
import { PhotoPreview } from '../photo-preview';
import { PreviewAddressMaker } from '../preview-address-maker';
import { photoRefusalMessage } from '../photo-refusal-message';
import { PhotoRules } from '../photo-rules';
import { PhotoViewerOpener } from '../photo-viewer-opener';

// Choose, check, preview and remove photos before they are sent: the post composer with 10 at most, the
// chat's message box with 5. The form owns the chosen files through [(photos)], so it can send them, empty
// the picker after sending, and put a refused post's or message's photos back; the picker follows, making
// a preview address for each new file and releasing the address of each file that left.
//   <app-photo-picker [rules]="photoRules" [(photos)]="photos" />
// A file the checks refuse is not added, and a message under the thumbnails names it and says why, until
// the next pick or removal. The compact picker ([compact]="true", the message box) keeps a low box: no
// Add photos button (the form puts its own control in its row and calls openFiles()), and one row of
// small thumbnails, as many as fit, that open the viewer, where each photo can be removed.
@Component({
  selector: 'app-photo-picker',
  imports: [Button, IconButton, Icon],
  templateUrl: './photo-picker.html',
  styleUrl: './photo-picker.css',
})
export class PhotoPicker {
  protected readonly icons = {
    circleExclamationPoint: LucideCircleExclamationPoint,
    imagePlus: LucideImagePlus,
    x: LucideX,
  };

  private readonly previewAddressMaker = inject(PreviewAddressMaker);
  private readonly photoViewerOpener = inject(PhotoViewerOpener);
  // Each chosen file's preview address, kept until the file leaves the selection.
  private readonly addresses = new Map<File, string>();
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly strip = viewChild<ElementRef<HTMLElement>>('strip');

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
  // The compact row's room in thumbnails, measured; null until it is, when every photo shows.
  private readonly stripRoom = signal<number | null>(null);
  protected readonly compactTiles = computed(() =>
    photoGridTiles(this.previewImages(), this.stripRoom() ?? this.previewImages().length),
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
    // The compact row exists only while it shows photos; it is measured again whenever its width changes.
    effect((onCleanup) => {
      const strip = this.strip()?.nativeElement;

      if (strip !== undefined) {
        const observer = new ResizeObserver(() => {
          this.measureStrip(strip);
        });

        observer.observe(strip);
        onCleanup(() => {
          observer.disconnect();
        });
      }
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

  // A compact thumbnail's own remove button.
  removeAt(index: number): void {
    this.remove(this.previews()[index]);
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

  // The row holds the thumbnails and then the photo count, which keeps its width; the thumbnails get the
  // rest. Their size changes at md, so it is read from the first one rather than written down here.
  private measureStrip(strip: HTMLElement): void {
    const list = strip.querySelector('ul');
    const firstTile = list?.querySelector('li');
    const count = strip.lastElementChild;
    const isLaidOut = list instanceof HTMLElement && firstTile instanceof HTMLElement;

    if (isLaidOut && count instanceof HTMLElement) {
      const rowGap = parseFloat(getComputedStyle(strip).columnGap) || 0;
      const tileGap = parseFloat(getComputedStyle(list).columnGap) || 0;
      const room = strip.clientWidth - count.offsetWidth - rowGap;

      this.stripRoom.set(fittingTileCount(room, firstTile.offsetWidth, tileGap));
    }
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
