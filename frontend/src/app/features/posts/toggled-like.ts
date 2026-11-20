import { StandardPostDisplayDto } from './standard-post-display-dto';

// The post as it stands after the server accepted the caller's like or unlike. The like calls return no
// count, so the card works it out from the one it shows.
export function toggledLike(post: StandardPostDisplayDto): StandardPostDisplayDto {
  const likedByCaller = !post.likedByCaller;
  const likeCount = likedByCaller ? post.likeCount + 1 : post.likeCount - 1;
  return { ...post, likedByCaller, likeCount };
}
