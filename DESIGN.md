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

  # Discs of the default profile picture, the same in both themes, always with white letters
  disc-1: "#1f6b62"
  disc-2: "#2f6a47"
  disc-3: "#566a1d"
  disc-4: "#3d5788"
  disc-5: "#4c4f8c"
  disc-6: "#8a4925"
  disc-7: "#69513a"
  disc-8: "#6d3c69"
  disc-unavailable: "#686c6e"
  on-disc: "#ffffff"
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
    backgroundColor: "{colors.disc-1}"
    textColor: "{colors.on-disc}"
    rounded: "{rounded.full}"
---

# Ezzo design

This file is the visual brief. Read it before you edit a template or a style in `frontend/`. The rules for writing styles are in the Styling section of the conventions skill's TypeScript reference, and the reason for the toolset is ADR 0007.

The same values live in the Tailwind theme block, which is the file the build reads. A design token changes in both files in the same commit.

## Overview

Ezzo (`PRODUCT.md`) is a small social platform: a feed, posts with photos, comments, friends, chat, and an admin panel. Its screens are tools that people use many times a day, so clarity and consistency come before decoration. The code still calls the app WebCity; only what a visitor reads says Ezzo.

**The skin is Balcony** (owner, 2026-11-23): the painted wooden balconies of old Tbilisi, where neighbours lean out and talk across the yard. A deep balcony blue is the one accent, on cool pale walls in the light theme and on a blue-black night in the dark one. The brand shows in two places only, and everything else stays quiet:

- **the logo** (Brand, below);
- **the token values** of this file.

## Brand

- **The logo** is "zz" in `on-accent` strokes inside an `accent` speech bubble (owner, 2026-11-23): neighbours talking across balconies. The same drawing is the top bar's home link, the landing page's mark (where the top bar has none) and the browser-tab icon (`public/favicon.svg`, which holds the light values, as a file outside the app cannot read tokens). The name is not written on the page; screen readers hear it.

## Colors

A colour is named for its job, never for its shade. A component uses the role name and is then correct in both themes and under any later skin.

| Role | Its job |
|---|---|
| `surface-page` | The page background. |
| `surface-raised` | Cards, dialogs, menus, inputs: anything that sits on the page. |
| `surface-sunken` | Wells and inactive areas that sit below the page. |
| `ink-strong` | Main text. |
| `ink-muted` | Secondary text: times, counts, hints. |
| `border` | Dividers and the edges of cards. Decorative only. |
| `border-strong` | The edge of an input or any control whose edge is the only thing that marks it. |
| `accent` | The main action on a screen, links, the selected item. |
| `accent-strong` | The accent while hovered or pressed. |
| `on-accent` | Text and icons on the accent. |
| `danger`, `success`, `warning` | Destructive actions and errors; confirmations; cautions. |
| `focus` | The keyboard focus ring. |
| `disc-1` to `disc-8` | The disc of the default profile picture. |
| `disc-unavailable` | The disc of an account that is deactivated or deleted. |
| `on-disc` | The initials on a disc. |

- **Two themes, one set of names.** The DESIGN.md format holds one list of colours, so the dark theme's value of a role is the entry with the `-dark` suffix. In the Tailwind theme block there is no suffix: the dark theme gives the same name another value.
- **Contrast.** Every text colour on every surface is at least 4.5 to 1 in both themes. White on each disc is at least 4.5 to 1. `border-strong` is at least 3 to 1 on every surface. Check new values the same way before they go in.
- **One accent.** Use it for the single most important action on a screen. Never use colour alone to carry a meaning; pair it with a word or an icon.
- **Accent and success stay apart.** Both are cool colours, so `success` is a green set clearly away from the blue (a luminance ratio of about 1.4 between them in each theme). A new value keeps that distance.
- **The discs stay in the palette:** eight muted, deep colours (teal, green, olive, blue, indigo, rust, walnut, plum) that sit beside the accent without competing with it, all dark enough for white initials.
- **The landing page's picture** is the one drawing in the app: it takes its colours from the disc roles.
- **Scrollbars** take `border-strong` on `surface-page`.

## Typography

- **Two roles.** The **body** role (`font-body`) is Noto Sans, with the variable Noto Sans Georgian for Georgian letters. The **display** role (`font-display`: headings and the logo) is Bricolage Grotesque, set narrow through its width axis. It has no Cyrillic or Georgian, so those letters fall to Noto Sans and to the variable Noto Sans Georgian, whose width axis narrows Georgian headings to match.
- **Six sizes,** from `text-xs` (12 px) to `text-2xl` (28 px). Body text is `text-base` (16 px) and is never smaller than `text-sm` (14 px).
- **No letter spacing.** Headings keep the face's own spacing, which Georgian needs.
- **Fonts are served by the app itself.** No font is loaded from another origin.
- **Do not lean on capital letters.** Georgian has none in everyday writing, so an ALL-CAPS label loses its meaning in the Georgian interface. Use weight and size for emphasis.
- **Lines of text stay under about 80 characters.**

