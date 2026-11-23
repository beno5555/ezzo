import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageStore } from '../../../core/languages/language-store';
import { appAddresses } from '../../../core/routing/app-addresses';
import { HiddenBadge } from '../../../shared/hidden-badge/hidden-badge';
import { TextLink } from '../../../shared/text-link/text-link';
import { CommentSnapshotDto } from '../../moderation/comment-snapshot-dto';
import { SnapshotAuthor } from '../snapshot-author/snapshot-author';

// A comment under review, as the backend's snapshot of it: the author and time, the text, and the title
// of the post it is on, which leads to that post. A report's comment and a flagged comment show alike.
//   <app-comment-snapshot [comment]="report.comment" />
@Component({
  selector: 'app-comment-snapshot',
  imports: [RouterLink, HiddenBadge, SnapshotAuthor, TextLink],
  templateUrl: './comment-snapshot.html',
  styleUrl: './comment-snapshot.css',
  host: { class: 'flex flex-col gap-3' },
})
export class CommentSnapshot {
  protected readonly text = inject(LanguageStore).text;

  readonly comment = input.required<CommentSnapshotDto>();

  protected readonly postAddress = computed(() => appAddresses.post(this.comment().postId));
}
