import { Component, computed, input } from '@angular/core';

// Used characters out of the limit ("12/1000"), small, in the corner of a one-row text box; red at the
// limit. Screen readers skip it: the box's maxlength already stops them there. The caller shows it from the
// first character typed and keeps room for it on the box's right, so the text never runs under it:
//   <div class="relative">
//     <textarea [class.pe-16]="length() > 0" ...></textarea>
//     @if (length() > 0) {
//       <app-character-count class="absolute end-3 bottom-2" [length]="length()" [maxLength]="maxLength" />
//     }
//   </div>
@Component({
  selector: 'app-character-count',
  templateUrl: './character-count.html',
  host: {
    class: 'pointer-events-none text-xs',
    '[class.text-danger]': 'isAtLimit()',
    '[class.text-ink-muted]': '!isAtLimit()',
    'aria-hidden': 'true',
  },
})
export class CharacterCount {
  readonly length = input.required<number>();
  readonly maxLength = input.required<number>();

  protected readonly isAtLimit = computed(() => this.length() >= this.maxLength());
}
