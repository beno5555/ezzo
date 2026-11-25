# 42: A date of birth is entered as day, month and year

**What to build:** Every date-of-birth field (register, and the administrator's create-account and edit-profile dialogs) replaces the browser's date picker, whose mm/dd/yyyy box and calendar popup clash with the app (owner, 2026-11-23), with three fields in one group:

- **Day:** a number box, 1 to 31.
- **Month:** a list of the twelve month names in the interface's language (English or Georgian).
- **Year:** a number box, four digits.

Rules:

- **One shared component** for all three forms, holding the form value in the same yyyy-mm-dd shape as today, so the existing age validator and the backend stay as they are. Empty while any part is empty.
- **A date that does not exist** (31 April, 29 February in a common year) shows its own error beside the group, in both languages, like every other field error.
- **Accessibility.** The group has one visible label (a legend), each part its own visible small label, the browser's birthday autofill still works on the parts, and the error is read after the label. Each part is at least 44 px high and the group fits at 360 px with no sideways scroll.
- **Look.** The parts take the app's text-input look; no calendar popup anywhere.
- An edit-profile dialog opened on a user who has a date of birth shows it split into the three parts.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): the app has no custom form control yet, so this one sets the pattern later controls copy, and its labelling must hold for screen readers.

- [ ] Register, create-account and edit-profile show day, month and year instead of the date picker
- [ ] The form value is yyyy-mm-dd when complete and empty while any part is empty; the age errors still show
- [ ] A non-existent date shows its own error, in English and Georgian
- [ ] Month names follow the interface language
- [ ] Edit-profile shows an existing date split into the three parts
- [ ] Unit tests cover the value, the non-existent date and the split of an existing date
- [ ] Checked with the screenshot command at 360, 768 and 1280, both themes, English and Georgian
