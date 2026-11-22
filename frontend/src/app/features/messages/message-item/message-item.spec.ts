import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImageDto } from '../../posts/image-dto';
import { ConversationsStore } from '../conversations-store';
import { EditDraft } from '../edit-draft';
import { StandardMessageDto } from '../standard-message-dto';
import { MessageItem } from './message-item';

describe('MessageItem menu', () => {
  const now = new Date('2026-11-23T10:00:00Z').getTime();
  const minute = 60_000;

  const editDraft = signal<EditDraft | null>(null);
  const store = {
    editDraft,
    startEditing: vi.fn(),
    deleteMessage: vi.fn(() => Promise.resolve()),
  };

  function messageSentAgo(minutesAgo: number, overrides: Partial<StandardMessageDto> = {}) {
    const message: StandardMessageDto = {
      id: 2,
      content: 'Helo',
      images: [],
      sender: { id: 1, username: 'me' },
      receiverId: 7,
      sentAt: new Date(now - minutesAgo * minute).toISOString(),
      seen: false,
      seenAt: null,
      isEdited: false,
      ...overrides,
    };

    return message;
  }

  function createItem(
    message: StandardMessageDto,
    inputs: { isOwn?: boolean; isSending?: boolean; isFading?: boolean } = {},
  ): ComponentFixture<MessageItem> {
    const fixture = TestBed.createComponent(MessageItem);
    fixture.componentRef.setInput('message', message);
    fixture.componentRef.setInput('isOwn', inputs.isOwn ?? true);
    fixture.componentRef.setInput('isSending', inputs.isSending ?? false);
    fixture.componentRef.setInput('isFading', inputs.isFading ?? false);
    fixture.detectChanges();

    return fixture;
  }

  const entries = (fixture: ComponentFixture<MessageItem>) =>
    (fixture.componentInstance as unknown as { menuEntries(): { label: string }[] })
      .menuEntries()
      .map((entry) => entry.label);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    editDraft.set(null);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: ConversationsStore, useValue: store }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('offers Edit and Delete on the user’s own message inside 20 minutes', () => {
    expect(entries(createItem(messageSentAgo(19)))).toEqual(['Edit', 'Delete']);
  });

  it('offers only Delete once the 20 minutes have passed', () => {
    expect(entries(createItem(messageSentAgo(20)))).toEqual(['Delete']);
  });

  it('withdraws Edit at the moment the window closes while the message is on screen', () => {
    const fixture = createItem(messageSentAgo(19));
    expect(entries(fixture)).toEqual(['Edit', 'Delete']);

    vi.advanceTimersByTime(minute);
    fixture.detectChanges();

    expect(entries(fixture)).toEqual(['Delete']);
  });

  it('has no menu on a friend’s message', () => {
    const fixture = createItem(messageSentAgo(1), { isOwn: false });

    expect(entries(fixture)).toEqual([]);
    expect(fixture.nativeElement.querySelector('app-menu')).toBeNull();
  });

  it('has no menu while the message is on its way or fading out', () => {
    expect(entries(createItem(messageSentAgo(1), { isSending: true }))).toEqual([]);
    expect(entries(createItem(messageSentAgo(1), { isFading: true }))).toEqual([]);
  });

  it('offers Edit on a message with only photos: the text can be added', () => {
    const photo: ImageDto = { id: 1, address: '/api/images/a.jpg', orderIndex: 0 };

    expect(entries(createItem(messageSentAgo(1, { content: '', images: [photo] })))).toEqual([
      'Edit',
      'Delete',
    ]);
  });

  it('hands the message to the message box on Edit, and to the store on Delete', async () => {
    const message = messageSentAgo(1);
    const fixture = createItem(message);
    const item = fixture.componentInstance;

    item.startEditing();
    await item.remove();

    expect(store.startEditing).toHaveBeenCalledExactlyOnceWith(message);
    expect(store.deleteMessage).toHaveBeenCalledExactlyOnceWith(message);
  });

  it('outlines the bubble while the message box holds an edit of it', () => {
    const message = messageSentAgo(1);
    const fixture = createItem(message);
    const bubble = () => fixture.nativeElement.querySelector('.outline-2');
    expect(bubble()).toBeNull();

    editDraft.set({ message, content: message.content });
    fixture.detectChanges();

    expect(bubble()).not.toBeNull();
  });
});
