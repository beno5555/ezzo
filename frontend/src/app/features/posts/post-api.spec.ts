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
