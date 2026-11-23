import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { appAddresses } from '../../../core/routing/app-addresses';
import { Avatar } from '../../../shared/avatar/avatar';
import { TextLink } from '../../../shared/text-link/text-link';
import { MinimalUserDto } from '../../users/minimal-user-dto';

// The line above a snapshot of a post or a comment: who wrote it, and when. An author whose account is
// unavailable has no id, and is shown as text with no link, as on the post card.
//   <app-snapshot-author [author]="post.author" [uploadedAt]="post.uploadedAt" />
@Component({
  selector: 'app-snapshot-author',
  imports: [RouterLink, Avatar, TextLink],
  templateUrl: './snapshot-author.html',
  styleUrl: './snapshot-author.css',
  host: { class: 'flex items-center gap-3' },
})
export class SnapshotAuthor {
  protected readonly dateFormatter = inject(DateFormatter);

  readonly author = input.required<MinimalUserDto>();
  readonly uploadedAt = input.required<string>();

  protected readonly isAvailable = computed(() => this.author().id !== null);
  // The avatar picks its disc by id; an unavailable author gets the grey disc, whatever the id.
  protected readonly avatarId = computed(() => this.author().id ?? 0);
  protected readonly profileAddress = computed(() => appAddresses.profile(this.author().username));
}
