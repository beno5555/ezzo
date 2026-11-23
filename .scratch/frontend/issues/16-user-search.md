# 16: User search

**What to build:** A visitor, signed in or a guest, finds people by name at `/search?q=…`.

- **The words live in the address,** so a search can be reloaded and shared. The search box in the shell leads here with what was typed.
- **Results follow the typing,** 500 ms after the last keystroke. The address is updated without adding a history entry for every letter.
- **Only the latest answer is shown.** A slow answer to older words never replaces a newer one (ADR 0003).
- **Each result** shows the username and links to the profile.
- **Results load by pages.** Empty words show a prompt, and words with no match show an empty state.

Decisions are under "Friends and search" in `.scratch/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: one page on an existing `…Api` method, with one rule that is unit-tested.

- [x] Typing in the shell's search box and confirming opens `/search` with the words in the address
- [x] Results appear 500 ms after the typing stops, not on every keystroke (**already built** while doing ticket 22, on the search page from ticket 07: `Debouncer` in `core/timing/`, address replaced without a history entry, emptying the field clears it, a class-level spec with fake timers in `user-search-page.spec.ts`; this ticket keeps it working through the restyle and adds the paging and the rest)
- [x] The "latest answer wins" rule is unit-tested: an older answer that arrives after a newer one is ignored
- [x] The pause is tested with fake timers (already in `user-search-page.spec.ts`)
- [x] Reloading the page with words in the address shows their results
- [x] A guest can search and open a profile from the results
- [x] Checked in the running app on a desktop width and on a phone width, as a guest and as a user

## Comments

**2026-11-23, round 1: implementation (Sonnet 5.5).**

**Built.** The search page now loads by pages and is styled with the shared pieces the profile's Friends tab uses.
- Each search owns a `PagedList`; the page shows only the latest one, so an older answer (success or failure, page 1 or later) lands in a list nobody sees (ADR 0003). No counter is needed any more.
- Rows are an avatar plus a profile link (`appAddresses.profile`), infinite scroll through `ScrollSentinel`, a "Searching…" line, a Try again button for a failed page, and a "No more users." end line.
- Empty words show a prompt ("Find people"); words with no match show an empty state that names the words.
- The debounce, address replacement and clearing are untouched (`Debouncer`, `user-search-page.spec.ts`).
- Texts: added `users.search.{resultsLabel, promptTitle, promptMessage, loading, loadingMore, emptyTitle, emptyMessage, retryButton, end}` in English and Georgian.

**Departures.**
- Removed `users.search.shown` ("Showing N users"): with paging it would state the loaded count, not the matches. Its only test was `plural-entries.spec.ts`, which now checks `shared.photos.openMoreButton` (English one/other, Georgian other-only), so the plural rules keep their coverage.
- Whether to search is now judged by the words in the address, not by the field's validity, so typing past the length limit after the pause no longer swaps the results for the prompt (found in review).

**Checks.** `npm test` 728 passed (new: reload with `?q=` in the address, empty words, first page asked, older answer ignored, older failure ignored, next page of the same words); `npm run lint` clean; `npm run build` passes with the existing initial-bundle warning (709 kB over the 600 kB budget; this page is lazy, ADR 0009). The backend was not touched, so its tests were not run.

**Tried in the running app** (backend https 7102, `ng serve` 4200; the dev database has 100+ matches for "a"):
- Screenshot command at 360/768/1280, both themes, English and Georgian, for `/search`, `?q=ali`, `?q=zzzzqq` as a guest and `/search`, `?q=ali`, `?q=a` as the development user. Looked at: guest 360 light (results), guest 1280 dark (empty state), guest 768 Georgian (prompt), user 360 dark, user 1280 light (30 rows).
- Playwright, guest, desktop width: typing "alic" slowly sent one request and added one history entry; reload with `?q=a` showed results and scrolling loaded pages 2 to 13; clicking a result opened `/users/t20_alice`; the top-bar box on a profile page led to `/search?q=ali`.
- Not tried: clicking through on a phone width (phone width was checked by screenshots only, so the last box is ticked on that basis), a failed page's Try again button in the browser (covered by `PagedList`'s own spec), and a deactivated account's row (the backend search returned `erin_deactivated` with an id, so no null-id row appeared).

**Review.** Standards and spec reviews ran on Opus 5.5 at high effort, one each. The standards review found no hard violation; the spec review found nothing missing apart from one test.

Fixed:
- The avatar of a null-id row did not pass `isUnavailable` (both reviews found it): it now does, like the Friends tab.
- Whether to search was judged by the field's validity, so typing past the length limit after the pause showed the prompt while the address held valid words (spec review): it is now judged by the address's words.
- No test opened the page with words already in the address, which the "reloading" box asks for (spec review): added.

Left alone:
- **Duplicated row.** The result row copies the Friends tab's row, and its muted-name span is a fourth copy (the others: Friends tab, `comment-item`, `post-card`), against "a look used twice becomes a component in `shared/`" (standards review, judgement call). The `@switch` on the list status is copied too, but about ten templates already have it, so the reviewer called it the established pattern. Recommendation: a `shared/user-row` component in its own small ticket so the Friends tab changes with it. Your memory note "Extract on third use" came up after I had decided this, and I did not weigh it: by that rule the span should be extracted rather than copied again, so decide whether this branch should do it before the merge.
- **Null-id branch.** The span branch and `user.id ?? 0` for an account without an id cover a case the search never returns (standards review, mild Speculative Generality). Kept, because `MinimalUserDto.id` is `number | null` and the Friends tab handles it the same way.
- **Two signals set together.** `searchedWords` and `results` always change together; one signal holding both would keep them in step (standards review, optional).
- **Tests read protected members** (`page['results']()`, `page['loadMore']()`), where the temporary rule says to write no component DOM tests. The spec file already tested the class this way and no DOM is read, so the reviewer did not count it a violation.
- **Extras the ticket did not ask for** (spec review, called harmless): the "No more users." line, the separate "Loading more" text, the Try again button, `aria-hidden` on icons.
- **Exactly full last page.** The page asks once more and gets an empty page before showing the end line (spec review, normal for this paging).

**Open decisions.** None blocking.

**Screenshots:** `.scratch/frontend/shots/16/` in the main checkout.

**Branch:** `worktree-f16-search`, pushed for the owner's review (visual work, not merged). Trial merge against `origin/master` at `f5c05b1`: clean (exit 0), the branch being a straight descendant of it. The worktree is kept; the owner merges from the main checkout.
