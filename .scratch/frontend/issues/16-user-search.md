# 16: User search

**What to build:** A visitor, signed in or a guest, finds people by name at `/search?q=…`.

- **The words live in the address,** so a search can be reloaded and shared. The search box in the shell leads here with what was typed.
- **Results follow the typing,** 300 ms after the last keystroke. The address is updated without adding a history entry for every letter.
- **Only the latest answer is shown.** A slow answer to older words never replaces a newer one (ADR 0003).
- **Each result** shows the username and links to the profile.
- **Results load by pages.** Empty words show a prompt, and words with no match show an empty state.

Decisions are under "Friends and search" in `.scratch/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest)

**Status:** ready-for-agent

**Difficulty:** routine: one page on an existing `…Api` method, with one rule that is unit-tested.

- [ ] Typing in the shell's search box and confirming opens `/search` with the words in the address
- [ ] Results appear 300 ms after the typing stops, not on every keystroke
- [ ] The "latest answer wins" rule is unit-tested: an older answer that arrives after a newer one is ignored
- [ ] The pause is tested with fake timers
- [ ] Reloading the page with words in the address shows their results
- [ ] A guest can search and open a profile from the results
- [ ] Checked in the running app on a desktop width and on a phone width, as a guest and as a user
