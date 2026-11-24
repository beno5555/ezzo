import { Component, computed, inject } from '@angular/core';
import LucideHeart from 'lucide/dist/esm/icons/heart.mjs';
import LucideMessageCircle from 'lucide/dist/esm/icons/message-circle.mjs';
import { LanguageStore } from '../../../../core/languages/language-store';
import { Avatar } from '../../../../shared/avatar/avatar';
import { Icon } from '../../../../shared/icon/icon';

// The picture of the app on the landing page: two made things in the feed, in the shape of the post card
// (shared/post-card), set askew and overlapping like two prints laid on a table. It is a drawing, not
// posts: it asks the backend for nothing, its buttons are not buttons, and screen readers skip it.
@Component({
  selector: 'app-landing-picture',
  imports: [Avatar, Icon],
  templateUrl: './landing-picture.html',
  styleUrl: './landing-picture.css',
  host: { 'aria-hidden': 'true' },
})
export class LandingPicture {
  protected readonly icons = { heart: LucideHeart, messageCircle: LucideMessageCircle };

  protected readonly text = inject(LanguageStore).text;
  // The author ids pick the discs' colours.
  protected readonly posts = computed(() => {
    const { pots, quilt } = this.text().auth.landingPicture;

    return [
      { kind: 'pots', authorId: 3, likeCount: 24, commentCount: 6, ...pots },
      { kind: 'quilt', authorId: 8, likeCount: 41, commentCount: 12, ...quilt },
    ] as const;
  });
}
