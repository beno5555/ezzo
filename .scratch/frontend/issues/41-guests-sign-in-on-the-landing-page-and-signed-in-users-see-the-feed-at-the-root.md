# 41: Guests sign in on the landing page, and signed-in users see the feed at `/`

**What to build:** `/` is the one front door (owner, 2026-11-23). A guest who opens it sees the landing page with the sign-in form on it; a signed-in user who opens it sees the feed. There is no separate home page and no separate sign-in page. This replaces ticket 26.

- **The landing page, Instagram's pattern.** On a desktop: on one side, a picture of the app in use (made things in the feed, drawn from the post card's shape, with no request to the backend); on the other, the "zz" logo mark, the punchline "Bring what you made." (Georgian: "გაგვიზიარე, რაც შექმენი."), the sign-in form and "New here? Create an account" under it. On a phone: only the logo, the punchline and the form. The punchline appears only here.
- **The sign-in form moves, unchanged in behaviour.** Everything the sign-in page does today keeps working on `/`: its notices (after a password reset, after reactivation, a session that ended), the return address a guard sends a guest back to after signing in, the rate-limit and wrong-password messages, the links to Forgot password and Reactivate.
- **Old addresses keep working.** `/sign-in` sends to `/`, keeping its query (the return address and any notice), so emails and links already sent still land correctly. `/feed` sends to `/`. Every place in the app that links to sign-in or to the feed points at `/` directly.
- **Signing in and out.** After signing in, the user stays on `/` and sees the feed (or goes to the return address). After signing out, the user is on `/` and sees the landing page. A hard reload of `/` shows the right one once the session is known, without flashing the other.
- **The account-page shell.** The landing page shows no second logo in the top bar, and offers the language and theme switch (the critique found sign-in had neither).
- **Texts** come from the dictionaries, in English and Georgian. The browser-tab title is "Ezzo" on the landing page and "Feed – Ezzo" on the feed.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

**Difficulty:** tricky: it moves the auth entry point, so the guards, the return address, the session restore on reload and the sign-out path all change together, and a mistake shows only as a wrong redirect.

- [ ] A guest opening `/` sees the logo mark, the punchline and the sign-in form; on a desktop also the picture of the app
- [ ] A signed-in user opening `/`, by a link or a hard reload, sees the feed with no flash of the landing page
- [ ] Signing in on `/` shows the feed; signing in after a guard's redirect returns to the address the guest asked for
- [ ] Signing out lands on `/` showing the landing page
- [ ] `/sign-in?…` and `/feed` send to `/`, keeping the query; the reset and reactivation notices still show
- [ ] No link in the app points at `/sign-in` or `/feed`
- [ ] The landing page sends no request for posts
- [ ] Unit tests for the guards and redirects pass; ticket 26 is marked superseded
- [ ] Checked with the screenshot command at 360, 768 and 1280, both themes, English and Georgian, signed out and signed in
