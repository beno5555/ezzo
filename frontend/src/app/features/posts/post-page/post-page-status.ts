// What a post's page shows in place of the post: it is loading, the post is there, there is no such post
// for this visitor (a missing id, or a hidden post they may not read), or loading failed for another
// reason, with a way to try again.
export const PostPageStatus = {
  Loading: 'loading',
  Ready: 'ready',
  NotFound: 'not-found',
  Failed: 'failed',
} as const;
export type PostPageStatus = (typeof PostPageStatus)[keyof typeof PostPageStatus];
