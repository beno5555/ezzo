# 01: Clean up frontend comments and route parsing

**What to build:** Make client-side route handling easier to maintain and correct comments in the frontend areas sampled in the audit. Preserve the behavior of each affected feature.

**Blocked by:** None (can start immediately).

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): Four route checks share the same parsing rule, and their callers need separate verification. In Codex, use GPT-6.2 Sol at high effort.

- [x] Share the rule that strips the query or fragment from a route address across sign-in, landing-page detection, account-page detection, and the post-delete route check. Keep each caller's matching and normalization rules, including its handling of leading slashes and encoded paths.
- [x] Verify the callers through the existing feature tests and normal app flows for any uncovered cases. Check that sign-in keeps the complete return address, page detection works with query strings and fragments, and deleting a post only navigates away when the user is still on that post.
- [x] Correct the admin logs comment to reflect automatic search after a typing pause and the profile picture comment to explain that an unavailable account shows the default silhouette with a grey ring.
- [x] Review nearby comments for obsolete claims and redundant narration. Keep the explanations of constraints and timing that the code alone does not make clear.
- [x] Run the frontend formatting check, lint, unit tests, and build. Record the feature checks and their results.
- [x] Run `$spec-review` on the ticket branch against `cleanup` after verification. The Standards reviewer applies `webcity-conventions` and the applicable project rules. The Spec reviewer checks this ticket's acceptance criteria, including behavior at all four route callers. Address confirmed findings before merging.

**Branch:** Start from `cleanup` and target `cleanup` for integration. A worktree session finishes with a trial merge against `cleanup` and leaves the actual merge to the main checkout.

## Comments

### 2026-11-24 verification

- Prettier, lint (including 39 rule tests), and all 979 frontend unit tests (14.58 s) passed. The new `routePath` tests cover leading slashes, both suffix delimiters, and percent-encoded delimiters and slashes.
- The production build passed in 9.10 s. It warned that the 805.69 kB initial bundle exceeded the 600 kB warning threshold.
- Playwright checks passed on frontend port 4300 with the proxy aimed at port 7202 and API responses supplied by fixtures. Opening `/friends?filter=a%26b#requests` as a guest retained the full address in `returnUrl` and returned there after submitting the sign-in form. Reloading the landing page at `/?returnUrl=…#form` showed its preferences menu, and `/reset-password?token=fixture#form` showed the logo-only top bar.
- Deleting a fixture post from `/posts/7?source=direct#comments` returned to the feed after the response and fade. Navigating from another post to Friends while the deletion response was pending kept the Friends page in place after the deletion toast appeared.

### 2026-11-24 spec review against `cleanup` (`2b04665`)

- Standards found no violations or actionable code smells.
- Spec found no missing requirements, scope changes, or regressions at the four route callers.

### 2026-11-24 screenshot follow-up

- The screenshot command captured the landing page, reset page, guest post with an unavailable author's avatar, signed-in post, feed, Friends and admin logs at 360, 768 and 1280 px in both themes and languages. All 84 images were reviewed as contact sheets. Playwright captured five more images showing the landing and reset pages with fragments, the delete dialog and the two outcomes after deletion.
- Playwright found no horizontal overflow across 21 page and width combinations. Typing in the admin logs filter updated the address automatically. The unavailable author's avatar showed the default silhouette with a grey ring.
- The screenshot command stalled on reloads of addresses with fragments. The full sets used query-only addresses, and Playwright explicitly reloaded the fragment addresses for the separate captures. The frontend ran on 4300 with synthetic API data on 7202. Both servers and the browsers were stopped afterwards.

### 2026-11-24 rerun after lazy dictionaries and per-icon SVG imports

- Removed the obsolete icon examples and Angular icon test stand-in, and checked the updated guidance against the source. The route-path helper and its callers required no further edits.
- Prettier, lint and its 39 checks, all 982 frontend unit tests, and the production build passed. The initial total was 560.88 kB raw and triggered no budget warning.
- On fixture ports 4300 and 7202, verified the complete sign-in return address, a direct reset-page reload with a query and fragment, and both deletion outcomes. Deleting the open post returned to the feed. Navigating to Friends during another delete request kept the Friends page in place when the response arrived.
- The 24 before-and-after landing and feed images matched pixel for pixel across the three widths, both languages and both themes.
- The Standards review caught an ignored SVG renderer and language-switch feedback that could disappear with the popover. The renderer is tracked and load failures now use a toast. The Spec review confirmed the original route behavior and identified the old account-language wording. The owner confirmed that account pages should honor the saved language.
