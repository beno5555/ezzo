import { Component } from '@angular/core';

// One repeat of the carving, in the drawing's own units: a hanging tooth, a drilled hole between two
// teeth, and the rail under them.
const toothWidth = 22;
const toothDepth = 8.5;
const holeCentreDepth = 8;
const holeRadius = 1.75;
const railTop = 12;
const railHeight = 2;
const toothCount = 4;

const teeth = Array.from(
  { length: toothCount },
  (_, index) =>
    `M${index * toothWidth} 0h${toothWidth}L${index * toothWidth + toothWidth / 2} ${toothDepth}z`,
).join('');

const holes = Array.from({ length: toothCount + 1 }, (_, index) => index * toothWidth);

// The balcony's fretwork: the carved valance of a Tbilisi balcony, a row of hanging teeth with drilled
// holes on a rail. It is the brand's one ornament and appears only under the large wordmark on the
// sign-in pages (DESIGN.md, Brand). It is decoration, so screen readers skip it. It takes the text
// colour of its host, so the caller colours it: <app-fretwork class="w-0 min-w-full text-accent" />
// "w-0 min-w-full" makes it exactly as wide as its column without widening it, so a column sized to the
// wordmark stays the wordmark's width.
@Component({
  selector: 'app-fretwork',
  templateUrl: './fretwork.html',
  styleUrl: './fretwork.css',
  host: { class: 'block', 'aria-hidden': 'true' },
})
export class Fretwork {
  protected readonly width = toothCount * toothWidth;
  protected readonly height = railTop + railHeight;
  protected readonly teeth = teeth;
  protected readonly holes = holes;
  protected readonly holeCentreDepth = holeCentreDepth;
  protected readonly holeRadius = holeRadius;
  protected readonly railTop = railTop;
  protected readonly railHeight = railHeight;
}
