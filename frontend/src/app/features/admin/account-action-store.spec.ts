import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { ToastStore } from '../../shared/toasts/toast-store';
import { AccountActivationApi } from '../accounts/account-activation-api';
import { AccountManagementApi } from '../accounts/account-management-api';
import { AccountActionStore } from './account-action-store';
import { AccountRowAction } from './account-row-action';
import { AccountState } from './account-state';
import { AdminUserDto } from './admin-user-dto';

const account: AdminUserDto = {
  id: 4,
  username: 'john_doe',
  email: 'john@example.com',
  isAdministrator: false,
  state: AccountState.Active,
  registeredAt: '2026-01-05T10:00:00Z',
  deactivatedAt: null,
  deletedAt: null,
};

describe('AccountActionStore', () => {
  const activationApi = { deactivateAccount: vi.fn(), reactivateAccount: vi.fn() };
  const managementApi = {
    assignAdministrator: vi.fn(),
    removeAdministrator: vi.fn(),
    deleteAccount: vi.fn(),
  };
  let store: AccountActionStore;
  let toastStore: ToastStore;
  let shown: AdminUserDto[];

  // A request the test answers by hand, to look at the screen while it is on its way.
  function pendingRequest() {
    let answer: (result: AppResult<void>) => void = () => undefined;
    const promise = new Promise<AppResult<void>>((resolve) => {
      answer = resolve;
    });

    return { promise, answer };
  }

  const show = (row: AdminUserDto) => shown.push(row);

  beforeEach(() => {
    vi.resetAllMocks();
    shown = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: AccountActivationApi, useValue: activationApi },
        { provide: AccountManagementApi, useValue: managementApi },
      ],
    });
    store = TestBed.inject(AccountActionStore);
    toastStore = TestBed.inject(ToastStore);
  });

  it.each([
    [AccountRowAction.Deactivate, () => activationApi.deactivateAccount],
    [AccountRowAction.Restore, () => activationApi.reactivateAccount],
    [AccountRowAction.Delete, () => managementApi.deleteAccount],
    [AccountRowAction.GrantAdministrator, () => managementApi.assignAdministrator],
    [AccountRowAction.RemoveAdministrator, () => managementApi.removeAdministrator],
  ])('sends %s to its own endpoint, with the account id', async (action, endpoint) => {
    endpoint().mockResolvedValue(ok(undefined));

    await store.run(account, action, show);

    expect(endpoint()).toHaveBeenCalledExactlyOnceWith(4);
  });

  it('shows the new state before the server has answered, and keeps it when the server agrees', async () => {
    const request = pendingRequest();
    managementApi.deleteAccount.mockReturnValue(request.promise);

    const running = store.run(account, AccountRowAction.Delete, show);

    expect(shown).toHaveLength(1);
    expect(shown[0]).toMatchObject({ state: AccountState.SoftDeleted });
    expect(store.isBusy(4)).toBe(true);

    request.answer(ok(undefined));
    await running;

    expect(shown).toHaveLength(1);
    expect(store.isBusy(4)).toBe(false);
    expect(toastStore.visible()).toEqual([]);
  });

  it('puts the row back and shows a toast with the server message when the server refuses', async () => {
    activationApi.deactivateAccount.mockResolvedValue(fail('User not found', 404));

    await store.run(account, AccountRowAction.Deactivate, show);

    expect(shown).toHaveLength(2);
    expect(shown[0]).toMatchObject({ state: AccountState.Deactivated });
    expect(shown[1]).toBe(account);
    expect(store.isBusy(4)).toBe(false);
    expect(toastStore.visible().map((toast) => toast.message)).toEqual(['User not found']);
  });

  it('tells the caller that the server agreed, and not when it refused', async () => {
    const settled = vi.fn();
    activationApi.deactivateAccount.mockResolvedValueOnce(ok(undefined));
    activationApi.deactivateAccount.mockResolvedValueOnce(fail('User not found', 404));

    await store.run(account, AccountRowAction.Deactivate, show, settled);
    expect(settled).toHaveBeenCalledTimes(1);

    await store.run(account, AccountRowAction.Deactivate, show, settled);
    expect(settled).toHaveBeenCalledTimes(1);
  });

  it('ignores a second action on an account whose request is on its way', async () => {
    const request = pendingRequest();
    activationApi.deactivateAccount.mockReturnValue(request.promise);

    const first = store.run(account, AccountRowAction.Deactivate, show);
    await store.run(account, AccountRowAction.Delete, show);

    expect(managementApi.deleteAccount).not.toHaveBeenCalled();
    expect(shown).toHaveLength(1);

    request.answer(ok(undefined));
    await first;
  });

  it('acts on another account while one is busy', async () => {
    const request = pendingRequest();
    activationApi.deactivateAccount.mockReturnValue(request.promise);
    managementApi.deleteAccount.mockResolvedValue(ok(undefined));

    const first = store.run(account, AccountRowAction.Deactivate, show);
    await store.run({ ...account, id: 5 }, AccountRowAction.Delete, show);

    expect(managementApi.deleteAccount).toHaveBeenCalledExactlyOnceWith(5);

    request.answer(ok(undefined));
    await first;
  });
});
