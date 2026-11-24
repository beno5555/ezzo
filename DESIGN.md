---
version: alpha
name: Ezzo (Balcony)
description: The look of Ezzo, a small social platform: Balcony, the painted wooden balconies of old Tbilisi, a deep balcony blue on cool pale walls.
colors:
  # "primary" is the name the DESIGN.md format requires. It is the same colour as "accent", in both themes.
  primary: "#1d6a8e"
  primary-dark: "#9bd3f2"

  # Light theme
  surface-page: "#ecf1f2"
  surface-raised: "#ffffff"
  surface-sunken: "#dce5e8"
  ink-strong: "#12202a"
  ink-muted: "#485b63"
  border: "#c9d6da"
  border-strong: "#6a8088"
  accent: "#1d6a8e"
  accent-strong: "#134d68"
  on-accent: "#ffffff"
  danger: "#b3261e"
  success: "#24561a"
  warning: "#8a5a00"
  focus: "#1d6a8e"
  stamp: "#d7e4e8"

  # Dark theme: the same roles, marked by the "-dark" suffix
  surface-page-dark: "#0f1a20"
  surface-raised-dark: "#1e2f38"
  surface-sunken-dark: "#060c10"
  ink-strong-dark: "#e5eef1"
  ink-muted-dark: "#9db1b9"
  border-dark: "#33474f"
  border-strong-dark: "#6d8791"
  accent-dark: "#9bd3f2"
  accent-strong-dark: "#c2e4f7"
  on-accent-dark: "#05263a"
  danger-dark: "#ff8f85"
  success-dark: "#74bd52"
  warning-dark: "#efb84f"
  focus-dark: "#9bd3f2"
  stamp-dark: "#23343d"

  # Discs of the landing page's drawing, the same in both themes, always with white lines
  disc-1: "#1f6b62"
  disc-2: "#2f6a47"
  disc-3: "#566a1d"
  disc-4: "#3d5788"
  disc-5: "#4c4f8c"
  disc-6: "#8a4925"
  disc-7: "#69513a"
  disc-8: "#6d3c69"
  on-disc: "#ffffff"

  # Rings of the default profile picture: the disc hues, lighter in the dark theme (the "-dark" entries)
  avatar-1: "#1f6b62"
  avatar-2: "#2f6a47"
  avatar-3: "#566a1d"
  avatar-4: "#3d5788"
  avatar-5: "#4c4f8c"
  avatar-6: "#8a4925"
  avatar-7: "#69513a"
  avatar-8: "#6d3c69"
  avatar-unavailable: "#686c6e"
  avatar-1-dark: "#288b7f"
  avatar-2-dark: "#3e8c5d"
  avatar-3-dark: "#6d8625"
  avatar-4-dark: "#5d7cb7"
  avatar-5-dark: "#7477b3"
  avatar-6-dark: "#be6533"
  avatar-7-dark: "#997654"
  avatar-8-dark: "#aa65a4"
  avatar-unavailable-dark: "#787d7f"
typography:
  text-xs:
    fontFamily: Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
  text-sm:
    fontFamily: Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.45
  text-base:
    fontFamily: Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.55
  text-lg:
    fontFamily: Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  text-xl:
    fontFamily: Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 1.375rem
    fontWeight: 600
    lineHeight: 1.3
  text-2xl:
    fontFamily: Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.2
  text-display:
    fontFamily: Bricolage Grotesque, Noto Sans, Noto Sans Georgian, system-ui, sans-serif
    fontSize: 3rem
    fontWeight: 700
    lineHeight: 1.1
  wordmark:
    fontFamily: Fraunces Variable, serif
    fontWeight: 900
rounded:
  sm: 4px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  unit: 0.25rem
  column: 42rem
  wide: 75rem
  admin: 90rem
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    height: 44px
  button-primary-hover:
    backgroundColor: "{colors.accent-strong}"
  card:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.lg}"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-strong}"
    rounded: "{rounded.md}"
    height: 44px
  profile-picture-default:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
---

# Ezzo design

This file is the visual brief. Read it before you edit a template or a style in `frontend/`. The rules for writing styles are in the Styling section of the conventions skill's TypeScript reference, and the reason for the toolset is ADR 0007.

The same values live in the Tailwind theme block, which is the file the build reads. A design token changes in both files in the same commit.

## Overview

