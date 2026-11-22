import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MessageApi } from './message-api';
import { SentMessageDto } from './sent-message-dto';
import { StandardMessageDto } from './standard-message-dto';

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

  describe('GET /api/messages/conversation/{otherUserId}', () => {
    it('sends the page as the query, and returns the messages oldest first as they arrive', async () => {
      const message: StandardMessageDto = {
        id: 12,
        content: 'See you there',
        images: [{ id: 5, address: '/api/images/a.png', orderIndex: 0 }],
        sender: { id: 3, username: 'alice' },
        receiverId: 1,
        sentAt: '2026-11-17T08:00:00Z',
        seen: true,
        seenAt: '2026-11-17T08:05:00Z',
        isEdited: false,
      };
      const pending = messageApi.getConversation(3, { pageNumber: 2, pageSize: 20 });

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'GET' && candidate.url === '/api/messages/conversation/3',
      );
      expect(request.request.params.get('pageNumber')).toBe('2');
      expect(request.request.params.get('pageSize')).toBe('20');
      request.flush({ succeeded: true, message: null, data: [message], totalCount: 1 });

      expect(await pending).toEqual({ succeeded: true, data: [message] });
    });

    it('returns the message when the backend refuses the read', async () => {
      const pending = messageApi.getConversation(3, { pageNumber: 1, pageSize: 20 });

      httpTesting
        .expectOne('/api/messages/conversation/3?pageNumber=1&pageSize=20')
        .flush(
          { succeeded: false, message: 'Invalid request' },
          { status: 400, statusText: 'Bad Request' },
        );

      expect(await pending).toEqual({ succeeded: false, message: 'Invalid request', status: 400 });
    });
  });

  describe('POST /api/messages/{receiverId}', () => {
    it('sends the text and the photos in their order as one multipart body', async () => {
      const lake = new File(['lake'], 'lake.jpg', { type: 'image/jpeg' });
      const map = new File(['map'], 'map.png', { type: 'image/png' });
      const sent: SentMessageDto = {
        id: 40,
        content: 'Look at this',
        images: [
          { id: 7, address: '/api/images/lake.jpg', orderIndex: 0 },
          { id: 8, address: '/api/images/map.png', orderIndex: 1 },
        ],
        sentAt: '2026-11-22T10:00:00Z',
      };

      const pending = messageApi.send(3, { content: 'Look at this', photos: [lake, map] });

      const request = httpTesting.expectOne(
        (candidate) => candidate.method === 'POST' && candidate.url === '/api/messages/3',
      );
      const body = request.request.body as FormData;
      expect(body).toBeInstanceOf(FormData);
      expect(body.get('Content')).toBe('Look at this');
      expect(body.getAll('Images').map((image) => (image as File).name)).toEqual([
        'lake.jpg',
        'map.png',
      ]);
      request.flush(
        { succeeded: true, message: 'Message sent', data: sent },
        { status: 201, statusText: 'Created' },
      );

      expect(await pending).toEqual({ succeeded: true, message: 'Message sent', data: sent });
    });

    it('sends no text part for a message with photos only, and returns a refusal', async () => {
      const lake = new File(['lake'], 'lake.jpg', { type: 'image/jpeg' });

      const pending = messageApi.send(3, { content: '', photos: [lake] });

      const request = httpTesting.expectOne('/api/messages/3');
      const body = request.request.body as FormData;
      expect(body.has('Content')).toBe(false);
      expect(body.getAll('Images')).toHaveLength(1);
      request.flush(
        { succeeded: false, message: 'You can message only your friends', data: null },
        { status: 400, statusText: 'Bad Request' },
      );

      expect(await pending).toEqual({
        succeeded: false,
        message: 'You can message only your friends',
        status: 400,
      });
    });
  });

  describe('PUT /api/messages/conversation/{otherUserId}/mark-as-read', () => {
    it('succeeds on the empty answer', async () => {
      const pending = messageApi.markAsRead(3);

      const request = httpTesting.expectOne(
        (candidate) =>
          candidate.method === 'PUT' &&
          candidate.url === '/api/messages/conversation/3/mark-as-read',
      );
      request.flush(null, { status: 204, statusText: 'No Content' });

      expect((await pending).succeeded).toBe(true);
    });
  });
});
