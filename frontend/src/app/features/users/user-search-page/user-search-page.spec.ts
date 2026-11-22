import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MockInstance } from 'vitest';
import { AppResult } from '../../../core/http/app-result';
import { typingPauseMilliseconds } from '../../../core/timing/debouncer';
import { MinimalUserDto } from '../minimal-user-dto';
import { UserApi } from '../user-api';
import { UserSearchPage } from './user-search-page';

// Class-level tests: the page is created with a stubbed API, and the tests read its navigation, never its
// DOM (component DOM tests wait until after the release; conventions, Tests and linting).
describe('UserSearchPage', () => {
  const found: AppResult<MinimalUserDto[]> = { succeeded: true, data: [] };

  let userApi: { searchUsers: ReturnType<typeof vi.fn> };
  let navigate: MockInstance<Router['navigate']>;

  beforeEach(() => {
    userApi = { searchUsers: vi.fn().mockResolvedValue(found) };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([{ path: 'search', children: [] }]),
        { provide: UserApi, useValue: userApi },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // Waits for the page's first render, which shows the address's query in the field: typing comes after it.
  // The clock is faked only afterwards, because Angular's own waiting would never end on a stopped clock.
  async function openPage(): Promise<UserSearchPage> {
    const fixture = TestBed.createComponent(UserSearchPage);
    await fixture.whenStable();
    vi.useFakeTimers();

    return fixture.componentInstance;
  }

  function type(page: UserSearchPage, words: string): void {
    page['form'].controls.username.setValue(words);
    page.searchAfterTyping();
  }

  it('does not search while the keys are less than the pause apart', async () => {
    const page = await openPage();

    type(page, 'a');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds - 1);
    type(page, 'al');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds - 1);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('searches once after the pause, replacing the address instead of adding to the history', async () => {
    const page = await openPage();

    type(page, 'al');
    type(page, 'ali');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: 'ali' },
      replaceUrl: true,
    });
  });

  it('does not search again for words that differ only by spaces from the address', async () => {
    const page = await openPage();

    type(page, 'ali');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);
    navigate.mockClear();
    type(page, 'ali ');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('searches at once on submit, and the waiting search does not repeat it', async () => {
    const page = await openPage();

    type(page, 'ali');
    await page.submit();
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/search'], { queryParams: { q: 'ali' } });
  });

  it('clears the search from the address when the field is emptied', async () => {
    const page = await openPage();
    type(page, 'ali');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);
    navigate.mockClear();

    type(page, '');
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);

    expect(navigate).toHaveBeenCalledWith(['/search'], {
      queryParams: { q: null },
      replaceUrl: true,
    });
  });

  it('does not search after the page is gone', async () => {
    const fixture = TestBed.createComponent(UserSearchPage);
    await fixture.whenStable();
    vi.useFakeTimers();

    type(fixture.componentInstance, 'ali');
    fixture.destroy();
    await vi.advanceTimersByTimeAsync(typingPauseMilliseconds);

    expect(navigate).not.toHaveBeenCalled();
  });
});
