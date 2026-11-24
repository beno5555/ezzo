import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommentSnapshotDto } from '../moderation/comment-snapshot-dto';
import { PostSnapshotDto } from '../moderation/post-snapshot-dto';
import { AccountState } from './account-state';
import { AdminApi } from './admin-api';
import { AdminUserDto } from './admin-user-dto';
import { LogDisplayDto } from './log-display-dto';
import { SystemStatisticsDto } from './system-statistics-dto';

const account: AdminUserDto = {
  id: 4,
  username: 'john_doe',
  email: 'john@example.com',
  isAdministrator: false,
  state: AccountState.Deactivated,
  registeredAt: '2026-01-05T10:00:00Z',
  deactivatedAt: '2026-02-01T08:30:00Z',
  deletedAt: null,
};

const flaggedPost: PostSnapshotDto = {
  id: 8,
  title: 'Cheap watches',
  postContent: 'Click here',
  images: [{ id: 1, address: '/api/images/a.jpg', orderIndex: 0 }],
  author: { id: 3, username: 'spammer' },
  uploadedAt: '2026-11-20T09:00:00Z',
  isHidden: false,
};

const flaggedComment: CommentSnapshotDto = {
  id: 14,
  content: 'Buy now',
  author: { id: 3, username: 'spammer' },
  postId: 8,
  postTitle: 'Cheap watches',
  uploadedAt: '2026-11-20T09:05:00Z',
  isHidden: false,
};

const logRow: LogDisplayDto = {
  id: 91,
  createdAt: '2026-11-20T09:15:00Z',
  authorizedRequest: true,
  userId: 3,
  action: 'PostService.CreatePostAsync',
  succeeded: false,
  details: 'The title is too long',
  entityId: 8,
  entityName: 'Post',
};

const statistics: SystemStatisticsDto = {
  totals: {
    activeAccounts: 12,
    deactivatedAccounts: 2,
    posts: 40,
    comments: 95,
    messages: 310,
    likes: 120,
    pendingReports: 3,
  },
  activity: {
    last7Days: { accounts: 1, posts: 5, comments: 9, messages: 40 },
    last30Days: { accounts: 4, posts: 18, comments: 50, messages: 200 },
  },
  onlineUsers: 2,
};

const reversedPeriodMessage = 'The start of the date range must not be after its end';

