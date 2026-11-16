import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { MinimalUserDto } from '../minimal-user-dto';
import { UserApi } from '../user-api';

// A bare page that proves the path from the browser through the dev proxy to the backend.
@Component({
  selector: 'app-user-search-page',
  imports: [ReactiveFormsModule],
  templateUrl: './user-search-page.html',
  styleUrl: './user-search-page.css',
})
export class UserSearchPage {
  private readonly userApi = inject(UserApi);

  protected readonly text = inject(LanguageStore).text;
  protected readonly form = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.required, Validators.maxLength(LIMITS.users.usernameMaxLength)]],
  });
  protected readonly users = signal<MinimalUserDto[]>([]);
  protected readonly failureMessage = signal<string | null>(null);

  // Numbers each search, so a slow older response cannot overwrite a newer one.
  private latestSearch = 0;

  async search(): Promise<void> {
    if (this.form.invalid) {
      return;
    }

    const searchNumber = ++this.latestSearch;
    const result = await this.userApi.searchUsers({
      username: this.form.controls.username.value,
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
