import { Component, inject, input } from '@angular/core';
import { LanguageStore } from '../../../core/languages/language-store';
import { Avatar } from '../../../shared/avatar/avatar';
import { UserSnapshotDto } from '../../reports/user-snapshot-dto';

// A reported user, as the backend's snapshot of the account: the real username, whatever the account's
// state, and the bio. It leads nowhere: a deactivated or deleted account has no profile page to open.
//   <app-user-snapshot [user]="report.user" />
@Component({
  selector: 'app-user-snapshot',
  imports: [Avatar],
  templateUrl: './user-snapshot.html',
  styleUrl: './user-snapshot.css',
  host: { class: 'flex flex-col gap-3' },
})
export class UserSnapshot {
  protected readonly text = inject(LanguageStore).text;

  readonly user = input.required<UserSnapshotDto>();
}
