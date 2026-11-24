import { TestBed } from '@angular/core/testing';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { ToastStore } from '../../shared/toasts/toast-store';
import { PostLikeApi } from './post-like-api';
import { likeSendDelayMilliseconds, PostLikeStore } from './post-like-store';
import { StandardPostDisplayDto } from './standard-post-display-dto';

const post = (isLiked: boolean): StandardPostDisplayDto => ({
  id: 3,
  title: 'Sunday at the lake',
  author: { id: 7, username: 'john_doe' },
  postContent: 'Cold water, warm sun.',
  uploadedAt: '2026-11-19T08:30:00Z',
  images: [],
  likeCount: isLiked ? 5 : 4,
  commentCount: 0,
  likedByCaller: isLiked,
  isHidden: false,
});

// A call whose answer the test gives when it chooses.
function deferred() {
  let resolve!: (value: AppResult<void>) => void;
  const promise = new Promise<AppResult<void>>((resolver) => {
    resolve = resolver;
  });

  return { promise, resolve };
}

describe('PostLikeStore', () => {
  let store: PostLikeStore;
  let postLikeApi: { like: ReturnType<typeof vi.fn>; unlike: ReturnType<typeof vi.fn> };
  let toastStore: { show: ReturnType<typeof vi.fn> };
  // What the page shows for the post: the page keeps the last post it was given.
  let shown: StandardPostDisplayDto;
  const show = (next: StandardPostDisplayDto) => {
    shown = next;
  };
  // What a click on the card asks: the post as the page shows it now.
  const click = () => store.toggle(shown, show);

  beforeEach(() => {
    vi.useFakeTimers();
    postLikeApi = {
      like: vi.fn().mockResolvedValue(ok(undefined)),
      unlike: vi.fn().mockResolvedValue(ok(undefined)),
    };
    toastStore = { show: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: PostLikeApi, useValue: postLikeApi },
        { provide: ToastStore, useValue: toastStore },
      ],
    });
    store = TestBed.inject(PostLikeStore);
    shown = post(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a like on the click and tells the server once the delay has passed', async () => {
    click();

    expect(shown).toEqual(post(true));
    expect(postLikeApi.like).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

    expect(postLikeApi.like).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('sends an unlike of a liked post', async () => {
    shown = post(true);

    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

    expect(shown).toEqual(post(false));
    expect(postLikeApi.unlike).toHaveBeenCalledExactlyOnceWith(3);
    expect(postLikeApi.like).not.toHaveBeenCalled();
  });

  it('sends nothing for a like that is taken back inside the delay', async () => {
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds / 2);
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds * 2);

    expect(shown).toEqual(post(false));
    expect(postLikeApi.like).not.toHaveBeenCalled();
    expect(postLikeApi.unlike).not.toHaveBeenCalled();
  });

  it('sends nothing for an unlike that is taken back inside the delay', async () => {
    shown = post(true);

    click();
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds * 2);

    expect(shown).toEqual(post(true));
    expect(postLikeApi.like).not.toHaveBeenCalled();
    expect(postLikeApi.unlike).not.toHaveBeenCalled();
  });

  it('sends one request after a burst of clicks, for where the burst ended', async () => {
    click();
    click();
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

    expect(shown).toEqual(post(true));
    expect(postLikeApi.like).toHaveBeenCalledOnce();
    expect(postLikeApi.unlike).not.toHaveBeenCalled();
  });

  it('starts the delay again with each click', async () => {
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds - 1);
    click();
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds - 1);

    expect(postLikeApi.like).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);

    expect(postLikeApi.like).toHaveBeenCalledOnce();
  });

  it('takes a click while the request is on its way, and sends the unlike after the answer', async () => {
    const answer = deferred();
    postLikeApi.like.mockReturnValueOnce(answer.promise);

    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);
    click();

    expect(shown).toEqual(post(false));

    answer.resolve(ok(undefined));
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

    expect(postLikeApi.like).toHaveBeenCalledOnce();
    expect(postLikeApi.unlike).toHaveBeenCalledExactlyOnceWith(3);
  });

  it('sends nothing more when a click during the request leaves the post as the server has it', async () => {
    const answer = deferred();
    postLikeApi.like.mockReturnValueOnce(answer.promise);

    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);
    click();
    click();
    answer.resolve(ok(undefined));
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds * 2);

    expect(shown).toEqual(post(true));
    expect(postLikeApi.like).toHaveBeenCalledOnce();
    expect(postLikeApi.unlike).not.toHaveBeenCalled();
  });

  it('puts the post back as it was and shows a toast when the server refuses', async () => {
    postLikeApi.like.mockResolvedValueOnce(fail('Too many requests', 429));

    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

    expect(shown).toEqual(post(false));
    expect(toastStore.show).toHaveBeenCalledExactlyOnceWith('Too many requests');
  });

  it('settles each post on its own', async () => {
    const other = { ...post(false), id: 9 };
    let shownOther = other;

    click();
    store.toggle(other, (next) => {
      shownOther = next;
    });
    click();
    await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

    expect(shown).toEqual(post(false));
    expect(shownOther.likedByCaller).toBe(true);
    expect(postLikeApi.like).toHaveBeenCalledExactlyOnceWith(9);
  });

  describe('withUnsettledLike', () => {
    it('applies a click the server has not heard of to a post that was loaded meanwhile', () => {
      click();

      expect(store.withUnsettledLike(post(false))).toEqual(post(true));
    });

    it('leaves a post alone when the server already shows what the click made', () => {
      click();

      expect(store.withUnsettledLike(post(true))).toEqual(post(true));
    });

    it('leaves a post alone when nothing is unsettled', () => {
      expect(store.withUnsettledLike(post(false))).toEqual(post(false));
    });

    it('leaves a post alone once the click is settled', async () => {
      click();
      await vi.advanceTimersByTimeAsync(likeSendDelayMilliseconds);

      expect(store.withUnsettledLike(post(false))).toEqual(post(false));
    });
  });
});
