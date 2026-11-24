import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { english } from '../../core/languages/english';
import { ModerationApi } from './moderation-api';
import { ModerationStatus } from './moderation-status';

describe('ModerationApi', () => {
  let moderationApi: ModerationApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    moderationApi = TestBed.inject(ModerationApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('PUT /api/admin/posts/{id}/moderation', () => {
    it('sends the status as its name', async () => {
      const pending = moderationApi.setPostStatus(3, ModerationStatus.Hidden);

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PUT' && candidate.url === '/api/admin/posts/3/moderation',
      );
      expect(request.request.body).toEqual({ status: 'Hidden' });
      request.flush({ succeeded: true, message: 'Status set' });

      expect(await pending).toEqual({ succeeded: true, message: 'Status set', data: undefined });
    });

    it('sends Visible to make a hidden post visible', async () => {
      const pending = moderationApi.setPostStatus(3, ModerationStatus.Visible);

      const request = httpTesting.expectOne(
        (candidate) => candidate.url === '/api/admin/posts/3/moderation',
      );
      expect(request.request.body).toEqual({ status: 'Visible' });
      request.flush({ succeeded: true, message: null });
      await pending;
    });

    it('returns the backend message when the post is not found', async () => {
      const pending = moderationApi.setPostStatus(3, ModerationStatus.Hidden);

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/posts/3/moderation')
        .flush(
          { succeeded: false, message: 'Post not found', data: null },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'Post not found', status: 404 });
    });
  });

  describe('PUT /api/admin/comments/{id}/moderation', () => {
    it('sends the status as its name', async () => {
      const pending = moderationApi.setCommentStatus(5, ModerationStatus.Hidden);

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PUT' && candidate.url === '/api/admin/comments/5/moderation',
      );
      expect(request.request.body).toEqual({ status: 'Hidden' });
      request.flush({ succeeded: true, message: 'Status set' });

      expect(await pending).toEqual({ succeeded: true, message: 'Status set', data: undefined });
    });

    it('sends Visible to make a hidden comment visible', async () => {
      const pending = moderationApi.setCommentStatus(5, ModerationStatus.Visible);

      const request = httpTesting.expectOne(
        (candidate) => candidate.url === '/api/admin/comments/5/moderation',
      );
      expect(request.request.body).toEqual({ status: 'Visible' });
      request.flush({ succeeded: true, message: null });
      await pending;
    });

    it('returns a fixed text when the server cannot be reached', async () => {
      const pending = moderationApi.setCommentStatus(5, ModerationStatus.Hidden);

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/admin/comments/5/moderation')
        .error(new ProgressEvent('error'));

      expect(await pending).toEqual({
        succeeded: false,
        message: english.httpFailures.network,
        status: 0,
      });
    });
  });
});
