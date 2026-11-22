import { Directive, input } from '@angular/core';

// The look of "fade out, then leave": the element fades to nothing over 200 ms while its deletion is
// confirmed and waits (DeleteFade), and takes no clicks meanwhile. Under prefers-reduced-motion it stays as
// it is for the same time. The post card, the comment and the message put it on their root:
//   <article [appFadeOut]="isDeleting()"> … </article>
// The duration is deleteFadeMilliseconds; change both together.
@Directive({
  selector: '[appFadeOut]',
  host: {
    class:
      'transition-opacity duration-200 motion-reduce:transition-none motion-reduce:opacity-100',
    '[class.opacity-0]': 'appFadeOut()',
    '[class.pointer-events-none]': 'appFadeOut()',
  },
})
export class FadeOut {
  readonly appFadeOut = input(false);
}
