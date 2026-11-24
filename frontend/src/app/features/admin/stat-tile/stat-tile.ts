import { Component, input } from '@angular/core';

// One number of the statistics page with its name: a raised card, the number large above its label.
// `value` is already written in the reader's language (a thousands separator), so the tile only lays it out.
//   <app-stat-tile [label]="text().admin.statistics.posts" [value]="format(totals.posts)" />
@Component({
  selector: 'app-stat-tile',
  templateUrl: './stat-tile.html',
  styleUrl: './stat-tile.css',
  host: { class: 'block rounded-lg border border-border bg-surface-raised p-4 shadow-raised' },
})
export class StatTile {
  readonly label = input.required<string>();
  readonly value = input.required<string>();
}
