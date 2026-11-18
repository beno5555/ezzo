import { Component, input } from '@angular/core';

// The number beside a navigation link (unread conversations, waiting friend requests), drawn as a pill in
// accent. It shows nothing when text is null. A number alone means little to a screen reader, so the
// caller passes the dictionary entry that says what it counts ("3 unread"), which is read instead.
//   <app-count-badge [text]="unreadBadge()" [labelFor]="text().shell.unreadBadge" />
@Component({
  selector: 'app-count-badge',
  templateUrl: './count-badge.html',
  styleUrl: './count-badge.css',
})
export class CountBadge {
  readonly text = input.required<string | null>();
  readonly labelFor = input.required<(badge: string) => string>();
}
