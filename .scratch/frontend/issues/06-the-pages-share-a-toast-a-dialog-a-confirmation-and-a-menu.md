# 06: The pages share a toast, a dialog, a confirmation and a menu

**What to build:** Four building blocks in `shared/` that almost every page uses, built with the toolset and tokens the design session chose. This is the one ticket that is not a path through a page: it exists so that the first page to need a confirmation does not hold up every other page.

- **Toast.** A toast store and its component. A toast is a short message that appears over the page and leaves by itself. It stays 5 seconds, at most three show at once, and a fourth waits for a place. A toast may be a link. It serves two uses: failures of actions outside a form (conventions, Errors) and, in ticket 21, live notifications.
- **Dialog.** A box over the page that holds any content, keeps the keyboard focus inside it, and closes on Escape and on a click outside.
- **Confirmation.** A dialog with a question and two buttons, whose answer the caller awaits. One variant asks the user to type a given word before the confirm button works; the settings page needs it.
- **Menu.** A "…" button that opens a list of entries given by the caller, usable with the keyboard.

A user's initials, shown wherever an avatar would be, are a fifth small piece: users have no picture.

Decisions are under "Toasts", "Actions on content" and "Across the whole frontend" in `.scratch/frontend/spec.md`.

**Blocked by:** 02 (The Angular app starts), 03 (The interface speaks English and Georgian), and the design session (roadmap step 1), which chooses the toolset and the tokens

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the rules are exact, but most of the result is checked by looking, and every page inherits its quality.

- [ ] The toast store is unit-tested with fake timers: a toast leaves after 5 seconds, a fourth toast waits until one of three has left, and a toast can carry a link
- [ ] The confirmation resolves to yes or no, and the typed variant enables its confirm button only when the word matches (unit-tested where the logic has no template)
- [ ] In the running app, the bare page has a button that shows each block, until the shell replaces the page
- [ ] The dialog keeps focus inside, closes on Escape, and returns focus to the button that opened it
- [ ] The menu opens, moves and chooses with the keyboard
- [ ] Each block works on a desktop width and on a phone width
- [ ] All texts come from the dictionaries, and all colours, sizes and spacing from the token file
