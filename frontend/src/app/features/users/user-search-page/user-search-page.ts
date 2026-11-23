import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { Debouncer, typingPauseMilliseconds } from '../../../core/timing/debouncer';
import { Avatar } from '../../../shared/avatar/avatar';
import { Button } from '../../../shared/button/button';
import { EmptyState } from '../../../shared/empty-state/empty-state';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { TextInput } from '../../../shared/text-input/text-input';
import { TextLink } from '../../../shared/text-link/text-link';
import { MinimalUserDto } from '../minimal-user-dto';
import { UserApi } from '../user-api';

// The search page at /search?q=…. The address holds the query, so the top bar's search box, this
// page's own form and the browser's Back button all lead to the same search. Typing searches too, once
// the visitor pauses: the address is replaced, not added to, so Back does not walk through every try.
// Each search has its own PagedList and the page shows only the latest, so a slow answer to older words
// lands in a list nobody sees any more (ADR 0003). Results load page after page as the visitor scrolls.
@Component({
  selector: 'app-user-search-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    Avatar,
    Button,
    EmptyState,
    LoadFailure,
    ScrollSentinel,
    TextInput,
    TextLink,
    LucideSearch,
    LucideUserX,
  ],
  templateUrl: './user-search-page.html',
  styleUrl: './user-search-page.css',
})
export class UserSearchPage {
  private readonly userApi = inject(UserApi);
  private readonly router = inject(Router);

  // The query in the address. Read from the route, not bound as an input: an input's name must be a literal,
  // which would repeat searchQueryParameter where nothing checks the two agree.
  private readonly addressQuery = toSignal(
    inject(ActivatedRoute).queryParamMap.pipe(
      map((parameters) => parameters.get(searchQueryParameter)),
    ),
  );

  protected readonly text = inject(LanguageStore).text;
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly profileAddress = appAddresses.profile;
  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(LIMITS.users.usernameMaxLength)]],
  });

  // The latest search, or null while there are no words to search for (the page then shows its prompt).
  protected readonly results = signal<PagedList<MinimalUserDto> | null>(null);
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

  private createList(username: string): PagedList<MinimalUserDto> {
    return new PagedList<MinimalUserDto>({
      loadPage: (page) => this.userApi.searchUsers({ username, ...page }),
      pageSize: LIMITS.paging.defaultPageSize,
      // The search never returns an account without an id (deactivated or deleted), so the name, which
      // is unique, is only the fallback.
      keyOf: (user) => user.id ?? user.username,
    });
  }
}
