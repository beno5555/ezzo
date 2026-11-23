import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideCopy, LucideSearch, LucidePlus, LucideUsers } from '@lucide/angular';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { Debouncer, typingPauseMilliseconds } from '../../../core/timing/debouncer';
import { Avatar } from '../../../shared/avatar/avatar';
import { AvatarSize } from '../../../shared/avatar/avatar-size';
import { Button } from '../../../shared/button/button';
import { FadeOut } from '../../../shared/fade-out/fade-out';
import { IconButton } from '../../../shared/icon-button/icon-button';
import { ConfirmationOpener } from '../../../shared/confirmation/confirmation-opener';
import { LoadFailure } from '../../../shared/load-failure/load-failure';
import { Menu } from '../../../shared/menu/menu';
import { MenuEntry } from '../../../shared/menu/menu-entry';
import { ScrollSentinel } from '../../../shared/scroll-sentinel/scroll-sentinel';
import { TextInput } from '../../../shared/text-input/text-input';
import { ToastStore } from '../../../shared/toasts/toast-store';
import { ToggleButton } from '../../../shared/toggle-button/toggle-button';
import { AccountActionStore } from '../account-action-store';
import {
  accountActionLabel,
  accountActionConfirmation,
  isAccountActionDestructive,
} from '../account-action-texts';
import { accountActionsOffered, isAccountEditable } from '../account-actions-offered';
import { AccountDialogOpener } from '../account-dialog-opener';
import { AccountRowAction } from '../account-row-action';
import { AccountState } from '../account-state';
import { AccountTable } from '../account-table';
import { AdminApi } from '../admin-api';
import { AdminUserDto } from '../admin-user-dto';

// The colour of each state's word, which is plain text, not a control: the word carries the meaning, the
// colour only helps (DESIGN.md, Colors).
const stateTextClasses: Record<AccountState, string> = {
  [AccountState.Active]: 'text-success',
  [AccountState.Deactivated]: 'text-warning',
  [AccountState.SoftDeleted]: 'text-danger',
};

// An account that is not active is greyed: sunken and in the muted ink, so that it reads as out of use
// (it can not be edited, and a deactivated one must be restored first). The state word says which.
const rowClasses: Record<AccountState, string> = {
  [AccountState.Active]: 'bg-surface-raised lg:bg-transparent',
  [AccountState.Deactivated]: 'bg-surface-sunken text-ink-muted',
  [AccountState.SoftDeleted]: 'bg-surface-sunken text-ink-muted',
};

// The admin panel's users area at /admin/users: the accounts in any state, page after page as the reader
// scrolls, filtered by state and by username. On a desktop they are a table; on a phone each row is a
// card. The "…" menu of a row offers what fits its state: edit the profile, and the actions that ask
// first and then show their result on the click (AccountActionStore). Create account opens a dialog.
// A filter change makes a new AccountTable, read from its first page.
@Component({
  selector: 'app-admin-users-page',
  imports: [
    ReactiveFormsModule,
    Avatar,
    Button,
    FadeOut,
    IconButton,
    LoadFailure,
    Menu,
    ScrollSentinel,
    TextInput,
    ToggleButton,
    LucideCopy,
    LucidePlus,
    LucideSearch,
    LucideUsers,
  ],
  templateUrl: './admin-users-page.html',
  styleUrl: './admin-users-page.css',
})
export class AdminUsersPage implements OnInit {
  private readonly adminApi = inject(AdminApi);
  private readonly accountActions = inject(AccountActionStore);
  private readonly accountDialogs = inject(AccountDialogOpener);
  private readonly confirmationOpener = inject(ConfirmationOpener);
  private readonly toastStore = inject(ToastStore);
  // The search that follows typing: it runs when the user has stopped typing for a moment, and only when
  // the username is not the one the table already shows.
  private readonly typingPause = new Debouncer(
    () => void this.searchIfChanged(),
    typingPauseMilliseconds,
  );
  private appliedUsername = '';

  protected readonly text = inject(LanguageStore).text;
  protected readonly dates = inject(DateFormatter);
  protected readonly PageLoadStatus = PageLoadStatus;
  protected readonly AccountState = AccountState;
  protected readonly avatarSize = AvatarSize.Small;
  protected readonly usernameMaxLength = LIMITS.users.usernameMaxLength;

