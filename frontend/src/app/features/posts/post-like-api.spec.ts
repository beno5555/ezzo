import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PostLikeApi } from './post-like-api';

const notFound = { status: 404, statusText: 'Not Found' };

describe('PostLikeApi', () => {
  let postLikeApi: PostLikeApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    postLikeApi = TestBed.inject(PostLikeApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('POST /api/posts/{postId}/likes', () => {
    it('likes the post as the caller', async () => {
      const pending = postLikeApi.like(3);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/posts/3/likes',
      );
      request.flush({ succeeded: true, message: 'Post liked' });

      expect(await pending).toEqual({ succeeded: true, message: 'Post liked', data: undefined });
    });

    it('returns the message when there is no such post', async () => {
      const pending = postLikeApi.like(99);

      httpTesting
        .expectOne('/api/posts/99/likes')
        .flush({ succeeded: false, message: 'Post not found' }, notFound);

      expect(await pending).toEqual({ succeeded: false, message: 'Post not found', status: 404 });
    });
  });

  describe('DELETE /api/posts/{postId}/likes', () => {
    it("removes the caller's like", async () => {
      const pending = postLikeApi.unlike(3);

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'DELETE' && candidate.url === '/api/posts/3/likes',
      );
      request.flush({ succeeded: true, message: 'Post unliked' });

      expect(await pending).toEqual({ succeeded: true, message: 'Post unliked', data: undefined });
    });

    it('returns the message when the caller has not liked the post', async () => {
      const pending = postLikeApi.unlike(3);

      httpTesting
        .expectOne('/api/posts/3/likes')
        .flush({ succeeded: false, message: 'You have not liked this post' }, notFound);

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You have not liked this post',
        status: 404,
      });
    });
  });
});
