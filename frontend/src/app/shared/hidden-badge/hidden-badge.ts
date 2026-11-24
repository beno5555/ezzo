import { Component, inject } from '@angular/core';
import LucideEyeOff from 'lucide/dist/esm/icons/eye-off.mjs';
import { LanguageStore } from '../../core/languages/language-store';
import { Icon } from '../icon/icon';

// The "Hidden" badge on a post or a comment that moderation hid. Only its author and administrators ever
// receive such content, so the caller shows the badge on the item's flag alone, with no role check:
//   @if (isHidden()) { <app-hidden-badge /> }
// The icon, the weight and the warning colour make it read apart from the text, in both themes, with no
// box around it: a boxed tag would be louder than the post it marks (owner, 2026-11-23).
@Component({
  selector: 'app-hidden-badge',
  imports: [Icon],
  templateUrl: './hidden-badge.html',
  styleUrl: './hidden-badge.css',
})
export class HiddenBadge {
  protected readonly icons = { eyeOff: LucideEyeOff };

  protected readonly text = inject(LanguageStore).text;
}
