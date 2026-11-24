import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { AdminApi } from './admin-api';
import { LogDisplayDto } from './log-display-dto';
import { LogFilter } from './log-filter';
import { LogTable } from './log-table';

const logRow = (id: number): LogDisplayDto => ({
  id,
  createdAt: '2026-11-20T10:00:00Z',
  authorizedRequest: true,
  userId: 3,
  action: 'PostService.Create',
  succeeded: true,
  details: null,
  entityId: null,
  entityName: null,
});

describe('LogTable', () => {
  let httpTesting: HttpTestingController;

  const createTable = (filter: LogFilter = {}) => new LogTable(filter, TestBed.inject(AdminApi));
  const logsRequest = () =>
    httpTesting.expectOne((candidate) => candidate.url === '/api/admin/logs');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('asks the server for the filter it was made with and shows the rows', async () => {
    const table = createTable({ succeeded: false, action: 'Login' });

    const loading = table.loadNext();
    const request = logsRequest();
    expect(request.request.params.get('succeeded')).toBe('false');
    expect(request.request.params.get('action')).toBe('Login');
    request.flush({ succeeded: true, message: null, data: [logRow(1)], totalCount: 1 });
    await loading;

    expect(table.rows()).toEqual([logRow(1)]);
    expect(table.status()).toBe(PageLoadStatus.Ended);
    expect(table.refusal()).toBeNull();
  });

  it('keeps a refused filter as the server sentence, not as a failure to try again', async () => {
    const table = createTable({ from: '2026-11-21T00:00:00.000Z', to: '2026-11-20T00:00:00.000Z' });

    const loading = table.loadNext();
    logsRequest().flush(
      {
        status: 400,
        errors: { To: ['The end of the period must not be before its start.'] },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    await loading;

    expect(table.refusal()).toBe('The end of the period must not be before its start.');
    expect(table.failureMessage()).toBeNull();
    expect(table.rows()).toEqual([]);
  });

  it('reports any other failed page as a failure', async () => {
    const table = createTable();

    const loading = table.loadNext();
    logsRequest().flush({}, { status: 500, statusText: 'Server Error' });
    await loading;

    expect(table.refusal()).toBeNull();
    expect(table.failureMessage()).not.toBeNull();
  });
});
