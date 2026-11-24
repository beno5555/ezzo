import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import LucideSearch from 'lucide/dist/esm/icons/search.mjs';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { Icon } from '../../../shared/icon/icon';
import { TextInput } from '../../../shared/text-input/text-input';
import { LanguageStore } from '../../languages/language-store';
import { LIMITS } from '../../limits';
import { appAddresses, searchQueryParameters } from '../../routing/app-addresses';

// The top bar's search box. It searches nothing itself: it sends the visitor to /search?q=…, where the
// search page reads the query and shows the users it finds. One field with a length limit needs no form
// library, and the shell is on the first download, so it is a plain form (the bundle budget, ticket 07).
@Component({
  selector: 'app-search-box',
  imports: [IconButton, TextInput, Icon],
  templateUrl: './search-box.html',
  styleUrl: './search-box.css',
})
export class SearchBox {
  protected readonly icons = { search: LucideSearch };

  private readonly router = inject(Router);

  protected readonly text = inject(LanguageStore).text;
  protected readonly queryMaxLength = LIMITS.users.usernameMaxLength;

  async search(event: SubmitEvent, query: string): Promise<void> {
    event.preventDefault();
    await this.router.navigate([appAddresses.search], {
      queryParams: searchQueryParameters(query.trim()),
    });
  }
}