## Layout

- **Fluid by default.** No fixed widths, only maximum widths. Rows wrap. Images shrink with their container.
- **Phone first.** Write the phone layout, then add what changes on wider screens.
- **The shell changes at 768 px.** Below it: the phone shell with the bottom bar. From it up: the desktop shell with the top bar. A tablet gets the desktop shell.
- **A second change at 1024 px** is allowed only on a page with a real second column: chat, the admin panel and the landing page (its picture). One exception: a post's page moves its pinned "Back" button from a bar across the top into the margin left of the column (owner, 2026-11-22).
- **Content sits in a capped column:** `column` (42rem) for reading pages such as the feed and a post, `wide` (75rem) for chat and the landing page, `admin` (90rem) for the admin panel, whose users table needs the room. Inside it the menu stays in view while the page scrolls, and a page that is a list of cards (reports, moderation) keeps its own content in a `column`.
- **Nothing scrolls sideways** at 360 px. On a phone, the rows of an admin table become stacked cards.
- **Spacing** uses Tailwind's default scale, in steps of 0.25rem (4 px). Use no value outside the scale.
- **Touch targets** are at least 44 px high on a phone.
- **Every page is checked at 360, 768 and 1280 px,** in both themes, when it is built.

## Elevation & Depth

Depth comes from the three surfaces first: sunken, page, raised. Shadows are kept for things that float over the page.

- **Raised** (a card that needs to lift, the bottom bar): `0 1px 2px rgb(0 0 0 / 0.08)`.
- **Overlay** (dialogs, menus, toasts): `0 8px 24px rgb(0 0 0 / 0.16)`.
- In the dark theme a floating element is also marked by `border`, because a shadow barely shows on a dark page.

## Shapes

Three radii and "full": `sm` for small controls such as badges and checkboxes, `md` for buttons and inputs, `lg` for cards and dialogs, `full` for profile pictures and pills. Do not mix sharp and rounded corners in one view.

## Components

- **Profile picture.** One `Avatar` component shows a user's profile picture wherever a user appears. A user without one gets the default: their initials in `on-disc` on a disc.
  - **Disc colour:** one of `disc-1` to `disc-8`, chosen by the user's id, so it survives a change of username.
  - **Initials:** a username in two parts (`john.doe`, `john_doe`) gives the first letter of each part; any other username gives its first two letters.
  - **An unavailable account** (deactivated or deleted) gets `disc-unavailable` with no letters.
- **Buttons.** One primary button per screen, in `accent`. Other buttons are quiet: `surface-raised` with `border-strong`, or text only. A destructive button uses `danger` and carries a trash icon before its text, which the button adds by itself.
- **A list of people** (the friends page, a profile's Friends tab) is one card of rows. A name is `ink-strong` and semibold and is underlined only under the pointer, since the avatar and the name together read as a link. A button that every row repeats is never `accent` (the message to a friend is quiet), and a destructive one that every row repeats is text only in `danger` with its trash icon, no edge (owner, 2026-11-23: a column of filled blue buttons and red boxes looked heavy). A button that answers the row, such as Accept on a request, stays `accent`.
- **The current page** in the top bar, the bottom bar and the admin menu: its link turns `accent` and semibold, with a short accent bar along one edge (under it in the top bar, above it in the bottom bar, at its start in the admin menu).
- **The "Hidden" badge** is an eye-off icon and the word in `warning`, semibold, with no box.
- **Inputs.** A visible label above every input, never a placeholder in its place. The error text sits beside the field, in `danger`, with an icon.
- **Icons** come from one set, Lucide. An icon that is the only content of a button has an accessible label.
- **Dialogs, menus and toasts** take their behaviour from Angular CDK and their look from these design tokens.

## Do's and Don'ts

- Do use a design token for every colour, size, radius and space. Don't write a hex code or a bracketed Tailwind value such as `p-[13px]`.
- Do let the theme change the values. Don't write a `dark:` class or name a theme in a component.
- Do move only in answer to a user's action, for at most 200 ms. Don't animate on page load or on scroll, and turn motion off under "reduce motion". One exception (owner, 2026-11-23): the spinner of a "Deleting…" notice turns for as long as the server takes to answer, and at least 400 ms. It is the only motion that lasts longer, and it stands still under "reduce motion".
- Do keep keyboard focus visible on every control, with the `focus` ring.
- Do keep text contrast at 4.5 to 1 or more in both themes.
- Don't use ALL-CAPS labels, italics for meaning, or a monospace face for small labels.
- Don't add a second accent colour, a gradient or a glow.
- Don't spread the brand: it lives in the logo and the token values.
