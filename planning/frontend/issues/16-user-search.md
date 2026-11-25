# 16: User search

**What to build:** A visitor, signed in or a guest, finds people by name at `/search?q=…`.

- **The words live in the address,** so a search can be reloaded and shared. The search box in the shell leads here with what was typed.
- **Results follow the typing,** 500 ms after the last keystroke. The address is updated without adding a history entry for every letter.
- **Only the latest answer is shown.** A slow answer to older words never replaces a newer one (ADR 0003).
- **Each result** shows the username and links to the profile. A signed-in visitor also gets the friendship button for their relationship with that person, as on the friends page: Add friend, Cancel request, Accept and Decline, or Remove. A guest, and the visitor's own row, get none (owner, round 2).
- **Results load by pages.** Empty words show a prompt, and words with no match show an empty state.

Decisions are under "Friends and search" in `planning/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: one page on an existing `…Api` method, with one rule that is unit-tested.

- [x] Typing in the shell's search box and confirming opens `/search` with the words in the address
- [x] Results appear 500 ms after the typing stops, not on every keystroke (**already built** while doing ticket 22, on the search page from ticket 07: `Debouncer` in `core/timing/`, address replaced without a history entry, emptying the field clears it, a class-level spec with fake timers in `user-search-page.spec.ts`; this ticket keeps it working through the restyle and adds the paging and the rest)
- [x] The "latest answer wins" rule is unit-tested: an older answer that arrives after a newer one is ignored
- [x] The pause is tested with fake timers (already in `user-search-page.spec.ts`)
- [x] Reloading the page with words in the address shows their results
- [x] A guest can search and open a profile from the results
- [x] A signed-in visitor sees the friendship button that matches their relationship on each result (none, request sent, request received, friends), and it works from the search page; a guest and the visitor's own row get no button (round 2; the backend search now returns the relationship)
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

**Screenshots:** `planning/frontend/shots/16/` in the main checkout.

**Branch:** `worktree-f16-search`, pushed for the owner's review (visual work, not merged). Trial merge against `origin/master` at `f5c05b1`: clean (exit 0), the branch being a straight descendant of it. The worktree is kept; the owner merges from the main checkout.

**2026-11-23, round 2: revision (Sonnet 5.5).** Fixed point: `08cb71e`; master merged in first (`1eb68ee`, ticket 15's friends page).

Owner's decisions:
- Merge `master` into the branch before anything else: ticket 15 (the friends page and its shared `FriendList`) is already there.
- Each search result gets the friendship button for the relationship, as the friends page has: Add friend when there is none, Cancel request when the visitor sent one, Accept and Decline when one waits for them, Remove for a friend.
- Extract the user row in this branch (decided after the merge, when the friends page's row could be seen).
- The relationship reaches the search page through the backend if that is the cleanest way ("if backend addition is the cleanest one, go with that"): the search endpoint returns it.
- If everything in this round is settled, the ticket is ready to merge.

**Built.**
- **Backend.** `GET api/users/search` returns `ListResponse<SearchUserDto>` (`Id`, `Username`, `Relationship`); `RelationshipDto` is `Status` plus `IsRequester`. `Relationship` is null for a guest, the caller's own row and a stranger. One query (`FriendshipRepository.GetFriendshipsWithAsync`) reads the friendships of the whole page, so there is no call per row. Documented in `docs/backend/controllers.md`.
- **Shared row.** `shared/user-row` (`li[appUserRow]`) is the one row of `FriendList` (friends page and profile Friends tab) and of the search page: avatar, profile link, "Deleting…", Message, and the friendship buttons. It takes `isBusy` (buttons disabled while a request is on its way).
- **Search buttons.** `UserSearchStore` (provided by the page) offers the buttons of `friendshipActionsOffered`, none for a guest or the visitor's own row. A click shows the new relationship at once by replacing the row in its list, sends the request, and puts the row back with a toast if the server refuses. Remove asks first. Accept and Decline refresh the incoming-request count. An older search's list takes late changes too (ADR 0003).
- **Third-use extractions.** `sendFriendshipAction`, `askToRemoveFriend`, `answersRequest` replace the copies in `RelationshipStore` and `FriendsPageStore`; `core/collections/without-id.ts` replaces the private copy in `delete-fade.ts` and the one the search store would have added.
- **No end line.** "No more users." and `users.search.end` are gone (list rules).

**Checks.** Frontend: Prettier (`--end-of-line auto`), lint, `npm test` 815 passed, build OK (initial bundle warning 735.92 kB against 600 kB, was 709 kB in round 1). Backend: build, and the full integration suite 898 passed (new: five search-relationship tests in `UserControllerTests`).

**Tried in the running app** (backend 7202, `ng serve` 4300, throwaway accounts `r16_me`, `r16_other`, `r16_pal`, signed in as `r16_me`; the owner's 4200/7102 servers were left alone): own row has no button; Accept turns into Remove; Add friend into Cancel request and back; Remove asks "Remove r16_pal from your friends?", Cancel keeps the friend, confirming gives Add friend; buttons are disabled while the request is on its way; at 360 px the buttons wrap under the name like on the friends page. Screenshots (12 variants each) for guest `/search`, `?q=r16_`, `?q=zzzzqq` and signed-in `?q=r16_`, `?q=t20_`; looked at: signed-in 1280 dark Georgian, 768 light English, guest 360 light English.
Not tried: a failed request's toast in the browser (covered by `user-search-store.spec.ts`), clicking through on a phone width, an expired token in the browser (covered by a unit test).

**Review.** Standards and spec reviews ran on Opus 5.5 at high effort.
- **Severe, fixed:** the search endpoint is anonymous, so a visitor whose access token had expired was read as a guest: every `relationship` came back null and friends showed "Add friend". The page now calls `sessionStore.validAccessToken()` (renews a token about to expire) before each search request; unit-tested.
- **Fixed (tidy-ups):** the "copy a set without an id" block (extracted, above); `UserSearchStore.perform` nested four deep (split into `carryOut`); the test `Search_Anonymous_ReturnsMinimalDtoOnly` renamed `Search_Anonymous_ReturnsOnlyIdAndUsername`; the DTO tier table in `dtos-and-mapping.md` no longer says the Minimal tier is for search.
- **Left alone:** `RemoveFriendTexts` shares a file with `askToRemoveFriend` (a type bound to one function; judgement call); the "after the server answers" block is in three stores but each undoes differently (borderline); `sendFriendshipAction` could live on `FriendshipApi`, and `UserRow` tests `Remove` twice (judgement calls); `typing-store`, `account-action-store`, `conversations-store`, `comment-thread-store` still have their own set copies (not touched by this ticket).

**Open decisions.**
- **Remove on the search page shows no "Deleting…".** The friends page shows it because the row leaves the list; on search the row stays and turns into Add friend at once, as on a profile (quick actions show their result at once, spec). Recommendation: keep. If you want "Deleting…" here, say so and I add the notice for Remove only.
- **Throwaway accounts** `r16_me`, `r16_other`, `r16_pal` and their friendship rows remain in the dev database.

**Screenshots:** `planning/frontend/shots/16/` in the main checkout (the round 1 pictures were replaced by this round's).

**Branch:** `worktree-f16-search`, pushed for the owner's review, not merged.