Ezzo (`PRODUCT.md`) is a small social platform: a feed, posts with photos, comments, friends, chat, and an admin panel. Its screens are tools that people use many times a day, so clarity and consistency come before decoration. The code still calls the app WebCity; only what a visitor reads says Ezzo.

**The skin is Balcony** (owner, 2026-11-23): the painted wooden balconies of old Tbilisi, where neighbours lean out and talk across the yard. A deep balcony blue is the one accent, on cool pale walls in the light theme and on a blue-black night in the dark one.

## Brand

- **The logo** is "zz" in `on-accent` strokes inside an `accent` speech bubble (owner, 2026-11-23): neighbours talking across balconies. The same drawing is the top bar's home link on every page but the landing page, whose wordmark carries it, and the browser-tab icon (`public/favicon.svg`, which holds the light values, as a file outside the app cannot read tokens).
- **The wordmark** is the name, "ezzo", drawn large on the landing page in the `wordmark` face (owner, 2026-11-23). Its "zz" is the logo: the letters in `on-accent` inside the logo's `accent` speech bubble, so the top bar there shows no second logo. The "e" and the "o" are outlined in `accent`, with no fill, so the bubble and the letters read as one word. The tagline sits under it, so the two are read together (`PRODUCT.md`). Screen readers skip it; the page's heading and the tab title name the app.
- **The stamp** is the same name fixed to the window behind every page but the landing page, which draws its own (owner, 2026-11-23): the logo's bubble once per page, never twice. Every letter and the bubble are `stamp`, the "zz" is cut out of the bubble in `surface-page`, and the whole is tilted -9° about its bottom-left corner, which lies outside the window, so the page's cards cover about half of it as they scroll over it. A phone shows less, as the cards fill its width. `stamp` is kept pale so that text on the page, which can lie over it, stays at 4.5 to 1 in both themes.

## Colors

A colour is named for its job, never for its shade. A component uses the role name and is then correct in both themes and under any later skin.

| Role                           | Its job                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------- |
| `surface-page`                 | The page background.                                                            |
| `surface-raised`               | Cards, dialogs, menus, inputs: anything that sits on the page.                  |
| `surface-sunken`               | Wells and inactive areas that sit below the page.                               |
| `ink-strong`                   | Main text.                                                                      |
| `ink-muted`                    | Secondary text: times, counts, hints.                                           |
| `border`                       | Dividers and the edges of cards. Decorative only.                               |
| `border-strong`                | The edge of an input or any control whose edge is the only thing that marks it. |
| `accent`                       | The main action on a screen, links, the selected item.                          |
| `accent-strong`                | The accent while hovered or pressed.                                            |
| `on-accent`                    | Text and icons on the accent.                                                   |
| `danger`, `success`, `warning` | Destructive actions and errors; confirmations; cautions.                        |
| `focus`                        | The keyboard focus ring.                                                        |
| `stamp`                        | The big "ezzo" fixed behind every page but the landing page (Brand).            |
| `disc-1` to `disc-8`           | The discs of the landing page's drawing.                                        |
| `on-disc`                      | Lines drawn on a disc in the landing page's drawing.                            |
| `avatar-1` to `avatar-8`       | The ring of the default profile picture, chosen by the user's id.               |
| `avatar-unavailable`           | The ring of an account that is deactivated or deleted.                          |

- **Two themes, one set of names.** The DESIGN.md format holds one list of colours, so the dark theme's value of a role is the entry with the `-dark` suffix. In the Tailwind theme block there is no suffix: the dark theme gives the same name another value.
- **Contrast.** Every text colour on every surface is at least 4.5 to 1 in both themes. White on each disc is at least 4.5 to 1. `ink-muted` on `surface-sunken`, the silhouette of the default profile picture, passes the same check in both themes. Each ring colour is at least 3 to 1 on `surface-page` and on `surface-raised` in both themes (4.7 to 1 or more in light; 3.3 to 1 or more in dark, which is why the dark rings are lighter, owner, 2026-11-24). `border-strong` is at least 3 to 1 on every surface. Check new values the same way before they go in.
- **One accent.** Use it for the single most important action on a screen. Two exceptions, both on the landing page: the wordmark (Brand) and the sheet under the lifted card (Elevation & Depth). Never use colour alone to carry a meaning; pair it with a word or an icon.
- **Accent and success stay apart.** Both are cool colours, so `success` is a green set clearly away from the blue (a luminance ratio of about 1.4 between them in each theme). A new value keeps that distance.
- **The discs stay in the palette:** eight muted, deep colours (teal, green, olive, blue, indigo, rust, walnut, plum) that sit beside the accent without competing with it, all dark enough for white lines on them.
- **The landing page's picture** is the one drawing in the app: it takes its colours from the disc roles. Its two posts are set askew and overlap, like prints laid on a table, with the `overlay` shadow.
- **Scrollbars** take `border-strong` on `surface-page`.

