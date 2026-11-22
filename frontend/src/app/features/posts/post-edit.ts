// What an edit of a post changes: the title and the text (the backend's UpdatePostDto). Photos are
// removed one at a time and never added. The text may be empty only when the post has photos.
export type PostEdit = {
  title: string;
  content: string;
};
