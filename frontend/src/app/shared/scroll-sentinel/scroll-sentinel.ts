import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';
import { SentinelSide } from './sentinel-side';

// How far beyond the visible part the sentinel already counts as reached, so the next page is on its way
// before the reader gets to the end of the list: below the screen for a list that grows downward, above
// it for one that grows upward.
const lookAheadMargins: Record<SentinelSide, string> = {
  [SentinelSide.Below]: '0px 0px 600px 0px',
  [SentinelSide.Above]: '600px 0px 0px 0px',
};

// An empty element at the end of a paged list that emits `reached` when it scrolls into view (or is in view
// when it appears). The page shows it only while a next page may be loaded, so it is made again after each
// page and fires again if the end of the list is still in view:
//   @if (list.status() === PageLoadStatus.Idle) { <div appScrollSentinel (reached)="loadMore()"></div> }
// A list that scrolls inside its own box passes that box as scrollArea, so the look-ahead is measured from
// its edge rather than the screen's. A chat's history grows upward, so its sentinel sits above the
// messages with side="above".
@Directive({
  selector: '[appScrollSentinel]',
  host: { 'aria-hidden': 'true' },
})
export class ScrollSentinel {
  readonly scrollArea = input<HTMLElement | null>(null);
  readonly side = input<SentinelSide>(SentinelSide.Below);
  readonly reached = output<void>();

  constructor() {
    const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          const isInView = entries.some((entry) => entry.isIntersecting);
          if (isInView) {
            this.reached.emit();
          }
        },
        { root: this.scrollArea(), rootMargin: lookAheadMargins[this.side()] },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