## Typography

- **Two roles,** and the wordmark below. The **body** role (`font-body`) is Noto Sans, with the variable Noto Sans Georgian for Georgian letters. The **display** role (`font-display`: headings and the logo) is Bricolage Grotesque, set narrow through its width axis. It has no Cyrillic or Georgian, so those letters fall to Noto Sans and to the variable Noto Sans Georgian, whose width axis narrows Georgian headings to match.
- **The wordmark** (`font-wordmark`) is Fraunces at its heaviest, softest, largest optical size, with its wonky letters (owner, 2026-11-23). The landing page and the stamp load the same variable font subset for the letters in "ezzo".
- **Six sizes,** from `text-xs` (12 px) to `text-2xl` (28 px), and one more, `text-display` (48 px), for the landing page's tagline on a wide screen; at 28 px it read as a caption under the wordmark (owner, 2026-11-23). Body text is `text-base` (16 px) and is never smaller than `text-sm` (14 px).
- **No letter spacing.** Headings keep the face's own spacing, which Georgian needs.
- **Fonts are served by the app itself.** No font is loaded from another origin.
- **Do not lean on capital letters.** Georgian has none in everyday writing, so an ALL-CAPS label loses its meaning in the Georgian interface. Use weight and size for emphasis.
- **Lines of text stay under about 80 characters.**

## Layout

