# 41: Guests sign in on the landing page, and signed-in users see the feed at `/`

**What to build:** `/` is the one front door (owner, 2026-11-23). A guest who opens it sees the landing page with the sign-in form on it; a signed-in user who opens it sees the feed. There is no separate home page and no separate sign-in page. This replaces ticket 26.

- **The landing page, Instagram's pattern.** On a desktop: on one side, a picture of the app in use (made things in the feed, drawn from the post card's shape, with no request to the backend); on the other, the "zz" logo mark, the punchline "Bring what you made." (Georgian: "გაგვიზიარე, რაც შექმენი."), the sign-in form and "New here? Create an account" under it. On a phone: only the logo, the punchline and the form. The punchline appears only here.
- **The sign-in form moves, unchanged in behaviour.** Everything the sign-in page does today keeps working on `/`: its notices (after a password reset, after reactivation, a session that ended), the return address a guard sends a guest back to after signing in, the rate-limit and wrong-password messages, the links to Forgot password and Reactivate.
- **Old addresses keep working.** `/sign-in` sends to `/`, keeping its query (the return address and any notice), so emails and links already sent still land correctly. `/feed` sends to `/`. Every place in the app that links to sign-in or to the feed points at `/` directly.
- **Signing in and out.** After signing in, the user stays on `/` and sees the feed (or goes to the return address). After signing out, the user is on `/` and sees the landing page. A hard reload of `/` shows the right one once the session is known, without flashing the other.
- **The account-page shell.** The landing page shows no second logo in the top bar, and offers the language and theme switch (the critique found sign-in had neither).
- **Texts** come from the dictionaries, in English and Georgian. The browser-tab title is "Ezzo" on the landing page and "Feed – Ezzo" on the feed.

**Blocked by:** None (can start immediately)

**Status:** done

**Difficulty:** tricky: it moves the auth entry point, so the guards, the return address, the session restore on reload and the sign-out path all change together, and a mistake shows only as a wrong redirect.

- [x] A guest opening `/` sees the logo mark, the punchline and the sign-in form; on a desktop also the picture of the app
- [x] A signed-in user opening `/`, by a link or a hard reload, sees the feed with no flash of the landing page
- [x] Signing in on `/` shows the feed; signing in after a guard's redirect returns to the address the guest asked for
- [x] Signing out lands on `/` showing the landing page
- [x] `/sign-in?…` and `/feed` send to `/`, keeping the query; the reset and reactivation notices still show
- [x] No link in the app points at `/sign-in` or `/feed`
- [x] The landing page sends no request for posts
- [x] Unit tests for the guards and redirects pass; ticket 26 is marked superseded
- [x] Checked with the screenshot command at 360, 768 and 1280, both themes, English and Georgian, signed out and signed in

## Comments

**2026-11-23, round 1: implementation (Opus 5.5).**

- **Built:** two routes at `/`, chosen by `signedInMatch`; `/feed` and `/sign-in` redirect there with their query. The sign-in page became `LandingPage` (same form and messages) with `LandingPicture` beside it from 1024 px. The shell follows the open page through `isOnLandingPage`.
- **Side changes the single address needed:** the router reloads a navigation to the same address (`router-config.ts`); `ModerationStore` therefore keeps its states on such a navigation unless the user changed; the Feed links count as current on `/` alone; a return address already on `/` is kept. Ticket 35, the frontend spec, `DESIGN.md` and the conventions were updated to the new addresses.
- **Beyond the ticket:** the landing page's top bar has no border or raised background, since it holds only the language and theme menu.
- **Checks:** 742 unit tests, lint and build pass, and Prettier's check with `--end-of-line auto` (this checkout holds CRLF files outside `src`, which the plain check reports). The backend suite was not run: no backend file changed. The build warns that the first download is over 600 kB: 710.8 kB here, 708.2 kB on master before this ticket.
- **In the running app** (ports 7202 and 4300, development account): the 12 guest and 12 signed-in images of `/` (the signed-in ones taken before the review fixes, the guest ones again after them); the guest, former-address, guard, sign-in, sign-out, wrong-password and hard-reload paths; the reset and reactivation notices with the backend's answer stubbed; a session that ends on the feed and on messages, with 401s stubbed. Not tried: the rate-limit message, an administrator (the Hidden badge fix has unit tests only), opening the language and theme menu, a screen reader. Feed photos show broken in the images, as the uploads live in another checkout.
- **Left standing:** after signing out on the feed, the guest top bar shows over the feed until the landing page loads, and for about a frame after it. A guest who hard-loads a guarded page sees that bar first. The hard reload of `/` itself shows no flash.
- **Review findings fixed:** the Hidden badge lost on a same-address click, the lost return address, the doubled card markup, repeated former addresses, missing tests, stale wording. Left: the name `signIn.punchline` (the ticket's word), the bare `appAuthMark` attribute, `comment-section.ts`'s older `signInAddress` name, the repeated path split.
- **Open decisions:** (1) "a session that ended" has no notice today, so none was added; recommend leaving it. (2) The picture starts at 1024 px, not 768; recommend keeping it, as two columns are cramped at 768. (3) `PRODUCT.md` wants the tagline next to the name, `DESIGN.md` keeps the name off the page; the logo stands in for it, recommend amending `PRODUCT.md`. (4) The picture's post texts, in both languages, are the agent's and need the owner's approval, as does its use of the disc colours (noted in `DESIGN.md`).
- **Screenshots:** `.scratch/frontend/shots/41/` in the main checkout.
- **Branch:** `frontend-41-landing-page`, pushed and waiting for the owner's review. The trial merge result is in the chat report.
