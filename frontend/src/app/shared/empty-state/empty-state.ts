import { Component, input } from '@angular/core';

// Where a list or a page has nothing to show: an icon, a heading and a muted line that says why. The icon is
// projected, since a Lucide icon is a directive on the <svg> itself; anything else projected (a link onward)
// goes below the line:
//   <app-empty-state [heading]="..." [message]="...">
//     <svg class="size-8 text-ink-muted" lucideMessageCircleDashed aria-hidden="true"></svg>
//   </app-empty-state>
// headingLevel keeps the page's outline: 2 under the page's h1, 3 inside a section that has its own h2. The
// caller gives the space around it and any frame.
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
  host: { class: 'flex flex-col items-center gap-2 px-4 py-10 text-center' },
})
export class EmptyState {
  readonly heading = input.required<string>();
  readonly message = input.required<string>();
  readonly headingLevel = input<2 | 3>(2);
}