- **Fluid by default.** No fixed widths, only maximum widths. Rows wrap. Images shrink with their container.
- **Phone first.** Write the phone layout, then add what changes on wider screens.
- **The shell changes at 768 px.** Below it: the phone shell with the bottom bar. From it up: the desktop shell with the top bar. A tablet gets the desktop shell.
- **A second change at 1024 px** is allowed only on a page with a real second column: chat, the admin panel and the landing page (its picture). One exception: a page with a pinned "Back" button (the post's page, the settings page) moves it from a bar across the top into the margin left of the column (owner, 2026-11-22 and 2026-11-24).
- **Content sits in a capped column:** `column` (42rem) for reading pages such as the feed and a post, `wide` (75rem) for chat and the landing page, `admin` (90rem) for the admin panel, whose users table needs the room. Inside it the menu stays in view while the page scrolls, and a page that is a list of cards (reports, moderation) keeps its own content in a `column`.
- **Nothing scrolls sideways** at 360 px. On a phone, the rows of an admin table become stacked cards.
- **Spacing** uses Tailwind's default scale, in steps of 0.25rem (4 px). Use no value outside the scale.
- **Touch targets** are at least 44 px high on a phone.
- **Every page is checked at 360, 768 and 1280 px,** in both themes, when it is built.

## Elevation & Depth

Depth comes from the three surfaces first: sunken, page, raised. Shadows are kept for things that float over the page.

- **Raised** (a card that needs to lift, the bottom bar): `0 1px 2px rgb(0 0 0 / 0.08)`.
- **Overlay** (dialogs, menus, toasts, and on the landing page the lifted card and the picture's posts): `0 8px 24px rgb(0 0 0 / 0.16)`.
- In the dark theme a floating element is also marked by `border`, because a shadow barely shows on a dark page.
- **The lifted card** (the landing page's sign-in form, owner, 2026-11-23) takes the `overlay` shadow and lies on a sheet of `accent` set askew behind it, a little less askew on a phone so its corner stays inside the margin. It is the only card that stands out this way.

## Shapes

Three radii and "full": `sm` for small controls such as badges and checkboxes, `md` for buttons and inputs, `lg` for cards and dialogs, `full` for profile pictures and pills. Do not mix sharp and rounded corners in one view.

## Components

- **Profile picture.** One `Avatar` component shows a user's profile picture wherever a user appears. A user without one gets the default: a faceless silhouette (head and shoulders, the lucide `User` icon filled) in `ink-muted` on `surface-sunken`, inside a ring (owner, 2026-11-19). The app stores no gender, so the silhouette is the same for every user, and the picture shows no letters.
  - **Ring colour:** one of `avatar-1` to `avatar-8`, chosen by the user's id, so it survives a change of username. The ring is 2 px wide, 4 px on the large picture.
  - **An unavailable account** (deactivated or deleted) gets the same silhouette in an `avatar-unavailable` ring.
- **Buttons.** One primary button per screen, in `accent`. Other buttons are quiet: `surface-raised` with `border-strong`, or text only. A destructive button uses `danger` and carries a trash icon before its text, which the button adds by itself.
- **A list of people** (the friends page, a profile's Friends tab) is one card of rows. A name is `ink-strong` and semibold and is underlined only under the pointer, since the avatar and the name together read as a link. A button that every row repeats is never `accent` (the message to a friend is quiet), and a destructive one that every row repeats is text only in `danger` with its trash icon, no edge (owner, 2026-11-23: a column of filled blue buttons and red boxes looked heavy). A button that answers the row, such as Accept on a request, stays `accent`.
- **The current page** in the top bar, the bottom bar and the admin menu: its link turns `accent` and semibold, with a short accent bar along one edge (under it in the top bar, above it in the bottom bar, at its start in the admin menu).
- **The "Hidden" badge** is an eye-off icon and the word in `warning`, semibold, with no box.
- **Inputs.** Every input in a form has a visible label that floats: it rests in the empty box where the text goes, and shrinks up to the box's top once the box is focused or filled (owner, 2026-11-23). The hint and the error text sit under the field, the error in `danger` with an icon; a counter or a "Forgot password?" link ends that row. A password box ends with an eye button (`PasswordToggle`) that shows the password as text and hides it again. The eye shows the state: closed while the password is hidden, which is how every box starts, and open while it shows. Submitting the form hides it again. Register and the password reset ask for the password twice, and the second box must match the first (owner, 2026-11-24).
- **Date and time.** A date and clock time (the audit page's period) is chosen in the calendar that opens under a read-only box (`appDateTimeInput`, vanilla-calendar-pro), never in the browser's own date picker, which the app cannot style (owner, 2026-11-24). Hours and minutes, no seconds. The calendar takes its colours from the tokens, so it follows both themes; its day buttons and time boxes are at least 44 px high. A date of birth is a different control (ticket 42).
- **Icons** come from one set, Lucide. An icon that is the only content of a button has an accessible label.
- **Dialogs, menus and toasts** take their behaviour from Angular CDK and their look from these design tokens.
- **A toast tells its news by its look** (owner, 2026-11-24): a reader should get it without reading. A toast about a person shows their avatar, their name in `ink-strong` and semibold on its own line, and the news in muted text under it; a small round badge on the avatar's corner says what kind it is: a green dot (`success`) for a friend who came online, an `accent` badge with a speech icon for a message or a comment, a `danger` badge with a heart for a like. A toast about no one shows a disc with an icon: a check in `success` (done), a cloud with an arrow (uploading), a cross in `danger` (failed). A toast with a link ends in a chevron. Every toast ends in a close button (owner, 2026-11-24), at least 44 px wide, that discards it at once; with a link, the button sits beside the link, not inside it.
- **A friend's presence on their profile** is the dot on the avatar's corner and nothing else: green for online, grey for last active within a day, no dot after that. The words ("Active now", "Active 5 min ago") are for lists and the chat.

## Do's and Don'ts

- Do use a design token for every colour, size, radius and space. Don't write a hex code or a bracketed Tailwind value such as `p-[13px]`.
- Do let the theme change the values. Don't write a `dark:` class or name a theme in a component.
- Do move only in answer to a user's action, for at most 200 ms. Don't animate on page load or on scroll, and turn motion off under "reduce motion". Two exceptions. One (owner, 2026-11-23): the spinner of a "Deleting…" notice turns for as long as the server takes to answer, and at least 400 ms; it stands still under "reduce motion". The other (owner, 2026-11-24): a toast appears on its own, so it slides in over 300 ms (down from the top edge on a phone, in from the end edge from `md:`), and under "reduce motion" it just appears.
- Do keep keyboard focus visible on every control, with the `focus` ring.
- Do keep text contrast at 4.5 to 1 or more in both themes.
- Don't use ALL-CAPS labels, italics for meaning, or a monospace face for small labels.
- Don't add a second accent colour, a gradient or a glow.
