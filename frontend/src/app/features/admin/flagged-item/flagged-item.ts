import { Component, inject, input, output } from '@angular/core';
import LucideEye from 'lucide/dist/esm/icons/eye.mjs';
import LucideEyeOff from 'lucide/dist/esm/icons/eye-off.mjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { Button } from '../../../shared/button/button';
import { FadeOut } from '../../../shared/fade-out/fade-out';
import { Icon } from '../../../shared/icon/icon';

// One flagged post or comment in the moderation queue: its snapshot, projected, above the two ways to
// settle it, Hide and Make visible. It only shows the item: a click asks the page, which sends it and
// fades the item out (SettlingList).
//   <app-flagged-item [isFading]="posts.isFading(post.id)" (hide)="hide(post)" (makeVisible)="show(post)">
//     <app-post-snapshot [post]="post" />
//   </app-flagged-item>
@Component({
  selector: 'app-flagged-item',
  imports: [Button, FadeOut, Icon],
  templateUrl: './flagged-item.html',
  styleUrl: './flagged-item.css',
  host: { class: 'block' },
})
export class FlaggedItem {
  protected readonly icons = { eye: LucideEye, eyeOff: LucideEyeOff };

  protected readonly text = inject(LanguageStore).text;

  // True while the item fades out on its way out of the queue.
  readonly isFading = input(false);
  readonly hide = output();
  readonly makeVisible = output();

  requestHide(): void {
    this.hide.emit();
  }

  requestMakeVisible(): void {
    this.makeVisible.emit();
  }
}
