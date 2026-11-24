import { Component, computed, input, linkedSignal } from '@angular/core';
import { LucideUser } from '@lucide/angular';
import { AvatarSize } from './avatar-size';
import { ringClass } from './default-picture';

// The picture's size.
const sizeClasses: Record<AvatarSize, string> = {
  [AvatarSize.Small]: 'size-8',
  [AvatarSize.Medium]: 'size-10',
  [AvatarSize.Large]: 'size-24',
};
// The width of the default picture's ring.
const ringWidthClasses: Record<AvatarSize, string> = {
  [AvatarSize.Small]: 'border-2',
  [AvatarSize.Medium]: 'border-2',
  [AvatarSize.Large]: 'border-4',
};

// A user's profile picture, wherever a user appears (DESIGN.md, Components). Without a picture, or when
// it fails to load, it draws the default: a faceless silhouette in a ring coloured by the id. An
// unavailable account (deactivated or deleted) gets a grey ring, even with a picture.
//   <app-avatar [userId]="user.id" />
// No DTO carries a picture's address yet. The picture sits beside the username, which already names the
// user, so screen readers skip it; a caller that shows it alone labels the link or button around it.
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  imports: [LucideUser],
  host: {
    class: 'inline-flex shrink-0',
    '[class]': 'sizeClass()',
    'aria-hidden': 'true',
  },
})
export class Avatar {
  readonly userId = input.required<number>();
  readonly pictureAddress = input<string | null>(null);
  readonly isUnavailable = input(false);
  readonly size = input<AvatarSize>(AvatarSize.Medium);

  // Set when the picture fails to load; a new address tries again.
  private readonly hasPictureFailed = linkedSignal({
    source: this.pictureAddress,
    computation: () => false,
  });

  protected readonly sizeClass = computed(() => sizeClasses[this.size()]);
  protected readonly ring = computed(
    () => `${ringWidthClasses[this.size()]} ${ringClass(this.userId(), this.isUnavailable())}`,
  );
  protected readonly showsPicture = computed(
    () => this.pictureAddress() !== null && !this.isUnavailable() && !this.hasPictureFailed(),
  );

  onPictureError(): void {
    this.hasPictureFailed.set(true);
  }
}
