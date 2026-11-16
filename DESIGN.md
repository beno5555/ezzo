---
version: alpha
name: WebCity (provisional skin)
description: The structure of WebCity's look, with neutral values that stand in until the product's name and brand are chosen.
colors:
  # "primary" is the name the DESIGN.md format requires. It is the same colour as "accent", in both themes.
  primary: "#2b59c3"
  primary-dark: "#8fb0ff"

  # Light theme
  surface-page: "#f4f4f5"
  surface-raised: "#ffffff"
  surface-sunken: "#e9e9ec"
  ink-strong: "#1b1b1f"
  ink-muted: "#5c5c66"
  border: "#d3d3d8"
  border-strong: "#85858f"
  accent: "#2b59c3"
  accent-strong: "#21469b"
  on-accent: "#ffffff"
  danger: "#b3261e"
  success: "#1b6e45"
  warning: "#8a5a00"
  focus: "#2b59c3"

  # Dark theme: the same roles, marked by the "-dark" suffix
  surface-page-dark: "#141416"
  surface-raised-dark: "#1e1e21"
  surface-sunken-dark: "#0c0c0e"
  ink-strong-dark: "#f1f1f3"
  ink-muted-dark: "#a4a4ae"
  border-dark: "#38383e"
  border-strong-dark: "#7b7b86"
  accent-dark: "#8fb0ff"
  accent-strong-dark: "#b3c9ff"
  on-accent-dark: "#0d1a3a"
  danger-dark: "#ff8f85"
  success-dark: "#63d19c"
  warning-dark: "#efb84f"
  focus-dark: "#8fb0ff"

  # Discs of the default profile picture, the same in both themes, always with white letters
  disc-1: "#b8431f"
  disc-2: "#a15c07"
  disc-3: "#4a7a12"
  disc-4: "#0b7a5c"
  disc-5: "#0f7391"
  disc-6: "#2557c7"
  disc-7: "#7a34c4"
  disc-8: "#b82462"
  disc-unavailable: "#6b6b75"
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

# WebCity design

This file is the visual brief. Read it before you edit a template or a style in `frontend/`. The rules for writing styles are in the Styling section of the conventions skill's TypeScript reference, and the reason for the toolset is ADR 0007.

The same values live in the Tailwind theme block, which is the file the build reads. A design token changes in both files in the same commit.

## Overview

WebCity is a small social platform: a feed, posts with photos, comments, friends, chat, and an admin panel. Its screens are tools that people use many times a day, so clarity and consistency come before decoration.

**The structure is final. The skin is provisional.**

- **Final:** the design token names, the two themes, the type sizes, the spacing scale, the radii, the layout rules and the floor for motion and accessibility.
- **Provisional:** every colour value, both font families and the logo. They are deliberately neutral, so that nobody mistakes them for the finished look. The product's name is still open, and the brand is chosen after it.
- **Until the name is settled, no component carries a brand metaphor.** The brand lives only in design token values and in the logo component. That is what keeps a change of name cheap.

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

## Typography

- **Two roles.** The **body** role uses one family that covers Latin, Cyrillic and Georgian by itself. The **display** role (headings, the logo) may use a Latin-only face with one named Georgian partner in its stack. In the provisional skin both roles are Noto Sans with Noto Sans Georgian.
- **Six sizes,** from `text-xs` (12 px) to `text-2xl` (28 px). Body text is `text-base` (16 px) and is never smaller than `text-sm` (14 px).
- **Fonts are served by the app itself.** No font is loaded from another origin.
- **Do not lean on capital letters.** Georgian has none in everyday writing, so an ALL-CAPS label loses its meaning in the Georgian interface. Use weight and size for emphasis.
- **Lines of text stay under about 80 characters.**

## Layout

- **Fluid by default.** No fixed widths, only maximum widths. Rows wrap. Images shrink with their container.
- **Phone first.** Write the phone layout, then add what changes on wider screens.
- **The shell changes at 768 px.** Below it: the phone shell with the bottom bar. From it up: the desktop shell with the top bar. A tablet gets the desktop shell.
- **A second change at 1024 px** is allowed only on a page with a real second column: chat and the admin panel.
- **Content sits in a capped column:** `column` (42rem) for reading pages such as the feed and a post, `wide` (75rem) for chat and the admin panel.
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
- **Buttons.** One primary button per screen, in `accent`. Other buttons are quiet: `surface-raised` with `border-strong`, or text only. A destructive button uses `danger`.
- **Inputs.** A visible label above every input, never a placeholder in its place. The error text sits beside the field, in `danger`, with an icon.
- **Icons** come from one set, Lucide. An icon that is the only content of a button has an accessible label.
- **Dialogs, menus and toasts** take their behaviour from Angular CDK and their look from these design tokens.

## Do's and Don'ts

- Do use a design token for every colour, size, radius and space. Don't write a hex code or a bracketed Tailwind value such as `p-[13px]`.
- Do let the theme change the values. Don't write a `dark:` class or name a theme in a component.
- Do move only in answer to a user's action, for at most 200 ms. Don't animate on page load or on scroll, and turn motion off under "reduce motion".
- Do keep keyboard focus visible on every control, with the `focus` ring.
- Do keep text contrast at 4.5 to 1 or more in both themes.
- Don't use ALL-CAPS labels, italics for meaning, or a monospace face for small labels.
- Don't add a second accent colour, a gradient or a glow.
- Don't give a component a brand metaphor before the name is settled.
