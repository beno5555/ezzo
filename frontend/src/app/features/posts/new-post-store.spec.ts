import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { english } from '../../core/languages/english';
import { SessionStore } from '../../core/session/session-store';
import { PreviewAddressMaker } from '../../shared/photos/preview-address-maker';
import { ToastStore } from '../../shared/toasts/toast-store';
import { NewPost } from './new-post';
import { NewPostStore } from './new-post-store';
import { PostApi } from './post-api';
import { StandardPostDisplayDto } from './standard-post-display-dto';

const sentAt = '2026-11-21T10:00:00.000Z';
const author = { id: 7, username: 'john_doe', roles: [] };
const lake = new File(['lake'], 'lake.jpg', { type: 'image/jpeg' });
const map = new File(['map'], 'map.png', { type: 'image/png' });

const serverCopy = (id: number, title: string): StandardPostDisplayDto => ({
  id,
  title,
  author: { id: 7, username: 'john_doe' },
  postContent: '',
  uploadedAt: '2026-11-21T10:00:01Z',
  images: [],
  likeCount: 0,
  commentCount: 0,
  likedByCaller: false,
  isHidden: false,
});

// A PostApi whose answers the test gives one at a time, in the order the posts were sent.
function createPostApi() {
  const sent: NewPost[] = [];
  const answers: ((result: AppResult<StandardPostDisplayDto>) => void)[] = [];
  const create = (newPost: NewPost) =>
    new Promise<AppResult<StandardPostDisplayDto>>((resolve) => {
      sent.push(newPost);
      answers.push(resolve);
    });

  return {
    sent,
    create,
    answer: (result: AppResult<StandardPostDisplayDto>) => answers.shift()?.(result),
  };
}

// Preview addresses named after their file, and a record of those released.
function createPreviews() {
  const released: string[] = [];

  return {
    released,
    create: (photo: File) => `blob:${photo.name}`,
    release: (address: string) => released.push(address),
  };
}

describe('NewPostStore', () => {
  let store: NewPostStore;
  let toastStore: ToastStore;
  let postApi: ReturnType<typeof createPostApi>;
  let previews: ReturnType<typeof createPreviews>;
  let shown: StandardPostDisplayDto[];

  const toastMessages = () => toastStore.visible().map((toast) => toast.message);
  const show = (post: StandardPostDisplayDto) => shown.push(post);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(sentAt));
    postApi = createPostApi();
    previews = createPreviews();
    shown = [];
    TestBed.configureTestingModule({
      providers: [
        { provide: PostApi, useValue: postApi },
        { provide: PreviewAddressMaker, useValue: previews },
        { provide: SessionStore, useValue: { user: signal(author) } },
      ],
    });
    store = TestBed.inject(NewPostStore);
    toastStore = TestBed.inject(ToastStore);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the post at once as uploading, with the moment it was sent and its photos from the previews', () => {
    void store.publish(
      { title: 'Sunday at the lake', content: 'Cold water.', photos: [lake, map] },
      show,
    );

    expect(store.pending()).toEqual([
      {
        id: expect.any(Number),
        title: 'Sunday at the lake',
        author: { id: 7, username: 'john_doe' },
        postContent: 'Cold water.',
        uploadedAt: sentAt,
        images: [
          { id: expect.any(Number), address: 'blob:lake.jpg', orderIndex: 0 },
          { id: expect.any(Number), address: 'blob:map.png', orderIndex: 1 },
        ],
        likeCount: 0,
        commentCount: 0,
        likedByCaller: false,
        isHidden: false,
      },
    ]);
    expect(postApi.sent).toEqual([
      { title: 'Sunday at the lake', content: 'Cold water.', photos: [lake, map] },
    ]);
    expect(toastMessages()).toEqual([english.posts.composer.uploadingToast]);
    vi.advanceTimersByTime(60_000);
    expect(toastMessages()).toEqual([english.posts.composer.uploadingToast]);
  });

  it("puts the server's copy in the pending post's place, releases the previews, and says it was published", async () => {
    const publishing = store.publish(
      { title: 'Sunday at the lake', content: '', photos: [lake, map] },
      show,
    );

    postApi.answer(ok(serverCopy(12, 'Sunday at the lake')));
    await publishing;

    expect(store.pending()).toEqual([]);
    expect(shown).toEqual([serverCopy(12, 'Sunday at the lake')]);
    expect(previews.released).toEqual(['blob:lake.jpg', 'blob:map.png']);
    expect(toastStore.visible()).toEqual([
      { id: expect.any(Number), message: english.posts.composer.publishedToast, link: '/posts/12' },
    ]);
  });

  it('on a refusal removes the pending post, says why, and gives back what the user wrote', async () => {
    const written: NewPost = {
      title: 'Sunday at the lake',
      content: 'Cold water.',
      photos: [lake],
    };
    const publishing = store.publish(written, show);

    postApi.answer(fail('Image lake.jpg is not a supported image', 400));
    await publishing;

    expect(store.pending()).toEqual([]);
    expect(shown).toEqual([]);
    expect(previews.released).toEqual(['blob:lake.jpg']);
    expect(toastMessages()).toEqual(['Image lake.jpg is not a supported image']);
    expect(store.takeReturned()).toEqual(written);
    expect(store.takeReturned()).toBeNull();
  });

  it('keeps each of two uploads under way apart, newest on top, each with its own toasts', async () => {
    const first = store.publish({ title: 'First', content: 'one', photos: [] }, show);
    const second = store.publish({ title: 'Second', content: 'two', photos: [] }, show);

    expect(store.pending().map((post) => post.title)).toEqual(['Second', 'First']);
    expect(new Set(store.pending().map((post) => post.id)).size).toBe(2);
    expect(toastMessages()).toEqual([
      english.posts.composer.uploadingToast,
      english.posts.composer.uploadingToast,
    ]);

    postApi.answer(ok(serverCopy(21, 'First')));
    await first;

    expect(store.pending().map((post) => post.title)).toEqual(['Second']);
    expect(toastMessages()).toEqual([
      english.posts.composer.publishedToast,
      english.posts.composer.uploadingToast,
    ]);

    postApi.answer(fail('Too many requests', 429));
    await second;

    expect(store.pending()).toEqual([]);
    expect(shown.map((post) => post.id)).toEqual([21]);
    expect(store.takeReturned()?.title).toBe('Second');
  });
});
