# 37: Only the language in use is downloaded first

**What to build:** A visitor first downloads only the dictionary of the language they read in. The other language loads when they first switch to it. Nothing they see changes: the switch, the remembered choice and a guest's language work as they do today, and the page never shows the wrong language, not even for a moment. The owner decided this on 2026-11-22.

**Measured on `master` at `4f6a74f` (2026-11-22).** Both dictionaries ship in the first download (ADR 0006): Georgian takes 39.6 kB and English 12.4 kB, of the 600.17 kB raw total (129.36 kB compressed). That total is 174 bytes over ADR 0009's 600 kB limit, and every page ticket adds text to both dictionaries.

- **What loads first.** Only the starting language: the remembered choice, or on a first visit the language picked from the browser (Georgian for a browser that prefers Georgian, English otherwise). It is loaded before the first page shows, so no text appears in the other language first.
- **The other language.** It loads on demand at the first switch and then stays loaded, so switching back and forth fetches nothing more. It may also be fetched quietly in advance, after the first page has shown. Record in the comments whether you did that, and why. A switch still changes the page in place, without a reload (spec, stories 130 to 133).
- **Everything else stays as it is.** The account pages also honor the saved language and use the browser preference on a first visit. Dates and plurals use the chosen language. The compiler still proves every dictionary complete against the English one (spec story 140).
- **`text()` and the tests.** Decide what `text()` gives while a dictionary is loading, and record the decision in the comments. Make sure no page has to handle a missing dictionary. Change the unit tests so they still get a dictionary without each test loading one itself.
- **The decision is recorded.** Write a new ADR that supersedes ADR 0006 and mark ADR 0006 as superseded by it. ADR 0009 says both dictionaries ship in the first download and lists this change as left for later: update those lines to point to the new ADR. Leave ADR 0009's limit as it is. Check that the spec's lines on the dictionaries still read true, and correct the ones that don't.
- **The result is measured.** Re-measure the first download once the change is done, and record it in the ticket's comments.

**Blocked by:** None (can start immediately)

**Status:** done

**Difficulty:** tricky. It changes how the app starts (the first page may not show before its dictionary), turns a dictionary that is always there into one that loads later, and touches `text()` and the unit tests across the app.

- [x] A first load in English downloads no Georgian text, and a first load in Georgian downloads no English text
- [x] No page ever shows text in the language that is not chosen, on a first visit, a reload or a sign-in
- [x] The first switch to the other language changes the page in place; switching back fetches nothing new
- [x] The remembered choice, a first visit with a Georgian browser, and the account pages all start in the right language
- [x] Dates and plurals follow the chosen language after a switch
- [x] A missing key in either dictionary still fails the build
- [x] A new ADR supersedes ADR 0006, ADR 0006 is marked superseded, ADR 0009's lines on the dictionaries point to the new ADR, and its limit is unchanged
- [x] The spec's lines on the dictionaries read true
- [x] The first download's raw and compressed sizes, before and after, are in the ticket's comments
- [x] Checked in the app in both languages and both themes, with the screenshot command
- [x] The unit tests, lint, Prettier and the build pass

## Comments

### 2026-11-24 implementation

- Startup resolves the remembered choice or the browser preference and loads that dictionary alongside session restoration. Angular waits for both before rendering. `LanguageStore.text()` continues to give a complete dictionary. During a switch it gives the previous dictionary until the requested one is ready. A failed switch shows a toast in the current language and leaves the preference intact. A late load cannot overwrite a newer choice.
- No prefetch. The browser reuses a dictionary it has already loaded, and a visitor using one language never fetches the other. Specs that create their own Angular injector start with an English dictionary supplied by the test setup.
- The fixture browser checked both first-visit languages, a saved choice overriding the browser in both directions, the first rendered heading, a switch and a switch back without a second request, a reload and a failed switch. Both languages and themes were also captured at 360, 768 and 1280 px.
- The language-only build reduced Angular's initial total from 773.59 kB raw and 162.23 kB estimated transfer to 711.61 kB raw and 151.16 kB estimated transfer. In the final build with ticket 36, the initial total is 560.88 kB raw and 146.44 kB estimated transfer. The selected dictionary adds 20.71 kB raw (5.56 kB estimated) for English or 44.11 kB raw (7.61 kB estimated) for Georgian at startup.
- The first implementation waited for the dictionary before starting session refresh. Chromium now confirms the refresh can finish while the language chunk is held, and a direct reset-password page with conflicting saved and browser languages waits for the saved dictionary before appearing. The owner confirmed the saved language should take precedence there.
- Across three cold English runs per build at 360 px, 1.6 Mbps, 150 ms latency and 4× CPU slowdown, the fixture medians for `1cff984` and the final build were 2.42 s and 2.47 s for guest sign-in, and 3.32 s and 3.36 s for the first feed post. The runs overlapped and did not establish a speedup.
