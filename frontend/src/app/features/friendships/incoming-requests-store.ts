import {
  EnvironmentInjector,
  Injectable,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { LIMITS } from '../../core/limits';
import { SessionStore } from '../../core/session/session-store';
import { countBadgeText } from '../../core/shell/count-badge/count-badge-text';
import { FriendshipApi } from './friendship-api';

// The friend requests waiting for the signed-in user's answer, as a count for the Friends link.
// The backend gives no total, and the list's totalCount is only the length of the page it returns,
// so the store reads one page of the largest size: a full page means at least that many, maybe more.
// It is not live (spec, Shell): it is read at sign-in, and again whenever a page tells it to.
@Injectable({ providedIn: 'root' })
export class IncomingRequestsStore {
  private readonly injector = inject(EnvironmentInjector);
  private readonly sessionStore = inject(SessionStore);
  private readonly friendshipApi = inject(FriendshipApi);

  private readonly latestPageLength = signal<number | null>(null);
  // Numbers each read, so that only the answer to the newest one is kept.
  private readNumber = 0;

  // The badge's text: null when nothing waits or nothing is read yet, "99+" when the page was full.
  readonly badge = computed(() => {
    const pageLength = this.latestPageLength();
    const isPageFull = pageLength === LIMITS.paging.maxPageSize;

    return countBadgeText(pageLength, { mayBeMore: isPageFull });
  });

  // Called once at startup: reads the count when a user signs in, and forgets it on sign-out.
  followSession(): void {
    effect(
      () => {
        const isSignedIn = this.sessionStore.userId() !== null;
        // untracked: what the read itself touches (the dictionary for failure texts) must not re-run it.
        untracked(() => {
          if (isSignedIn) {
            void this.refresh(); // a failed read keeps the last count
          } else {
            this.clear();
          }
        });
      },
      { injector: this.injector },
    );
  }

  // Called at sign-in, and by any page that changes what waits (the friends page, ticket 15).
  // A failed read keeps the last count.
  async refresh(): Promise<void> {
    this.readNumber++;
    const thisReadNumber = this.readNumber;
    const result = await this.friendshipApi.getPendingRequests({
      pageNumber: LIMITS.paging.firstPageNumber,
      pageSize: LIMITS.paging.maxPageSize,
    });

    const isNewestRead = thisReadNumber === this.readNumber;
    if (result.succeeded && isNewestRead) {
      this.latestPageLength.set(result.data.length);
    }
  }

  // On sign-out. A read still on its way is ignored when it answers.
  clear(): void {
    this.readNumber++;
    this.latestPageLength.set(null);
  }
}
