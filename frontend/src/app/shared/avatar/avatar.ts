import { Component, computed, input, linkedSignal } from '@angular/core';
import LucideUser from 'lucide/dist/esm/icons/user.mjs';
import { Icon } from '../icon/icon';
import { AvatarSize } from './avatar-size';
import { ringClass } from './default-picture';

const sizeClasses: Record<AvatarSize, string> = {
  [AvatarSize.Small]: 'size-8',
  [AvatarSize.Medium]: 'size-10',
  [AvatarSize.Large]: 'size-24',
};
const ringWidthClasses: Record<AvatarSize, string> = {
  [AvatarSize.Small]: 'border-2',
  [AvatarSize.Medium]: 'border-2',
  [AvatarSize.Large]: 'border-4',
};

// An unavailable account (deactivated or deleted) shows the default silhouette with a grey ring,
// even if a picture address is available. The username usually identifies the user, so screen readers
// skip the avatar. A caller that shows it alone labels the link or button around it.
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  imports: [Icon],
  host: {
    class: 'inline-flex shrink-0',
    '[class]': 'sizeClass()',
    'aria-hidden': 'true',
  },
})
export class Avatar {
  protected readonly icons = { user: LucideUser };

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
