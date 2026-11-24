import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LIMITS } from '../../../core/limits';
import { ConversationsStore } from '../conversations-store';
import { EditDraft } from '../edit-draft';
import { StandardMessageDto } from '../standard-message-dto';
import { TypingSender } from '../typing-sender';
import { MessageForm } from './message-form';

describe('MessageForm editing', () => {
  const now = new Date('2026-11-23T10:00:00Z').getTime();
  const minute = 60_000;
  const friendId = 7;

  const editDraft = signal<EditDraft | null>(null);
  const store = {
    editDraft,
    returnedMessage: signal(null),
    takeReturned: vi.fn(() => null),
    stopEditing: vi.fn(() => editDraft.set(null)),
    edit: vi.fn(() => Promise.resolve()),
  };
  const typingSender = { typed: vi.fn() };

  function messageSentAgo(minutesAgo: number, content = 'Helo'): StandardMessageDto {
    return {
      id: 2,
      content,
      images: [],
      sender: { id: 1, username: 'me' },
      receiverId: friendId,
      sentAt: new Date(now - minutesAgo * minute).toISOString(),
      seen: false,
      seenAt: null,
      isEdited: false,
    };
  }

  function createForm(): ComponentFixture<MessageForm> {
    const fixture = TestBed.createComponent(MessageForm);
    fixture.componentRef.setInput('friendId', friendId);
    fixture.detectChanges();

    return fixture;
  }

  const box = (fixture: ComponentFixture<MessageForm>) =>
    fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;

  function write(fixture: ComponentFixture<MessageForm>, text: string): void {
    box(fixture).value = text;
    box(fixture).dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function startEdit(fixture: ComponentFixture<MessageForm>, message: StandardMessageDto): void {
    editDraft.set({ message, content: message.content });
    fixture.detectChanges();
  }

  const submit = (fixture: ComponentFixture<MessageForm>) =>
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(
      new Event('submit'),
    );

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    editDraft.set(null);
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        { provide: ConversationsStore, useValue: store },
        { provide: TypingSender, useValue: typingSender },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('puts the message’s text into the box, with Save in place of Send and no extra line', () => {
    const fixture = createForm();

    startEdit(fixture, messageSentAgo(1));

    expect(box(fixture).value).toBe('Helo');
    expect(fixture.nativeElement.textContent).toContain('Save');
    expect(fixture.nativeElement.querySelector('[role="status"]')).toBeNull();
  });

  it('keeps what the user was writing and gives it back when the edit is cancelled', () => {
    const fixture = createForm();
    write(fixture, 'my unfinished draft');

    startEdit(fixture, messageSentAgo(1));
    expect(box(fixture).value).toBe('Helo');
    store.stopEditing();
    fixture.detectChanges();

    expect(box(fixture).value).toBe('my unfinished draft');
    expect(fixture.nativeElement.querySelector('[aria-label="Cancel editing"]')).toBeNull();
  });

  it('saves the changed text, trimmed, through the store and sends no new message', () => {
    const fixture = createForm();
    const sent = vi.fn();
    fixture.componentInstance.send.subscribe(sent);
    const message = messageSentAgo(1);
    startEdit(fixture, message);

    write(fixture, '  Hello  ');
    submit(fixture);

    expect(store.edit).toHaveBeenCalledExactlyOnceWith(message, 'Hello');
    expect(sent).not.toHaveBeenCalled();
  });

  it('sends nothing for an edit that changes nothing, and ends it', () => {
    const fixture = createForm();
    startEdit(fixture, messageSentAgo(1));

    submit(fixture);

    expect(store.edit).not.toHaveBeenCalled();
    expect(store.stopEditing).toHaveBeenCalledOnce();
  });

  it('cannot save an edit with no text', () => {
    const fixture = createForm();
    startEdit(fixture, messageSentAgo(1));

    write(fixture, '   ');
    submit(fixture);

    expect(store.edit).not.toHaveBeenCalled();
  });

  it('gives the friend no typing signal while a message is edited', () => {
    const fixture = createForm();
    startEdit(fixture, messageSentAgo(1));

    write(fixture, 'Hello');

    expect(typingSender.typed).not.toHaveBeenCalled();
  });

  it('ends the edit at the moment its 20 minutes pass, while the box is open', () => {
    const fixture = createForm();
    startEdit(fixture, messageSentAgo(19));

    vi.advanceTimersByTime(minute - 1);
    expect(store.stopEditing).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(store.stopEditing).toHaveBeenCalledOnce();
    expect(LIMITS.messages.editWindowMilliseconds).toBe(20 * minute);
  });

  it('ends at once an edit that comes back after its time has passed', () => {
    const fixture = createForm();

    startEdit(fixture, messageSentAgo(21));
    vi.advanceTimersByTime(0);

    expect(store.stopEditing).toHaveBeenCalledOnce();
  });

  it('leaves an edit of another conversation’s message alone', () => {
    const fixture = createForm();

    startEdit(fixture, { ...messageSentAgo(1), receiverId: friendId + 1 });

    expect(box(fixture).value).toBe('');
    expect(fixture.nativeElement.querySelector('[aria-label="Cancel editing"]')).toBeNull();
  });
});
