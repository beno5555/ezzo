import { StandardPostDisplayDto } from './standard-post-display-dto';
import { toggledLike } from './toggled-like';

const post: StandardPostDisplayDto = {
  id: 3,
  title: 'Sunday at the lake',
  author: { id: 7, username: 'john_doe' },
  postContent: 'Cold water, warm sun.',
  uploadedAt: '2026-11-19T08:30:00Z',
  images: [],
  likeCount: 4,
  commentCount: 2,
  likedByCaller: false,
  isHidden: false,
};

describe('toggledLike', () => {
  it('marks a post liked and counts one more like', () => {
    expect(toggledLike(post)).toEqual({ ...post, likedByCaller: true, likeCount: 5 });
  });

  it('marks a liked post unliked and counts one fewer like', () => {
    const liked = { ...post, likedByCaller: true, likeCount: 5 };

    expect(toggledLike(liked)).toEqual({ ...post, likedByCaller: false, likeCount: 4 });
  });
});