describe('AdminApi', () => {
  let adminApi: AdminApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    adminApi = TestBed.inject(AdminApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('GET /api/admin/users', () => {
    it('sends only the page when no filter is set, and returns the accounts', async () => {
      const pending = adminApi.getUsers({ pageNumber: 1, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/admin/users',
      );
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      expect(request.request.params.get('pageNumber')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [account], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [account] });
    });

    it.each(Object.values(AccountState))(
      'sends the state %s as its name, not a number',
      async (state) => {
        const pending = adminApi.getUsers({ pageNumber: 2, pageSize: 10, state });

        const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
        expect(request.request.params.get('state')).toBe(state);
        request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
        await pending;
      },
    );

    it('sends the username filter beside the state', async () => {
      const pending = adminApi.getUsers({
        pageNumber: 1,
        pageSize: 10,
        state: AccountState.Active,
        username: 'doe',
      });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
      expect(request.request.params.get('state')).toBe('Active');
      expect(request.request.params.get('username')).toBe('doe');
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('leaves an empty username out of the request', async () => {
      const pending = adminApi.getUsers({ pageNumber: 1, pageSize: 10, username: '' });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/users');
      expect(request.request.params.has('username')).toBe(false);
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('answers a non-administrator with the forbidden text', async () => {
      const pending = adminApi.getUsers({ pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/users')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are not allowed to do this.',
        status: 403,
      });
    });
  });

  describe('GET /api/admin/moderation-queue/posts', () => {
    it('sends the page and returns the flagged posts', async () => {
      const pending = adminApi.getFlaggedPosts({ pageNumber: 2, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'GET' && candidate.url === '/api/admin/moderation-queue/posts',
      );
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [flaggedPost], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [flaggedPost] });
    });

    it('answers a failure with its message', async () => {
      const pending = adminApi.getFlaggedPosts({ pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/moderation-queue/posts')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are not allowed to do this.',
        status: 403,
      });
    });
  });

  describe('GET /api/admin/moderation-queue/comments', () => {
    it('sends the page and returns the flagged comments', async () => {
      const pending = adminApi.getFlaggedComments({ pageNumber: 1, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'GET' && candidate.url === '/api/admin/moderation-queue/comments',
      );
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      expect(request.request.params.get('pageNumber')).toBe('1');
      request.flush({ succeeded: true, message: null, data: [flaggedComment], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [flaggedComment] });
    });
  });

  describe('GET /api/admin/logs', () => {
    it('sends only the page when no filter is set, and returns the rows', async () => {
      const pending = adminApi.getLogs({ pageNumber: 1, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/admin/logs',
      );
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      request.flush({ succeeded: true, message: null, data: [logRow], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [logRow] });
    });

    it('sends every filter under the name the backend reads', async () => {
      const pending = adminApi.getLogs({
        pageNumber: 2,
        pageSize: 10,
        userId: 3,
        authorizedRequest: true,
        succeeded: false,
        action: 'PostService',
        entityName: 'Post',
        entityId: 8,
        from: '2026-11-19T22:00:00.000Z',
        to: '2026-11-20T21:59:59.999Z',
      });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/logs');
      const params = request.request.params;
      expect(params.get('pageNumber')).toBe('2');
      expect(params.get('userId')).toBe('3');
      expect(params.get('authorizedRequest')).toBe('true');
      expect(params.get('succeeded')).toBe('false');
      expect(params.get('action')).toBe('PostService');
      expect(params.get('entityName')).toBe('Post');
      expect(params.get('entityId')).toBe('8');
      expect(params.get('from')).toBe('2026-11-19T22:00:00.000Z');
      expect(params.get('to')).toBe('2026-11-20T21:59:59.999Z');
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('sends a guest request, which is false, not left out', async () => {
      const pending = adminApi.getLogs({ pageNumber: 1, pageSize: 10, authorizedRequest: false });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/logs');
      expect(request.request.params.get('authorizedRequest')).toBe('false');
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('leaves empty text filters out of the request', async () => {
      const pending = adminApi.getLogs({ pageNumber: 1, pageSize: 10, action: '', entityName: '' });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/admin/logs');
      expect(request.request.params.keys().sort()).toEqual(['pageNumber', 'pageSize']);
      request.flush({ succeeded: true, message: null, data: [], totalCount: 0 });
      await pending;
    });

    it('answers a refused period with the server message', async () => {
      const pending = adminApi.getLogs({
        pageNumber: 1,
        pageSize: 10,
        from: '2026-11-21T00:00:00.000Z',
        to: '2026-11-20T00:00:00.000Z',
      });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/logs')
        .flush(
          {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { From: [reversedPeriodMessage], To: [reversedPeriodMessage] },
          },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: reversedPeriodMessage,
        status: 400,
        fieldErrors: { from: [reversedPeriodMessage], to: [reversedPeriodMessage] },
      });
    });

    it('answers a non-administrator with the forbidden text', async () => {
      const pending = adminApi.getLogs({ pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/logs')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are not allowed to do this.',
        status: 403,
      });
    });
  });

  describe('GET /api/admin/statistics', () => {
    it('returns the totals, the activity and the online count', async () => {
      const pending = adminApi.getStatistics();

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/admin/statistics',
      );
      request.flush({ succeeded: true, message: null, data: statistics });

      expect(await pending).toEqual({ succeeded: true, data: statistics });
    });

    it('answers a non-administrator with the forbidden text', async () => {
      const pending = adminApi.getStatistics();

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/statistics')
        .flush(null, { status: 403, statusText: 'Forbidden' });

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You are not allowed to do this.',
        status: 403,
      });
    });
  });
});
