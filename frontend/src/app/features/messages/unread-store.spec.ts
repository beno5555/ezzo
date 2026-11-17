import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { UnreadStore } from './unread-store';

const unreadAddress = '/api/messages/conversations/unread';

describe('UnreadStore', () => {
  let unreadStore: UnreadStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    unreadStore = TestBed.inject(UnreadStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('holds no count before it is read', () => {
    expect(unreadStore.count()).toBeNull();
  });

  it('reads the count from the backend when told that something changed', async () => {
    const reading = unreadStore.refresh();
    httpTesting.expectOne(unreadAddress).flush({ unreadCount: 2 });
    await reading;

    expect(unreadStore.count()).toBe(2);
  });

  it('reads again each time it is told, and shows the newest count', async () => {
    const firstReading = unreadStore.refresh();
    httpTesting.expectOne(unreadAddress).flush({ unreadCount: 2 });
    await firstReading;

    const secondReading = unreadStore.refresh();
    httpTesting.expectOne(unreadAddress).flush({ unreadCount: 0 });
    await secondReading;

    expect(unreadStore.count()).toBe(0);
  });

  it('keeps the answer to the latest read when an older one arrives after it', async () => {
    const olderReading = unreadStore.refresh();
    const newerReading = unreadStore.refresh();
    const [olderRequest, newerRequest] = httpTesting.match(unreadAddress);

    newerRequest.flush({ unreadCount: 4 });
    await newerReading;
    olderRequest.flush({ unreadCount: 3 });
    await olderReading;

    expect(unreadStore.count()).toBe(4);
  });

  it('keeps the last count when a read fails', async () => {
    const firstReading = unreadStore.refresh();
    httpTesting.expectOne(unreadAddress).flush({ unreadCount: 2 });
    await firstReading;

    const failedReading = unreadStore.refresh();
    httpTesting.expectOne(unreadAddress).flush(null, { status: 0, statusText: 'Unknown Error' });
    await failedReading;

    expect(unreadStore.count()).toBe(2);
  });

  it('forgets the count when cleared', async () => {
    const reading = unreadStore.refresh();
    httpTesting.expectOne(unreadAddress).flush({ unreadCount: 2 });
    await reading;

    unreadStore.clear();

    expect(unreadStore.count()).toBeNull();
  });

  it('ignores a read that answers after the count was cleared', async () => {
    const reading = unreadStore.refresh();
    unreadStore.clear();
    httpTesting.expectOne(unreadAddress).flush({ unreadCount: 2 });
    await reading;

    expect(unreadStore.count()).toBeNull();
  });
});
