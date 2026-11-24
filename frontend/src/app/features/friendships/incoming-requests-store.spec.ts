import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SessionStore } from '../../core/session/session-store';
import { waitForPendingWork } from '../../core/session/testing/wait-for-pending-work';
import { IncomingRequestsStore } from './incoming-requests-store';
import { StandardFriendshipDto } from './standard-friendship-dto';

const pendingAddress = '/api/friendships/pending?pageNumber=1&pageSize=100';

function requests(count: number): StandardFriendshipDto[] {
  return Array.from({ length: count }, (_, index) => ({
    otherUser: { id: index + 10, username: `user_${index}` },
    status: 'Pending',
    sentAt: '2026-11-18T10:00:00Z',
    lastUpdatedAt: null,
    isRequester: false,
  }));
}

// The list's totalCount is the length of the page, as the backend sends it.
function page(count: number) {
  return { succeeded: true, message: null, data: requests(count), totalCount: count };
}

describe('IncomingRequestsStore', () => {
  const userId = signal<number | null>(null);
  let store: IncomingRequestsStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    userId.set(null);
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: SessionStore, useValue: { userId } },
      ],
    });
    store = TestBed.inject(IncomingRequestsStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('shows no badge before it is read', () => {
    expect(store.badge()).toBeNull();
  });

  it('reads one page of the largest size and shows how many requests wait', async () => {
    const reading = store.refresh();
    httpTesting.expectOne(pendingAddress).flush(page(3));
    await reading;

    expect(store.badge()).toBe('3');
  });

  it('shows 99+ when the page is full, since more may wait beyond it', async () => {
    const reading = store.refresh();
    httpTesting.expectOne(pendingAddress).flush(page(100));
    await reading;

    expect(store.badge()).toBe('99+');
  });

  it('shows 99 when one place on the page is left', async () => {
    const reading = store.refresh();
    httpTesting.expectOne(pendingAddress).flush(page(99));
    await reading;

    expect(store.badge()).toBe('99');
  });

  it('shows no badge when no request waits', async () => {
    const reading = store.refresh();
    httpTesting.expectOne(pendingAddress).flush(page(0));
    await reading;

    expect(store.badge()).toBeNull();
  });

  it('keeps the answer to the latest read when an older one arrives after it', async () => {
    const olderReading = store.refresh();
    const newerReading = store.refresh();
    const [olderRequest, newerRequest] = httpTesting.match(pendingAddress);

    newerRequest.flush(page(1));
    await newerReading;
    olderRequest.flush(page(5));
    await olderReading;

    expect(store.badge()).toBe('1');
  });

  it('keeps the last count when a read fails', async () => {
    const firstReading = store.refresh();
    httpTesting.expectOne(pendingAddress).flush(page(2));
    await firstReading;

    const failedReading = store.refresh();
    httpTesting.expectOne(pendingAddress).flush(null, { status: 0, statusText: 'Unknown Error' });
    await failedReading;

    expect(store.badge()).toBe('2');
  });

  it('ignores a read that answers after the count was cleared', async () => {
    const reading = store.refresh();
    store.clear();
    httpTesting.expectOne(pendingAddress).flush(page(2));
    await reading;

    expect(store.badge()).toBeNull();
  });

  describe('following the session', () => {
    beforeEach(() => {
      store.followSession();
    });

    it('reads the count when a user signs in', async () => {
      userId.set(7);
      TestBed.tick();

      httpTesting.expectOne(pendingAddress).flush(page(4));
      await waitForPendingWork();

      expect(store.badge()).toBe('4');
    });

    it('reads nothing while nobody is signed in', () => {
      TestBed.tick();

      httpTesting.expectNone(pendingAddress);
    });

    it('forgets the count when the user signs out', async () => {
      userId.set(7);
      TestBed.tick();
      httpTesting.expectOne(pendingAddress).flush(page(4));
      await waitForPendingWork();

      userId.set(null);
      TestBed.tick();

      expect(store.badge()).toBeNull();
    });

    it('reads again for another user who signs in', async () => {
      userId.set(7);
      TestBed.tick();
      httpTesting.expectOne(pendingAddress).flush(page(4));
      await waitForPendingWork();

      userId.set(8);
      TestBed.tick();
      httpTesting.expectOne(pendingAddress).flush(page(1));
      await waitForPendingWork();

      expect(store.badge()).toBe('1');
    });
  });
});
