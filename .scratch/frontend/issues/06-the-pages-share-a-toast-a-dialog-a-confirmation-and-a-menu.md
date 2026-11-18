# 06: The pages share a toast, a dialog, a confirmation and a menu

**What to build:** Four building blocks in `shared/` that almost every page uses, built with Tailwind, Angular CDK and the design tokens of `DESIGN.md`. This is the one ticket that is not a path through a page: it exists so that the first page to need a confirmation does not hold up every other page.

- **Toast.** A toast store and its component. A toast is a short message that appears over the page and leaves by itself. It stays 5 seconds, at most three show at once, and a fourth waits for a place. A toast may be a link. It serves two uses: failures of actions outside a form (conventions, Errors) and, in ticket 21, live notifications.
- **Dialog.** A box over the page that holds any content, keeps the keyboard focus inside it, and closes on Escape and on a click outside.
- **Confirmation.** A dialog with a question and two buttons, whose answer the caller awaits. One variant asks the user to type a given word before the confirm button works; the settings page needs it.
- **Menu.** A "…" button that opens a list of entries given by the caller, usable with the keyboard.

The profile picture is a fifth small piece: one `Avatar` component that shows a user wherever a user appears. It takes the user's id, the username and an optional address of a picture, which no DTO supplies yet. Without a picture it draws the default, as `DESIGN.md` (Components) defines it: the user's initials on a disc whose colour is chosen by the user's id, and a grey disc with no letters for an account that is deactivated or deleted.

Decisions are under "Toasts", "Actions on content" and "Across the whole frontend" in `.scratch/frontend/spec.md`.

**Blocked by:** 02 (The Angular app starts), 03 (The interface speaks English and Georgian), 27 (The app takes its look from design tokens)

**Status:** done

**Difficulty:** routine (Opus 5.5 medium): the rules are exact, but most of the result is checked by looking, and every page inherits its quality.

- [x] The toast store is unit-tested with fake timers: a toast leaves after 5 seconds, a fourth toast waits until one of three has left, and a toast can carry a link
- [x] The confirmation resolves to yes or no, and the typed variant enables its confirm button only when the word matches (unit-tested where the logic has no template)
- [x] In the running app, the bare page has a button that shows each block, until the shell replaces the page
- [x] The dialog keeps focus inside, closes on Escape, and returns focus to the button that opened it
- [x] The menu opens, moves and chooses with the keyboard
- [x] The default profile picture's rules are unit-tested: a username in two parts gives both first letters, any other gives its first two letters, the same id always gives the same disc colour, and an unavailable account gives the grey disc with no letters
- [x] Each block is checked on the bare page at 360, 768 and 1280 px, in both themes, for the owner's approval. This ticket does not wait for tickets 28 and 29: until they land, show the dark theme by putting `data-theme="dark"` on the root element by hand, and check by eye; once ticket 29 has landed, use its screenshots
- [x] All texts come from the dictionaries, and all colours, sizes and spacing from design tokens

## Comments

- **Approved by the owner on 2026-11-18,** together with every point below. I checked every block in Chrome at 360, 768 and 1280 px, in both themes, with the dark theme set by hand. The window cannot narrow to 360 px at the screen's 150 % scale, so I used same-origin iframes of fixed widths instead.
- **Repeated toasts are skipped.** You chose this during the work. A toast equal to one already shown or waiting (same message, same link) is not queued again. Clicking a failing action twenty times shows one toast, where it used to queue about 35 seconds of the same message. Once the toast has left, the same message can show again.
- **Toasts are not a CDK overlay.**
  - `DESIGN.md` says dialogs, menus and toasts take their behaviour from Angular CDK. The toast list is a plain fixed `<section aria-live="polite">` instead, because a toast needs no focus handling, positioning or backdrop.
  - The list sits under an open dialog's backdrop. A live link toast (ticket 21) that arrives while a dialog is open cannot be clicked until the dialog closes.
  - Toasts have no close button.
- **`firstValueFrom` in `ConfirmationOpener`** is RxJS used outside `toAppResult`. It turns the CDK's `closed` observable into the promise the caller awaits.
- **Two `!` classes on the dialog pane** (`max-w-column!`, `pointer-events-none!`). The CDK sets those two properties outside any cascade layer, where they beat Tailwind's classes. `@layer cdk-overlay;` in `styles.css` handles the rest of the CDK's styles.
- **The typed word is trimmed**, so `" alice_smith "` with spaces around it also unlocks the confirm button.
- **Bundle budget.** `npm run build` warns that the initial bundle is 560.97 kB against the 500 kB budget. The block samples load the CDK dialog and menu at startup. The warning should go once ticket 07 removes the samples and the pages load lazily.
- **Built beyond the ticket:**
  - `TextInput` (`input[appTextInput]`). The dialog sample, the typed confirmation and the user search share one input look, so the search page uses it now.
  - `IconButton`, for the dialog's close button.
  - `AvatarSize`, with three sizes.
  - An Avatar falls back to the default disc when its picture fails to load.
  - `aria-hidden` on every Avatar, because the username always appears beside it.
- **Review points left alone:**
  - The raised overlay surface (`rounded-lg border bg-surface-raised shadow-overlay`) is written out three times: in the dialog frame, the toast and the menu panel. These are three different elements; a shared look can come when a fourth one appears.
  - `defaultPicture(userId, username, isUnavailable)` takes three positional values.
  - The block samples repeat some shapes. Ticket 07 deletes them.
- **Chrome extension.** It did not answer at first, and worked after you checked it.
