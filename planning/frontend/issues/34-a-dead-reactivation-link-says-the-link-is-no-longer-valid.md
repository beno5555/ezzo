# 34: A dead reactivation link says the link is no longer valid

**What to build:** A person who opens an expired, used or unknown reactivation link and presses "Reactivate my account" reads that the link is invalid or expired, not that their account does not exist. Today the activate endpoint answers every bad token with the "User not found" message, and the page shows the backend's message as it is, so the person may think their account is gone (found in ticket 33's review; owner, 2026-11-20).

- **Its own message.** The activate endpoint (consuming the token) fails a bad token with a message of its own, worded and named like the reset flow's "Invalid or expired reset token", for example "Invalid or expired activation token". The status stays `400`, and the `Log` row records the new message.
- **"User not found" keeps its other use.** Asking for a reactivation link with an email that matches no deactivated account still answers "User not found". Only the token path changes.
- **Backend only.** The page already shows whatever message the backend sends and keeps its "Ask for a new one" link beside it, so no frontend code changes. Server text is not translated (ADR 0006), so the message stays English in both languages, as the reset page's does.
- **Docs follow.** The Reactivation bullet in `docs/backend/auth.md`, which ticket 33 wrote to say a dead token gets "User not found", names the new message instead.

**Blocked by:** 33 (A deactivated user reactivates from the email's link), until it is merged: it wrote the page, the tests and the docs this ticket corrects.

**Status:** done

**Difficulty:** routine: one new response message on an existing failure branch, copied from the reset flow, with integration tests that catch a slip.

- [x] An expired, a used and an unknown token each get `400` with the new message; integration tests check each one
- [x] Asking for a link with an email that matches no deactivated account still gets "User not found"; the existing test passes unchanged
- [x] The new message is a constant beside the reset flow's token messages; no literal text in the service
- [x] `docs/backend/auth.md` names the new message for a dead token and no longer says "User not found" there
- [x] The roadmap's "If time is left" entry for this item is removed
- [x] The backend integration suite passes
