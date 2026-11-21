import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideSearch, LucidePlus, LucideUsers } from '@lucide/angular';
import { DateFormatter } from '../../../core/languages/date-formatter';
import { LanguageStore } from '../../../core/languages/language-store';
import { LIMITS } from '../../../core/limits';
import { PageLoadStatus } from '../../../core/paging/page-load-status';
import { Avatar } from '../../../shared/avatar/avatar';
import { AvatarSize } from '../../../shared/avatar/avatar-size';
import { Button } from '../../../shared/button/button';
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

// What marks each state's badge: its colour and its word, never the colour alone (DESIGN.md, Colors).
const stateBadgeClasses: Record<AccountState, string> = {
  [AccountState.Active]: 'border-success text-success',
  [AccountState.Deactivated]: 'border-warning text-warning',
  [AccountState.SoftDeleted]: 'border-danger text-danger',
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
    LoadFailure,
    Menu,
    ScrollSentinel,
    TextInput,
    ToggleButton,
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

  async ngOnInit(): Promise<void> {
    await this.table().loadNext();
  }

  async chooseState(state: AccountState | null): Promise<void> {
    this.selectedState.set(state);
    await this.reload();
  }

  async search(): Promise<void> {
    if (this.filterForm.invalid) {
      return;
    }

    await this.reload();
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

  stateBadgeClass(state: AccountState): string {
    return stateBadgeClasses[state];
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
        await this.accountActions.run(account, action, (shown) => table.replace(shown));
      }
    }
  }

  private async reload(): Promise<void> {
    const username = this.filterForm.controls.username.value.trim();
    const state = this.selectedState();
    const table = new AccountTable(
      { state: state ?? undefined, username: username === '' ? undefined : username },
      this.adminApi,
    );

    this.table.set(table);
    await table.loadNext();
  }
}
