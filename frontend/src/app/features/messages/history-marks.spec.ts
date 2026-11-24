import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryMark, historyMarks } from './history-marks';
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

function ids(marks: ReadonlyMap<number, HistoryMark>, key: keyof HistoryMark): number[] {
  return [...marks].filter(([, mark]) => mark[key]).map(([id]) => id);
}

describe('historyMarks', () => {
  // The days are counted in the visitor's time zone; the test runs in UTC.
  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('ends a run at its last message, so a burst shows one time', () => {
    const marks = historyMarks([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, alice, '2026-11-22T10:00:30Z'),
      message(3, alice, '2026-11-22T10:01:10Z'),
    ]);

    expect(ids(marks, 'showsTime')).toEqual([3]);
  });

  it('ends a run when the other person writes', () => {
    const marks = historyMarks([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, bob, '2026-11-22T10:00:20Z'),
      message(3, alice, '2026-11-22T10:00:40Z'),
    ]);

    // The first message is a run of one under the day's heading, which already writes its time.
    expect(ids(marks, 'showsTime')).toEqual([2, 3]);
  });

  it('keeps a pause of two minutes in the run and ends it at a longer one', () => {
    const marks = historyMarks([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, alice, '2026-11-22T10:02:00Z'),
      message(3, alice, '2026-11-22T10:04:01Z'),
    ]);

    expect(ids(marks, 'showsTime')).toEqual([2, 3]);
  });

  it('starts a day at the first message loaded and at each new day, and ends a run there', () => {
    const marks = historyMarks([
      message(1, alice, '2026-11-21T23:59:30Z'),
      message(2, alice, '2026-11-22T00:00:10Z'),
      message(3, bob, '2026-11-22T00:00:40Z'),
    ]);

    expect(ids(marks, 'startsDay')).toEqual([1, 2]);
    expect(ids(marks, 'showsTime')).toEqual([3]);
  });

  it('marks a pause of half an hour or more within a day', () => {
    const marks = historyMarks([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, bob, '2026-11-22T10:29:59Z'),
      message(3, alice, '2026-11-22T10:59:59Z'),
    ]);

    expect(ids(marks, 'followsLongPause')).toEqual([3]);
    expect(ids(marks, 'showsTime')).toEqual([2]);
  });

  it('writes the time below a run under a heading at its end', () => {
    const marks = historyMarks([
      message(1, alice, '2026-11-22T10:00:00Z'),
      message(2, alice, '2026-11-22T10:01:00Z'),
    ]);

    expect(ids(marks, 'showsTime')).toEqual([2]);
  });

  it('gives nothing for an empty history', () => {
    expect(historyMarks([]).size).toBe(0);
  });
});
