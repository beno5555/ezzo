import { Component, inject, input, output } from '@angular/core';
import { LucideEye, LucideEyeOff } from '@lucide/angular';
import { LanguageStore } from '../../../core/languages/language-store';
import { Button } from '../../../shared/button/button';
import { FadeOut } from '../../../shared/fade-out/fade-out';

// One flagged post or comment in the moderation queue: its snapshot, projected, above the two ways to
// settle it, Hide and Make visible. It only shows the item: a click asks the page, which sends it and
// fades the item out (SettlingList).
//   <app-flagged-item [isFading]="posts.isFading(post.id)" (hide)="hide(post)" (makeVisible)="show(post)">
//     <app-post-snapshot [post]="post" />
//   </app-flagged-item>
@Component({
  selector: 'app-flagged-item',
  imports: [Button, FadeOut, LucideEye, LucideEyeOff],
  templateUrl: './flagged-item.html',
  styleUrl: './flagged-item.css',
  host: { class: 'block' },
})
export class FlaggedItem {
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
