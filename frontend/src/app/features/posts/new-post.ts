// What the composer sends: a title, optional text and the photos in the order they should show. A post
// needs a title and either text or at least one photo (the backend's TextOrImageRequired).
export type NewPost = {
  title: string;
  content: string;
  photos: File[];
};
