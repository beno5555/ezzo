# 06: The pages share a toast, a dialog, a confirmation and a menu

**What to build:** Four building blocks in `shared/` that almost every page uses, built with Tailwind, Angular CDK and the design tokens of `DESIGN.md`. This is the one ticket that is not a path through a page: it exists so that the first page to need a confirmation does not hold up every other page.

- **Toast.** A toast store and its component. A toast is a short message that appears over the page and leaves by itself. It stays 5 seconds, at most three show at once, and a fourth waits for a place. A toast may be a link. It serves two uses: failures of actions outside a form (conventions, Errors) and, in ticket 21, live notifications.
- **Dialog.** A box over the page that holds any content, keeps the keyboard focus inside it, and closes on Escape and on a click outside.
- **Confirmation.** A dialog with a question and two buttons, whose answer the caller awaits. One variant asks the user to type a given word before the confirm button works; the settings page needs it.
- **Menu.** A "…" button that opens a list of entries given by the caller, usable with the keyboard.

The profile picture is a fifth small piece: one `Avatar` component that shows a user wherever a user appears. It takes the user's id, the username and an optional address of a picture, which no DTO supplies yet. Without a picture it draws the default, as `DESIGN.md` (Components) defines it: the user's initials on a disc whose colour is chosen by the user's id, and a grey disc with no letters for an account that is deactivated or deleted.

Decisions are under "Toasts", "Actions on content" and "Across the whole frontend" in `.scratch/frontend/spec.md`.

**Blocked by:** 02 (The Angular app starts), 03 (The interface speaks English and Georgian), 27 (The app takes its look from design tokens)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the rules are exact, but most of the result is checked by looking, and every page inherits its quality.

- [ ] The toast store is unit-tested with fake timers: a toast leaves after 5 seconds, a fourth toast waits until one of three has left, and a toast can carry a link
- [ ] The confirmation resolves to yes or no, and the typed variant enables its confirm button only when the word matches (unit-tested where the logic has no template)
- [ ] In the running app, the bare page has a button that shows each block, until the shell replaces the page
- [ ] The dialog keeps focus inside, closes on Escape, and returns focus to the button that opened it
- [ ] The menu opens, moves and chooses with the keyboard
- [ ] The default profile picture's rules are unit-tested: a username in two parts gives both first letters, any other gives its first two letters, the same id always gives the same disc colour, and an unavailable account gives the grey disc with no letters
- [ ] Each block is checked on the bare page at 360, 768 and 1280 px, in both themes, for the owner's approval. This ticket does not wait for tickets 28 and 29: until they land, show the dark theme by putting `data-theme="dark"` on the root element by hand, and check by eye; once ticket 29 has landed, use its screenshots
- [ ] All texts come from the dictionaries, and all colours, sizes and spacing from design tokens
