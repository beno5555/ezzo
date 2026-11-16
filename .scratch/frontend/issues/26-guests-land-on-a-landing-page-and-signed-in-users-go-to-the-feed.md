# 26: Guests land on a landing page, and signed-in users go to the feed

**What to build:** A guest who opens `/` sees what WebCity is and how to join. A signed-in user who opens `/` ends up on the feed.

- **Pitch.** A short text on what WebCity is, with Sign in and Register.
- **Example posts.** A few post skeletons, the shape of the post card with no content, show what the feed looks like. They are not real posts, and the page reads nothing from the backend to draw them.
- **Signed-in users** who open `/` are sent to `/feed`, on a link and on a hard reload alike, once the session is known.
- **Texts** come from the dictionaries, in English and Georgian.

Decisions are under "Addresses" in `.scratch/frontend/spec.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 09 (The feed shows posts with photos and likes), whose post card the skeletons copy, and the frontend setup (27, 28, 29)

**Status:** ready-for-agent

**Difficulty:** routine: one static page and one redirect, following the shell's guards and the feed card.

- [ ] A guest opening `/` sees the pitch, Sign in, Register and the post skeletons
- [ ] The landing page sends no request for posts
- [ ] A signed-in user opening `/`, by a link or a hard reload, lands on `/feed`
- [ ] Every text shows in English and in Georgian
- [ ] Checked in the running app on a desktop width and on a phone width, signed out and signed in
