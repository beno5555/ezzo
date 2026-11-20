import { StandardPostDisplayDto } from './standard-post-display-dto';

// The post with the caller's like or unlike, shown at once, before the server answers. The like calls
// return no count, so the count is worked out from the one the card shows.
export function toggledLike(post: StandardPostDisplayDto): StandardPostDisplayDto {
  const likedByCaller = !post.likedByCaller;
  const likeCount = likedByCaller ? post.likeCount + 1 : post.likeCount - 1;
  return { ...post, likedByCaller, likeCount };
}
