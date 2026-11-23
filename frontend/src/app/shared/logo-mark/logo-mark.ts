import { Component } from '@angular/core';

// The "zz" speech-bubble mark (DESIGN.md, Brand), the same drawing as the browser-tab icon
// (public/favicon.svg). It is only the drawing: the caller gives its size and says the name beside it.
//   <app-logo-mark class="size-9" />
@Component({
  selector: 'app-logo-mark',
  templateUrl: './logo-mark.html',
  styleUrl: './logo-mark.css',
  host: { class: 'block shrink-0', 'aria-hidden': 'true' },
})
export class LogoMark {}
