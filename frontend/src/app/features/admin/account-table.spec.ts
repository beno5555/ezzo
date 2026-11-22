import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { AccountState } from './account-state';
import { AccountFilter } from './account-filter';
import { AccountTable } from './account-table';
import { AdminApi } from './admin-api';
import { AdminUserDto } from './admin-user-dto';

const account = (id: number, overrides: Partial<AdminUserDto> = {}): AdminUserDto => ({
  id,
  username: `user_${id}`,
  email: `user${id}@example.com`,
  isAdministrator: false,
  state: AccountState.Active,
  registeredAt: '2026-01-05T10:00:00Z',
  deactivatedAt: null,
  deletedAt: null,
  ...overrides,
});

const page = (accounts: AdminUserDto[]) => ({
  succeeded: true,
  message: null,
  data: accounts,
  totalCount: accounts.length,
});

describe('AccountTable', () => {
  let httpTesting: HttpTestingController;

  const createTable = (filter: AccountFilter = {}) =>
    new AccountTable(filter, TestBed.inject(AdminApi));

  // Loads a first page of the given accounts.
  async function loaded(table: AccountTable, accounts: AdminUserDto[]): Promise<void> {
    const loading = table.loadNext();
    httpTesting.expectOne((request) => request.url === '/api/admin/users').flush(page(accounts));
    await loading;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('asks the server for the filter it was made with, page by page', async () => {
    const table = createTable({ state: AccountState.Deactivated, username: 'doe' });

    const loading = table.loadNext();
    const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
    expect(request.request.params.get('state')).toBe('Deactivated');
    expect(request.request.params.get('username')).toBe('doe');
    expect(request.request.params.get('pageNumber')).toBe('1');
    request.flush(page([account(1)]));
    await loading;

    expect(table.rows()).toEqual([account(1)]);
    expect(table.status()).toBe(PageLoadStatus.Ended);
  });

  it('puts a changed account in place of its row', async () => {
    const table = createTable();
    await loaded(table, [account(1), account(2)]);

    const deactivated = account(2, { state: AccountState.Deactivated });
    table.replace(deactivated);

    expect(table.rows()).toEqual([account(1), deactivated]);
  });

  it('shows a created account after the loaded ones, and takes its changes', async () => {
    const table = createTable();
    await loaded(table, [account(1)]);

    table.add(account(9));
    expect(table.rows()).toEqual([account(1), account(9)]);

    const granted = account(9, { isAdministrator: true });
    table.replace(granted);
    expect(table.rows()).toEqual([account(1), granted]);
  });

  it('shows a created account once when it is added twice', async () => {
    const table = createTable();
    await loaded(table, [account(1)]);

    table.add(account(9));
    table.add(account(9));

    expect(table.rows().map((row) => row.id)).toEqual([1, 9]);
  });

  it('shows a created account once when a later page brings it', async () => {
    const table = createTable();
    const first = Array.from({ length: 10 }, (_, index) => account(index + 1));
    await loaded(table, first);
    table.add(account(11));

    const second = table.loadNext();
    httpTesting
      .expectOne((candidate) => candidate.url === '/api/admin/users')
      .flush(page([account(11)]));
    await second;

    expect(table.rows().map((row) => row.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it('does not show a created account the state filter would not list', async () => {
    const table = createTable({ state: AccountState.Deactivated });
    await loaded(table, [account(1, { state: AccountState.Deactivated })]);

    table.add(account(9));

    expect(table.rows().map((row) => row.id)).toEqual([1]);
  });

  it('does not show a created account the username filter would not list, in any letter case', async () => {
    const table = createTable({ username: 'DOE' });
    await loaded(table, []);

    table.add(account(9, { username: 'jane' }));
    table.add(account(10, { username: 'john_doe' }));

    expect(table.rows().map((row) => row.id)).toEqual([10]);
  });
});