  // The state filter: null shows every state.
  protected readonly selectedState = signal<AccountState | null>(null);
  protected readonly stateChoices = computed(() => {
    const texts = this.text().admin.users;

    return [
      { state: null, label: texts.allStates },
      { state: AccountState.Active, label: texts.states.Active },
      { state: AccountState.Deactivated, label: texts.states.Deactivated },
      { state: AccountState.SoftDeleted, label: texts.states.SoftDeleted },
    ];
  });
  protected readonly filterForm = inject(NonNullableFormBuilder).group({
    username: ['', [Validators.maxLength(LIMITS.users.usernameMaxLength)]],
  });
  // The table holds the filter it was made with, so typing in the box changes nothing until Search.
  protected readonly table = signal(new AccountTable({}, this.adminApi));
  protected readonly hasRows = computed(() => this.table().rows().length > 0);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.typingPause.cancel());
  }

  async ngOnInit(): Promise<void> {
    await this.table().loadNext();
  }

  async chooseState(state: AccountState | null): Promise<void> {
    this.selectedState.set(state);
    await this.reload();
  }

  // The Search button and Enter: searches at once, without waiting for the pause.
  async search(): Promise<void> {
    this.typingPause.cancel();
    if (this.filterForm.invalid) {
      return;
    }

    await this.reload();
  }

  // From the username box, on each key: the search starts when the typing stops.
  searchAfterTyping(): void {
    this.typingPause.call();
  }

  // From the scroll sentinel, and from the Try again button after a failed page.
  async loadMore(): Promise<void> {
    await this.table().loadNext();
  }

  async createAccount(): Promise<void> {
    const table = this.table();
    const created = await this.accountDialogs.create();

    if (created !== undefined) {
      table.add(created);
      this.toastStore.show(this.text().admin.users.createDialog.createdToast(created.username));
    }
  }

  // Puts an email on the clipboard, for the copy button and for a click on the email itself.
  async copyEmail(email: string): Promise<void> {
    const texts = this.text().admin.users;

    try {
      await navigator.clipboard.writeText(email);
      this.toastStore.show(texts.emailCopied);
    } catch {
      this.toastStore.show(texts.copyFailed);
    }
  }

  rowClass(state: AccountState): string {
    return rowClasses[state];
  }

  stateTextClass(state: AccountState): string {
    return stateTextClasses[state];
  }

  // The entries of a row's menu: edit, then each action that fits the row's state.
  menuEntries(account: AdminUserDto): MenuEntry[] {
    const texts = this.text().admin.users;
    const entries: MenuEntry[] = [];

    if (isAccountEditable(account)) {
      entries.push({
        label: texts.actions.edit,
        isDestructive: false,
        choose: () => void this.edit(account),
      });
    }
    for (const action of accountActionsOffered(account)) {
      entries.push({
        label: accountActionLabel(texts, action),
        isDestructive: isAccountActionDestructive(action),
        choose: () => void this.act(account, action),
      });
    }

    return entries;
  }

  private async edit(account: AdminUserDto): Promise<void> {
    const table = this.table();
    const saved = await this.accountDialogs.edit(account);

    if (saved !== undefined) {
      table.replace(saved);
      this.toastStore.show(this.text().admin.users.editDialog.savedToast(saved.username));
    }
  }

  // Asks first, then runs the action; the row shows its new state at once, and goes back with a toast if
  // the server refuses. A row whose action is on its way asks nothing.
  private async act(account: AdminUserDto, action: AccountRowAction): Promise<void> {
    const table = this.table();
    const isIdle = !this.accountActions.isBusy(account.id);

    if (isIdle) {
      const question = accountActionConfirmation(this.text().admin.users, action, account.username);
      const isConfirmed = await this.confirmationOpener.ask(question);

      if (isConfirmed) {
        await this.accountActions.run(
          account,
          action,
          (shown) => table.show(shown),
          () => table.settled(account.id),
        );
      }
    }
  }

  private async searchIfChanged(): Promise<void> {
    const isChanged = this.typedUsername() !== this.appliedUsername;

    if (isChanged && this.filterForm.valid) {
      await this.reload();
    }
  }

  private typedUsername(): string {
    return this.filterForm.controls.username.value.trim();
  }

  private async reload(): Promise<void> {
    const username = this.typedUsername();
    this.appliedUsername = username;
    const state = this.selectedState();
    const table = new AccountTable(
      { state: state ?? undefined, username: username === '' ? undefined : username },
      this.adminApi,
    );

    this.table.set(table);
    await table.loadNext();
  }
}
