import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { english } from '../../core/languages/english';
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
