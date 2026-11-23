import { Component, input } from '@angular/core';
import { HiddenBadge } from '../../../shared/hidden-badge/hidden-badge';
import { PhotoGrid } from '../../../shared/photos/photo-grid/photo-grid';
import { PostSnapshotDto } from '../../moderation/post-snapshot-dto';
import { SnapshotAuthor } from '../snapshot-author/snapshot-author';

// A post under review, as the backend's snapshot of it: the author and time, the title, the whole text and
// the photos. A report's post and a flagged post show alike.
//   <app-post-snapshot [post]="report.post" />
@Component({
  selector: 'app-post-snapshot',
  imports: [HiddenBadge, PhotoGrid, SnapshotAuthor],
  templateUrl: './post-snapshot.html',
  styleUrl: './post-snapshot.css',
  host: { class: 'flex flex-col gap-3' },
})
export class PostSnapshot {
  readonly post = input.required<PostSnapshotDto>();
}
