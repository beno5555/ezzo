# 31: The default profile picture is a silhouette in a coloured ring

**Last in line.** Built only when every page ticket is done and time is left (`.scratch/roadmap.md`, Last in line). The current default picture stays until then.

**What to build:** The owner's intended look for the default profile picture (owner, 2026-11-19, reviewing ticket 07). Today it is the user's initials in white on a disc filled with one of eight colours chosen by the user's id. Instead:

- **The ring carries the colour.** The outline of the circle takes the colour chosen by the id (the same eight `disc-*` tokens, picked the same way, so it survives a change of username). The inside no longer does.
- **The inside is a faceless person.** A generic profile silhouette (head and shoulders, no face) on a neutral fill, the same for every user. The app stores no gender, so it is one neutral silhouette, not a man or a woman. The icon comes from `@lucide/angular` if one fits at every size; otherwise it is drawn once in the `Avatar` component.
- **Initials go.** The picture no longer shows letters.
- **An unavailable account** (deactivated or deleted) keeps a grey look: a grey ring around the same silhouette.
- **Everything else stays.** One `Avatar` component still draws it everywhere a user appears, at every size it has today, and a chosen picture can still take its place later.

`DESIGN.md` (Components, and the disc tokens) is updated in the same change, together with `src/design-tokens.css` if a token changes.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), for the places the picture appears

**Status:** ready-for-agent

**Difficulty:** easy: one component, its unit-tested helper (`default-picture.ts`) and two documents.

- [ ] The ring's colour follows the user's id, from the eight `disc-*` tokens
- [ ] The inside is the same faceless silhouette for every user, with no initials
- [ ] An unavailable account shows a grey ring around the silhouette
- [ ] The ring and the silhouette are visible against the page in both themes, at every avatar size
- [ ] `DESIGN.md` describes the new default picture
- [ ] Checked with the screenshot command at 360, 768 and 1280 px in both themes, on a page that shows several users
