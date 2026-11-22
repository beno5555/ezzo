# 37: Only the language in use is downloaded first

**What to build:** A visitor first downloads only the dictionary of the language they read in. The other language loads when they first switch to it. Nothing they see changes: the switch, the remembered choice and a guest's language work as they do today, and the page never shows the wrong language, not even for a moment. The owner decided this on 2026-11-22.

**Measured on `master` at `4f6a74f` (2026-11-22).** Both dictionaries ship in the first download (ADR 0006): Georgian takes 39.6 kB and English 12.4 kB, of the 600.17 kB raw total (129.36 kB compressed). That total is 174 bytes over ADR 0009's 600 kB limit, and every page ticket adds text to both dictionaries.

- **What loads first.** Only the starting language: the remembered choice, or on a first visit the language picked from the browser (Georgian for a browser that prefers Georgian, English otherwise). It is loaded before the first page shows, so no text appears in the other language first.
- **The other language.** It loads on demand at the first switch and then stays loaded, so switching back and forth fetches nothing more. It may also be fetched quietly in advance, after the first page has shown. Record in the comments whether you did that, and why. A switch still changes the page in place, without a reload (spec, stories 130 to 133).
- **Everything else stays as it is.** That includes the remembered choice, the account pages' language (taken from the browser), and dates and plurals in the chosen language. The compiler still proves every dictionary complete against the English one (spec story 140).
- **`text()` and the tests.** Decide what `text()` gives while a dictionary is loading, and record the decision in the comments. Make sure no page has to handle a missing dictionary. Change the unit tests so they still get a dictionary without each test loading one itself.
- **The decision is recorded.** Write a new ADR that supersedes ADR 0006 and mark ADR 0006 as superseded by it. ADR 0009 says both dictionaries ship in the first download and lists this change as left for later: update those lines to point to the new ADR. Leave ADR 0009's limit as it is. Check that the spec's lines on the dictionaries still read true, and correct the ones that don't.
- **The result is measured.** Re-measure the first download once the change is done, and record it in the ticket's comments.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Difficulty:** tricky. It changes how the app starts (the first page may not show before its dictionary), turns a dictionary that is always there into one that loads later, and touches `text()` and the unit tests across the app.

- [ ] A first load in English downloads no Georgian text, and a first load in Georgian downloads no English text
- [ ] No page ever shows text in the language that is not chosen, on a first visit, a reload or a sign-in
- [ ] The first switch to the other language changes the page in place; switching back fetches nothing new
- [ ] The remembered choice, a first visit with a Georgian browser, and the account pages all start in the right language
- [ ] Dates and plurals follow the chosen language after a switch
- [ ] A missing key in either dictionary still fails the build
- [ ] A new ADR supersedes ADR 0006, ADR 0006 is marked superseded, ADR 0009's lines on the dictionaries point to the new ADR, and its limit is unchanged
- [ ] The spec's lines on the dictionaries read true
- [ ] The first download's raw and compressed sizes, before and after, are in the ticket's comments
- [ ] Checked in the app in both languages and both themes, with the screenshot command
- [ ] The unit tests, lint, Prettier and the build pass
