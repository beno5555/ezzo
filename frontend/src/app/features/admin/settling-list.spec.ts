import { fail, ok } from '../../core/http/app-result';
import { PageQuery } from '../../core/http/page-query';
import { PageLoadStatus } from '../../core/paging/page-load-status';
import { deleteFadeMilliseconds } from '../../shared/fade-out/delete-fade';
import { SettlingList } from './settling-list';

type Item = { id: number };

const pageSize = 3;
const item = (id: number): Item => ({ id });

// A list read from a fake server that keeps the items with the ids given, in order. A settled item leaves
// the server's list, as on the real queues: `settledOnServer` is the request a test sends to settle ids.
async function createLoadedList(ids: number[]) {
  const asked: PageQuery[] = [];
  let onServer = ids;
  const list = new SettlingList<Item>({
    loadPage: (query) => {
      asked.push(query);
      const first = (query.pageNumber - 1) * query.pageSize;
      return Promise.resolve(ok(onServer.slice(first, first + query.pageSize).map(item)));
    },
    pageSize,
  });
  await list.loadNext();

  return {
    list,
    asked,
    settledOnServer: (...settled: number[]) => {
      onServer = onServer.filter((id) => !settled.includes(id));
      return Promise.resolve(ok(undefined));
    },
  };
}

describe('SettlingList', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fades the item out, sends the request, and then the item has left', async () => {
    const { list } = await createLoadedList([1, 2, 3]);
    const send = vi.fn(() => Promise.resolve(ok(undefined)));

    const settling = list.settle(item(2), send);
    expect(list.isFading(2)).toBe(true);
    expect(send).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    const failure = await settling;

    expect(send).toHaveBeenCalledOnce();
    expect(failure).toBeNull();
    expect(list.rows()).toEqual([item(1), item(3)]);
  });

  it('brings the item back and resolves with the message when the server refuses', async () => {
    const { list } = await createLoadedList([1, 2]);

    const settling = list.settle(item(2), () => Promise.resolve(fail('Already settled', 409)));
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    const failure = await settling;

    expect(failure).toBe('Already settled');
    expect(list.rows()).toEqual([item(1), item(2)]);
    expect(list.isFading(2)).toBe(false);
  });

  it('ignores a second click on an item that is already settling', async () => {
    const { list } = await createLoadedList([1, 2]);
    const send = vi.fn(() => Promise.resolve(ok(undefined)));

    const first = list.settle(item(1), send);
    const second = await list.settle(item(1), send);
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    await first;

    expect(second).toBeNull();
    expect(send).toHaveBeenCalledOnce();
  });

  it('takes out the items settled with it only once the server has agreed', async () => {
    const { list, settledOnServer } = await createLoadedList([1, 2, 3]);
    let agree: () => void = () => undefined;
    const send = () =>
      new Promise<ReturnType<typeof ok<undefined>>>((resolve) => {
        agree = () => resolve(ok(undefined));
      });

    const settling = list.settle(item(1), send, [item(3)]);
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    expect(list.isFading(3)).toBe(false);
    await settledOnServer(1, 3);
    agree();
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    await settling;

    expect(list.rows()).toEqual([item(2)]);
  });

  it('leaves the others alone when the server refuses', async () => {
    const { list } = await createLoadedList([1, 2, 3]);

    const settling = list.settle(item(1), () => Promise.resolve(fail('No', 400)), [item(3)]);
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    await settling;

    expect(list.rows()).toEqual([item(1), item(2), item(3)]);
  });

  it('asks for the next page when settling leaves nothing on the screen but more is waiting', async () => {
    const { list, asked, settledOnServer } = await createLoadedList([1, 2, 3, 4, 5, 6]);
    expect(list.status()).toBe(PageLoadStatus.Idle);

    const settling = list.settle(item(1), () => settledOnServer(1, 2, 3), [item(2), item(3)]);
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds * 2);
    await settling;

    expect(asked.map((query) => query.pageNumber)).toEqual([1, 1]);
    expect(list.rows()).toEqual([item(4), item(5), item(6)]);
  });

  it('does not ask again when the last page was already read', async () => {
    const { list, asked } = await createLoadedList([1]);

    const settling = list.settle(item(1), () => Promise.resolve(ok(undefined)));
    await vi.advanceTimersByTimeAsync(deleteFadeMilliseconds);
    await settling;

    expect(asked).toHaveLength(1);
    expect(list.rows()).toEqual([]);
  });
});
