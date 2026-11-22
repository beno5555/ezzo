import { StandardPostDisplayDto } from './standard-post-display-dto';

// A change to the post as a page holds it now: PostEditStore hands one to the page's show function
// instead of a whole post, so what else changed in the meantime (a like settling, the comment count) is
// not overwritten by the copy of the post the edit started from.
export type PostChange = (post: StandardPostDisplayDto) => StandardPostDisplayDto;
