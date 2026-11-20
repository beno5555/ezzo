# 04: The frontend unit tests spend their time on tests, not on building pages

**What to build:** A full run of the frontend unit tests takes a fraction of today's time, with every test still in place and passing, so a session checks a change in a few seconds.

Measured on 2026-11-20: 243 tests in 32 files take 29.66 s, and Vitest's summary splits the time into environment 91%, import 4%, setup 3%, transform 1%. Almost all of it is spent building a fresh fake browser page (jsdom) for each test file; the tests themselves cost almost nothing. The backend's 749 integration tests take about the same time because each test class starts its host once and runs many tests on it.

- **Measure first.** Record today's `Duration` and phase split from three full runs before changing anything.
- **Try the known levers, one at a time,** and record each one's `Duration`:
  - a lighter fake browser (happy-dom) in place of jsdom;
  - test files sharing one page per worker instead of each building its own (Vitest's isolation turned off);
  - the number of workers.
- **Find how to set them.** The tests run through Angular's unit-test builder, not Vitest directly. Find whether the builder takes these settings itself or through a Vitest config file of its own, and use the supported way.
- **Keep the fastest setting that stays honest.** No test is deleted, skipped or weakened to gain time. If a lever breaks tests (a browser feature happy-dom lacks, state one file leaves behind for the next), either fix the cause in the test's setup or drop the lever, and say which in the comments.
- **Unchanged.** `npm test -- --watch=false` stays the command, and CI's frontend job runs it as today.

**Blocked by:** None (can start immediately).

**Status:** in-progress

**Difficulty:** tricky: the builder's support for these settings is unknown, and sharing a page across files can make tests fail only in some orders, which needs debugging.

Tooling only, with no visual part: it can run in a cloud session or a worktree beside any ticket that does not change the test setup.

- [ ] Today's `Duration` and phase split, from three runs, are recorded in this ticket's comments
- [ ] Each lever tried has its `Duration` recorded in the comments, kept or dropped with the reason
- [ ] The full run passes three times in a row with the chosen setting, and once with the test files in shuffled order; the `Duration` lines are recorded
- [ ] The test count is the same as before (243 at the time of writing, plus any added since), and no test is skipped
- [ ] CI's frontend job passes on the branch
- [ ] If a command or setting a session needs to know changes, `frontend/CLAUDE.md` or the root `CLAUDE.md` says so

## Comments

**2026-11-20, cloud session (4 cores, Node 22; the owner's 29.66 s figure came from another machine).**

**Baseline, before any change** (37 files, 260 tests; the count has grown from 243 since the ticket was written):

| Run | Duration | Phase split |
| --- | --- | --- |
| 1 | 14.27 s | import 52%, environment 44%, transform 2%, tests 2%, setup 2% |
| 2 | 13.70 s | import 51%, environment 44%, transform 2%, setup 2%, tests 1% |
| 3 | 14.48 s | import 51%, environment 44%, transform 2%, tests 2%, setup 1% |

**What the time actually is.** Not the fake browser. Importing `@lucide/angular` costs about 12 s per worker, in parallel across workers, and every other file together costs about 2 s. The package is one 11.5 MB file of 2057 icon components in partial-compiled form. The unit-test builder loads node_modules as-is (`externalPackages: true`), so Angular compiles all 2057 templates in the browser at import. Proof: a spec importing only `LucideX` takes 12.95 s; an empty spec takes 1.12 s. The slow files (`confirmation-opener`, `reactivate-account-page`, anything that imports a component with an icon) start at 14.5 s in the JSON reporter timeline; all other files finish by 2.2 s.

**How to set things.** The builder takes `isolate`, `splitting` and `runnerConfig` itself. `runnerConfig: true` makes it read `vitest-base.config.mts` from the project root; that file's `test` section is merged into the builder's project (root options such as `maxWorkers` work too). Isolation already defaults to off in the builder.

**Levers, before the icon fix** (baseline 14.3 s):

| Lever | Duration | Result |
| --- | --- | --- |
| Isolation on (`--isolate`) | 22.28 s, 25.73 s | Dropped: slower. Off is already the builder's default. |
| Isolation off (`--no-isolate`) | 14.74 s, 14.83 s | Same as baseline (already the default). |
| happy-dom in place of jsdom | 15.11 s, 13.90 s | Dropped: no gain; environment share falls, import share rises. |
| Workers 1 / 2 / 3 / 4 / 6 | 14.64 / 13.73 / 15.90 / 14.77 / 15.32 s | Dropped: flat, every worker waits on the same 12 s import. |
| `splitting` off | 15.06 s, 14.05 s | Dropped: no gain. |

**Fix kept:** `tools/lucide-stand-in.mts`, loaded through `vitest-base.config.mts`, serves the tests a module with one empty component per icon the app imports (found by scanning `src`), under the real selector `svg[lucideX]`. In tests an icon is an empty `<svg>`; no spec reads an icon's drawing. The owner agreed that this is acceptable. Linking the real package with the Angular linker was measured too: 25 s uncached (slower than the compile it replaces), so it was not pursued.

**Levers again, with the fix in place:**

| Lever | Duration | Result |
| --- | --- | --- |
| Default (jsdom, isolation off, builder's workers) | 1.42 s, 1.46 s, 1.46 s | Kept. |
| Isolation on | 8.86 s | Dropped: six times slower. |
| happy-dom | 1.45 s, 1.42 s, 1.39 s | Dropped: no gain, and one more dependency. |
| Workers 1 / 2 / 3 / 4 / 6 | 1.81 / 1.47 / 1.50 / 1.60 / 1.82 s | Dropped: default is as fast. |

**Final runs** (260 tests in 37 files, none skipped):

- Three in a row: 1.42 s, 1.46 s, 1.46 s.
- Shuffled order (`VITEST_SHUFFLE=1`, files and tests), seeds 1795204150151 and 1795204155580: 1.86 s and 1.84 s, all passing.

**Not checked here:** CI's frontend job. The workflow runs only on pull requests and on pushes to `master`, so it has not run on this branch.
