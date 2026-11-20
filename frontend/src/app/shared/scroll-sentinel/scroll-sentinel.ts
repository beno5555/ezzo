import { DestroyRef, Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

// How far below the screen the sentinel already counts as reached, so the next page is on its way before
// the reader gets to the end of the list.
const lookAheadMargin = '0px 0px 600px 0px';

// An empty element at the end of a paged list that emits `reached` when it scrolls into view (or is in view
// when it appears). The page shows it only while a next page may be loaded, so it is made again after each
// page and fires again if the end of the list is still in view:
//   @if (list.status() === PageLoadStatus.Idle) { <div appScrollSentinel (reached)="loadMore()"></div> }
@Directive({
  selector: '[appScrollSentinel]',
  host: { 'aria-hidden': 'true' },
})
export class ScrollSentinel {
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
        { rootMargin: lookAheadMargin },
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
