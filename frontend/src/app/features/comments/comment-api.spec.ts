import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { english } from '../../core/languages/english';
import { CommentApi } from './comment-api';
import { FullCommentDto } from './full-comment-dto';
import { StandardCommentDto } from './standard-comment-dto';

const comment: StandardCommentDto = {
  id: 5,
  content: 'Looks cold!',
  author: { id: 8, username: 'jane_roe' },
  uploadedAt: '2026-11-19T09:00:00Z',
  isHidden: false,
};

const fullComment: FullCommentDto = { ...comment, postId: 3, lastUpdatedAt: null };

const badRequest = { status: 400, statusText: 'Bad Request' };

describe('CommentApi', () => {
  let commentApi: CommentApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    commentApi = TestBed.inject(CommentApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('GET /api/comments/post/{postId}', () => {
    it('sends the page as the query, and returns the comments of that page', async () => {
      const pending = commentApi.getByPost(3, { pageNumber: 2, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/comments/post/3',
      );
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [comment], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [comment] });
    });

    it('returns the backend message when the post cannot be read', async () => {
      const pending = commentApi.getByPost(3, { pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/comments/post/3')
        .flush({ succeeded: false, message: 'Post not found', data: null }, badRequest);

      expect(await pending).toEqual({ succeeded: false, message: 'Post not found', status: 400 });
    });
  });

  describe('POST /api/comments/posts/{postId}', () => {
    it('sends the text as JSON, and returns the new comment', async () => {
      const pending = commentApi.create(3, 'Looks cold!');

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/comments/posts/3',
      );
      expect(request.request.body).toEqual({ content: 'Looks cold!' });
      request.flush(
        { succeeded: true, message: null, data: fullComment },
        { status: 201, statusText: 'Created' },
      );

      expect(await pending).toEqual({ succeeded: true, data: fullComment });
    });

    it('returns the validation message and the field errors of a refused text', async () => {
      const pending = commentApi.create(3, 'a'.repeat(501));

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/comments/posts/3')
        .flush(
          {
            title: 'One or more validation errors occurred.',
            status: 400,
            errors: { Content: ['The field Content must be a maximum length of 500.'] },
          },
          badRequest,
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: english.httpFailures.validation,
        status: 400,
        fieldErrors: { content: ['The field Content must be a maximum length of 500.'] },
      });
    });
  });

  describe('PUT /api/comments/{id}', () => {
    it('sends the new text as JSON, and returns the edited comment', async () => {
      const edited: FullCommentDto = {
        ...fullComment,
        content: 'Warm, actually.',
        lastUpdatedAt: '2026-11-19T09:05:00Z',
      };

      const pending = commentApi.edit(5, 'Warm, actually.');

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/comments/5',
      );
      expect(request.request.body).toEqual({ content: 'Warm, actually.' });
      request.flush({ succeeded: true, message: null, data: edited });

      expect(await pending).toEqual({ succeeded: true, data: edited });
    });

    it('returns the backend message when the comment is not the caller’s', async () => {
      const pending = commentApi.edit(5, 'Warm, actually.');

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/comments/5')
        .flush({ succeeded: false, message: 'Comment not found', data: null }, badRequest);

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Comment not found',
        status: 400,
      });
    });
  });

  describe('DELETE /api/comments/{id}', () => {
    it('deletes the comment', async () => {
      const pending = commentApi.delete(5);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/comments/5',
      );
      request.flush({ succeeded: true, message: 'Comment deleted' });

      expect(await pending).toEqual({
        succeeded: true,
        message: 'Comment deleted',
        data: undefined,
      });
    });

    it('returns a fixed text when the server cannot be reached', async () => {
      const pending = commentApi.delete(5);

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/comments/5')
        .error(new ProgressEvent('error'));

      expect(await pending).toEqual({
        succeeded: false,
        message: english.httpFailures.network,
        status: 0,
      });
    });
  });
});
