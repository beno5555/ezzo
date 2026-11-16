# 10: The digest switch on the settings page

**What to build:** A signed-in user opens the settings page, finds a section about email, and turns the weekly digest off or on with one switch. The change takes effect when the switch is flipped; there is no Save button for it.

- **A new section** of the settings page, between the existing ones, with one switch and one sentence that says what the digest is and how often it comes.
- **Its state** comes from the user's own data (`digestEmailEnabled`).
- **Flipping it** calls `PUT /api/users/mine/digest-email` at once. If the call fails, the switch goes back and a toast says what went wrong.
- **All text** comes from the dictionaries, in English and Georgian.

Read `DESIGN.md` and `frontend/CLAUDE.md` before touching a template or a style. Nothing in the frontend ever calls n8n.

This is visual work: the branch waits for the owner's review before it is merged.

The digest is first on the roadmap's "Last in line" list: if time runs short, this ticket and ticket 09 are the first to be left out.

Decisions are under "Frontend" and "The digest switch" in `.scratch/n8n-automation/spec.md`, and under "Settings" in `.scratch/frontend/spec.md`. Digest and Toast are defined in `GLOSSARY.md`.

**Blocked by:** 08 (The backend lists who gets a digest, and a user can switch it off), and frontend ticket 17 (The settings page) with everything that ticket waits for

**Status:** ready-for-agent

**Difficulty:** routine: one switch on the patterns the settings page already sets, with one new `…Api` method.

- [ ] The switch shows the user's current setting when the page opens
- [ ] Flipping it saves at once; after a reload it shows the new setting
- [ ] When the save fails, the switch returns to its old position and a toast says so
- [ ] The switch can be reached and flipped with the keyboard, and it says its state to a screen reader
- [ ] The section's text comes from the dictionaries in both languages, and its styles use design tokens only
- [ ] The new `…Api` method is unit-tested against the HTTP testing backend: the method, the address, the body, and the mapping of a success and of a failure
- [ ] Checked in the running app on a desktop width and on a phone width, in both languages and both themes, with the screenshots the frontend setup asks for
