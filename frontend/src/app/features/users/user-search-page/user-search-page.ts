import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideSearch, LucideUserX } from '@lucide/angular';
import { map } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { PagedList } from '../../../core/paging/paged-list';
import {
  appAddresses,
  searchQueryParameter,
  searchQueryParameters,
} from '../../../core/routing/app-addresses';
import { SessionStore } from '../../../core/session/session-store';
import { Debouncer, typingPauseMilliseconds } from '../../../core/timing/debouncer';
import { Button } from '../../../shared/button/button';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { TextInput } from '../../../shared/text-input/text-input';
import { UserRow } from '../../../shared/user-row/user-row';
import { FriendshipAction } from '../../friendships/friendship-action';
import { SearchUserDto } from '../search-user-dto';
import { UserApi } from '../user-api';
import { UserSearchStore } from '../user-search-store';

// The search page at /search?q=…. The address holds the query, so the top bar's search box, this
// page's own form and the browser's Back button all lead to the same search. Typing searches too, once
// the visitor pauses: the address is replaced, not added to, so Back does not walk through every try.
// Each search has its own PagedList and the page shows only the latest, so a slow answer to older words
// lands in a list nobody sees any more (ADR 0003). Results load page after page as the visitor scrolls.
// Each result is a UserRow with the friendship buttons its relationship offers to a signed-in visitor
// (UserSearchStore); a guest sees the names alone.
@Component({
  selector: 'app-user-search-page',
  imports: [
    ReactiveFormsModule,
    Button,
    EmptyState,
    LoadFailure,
    ScrollSentinel,
    TextInput,
    UserRow,
    LucideSearch,
    LucideUserX,
  ],
  providers: [UserSearchStore],
  templateUrl: './user-search-page.html',
  styleUrl: './user-search-page.css',
})
export class UserSearchPage {
  private readonly userApi = inject(UserApi);
  private readonly router = inject(Router);
  private readonly sessionStore = inject(SessionStore);

  // The query in the address. Read from the route, not bound as an input: an input's name must be a literal,
  // which would repeat searchQueryParameter where nothing checks the two agree.
  private readonly addressQuery = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((parameters) => parameters.get(searchQueryParameter)),
    ),
  );

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly searchStore = inject(UserSearchStore);
  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(LIMITS.users.usernameMaxLength)]],
  });

  // The latest search, or null while there are no words to search for (the page then shows its prompt).
  protected readonly results = signal<PagedList<SearchUserDto> | null>(null);
  // The words the results are for, named in the empty state.
  protected readonly searchedWords = signal('');

  // The query this page just put in the address after a pause in typing. The address then changes to it,
  // and the field must keep what the visitor has typed since, not be reset to the older words.
  private typedAddressQuery: string | null = null;

  private readonly typingPause = new Debouncer(
    () => void this.searchTypedWords(),
    typingPauseMilliseconds,
  );

  constructor() {
    inject(DestroyRef).onDestroy(() => this.typingPause.cancel());
    effect(() => {
      const query = this.addressQuery() ?? '';
      untracked(() => this.showSearchFor(query));
    });
  }

  searchAfterTyping(): void {
    this.typingPause.call();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.results()?.loadNext();
  }

  // A click on a row's friendship button: the change is made on the list the page shows now.
  async perform(action: FriendshipAction, user: SearchUserDto): Promise<void> {
    const list = this.results();

    if (list !== null) {
      await this.searchStore.perform(action, user, list);
    }
  }

  async submit(): Promise<void> {
    this.typingPause.cancel();
    if (this.form.invalid) {
      return;
    }

    const query = this.form.controls.username.value.trim();
    // The router ignores a navigation to the address it is already on, so the same query again is searched
    // here: that is how a failed search is tried a second time.
    const isSameQuery = query === (this.addressQuery() ?? '');
    if (isSameQuery) {
      this.showSearchFor(query);
    } else {
      await this.router.navigate([appAddresses.search], {
        queryParams: searchQueryParameters(query),
      });
    }
  }

  // Runs when the visitor has stopped typing. Emptying the field clears the search (the form is invalid
  // when empty, so that case is allowed by name); words that are too long are left alone, as the form
  // shows; words already in the address are not searched again.
  private async searchTypedWords(): Promise<void> {
    const query = this.form.controls.username.value.trim();
    const isChanged = query !== (this.addressQuery() ?? '');
    const isCleared = query === '';
    const isAllowed = isCleared || this.form.valid;

    if (isChanged && isAllowed) {
      this.typedAddressQuery = query;
      await this.router.navigate([appAddresses.search], {
        queryParams: searchQueryParameters(query),
        replaceUrl: true,
      });
    }
  }

  private showSearchFor(query: string): void {
    const isFromTyping = query === this.typedAddressQuery;
    this.typedAddressQuery = null;
    if (!isFromTyping) {
      this.form.controls.username.setValue(query);
    }
    // Judged by the words in the address, not by the field: the visitor may have typed past the limit since.
    const isSearchable = query !== '' && query.length <= LIMITS.users.usernameMaxLength;
    if (isSearchable) {
      const list = this.createList(query);
      this.searchedWords.set(query);
      this.results.set(list);
      void list.loadNext(); // the list shows its own failure
    } else {
      this.results.set(null);
    }
  }

  private createList(username: string): PagedList<SearchUserDto> {
    return new PagedList<SearchUserDto>({
      loadPage: async (page) => {
        // The search answers a guest too, so an expired token would not be refused but read as no one: the
        // relationships come back empty. A token that is about to expire is renewed first.
        await this.sessionStore.validAccessToken();

        return this.userApi.searchUsers({ username, ...page });
      },
      pageSize: LIMITS.paging.defaultPageSize,
      keyOf: (user) => user.id,
    });
  }
}
