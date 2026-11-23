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

  describe('leave', () => {
    it('takes the item out of the list', async () => {
      const loader = createLoader();
      const list = createList(loader);

      const first = list.loadNext();
      loader.answer(ok([item(1), item(2), item(3)]));
      await first;
      list.leave(2);

      expect(list.items()).toEqual([item(1), item(3)]);
    });

    it('asks again for the page that holds the first item not yet seen, since the later pages moved up', async () => {
      const loader = createLoader();
      const list = createList(loader);

      const first = list.loadNext();
      loader.answer(ok([item(1), item(2), item(3)]));
      await first;
      // The server's list is now 3, 4, 5, 6, 7, 8, ...: one item is seen, so the next unseen starts at 4.
      list.leave(1);
      list.leave(2);

      const second = list.loadNext();
      loader.answer(ok([item(3), item(4), item(5)]));
      await second;
      const third = list.loadNext();
      loader.answer(ok([item(6), item(7), item(8)]));
      await third;

      expect(loader.asked).toEqual([
        { pageNumber: 1, pageSize },
        { pageNumber: 1, pageSize },
        { pageNumber: 2, pageSize },
      ]);
      expect(list.items()).toEqual([item(3), item(4), item(5), item(6), item(7), item(8)]);
    });

    it('keeps asking from the first item not yet seen when items leave a second time', async () => {
      const loader = createLoader();
      const list = createList(loader);

      const first = list.loadNext();
      loader.answer(ok([item(1), item(2), item(3)]));
      await first;
      list.leave(1);
      const second = list.loadNext();
      loader.answer(ok([item(2), item(3), item(4)]));
      await second;
      // Seen on the server now: 2, 3, 4. Two leave, so 4 is the only one seen and 5 is the next unseen.
      list.leave(2);
      list.leave(3);
      const third = list.loadNext();
      loader.answer(ok([item(4), item(5), item(6)]));
      await third;

      expect(loader.asked.map((query) => query.pageNumber)).toEqual([1, 1, 1]);
      expect(list.items()).toEqual([item(4), item(5), item(6)]);
    });

    it('asks for the first page again when everything seen has left', async () => {
      const loader = createLoader();
      const list = createList(loader);

      const first = list.loadNext();
      loader.answer(ok([item(1), item(2), item(3)]));
      await first;
      list.leave(1);
      list.leave(2);
      list.leave(3);

      const second = list.loadNext();
      loader.answer(ok([item(4), item(5), item(6)]));
      await second;

      expect(loader.asked[1]).toEqual({ pageNumber: 1, pageSize });
      expect(list.items()).toEqual([item(4), item(5), item(6)]);
    });

    it('keeps asking for the same page after a failure, with the leaving taken into account', async () => {
      const loader = createLoader();
      const list = createList(loader);

      const first = list.loadNext();
      loader.answer(ok([item(1), item(2), item(3)]));
      await first;
      list.leave(1);
      const failed = list.loadNext();
      loader.answer(fail('Network down', 0));
      await failed;
      const retry = list.loadNext();
      loader.answer(ok([item(2), item(3), item(4)]));
      await retry;

      expect(loader.asked[1]).toEqual({ pageNumber: 1, pageSize });
      expect(loader.asked[2]).toEqual({ pageNumber: 1, pageSize });
      expect(list.items()).toEqual([item(2), item(3), item(4)]);
    });
  });
});
