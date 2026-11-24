import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AppResult, fail, ok } from '../../core/http/app-result';
import { SessionStore } from '../../core/session/session-store';
import { ToastStore } from '../../shared/toasts/toast-store';
import { ModeratedKind } from './moderated-kind';
import { ModerationApi } from './moderation-api';
import { ModerationStatus } from './moderation-status';
import { ModerationStore } from './moderation-store';

type Call = { kind: ModeratedKind; id: number; status: ModerationStatus };

// A ModerationApi whose answers the test gives one at a time, and a record of what it was asked.
function createModerationApi() {
  const calls: Call[] = [];
  const answers: ((result: AppResult<void>) => void)[] = [];
  const ask = (kind: ModeratedKind, id: number, status: ModerationStatus) =>
    new Promise<AppResult<void>>((resolve) => {
      calls.push({ kind, id, status });
      answers.push(resolve);
    });

  return {
    calls,
    setPostStatus: (id: number, status: ModerationStatus) => ask(ModeratedKind.Post, id, status),
    setCommentStatus: (id: number, status: ModerationStatus) =>
      ask(ModeratedKind.Comment, id, status),
    answer: (result: AppResult<void>) => answers.shift()?.(result),
  };
}

describe('ModerationStore', () => {
  const userId = signal(1);
  let store: ModerationStore;
  let toastStore: ToastStore;
  let moderationApi: ReturnType<typeof createModerationApi>;

  beforeEach(() => {
    userId.set(1);
    moderationApi = createModerationApi();
    TestBed.configureTestingModule({
      providers: [
        { provide: ModerationApi, useValue: moderationApi },
        { provide: SessionStore, useValue: { userId } },
        provideRouter([{ path: 'elsewhere', children: [] }]),
      ],
    });
    store = TestBed.inject(ModerationStore);
    toastStore = TestBed.inject(ToastStore);
  });

  it('shows an item as the server sent it until it is moderated here', () => {
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);
    expect(store.isHidden(ModeratedKind.Post, 3, true)).toBe(true);
  });

  it('sends Hidden for a post and shows it hidden at once', () => {
    void store.setHidden(ModeratedKind.Post, 3, true);

    expect(moderationApi.calls).toEqual([
      { kind: ModeratedKind.Post, id: 3, status: ModerationStatus.Hidden },
    ]);
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);
  });

  it('sends Visible for a comment and shows it visible at once', () => {
    void store.setHidden(ModeratedKind.Comment, 5, false);

    expect(moderationApi.calls).toEqual([
      { kind: ModeratedKind.Comment, id: 5, status: ModerationStatus.Visible },
    ]);
    expect(store.isHidden(ModeratedKind.Comment, 5, true)).toBe(false);
  });

  it('keeps a post and a comment with the same id apart', () => {
    void store.setHidden(ModeratedKind.Post, 3, true);

    expect(store.isHidden(ModeratedKind.Comment, 3, false)).toBe(false);
  });

  it('keeps the new state once the server accepts it, without a toast', async () => {
    const done = store.setHidden(ModeratedKind.Post, 3, true);

    moderationApi.answer(ok(undefined));
    await done;

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);
    expect(toastStore.visible()).toEqual([]);
  });

  it('puts the old state back and shows the reason when the server refuses', async () => {
    const done = store.setHidden(ModeratedKind.Post, 3, true);

    moderationApi.answer(fail('Post not found', 404));
    await done;

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);
    expect(toastStore.visible().map((toast) => toast.message)).toEqual(['Post not found']);
  });

  it('puts back the state set before, not the item’s own flag, when a later change is refused', async () => {
    const hide = store.setHidden(ModeratedKind.Post, 3, true);
    moderationApi.answer(ok(undefined));
    await hide;

    const show = store.setHidden(ModeratedKind.Post, 3, false);
    moderationApi.answer(fail('Post not found', 404));
    await show;

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);
  });

  it('shows a second request at once but sends it only after the first is answered', async () => {
    const hide = store.setHidden(ModeratedKind.Post, 3, true);
    void store.setHidden(ModeratedKind.Post, 3, false);

    expect(moderationApi.calls).toHaveLength(1);
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);

    moderationApi.answer(ok(undefined));
    await Promise.resolve();
    await Promise.resolve();

    expect(moderationApi.calls.map((call) => call.status)).toEqual([
      ModerationStatus.Hidden,
      ModerationStatus.Visible,
    ]);

    moderationApi.answer(ok(undefined));
    await hide;

    expect(store.isHidden(ModeratedKind.Post, 3, true)).toBe(false);
  });

  it('keeps only the latest of several requests made while one is on its way', async () => {
    const first = store.setHidden(ModeratedKind.Post, 3, true);
    void store.setHidden(ModeratedKind.Post, 3, false);
    void store.setHidden(ModeratedKind.Post, 3, true);

    moderationApi.answer(ok(undefined));
    await Promise.resolve();
    await Promise.resolve();
    moderationApi.answer(ok(undefined));
    await first;

    expect(moderationApi.calls.map((call) => call.status)).toEqual([
      ModerationStatus.Hidden,
      ModerationStatus.Hidden,
    ]);
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);
  });

  it('puts the settled state back when the first request is refused and nothing newer was asked', async () => {
    const hide = store.setHidden(ModeratedKind.Post, 3, true);

    moderationApi.answer(fail('Post not found', 404));
    await hide;

    expect(moderationApi.calls).toHaveLength(1);
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);
  });

  it('drops the answered states on the next navigation, so the server’s flag shows again', async () => {
    const hide = store.setHidden(ModeratedKind.Post, 3, true);
    moderationApi.answer(ok(undefined));
    await hide;
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);

    await TestBed.inject(Router).navigateByUrl('/elsewhere');

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);
  });

  it('keeps the answered states on a navigation to the same address, which keeps the page', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/elsewhere');
    const hide = store.setHidden(ModeratedKind.Post, 3, true);
    moderationApi.answer(ok(undefined));
    await hide;

    await router.navigateByUrl('/elsewhere', { onSameUrlNavigation: 'reload' });

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);
  });

  it('drops the answered states on the same address when another user signed in', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/elsewhere');
    const hide = store.setHidden(ModeratedKind.Post, 3, true);
    moderationApi.answer(ok(undefined));
    await hide;

    userId.set(2);
    await router.navigateByUrl('/elsewhere', { onSameUrlNavigation: 'reload' });

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);
  });

  it('keeps the state of a request still on its way through a navigation', async () => {
    void store.setHidden(ModeratedKind.Post, 3, true);

    await TestBed.inject(Router).navigateByUrl('/elsewhere');

    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(true);
  });

  it('takes a new request once the first one is answered', async () => {
    const first = store.setHidden(ModeratedKind.Post, 3, true);
    moderationApi.answer(ok(undefined));
    await first;

    void store.setHidden(ModeratedKind.Post, 3, false);

    expect(moderationApi.calls.map((call) => call.status)).toEqual([
      ModerationStatus.Hidden,
      ModerationStatus.Visible,
    ]);
    expect(store.isHidden(ModeratedKind.Post, 3, false)).toBe(false);
  });
});
