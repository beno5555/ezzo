import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { english } from '../../core/languages/english';
import { FullPostDisplayDto } from './full-post-display-dto';
import { PostApi } from './post-api';
import { StandardPostDisplayDto } from './standard-post-display-dto';

const post: StandardPostDisplayDto = {
  id: 3,
  title: 'Sunday at the lake',
  author: { id: 7, username: 'john_doe' },
  postContent: 'Cold water, warm sun.',
  uploadedAt: '2026-11-19T08:30:00Z',
  images: [{ id: 11, address: '/api/images/a.jpg', orderIndex: 0 }],
  likeCount: 4,
  commentCount: 2,
  likedByCaller: true,
  isHidden: false,
};

describe('PostApi', () => {
  let postApi: PostApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    postApi = TestBed.inject(PostApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('POST /api/posts', () => {
    it('sends the title, the text and the photos in their order as one multipart body', async () => {
      const lake = new File(['lake'], 'lake.jpg', { type: 'image/jpeg' });
      const map = new File(['map'], 'map.png', { type: 'image/png' });
      const created: StandardPostDisplayDto = {
        ...post,
        likeCount: 0,
        commentCount: 0,
        likedByCaller: false,
      };

      const pending = postApi.create({
        title: 'Sunday at the lake',
        content: 'Cold water, warm sun.',
        photos: [lake, map],
      });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/posts',
      );
      const body = request.request.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('PostTitle')).toBe('Sunday at the lake');
      expect(body.get('PostContent')).toBe('Cold water, warm sun.');
      expect(body.getAll('Images').map((image) => (image as File).name)).toEqual([
        'lake.jpg',
        'map.png',
      ]);
      request.flush(
        { succeeded: true, message: null, data: created },
        { status: 201, statusText: 'Created' },
      );

      expect(await pending).toEqual({ succeeded: true, data: created });
    });

    it('sends no text and no photos when the post has neither', async () => {
      const pending = postApi.create({ title: 'Only a title', content: '', photos: [] });

      const request = httpTesting.expectOne((candidate) => candidate.url === '/api/posts');
      const body = request.request.body as FormData;
      expect(body.get('PostTitle')).toBe('Only a title');
      expect(body.has('PostContent')).toBe(false);
      expect(body.has('Images')).toBe(false);
      request.flush(
        { succeeded: false, message: 'Post Text or at least one Image is required', data: null },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Post Text or at least one Image is required',
        status: 400,
      });
    });
  });

  describe('PUT /api/posts/{id}', () => {
    it('sends the title and the text as JSON and returns the edited post', async () => {
      const edited: FullPostDisplayDto = { ...post, title: 'Monday at the lake' };

      const pending = postApi.edit(3, { title: 'Monday at the lake', content: 'Cold water.' });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'PUT' && candidate.url === '/api/posts/3',
      );
      expect(request.request.body).toEqual({ title: 'Monday at the lake', content: 'Cold water.' });
      request.flush({ succeeded: true, message: null, data: edited });

      expect(await pending).toEqual({ succeeded: true, data: edited });
    });

    it('returns the backend message with status 400 for an edit it refuses', async () => {
      const pending = postApi.edit(3, { title: 'Only a title', content: '' });

      httpTesting
        .expectOne('/api/posts/3')
        .flush(
          { succeeded: false, message: 'Post Text or at least one Image is required', data: null },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Post Text or at least one Image is required',
        status: 400,
      });
    });
  });

  describe('DELETE /api/posts/{id}', () => {
    it('deletes the post', async () => {
      const pending = postApi.delete(3);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/posts/3',
      );
      request.flush({ succeeded: true, message: 'Post deleted' });

      expect(await pending).toEqual({ succeeded: true, message: 'Post deleted', data: undefined });
    });

    it('returns the backend message with status 400 when the post is not the callers', async () => {
      const pending = postApi.delete(3);

      httpTesting
        .expectOne('/api/posts/3')
        .flush(
          { succeeded: false, message: 'Could not delete post', data: null },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'Could not delete post',
        status: 400,
      });
    });
  });

  describe('DELETE /api/posts/{postId}/images/{imageId}', () => {
    it('removes one photo and returns the post without it', async () => {
      const without: FullPostDisplayDto = { ...post, images: [] };

      const pending = postApi.removeImage(3, 11);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/posts/3/images/11',
      );
      request.flush({ succeeded: true, message: null, data: without });

      expect(await pending).toEqual({ succeeded: true, data: without });
    });

    it('returns the backend message with status 400 for the last photo of a post without text', async () => {
      const pending = postApi.removeImage(3, 11);

      httpTesting
        .expectOne('/api/posts/3/images/11')
        .flush(
          { succeeded: false, message: 'A post must keep its text or a photo', data: null },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'A post must keep its text or a photo',
        status: 400,
      });
    });
  });

  describe('GET /api/posts/{id}', () => {
    it('returns the post with its counts', async () => {
      const full: FullPostDisplayDto = { ...post };

      const pending = postApi.getById(3);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/posts/3',
      );
      request.flush({ succeeded: true, message: null, data: full });

      expect(await pending).toEqual({ succeeded: true, data: full });
    });

    it('returns the backend message with status 404 for a post that cannot be read', async () => {
      const pending = postApi.getById(99);

      httpTesting
        .expectOne('/api/posts/99')
        .flush(
          { succeeded: false, message: 'Post not found', data: null },
          { status: 404, statusText: 'Not Found' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'Post not found', status: 404 });
    });
  });

  describe('GET /api/posts/feed', () => {
    it('sends the page as the query, and returns the posts of that page', async () => {
      const pending = postApi.getFeed({ pageNumber: 2, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'GET' && candidate.url === '/api/posts/feed',
      );
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [post], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [post] });
    });

    it('returns a fixed text when the server cannot be reached', async () => {
      const pending = postApi.getFeed({ pageNumber: 1, pageSize: 10 });

      httpTesting
        .expectOne((candidate) => candidate.url === '/api/posts/feed')
        .error(new ProgressEvent('error'));

      expect(await pending).toEqual({
        succeeded: false,
        message: english.httpFailures.network,
        status: 0,
      });
    });
  });
});
