import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageApi } from './message-api';

describe('MessageApi', () => {
  let messageApi: MessageApi;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    messageApi = TestBed.inject(MessageApi);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  describe('GET /api/messages/friends/conversation', () => {
    it('sends the page as the query, and returns the friends with a conversation', async () => {
      const row = {
        conversationFriend: { id: 3, username: 'alice', lastActiveAt: null, isActive: true },
        lastMessageContent: 'Hi',
        lastMessageSentAt: '2026-11-17T08:00:00Z',
        lastMessageSenderId: 3,
        lastMessageImageCount: 0,
        unreadCount: 1,
      };
      const pending = messageApi.getConversationFriends({ pageNumber: 1, pageSize: 100 });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'GET' && candidate.url === '/api/messages/friends/conversation',
      );
      expect(request.request.params.get('pageNumber')).toBe('1');
      expect(request.request.params.get('pageSize')).toBe('100');
      request.flush({ succeeded: true, message: null, data: [row], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [row] });
    });
  });

  describe('GET /api/messages/friends/no-conversation', () => {
    it('sends the page as the query, and returns the friends without a conversation', async () => {
      const row = { id: 4, username: 'bob', lastActiveAt: '2026-11-17T08:30:00Z', isActive: false };
      const pending = messageApi.getNonConversationFriends({ pageNumber: 2, pageSize: 10 });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'GET' && candidate.url === '/api/messages/friends/no-conversation',
      );
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('10');
      request.flush({ succeeded: true, message: null, data: [row], totalCount: 11 });

      expect(await pending).toEqual({ succeeded: true, data: [row] });
    });
  });

  describe('GET /api/messages/conversations/unread', () => {
    it('returns the number of conversations with unread messages', async () => {
      const pending = messageApi.getUnreadCount();

      httpTesting
        .expectOne(
          (candidate) =>
            candidate.method === 'GET' && candidate.url === '/api/messages/conversations/unread',
        )
        .flush({ unreadCount: 3 });

      expect(await pending).toEqual({ succeeded: true, data: { unreadCount: 3 } });
    });
  });
});
