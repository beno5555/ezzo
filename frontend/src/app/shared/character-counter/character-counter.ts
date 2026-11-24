import { Component, computed, input } from '@angular/core';

// The used characters out of the limit ("12/500"), in the muted colour and in the danger colour once the
// limit is reached. The text box beside it stops taking characters at the limit (maxlength), so a text
// cannot be too long to send; this only tells the user how much room is left. The caller places it with
// classes on the element, and hides it from screen readers, which hear the limit from the box:
//   <app-character-counter class="text-sm" aria-hidden="true" [length]="length()" [max]="maxLength" />
@Component({
  selector: 'app-character-counter',
  templateUrl: './character-counter.html',
  styleUrl: './character-counter.css',
})
export class CharacterCounter {
  readonly length = input.required<number>();
  readonly max = input.required<number>();

  protected readonly isAtLimit = computed(() => this.length() >= this.max());
}
