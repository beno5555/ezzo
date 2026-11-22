import { describe, expect, it } from 'vitest';
import { runEnds } from './run-ends';
import { StandardMessageDto } from './standard-message-dto';

const alice = { id: 3, username: 'alice' };
const bob = { id: 4, username: 'bob' };

function message(id: number, sender: typeof alice, sentAt: string): StandardMessageDto {
  return {
    id,
    content: `message ${id}`,
    images: [],
    sender,
    receiverId: sender === alice ? bob.id : alice.id,
    sentAt,
    seen: false,
    seenAt: null,
    isEdited: false,
  };
}

describe('runEnds', () => {
  it('ends a run at its last message, so a burst shows one time', () => {
    const ends = runEnds([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, alice, '2026-11-22T10:00:30Z'),
      message(3, alice, '2026-11-22T10:01:10Z'),
    ]);

    expect([...ends]).toEqual([3]);
  });

  it('ends a run when the other person writes', () => {
    const ends = runEnds([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, bob, '2026-11-22T10:00:20Z'),
      message(3, alice, '2026-11-22T10:00:40Z'),
    ]);

    expect([...ends]).toEqual([1, 2, 3]);
  });

  it('keeps a pause of two minutes in the run and ends it at a longer one', () => {
    const ends = runEnds([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, alice, '2026-11-22T10:02:00Z'),
      message(3, alice, '2026-11-22T10:04:01Z'),
    ]);

    expect([...ends]).toEqual([2, 3]);
  });

  it('gives nothing for an empty history', () => {
    expect(runEnds([]).size).toBe(0);
  });
});
