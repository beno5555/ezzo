import { Component, computed, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideHeart, LucideMessageCircle } from '@lucide/angular';
import { DateFormatter } from '../../core/languages/date-formatter';
import { LanguageStore } from '../../core/languages/language-store';
import { appAddresses } from '../../core/routing/app-addresses';
import { StandardPostDisplayDto } from '../../features/posts/standard-post-display-dto';
import { ActionButton } from '../action-button/action-button';
import { Avatar } from '../avatar/avatar';
import { PhotoGrid } from '../photos/photo-grid/photo-grid';
import { TextLink } from '../text-link/text-link';

// One post in a list: the feed, a profile's posts, the post's own page and the admin panel, so it sits
// in shared/. It only shows the post: a click on the like button asks the page through likeToggle, and the
// page sends it through PostLikeStore and puts the changed post in its list (the store's comment shows how).
//   <app-post-card [post]="post" [isLiking]="postLikes.isLiking(post.id)" (likeToggle)="toggleLike(post)" />
// An author whose account is unavailable has no id, and is shown as text with no link.
@Component({
  selector: 'app-post-card',
  imports: [
    RouterLink,
    ActionButton,
    Avatar,
    PhotoGrid,
    TextLink,
    LucideHeart,
    LucideMessageCircle,
  ],
  templateUrl: './post-card.html',
  styleUrl: './post-card.css',
})
export class PostCard {
  readonly post = input.required<StandardPostDisplayDto>();
  // True while the post's like or unlike is on its way. The button is then marked aria-disabled rather
  // than disabled, which would drop the keyboard focus; the store ignores a click meanwhile.
  readonly isLiking = input(false);
  readonly likeToggle = output();

  protected readonly text = inject(LanguageStore).text;
  protected readonly dateFormatter = inject(DateFormatter);
  protected readonly isAuthorAvailable = computed(() => this.post().author.id !== null);
  // The avatar picks its disc by id; an unavailable author gets the grey disc, whatever the id.
  protected readonly authorAvatarId = computed(() => this.post().author.id ?? 0);
  protected readonly profileAddress = computed(() =>
    appAddresses.profile(this.post().author.username),
  );
  protected readonly postAddress = computed(() => appAddresses.post(this.post().id));

  requestLikeToggle(): void {
    this.likeToggle.emit();
  }
}
