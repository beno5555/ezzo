import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideCircleExclamationPoint, LucideSearch } from '@lucide/angular';
import { map } from 'rxjs';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import {
  appAddresses,
  searchQueryParameter,
  searchQueryParameters,
} from '../../../core/routing/app-addresses';
import { Debouncer, typingPauseMilliseconds } from '../../../core/timing/debouncer';
import { Button } from '../../../shared/button/button';
import { TextInput } from '../../../shared/text-input/text-input';
import { MinimalUserDto } from '../minimal-user-dto';
import { UserApi } from '../user-api';

// The search page at /search?q=…. The address holds the query, so the top bar's search box, this
// page's own form and the browser's Back button all lead to the same search. Typing searches too, once
// the visitor pauses: the address is replaced, not added to, so Back does not walk through every try.
// Its own ticket styles it.
@Component({
  selector: 'app-user-search-page',
  imports: [ReactiveFormsModule, Button, TextInput, LucideSearch, LucideCircleExclamationPoint],
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
  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(LIMITS.users.usernameMaxLength)]],
  });
  protected readonly users = signal<MinimalUserDto[]>([]);
  protected readonly failureMessage = signal<string | null>(null);

  // Numbers each search, so a slow older response cannot overwrite a newer one.
  private latestSearch = 0;

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
    const isSearchable = query !== '' && this.form.valid;
    if (isSearchable) {
      void this.search(query); // the page shows its own failure
    } else {
      this.latestSearch++;
      this.users.set([]);
      this.failureMessage.set(null);
    }
  }

  private async search(username: string): Promise<void> {
    const searchNumber = ++this.latestSearch;
    const result = await this.userApi.searchUsers({
      username,
      pageNumber: LIMITS.paging.firstPageNumber,
      pageSize: LIMITS.paging.defaultPageSize,
    });

    const isStale = searchNumber !== this.latestSearch;
    if (isStale) {
      return;
    }

    if (result.succeeded) {
      this.users.set(result.data);
      this.failureMessage.set(null);
      return;
    }

    this.users.set([]);
    this.failureMessage.set(result.message);
  }
}
