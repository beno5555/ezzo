import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { StandardUserDto } from '../users/standard-user-dto';
import { DisplayFriendDto } from './display-friend-dto';
import { PresenceStore } from './presence-store';

const onlineAlice: DisplayFriendDto = {
  id: 3,
  username: 'alice',
  lastActiveAt: null,
  isActive: true,
};
const offlineBob: DisplayFriendDto = {
  id: 4,
  username: 'bob',
  lastActiveAt: '2026-11-17T08:30:00Z',
  isActive: false,
};

const carol: StandardUserDto = {
  id: 5,
  username: 'carol',
  bio: null,
  dateOfBirth: '1999-02-03T00:00:00Z',
};

describe('PresenceStore', () => {
  let presenceStore: PresenceStore;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    presenceStore = TestBed.inject(PresenceStore);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('starts from what friend rows carry, where no last active time means online', () => {
    presenceStore.track([onlineAlice, offlineBob], Date.now());

    expect(presenceStore.friends()).toEqual([
      { id: 3, username: 'alice', lastActiveAt: null },
      { id: 4, username: 'bob', lastActiveAt: '2026-11-17T08:30:00Z' },
    ]);
    expect(presenceStore.onlineFriends()).toEqual([
      { id: 3, username: 'alice', lastActiveAt: null },
    ]);
  });

  it('shows a friend who comes online as online', async () => {
    presenceStore.track([onlineAlice, offlineBob], Date.now());

    await presenceStore.markOnline(4);

    expect(presenceStore.onlineFriends()).toEqual([
      { id: 3, username: 'alice', lastActiveAt: null },
      { id: 4, username: 'bob', lastActiveAt: null },
    ]);
  });

  it('shows a friend who goes offline with the time they were last active', () => {
    presenceStore.track([onlineAlice, offlineBob], Date.now());

    presenceStore.markOffline(3, '2026-11-17T09:15:00Z');

    expect(presenceStore.onlineFriends()).toEqual([]);
    expect(presenceStore.friends()).toContainEqual({
      id: 3,
      username: 'alice',
      lastActiveAt: '2026-11-17T09:15:00Z',
    });
  });

  describe('rows that answer while live events arrive', () => {
    beforeEach(() => {
      vi.useFakeTimers({ toFake: ['Date'] });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('keep a live event that arrived after the rows were asked for', () => {
      vi.setSystemTime(new Date('2026-11-17T09:00:00Z'));
      presenceStore.track([offlineBob], Date.now());
      const askedAt = Date.now();

      vi.setSystemTime(new Date('2026-11-17T09:00:01Z'));
      void presenceStore.markOnline(4); // a known friend: no lookup
      presenceStore.track([offlineBob], askedAt);

      expect(presenceStore.onlineFriends()).toEqual([
        { id: 4, username: 'bob', lastActiveAt: null },
      ]);
    });

    it('replace what live events said before the rows were asked for', () => {
      vi.setSystemTime(new Date('2026-11-17T09:00:00Z'));
      presenceStore.track([offlineBob], Date.now());
      void presenceStore.markOnline(4); // a known friend: no lookup

      vi.setSystemTime(new Date('2026-11-17T09:05:00Z'));
      presenceStore.track([offlineBob], Date.now());

      expect(presenceStore.onlineFriends()).toEqual([]);
    });
  });

  describe('a friend it does not know', () => {
    it('is looked up by id when they come online, and then shown as online', async () => {
      presenceStore.track([onlineAlice], Date.now());

      const markingOnline = presenceStore.markOnline(5);
      httpTesting.expectOne('/api/users/5').flush({ succeeded: true, message: null, data: carol });
      await markingOnline;

      expect(presenceStore.onlineFriends()).toEqual([
        { id: 3, username: 'alice', lastActiveAt: null },
        { id: 5, username: 'carol', lastActiveAt: null },
      ]);
    });

    it('is not shown while the lookup is on its way', () => {
      void presenceStore.markOnline(5); // the lookup is answered below, after the check

      expect(presenceStore.friends()).toEqual([]);

      httpTesting.expectOne('/api/users/5').flush({ succeeded: true, message: null, data: carol });
    });

    it('is not shown when the lookup fails, and is looked up again on the next online event', async () => {
      const firstMarking = presenceStore.markOnline(5);
      httpTesting
        .expectOne('/api/users/5')
        .flush(
          { succeeded: false, message: 'User not found' },
          { status: 404, statusText: 'Not Found' },
        );
      await firstMarking;

      expect(presenceStore.friends()).toEqual([]);

      const secondMarking = presenceStore.markOnline(5);
      httpTesting.expectOne('/api/users/5').flush({ succeeded: true, message: null, data: carol });
      await secondMarking;

      expect(presenceStore.onlineFriends()).toEqual([
        { id: 5, username: 'carol', lastActiveAt: null },
      ]);
    });

    it('stays offline when they go offline before the lookup answers', async () => {
      const markingOnline = presenceStore.markOnline(5);
      presenceStore.markOffline(5, '2026-11-17T09:20:00Z');
      httpTesting.expectOne('/api/users/5').flush({ succeeded: true, message: null, data: carol });
      await markingOnline;

      expect(presenceStore.friends()).toEqual([
        { id: 5, username: 'carol', lastActiveAt: '2026-11-17T09:20:00Z' },
      ]);
    });

    it('is ignored when they go offline', () => {
      presenceStore.markOffline(5, '2026-11-17T09:20:00Z');

      expect(presenceStore.friends()).toEqual([]);
    });
  });

  it('forgets every friend when cleared, including a lookup still on its way', async () => {
    presenceStore.track([onlineAlice, offlineBob], Date.now());
    const markingOnline = presenceStore.markOnline(5);

    presenceStore.clear();
    httpTesting.expectOne('/api/users/5').flush({ succeeded: true, message: null, data: carol });
    await markingOnline;

    expect(presenceStore.friends()).toEqual([]);
  });
});
