import { Component, computed, input, linkedSignal } from '@angular/core';
import { AvatarSize } from './avatar-size';
import { defaultPicture } from './default-picture';

// The disc's size, and the size of the initials on it.
const sizeClasses: Record<AvatarSize, string> = {
  [AvatarSize.Small]: 'size-8 text-xs',
  [AvatarSize.Medium]: 'size-10 text-sm',
  [AvatarSize.Large]: 'size-24 text-2xl',
};

// A user's profile picture, wherever a user appears (DESIGN.md, Components). Without a picture, or when
// it fails to load, it draws the default: the initials on a disc chosen by the id. An unavailable
// account (deactivated or deleted) gets the grey disc with no letters, even with a picture.
//   <app-avatar [userId]="user.id" [username]="user.username" />
// No DTO carries a picture's address yet. The picture sits beside the username, which already names the
// user, so screen readers skip it; a caller that shows it alone labels the link or button around it.
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  host: {
    class: 'inline-flex shrink-0',
    '[class]': 'sizeClass()',
    'aria-hidden': 'true',
  },
})
export class Avatar {
  readonly userId = input.required<number>();
  readonly username = input.required<string>();
  readonly pictureAddress = input<string | null>(null);
  readonly isUnavailable = input(false);
  readonly size = input<AvatarSize>(AvatarSize.Medium);

  // Set when the picture fails to load; a new address tries again.
  private readonly hasPictureFailed = linkedSignal({
    source: this.pictureAddress,
    computation: () => false,
  });

  protected readonly sizeClass = computed(() => sizeClasses[this.size()]);
  protected readonly picture = computed(() =>
    defaultPicture(this.userId(), this.username(), this.isUnavailable()),
  );
  protected readonly showsPicture = computed(
    () => this.pictureAddress() !== null && !this.isUnavailable() && !this.hasPictureFailed(),
  );

  onPictureError(): void {
    this.hasPictureFailed.set(true);
  }
}
