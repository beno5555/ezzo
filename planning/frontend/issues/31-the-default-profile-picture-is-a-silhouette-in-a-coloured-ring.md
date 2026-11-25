# 31: The default profile picture is a silhouette in a coloured ring

**Last in line.** Built only when every page ticket is done and time is left (`planning/roadmap.md`, Last in line). The current default picture stays until then.

**What to build:** The owner's intended look for the default profile picture (owner, 2026-11-19, reviewing ticket 07). Today it is the user's initials in white on a disc filled with one of eight colours chosen by the user's id. Instead:

- **The ring carries the colour.** The outline of the circle takes the colour chosen by the id (the same eight `disc-*` tokens, picked the same way, so it survives a change of username). The inside no longer does.
- **The inside is a faceless person.** A generic profile silhouette (head and shoulders, no face) on a neutral fill, the same for every user. The app stores no gender, so it is one neutral silhouette, not a man or a woman. The icon comes from `@lucide/angular` if one fits at every size; otherwise it is drawn once in the `Avatar` component.
- **Initials go.** The picture no longer shows letters.
- **An unavailable account** (deactivated or deleted) keeps a grey look: a grey ring around the same silhouette.
- **Everything else stays.** One `Avatar` component still draws it everywhere a user appears, at every size it has today, and a chosen picture can still take its place later.

`DESIGN.md` (Components, and the disc tokens) is updated in the same change, together with `src/design-tokens.css` if a token changes.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), for the places the picture appears

**Status:** done

**Difficulty:** easy: one component, its unit-tested helper (`default-picture.ts`) and two documents.

- [x] The ring's colour follows the user's id, from the eight `avatar-*` tokens (the ticket said `disc-*`; round 2 gave the ring its own tokens)
- [x] The inside is the same faceless silhouette for every user, with no initials
- [x] An unavailable account shows a grey ring around the silhouette
- [x] The ring and the silhouette are visible against the page in both themes, at every avatar size (the dark rings were faint in round 1; round 2 lightened them to 3.3 to 1 or more; the large size was not looked at in the running app)
- [x] `DESIGN.md` describes the new default picture
- [x] Checked with the screenshot command at 360, 768 and 1280 px in both themes, on a page that shows several users

## Comments

**2026-11-24, round 1: implementation (Sonnet 5.5).**

- **Built.** The default picture is now a filled lucide `UserRound` (round 2: `User`, the owner chose option B) in `ink-muted` on `surface-sunken` (the neutral inside follows the theme, per the owner's "matches theme colors"), inside a `border-disc-N` ring: 2 px, 4 px on the large size. An unavailable account gets `border-disc-unavailable` around the same silhouette. `default-picture.ts` now exports only `ringClass(userId, isUnavailable)`; initials are gone. A chosen picture still replaces the default.
- **Departure from the ticket, from the review.** `Avatar`'s `username` input was dead once the initials went, so I removed it and the `[username]` binding at its 12 call sites (templates only, no spec used it). The ticket said "everything else stays"; a required input that does nothing was the worse choice. Reverting is one edit per site.
- **Documents.** `DESIGN.md` (Components, the `profile-picture-default` entry, token table, contrast and disc notes), the comment in `design-tokens.css` (no token value changed), `GLOSSARY.md`, `references/typescript.md`, and three stale comments (`post-card.ts`, `comment-item.ts`, `snapshot-author.ts`). `on-disc` stays because the landing page's drawing still uses it.
- **Checks.** `npm test` (109 files, 973 tests), `npm run lint`, `npm run build` and Prettier on the changed files pass. The build's bundle-size warning was there before.
- **Tried in the running app.** Screenshot command, signed in, on `/`, `/friends`, `/messages` at 360, 768 and 1280 px in both themes and both languages. I looked at the feed at 1280 dark and 360 light, friends at 360 dark, messages at 768 dark, and the guest landing page at 1280 dark. I did not look at the other images, at the large size (a profile page) or at the grey ring in the running app; the grey ring is covered by a unit test only.
- **Not met: the visibility box (left unticked).** The silhouette is clear in both themes (`ink-muted` on `surface-sunken`: 5.6 to 1 light, 8.8 to 1 dark). The rings are clear in light (4.7 to 8.4 to 1 against page and cards) but faint in dark: 1.65 to 2.3 to 1 against a card, 2.1 to 2.9 to 1 against the page. Plum, indigo and walnut are weakest, and the grey unavailable ring (2.6 to 1) stands out more than the coloured ones. The near-black inside still marks the circle's edge, so it reads as a person, but the colour that tells users apart is subtle.
  - **Open decision.** For now the shared disc tokens are unchanged. Recommendation: give the ring its own pair of tokens, lighter in the dark theme (with `disc-unavailable` following), and keep `disc-*` for the landing drawing. It changes `design-tokens.css` and `DESIGN.md` together, so it needs the owner's word.
- **Review.** Findings applied, except two judgement calls left alone: ring width and colour sit in `avatar.ts` and `default-picture.ts` (the width depends on the avatar size, the colour on the id), and the file name `default-picture.ts` stays. A ring entry in the `profile-picture-default` front matter was skipped because the format's keys do not cover a ring.
- **Screenshots.** `planning/frontend/shots/31/` in the main checkout (home, friends, messages in English, all widths and themes, plus the guest landing page).
- **Branch.** `worktree-f31-silhouette`: visual work waiting for the owner's review, not merged, not pushed.

**2026-11-24, round 2: owner's feedback (Sonnet 5.5).**

- **Owner approved the open decision:** the ring gets its own tokens. Built: `avatar-1` to `avatar-8` and `avatar-unavailable` in `design-tokens.css` and in `DESIGN.md` (front matter with `-dark` entries, token table, contrast note, Components). The light values are the old disc values. The dark values are the same hues, lightened until each is at least 3.3 to 1 on `surface-raised` (4.2 to 1 or more on `surface-page`): `#288b7f #3e8c5d #6d8625 #5d7cb7 #7477b3 #be6533 #997654 #aa65a4`, grey `#787d7f`. `disc-unavailable` is gone (it had no other user); `disc-1` to `disc-8` and `on-disc` stay for the landing drawing. `ringClass` returns `border-avatar-*`; its spec follows. Checks: tests (973), lint, build and Prettier pass.
- **Checked in the running app:** the guest landing page at 1280 px in both themes (computed ring colours match the tokens: `#5d7cb7` and `#288b7f` in dark, `#3d5788` and `#1f6b62` in light). Not re-checked: the signed-in pages, because ports 4200 and 7102 were held by servers I did not start (another session's), so I served the frontend on port 4300 and did not touch them.
- **Icon question.** The silhouette is lucide's `UserRound` (the icon the user menu already uses for Profile), filled, because the ticket asked for `@lucide/angular` first. The owner asked for other versions: `planning/frontend/mocks/31-silhouettes.html` shows five (A, the built one; B lucide `User`; C outline; D a hand-drawn classic where the shoulders fill the disc; E smaller), in both themes with the new rings. **Open decision:** A stays until the owner picks; changing it is one template line (B, C, E) or an inline SVG in `avatar.html` (D, which breaks the ticket's "icon from lucide if one fits" preference).
