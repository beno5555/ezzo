import { AppResult, fail, ok } from '../http/app-result';
import { PageQuery } from '../http/page-query';
import { PageLoadStatus } from './page-load-status';
import { PagedList } from './paged-list';

type Item = { id: number; name: string };

const pageSize = 3;
const item = (id: number): Item => ({ id, name: `item ${id}` });

// A loader whose answers the test gives one at a time, in the order the pages were asked for.
function createLoader() {
  const asked: PageQuery[] = [];
  const answers: ((result: AppResult<Item[]>) => void)[] = [];
  const loadPage = (query: PageQuery) =>
    new Promise<AppResult<Item[]>>((resolve) => {
      asked.push(query);
      answers.push(resolve);
    });

  return {
    asked,
    loadPage,
    answer: (result: AppResult<Item[]>) => answers.shift()?.(result),
  };
}

function createList(loader: ReturnType<typeof createLoader>) {
  return new PagedList<Item>({ loadPage: loader.loadPage, pageSize, keyOf: (entry) => entry.id });
}

describe('PagedList', () => {
  it('loads the first page, and ends when a page is shorter than the page size', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const loading = list.loadNext();
    expect(list.status()).toBe(PageLoadStatus.Loading);
    loader.answer(ok([item(1), item(2)]));
    await loading;

    expect(loader.asked).toEqual([{ pageNumber: 1, pageSize }]);
    expect(list.items()).toEqual([item(1), item(2)]);
    expect(list.status()).toBe(PageLoadStatus.Ended);
  });

  it('appends each full page, and asks for nothing more after an empty last page', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(1), item(2), item(3)]));
    await first;
    expect(list.status()).toBe(PageLoadStatus.Idle);

    const second = list.loadNext();
    loader.answer(ok([]));
    await second;
    await list.loadNext();

    expect(loader.asked).toEqual([
      { pageNumber: 1, pageSize },
      { pageNumber: 2, pageSize },
    ]);
    expect(list.items()).toEqual([item(1), item(2), item(3)]);
    expect(list.status()).toBe(PageLoadStatus.Ended);
  });

  it('keeps the items after a failed page, and asks for the same page again on retry', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(1), item(2), item(3)]));
    await first;
    const failed = list.loadNext();
    loader.answer(fail('The server could not be reached', 0));
    await failed;

    expect(list.status()).toBe(PageLoadStatus.Failed);
    expect(list.failureMessage()).toBe('The server could not be reached');
    expect(list.items()).toEqual([item(1), item(2), item(3)]);

    const retry = list.loadNext();
    loader.answer(ok([item(4)]));
    await retry;

    expect(loader.asked).toEqual([
      { pageNumber: 1, pageSize },
      { pageNumber: 2, pageSize },
      { pageNumber: 2, pageSize },
    ]);
    expect(list.items()).toEqual([item(1), item(2), item(3), item(4)]);
    expect(list.status()).toBe(PageLoadStatus.Ended);
  });

  it('shows an item once when the next page repeats it', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(1), item(2), item(3)]));
    await first;
    const second = list.loadNext();
    loader.answer(ok([item(3), item(4)]));
    await second;

    expect(list.items()).toEqual([item(1), item(2), item(3), item(4)]);
  });

  it('asks for no page while one is still loading', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    const second = list.loadNext();
    loader.answer(ok([item(1), item(2), item(3)]));
    await Promise.all([first, second]);

    expect(loader.asked).toEqual([{ pageNumber: 1, pageSize }]);
    expect(list.items()).toEqual([item(1), item(2), item(3)]);
  });

  it('puts a changed item in place of the one with its key', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(1), item(2)]));
    await first;
    list.replace({ id: 2, name: 'renamed' });

    expect(list.items()).toEqual([item(1), { id: 2, name: 'renamed' }]);
  });

  it('puts a new item on top, and shows it once when a later page repeats it', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(1), item(2), item(3)]));
    await first;
    list.prepend(item(9));
    const second = list.loadNext();
    loader.answer(ok([item(9), item(4)]));
    await second;

    expect(list.items()).toEqual([item(9), item(1), item(2), item(3), item(4)]);
  });

  it('does not put a new item on top when a page already showed it', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(9), item(1), item(2)]));
    await first;
    list.prepend(item(9));

    expect(list.items()).toEqual([item(9), item(1), item(2)]);
  });

  it('puts a removed item back at its index, once', async () => {
    const loader = createLoader();
    const list = createList(loader);
    const first = list.loadNext();
    loader.answer(ok([item(1), item(2), item(3)]));
    await first;

    list.remove(2);
    list.insertAt(item(2), 1);
    list.insertAt(item(2), 0);
    expect(list.items()).toEqual([item(1), item(2), item(3)]);

    list.remove(3);
    list.insertAt(item(3), 9);
    expect(list.items()).toEqual([item(1), item(2), item(3)]);
  });

  describe('after items were removed', () => {
    // A server whose list shrinks when the test removes an item, as the backend's does.
    function createServer(ids: number[]) {
      const asked: number[] = [];
      const loadPage = async (query: PageQuery) => {
        asked.push(query.pageNumber);
        const start = (query.pageNumber - 1) * query.pageSize;

        return ok(ids.slice(start, start + query.pageSize).map(item));
      };

      return {
        asked,
        remove: (id: number) => ids.splice(ids.indexOf(id), 1),
        list: new PagedList<Item>({ loadPage, pageSize, keyOf: (entry) => entry.id }),
      };
    }

    it('asks for an earlier page, so the rows that moved up are not skipped', async () => {
      const server = createServer([1, 2, 3, 4, 5, 6, 7]);
      await server.list.loadNext();

      server.remove(1);
      server.list.remove(1);
      server.remove(2);
      server.list.remove(2);
      await server.list.loadNext();
      await server.list.loadNext();

      expect(server.asked).toEqual([1, 1, 2]);
      expect(server.list.items().map((entry) => entry.id)).toEqual([3, 4, 5, 6, 7]);
      expect(server.list.status()).toBe(PageLoadStatus.Ended);
    });

    it('keeps asking in order when nothing was removed after the earlier page', async () => {
      const server = createServer([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      await server.list.loadNext();
      await server.list.loadNext();

      server.remove(2);
      server.list.remove(2);
      await server.list.loadNext();
      await server.list.loadNext();

      expect(server.asked).toEqual([1, 2, 2, 3]);
      expect(server.list.items().map((entry) => entry.id)).toEqual([1, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('goes back to the normal page when a refused removal puts the item back', async () => {
      const server = createServer([1, 2, 3, 4, 5, 6, 7]);
      await server.list.loadNext();

      server.list.remove(2);
      server.list.insertAt(item(2), 1);
      await server.list.loadNext();

      expect(server.asked).toEqual([1, 2]);
    });
  });

  it('removes an item by its key', async () => {
    const loader = createLoader();
    const list = createList(loader);

    const first = list.loadNext();
    loader.answer(ok([item(1), item(2)]));
    await first;
    list.prepend(item(9));
    list.remove(2);
    list.remove(9);

    expect(list.items()).toEqual([item(1)]);
  });
});
