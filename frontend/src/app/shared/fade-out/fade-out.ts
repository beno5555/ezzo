import { Directive, input } from '@angular/core';

// The look of "Deleting…, then fade out, then leave" (DeleteFade). While the server has not answered, the
// element dims and takes no clicks (appDeleting; the DeletingNotice inside it says why). Once the server has
// said yes it fades to nothing over 200 ms (appFadeOut), still taking no clicks. Under prefers-reduced-motion
// it stays as it is for the same time. The post card, the comment, the message and the friend's row put it
// on their root:
//   <article [appFadeOut]="isFading()" [appDeleting]="isWaiting()"> … </article>
// The duration is deleteFadeMilliseconds; change both together.
@Directive({
  selector: '[appFadeOut]',
  host: {
    class:
      'transition-opacity duration-200 motion-reduce:transition-none motion-reduce:opacity-100',
    '[class.opacity-0]': 'appFadeOut()',
    '[class.opacity-60]': 'appDeleting()',
    '[class.pointer-events-none]': 'appFadeOut() || appDeleting()',
  },
})
export class FadeOut {
  readonly appFadeOut = input(false);
  readonly appDeleting = input(false);
}
