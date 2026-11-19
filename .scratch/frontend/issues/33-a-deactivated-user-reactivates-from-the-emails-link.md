# 33: A deactivated user reactivates from the email's link

**What to build:** A user who deactivated their account asks for reactivation on the reactivation page, gets an email with a "Reactivate account" link, opens it, presses one button, and lands on sign-in with the "account reactivated" message. Nobody copies a token any more. Today the email holds the token as plain text (about 86 characters), which ticket 08's page asks the user to paste. The owner had switched the email to plain text only because no frontend existed yet; from now on it sends a link (owner, 2026-11-20).

- **The request carries a return address.** Asking for reactivation takes an optional return address, as asking for a password reset already does. It is checked against the same allowed origins (`Cors:AllowedOrigins`), and a foreign address is refused with the same message the reset request gives. A refused request sends no email and changes no token.
- **The email holds a link.** With a return address, the email holds a "Reactivate account" link to that address with the token in the query string (`?token=…`, escaped), built the same way as the reset email's link, and says when it expires. Without one (Swagger, a test), it still holds the plain token, as the reset email does (owner left the choice to the agent; chosen for symmetry with the reset flow, 2026-11-20).
- **First visit to the page.** The page asks for the email only and sends its own address as the return address. On success it shows that a link was sent to that address, as the forgotten-password page does. The code step and the "Use another email" button go away.
- **Opened from the link.** The page shows a "Reactivate my account" button and does not reactivate on its own: many mail services open every link in an email to scan it, and an automatic action would use up the token before the person reads the email. Pressing the button reactivates; success leads to sign-in with the existing "account reactivated" message.
- **A dead link.** An expired, used or unknown token shows the backend's message, and the way to ask for a new link stays on the page.
- **Docs follow.** The reactivation part of `docs/backend/auth.md`, and in `.scratch/frontend/spec.md` story 25, the address table's `/reactivate-account` row and the Reactivation bullet change from a code to a link.

Decided with the owner on 2026-11-20, after ticket 08 shipped the paste-the-token page.

**Blocked by:** None (can start immediately). Ticket 08 (The auth pages) is merged.

**Status:** ready-for-agent

**Difficulty:** tricky: an auth boundary (the return address must be checked, or the email can send a person and their token to a stranger's site), changed across the backend and the page together, on a flow where a slip locks a person out of their account.

- [ ] A reactivation request with an allowed return address sends an email whose link points at that address and carries the token; an integration test checks it
- [ ] A reactivation request with a foreign return address is refused with the reset request's message and sends no email; an integration test checks it
- [ ] A reactivation request without a return address still emails the plain token, and the existing reactivation tests pass
- [ ] The page sends its own address as the return address and, on success, says a link was sent; it has no code step
- [ ] Opened with `?token=…`, the page reactivates only when the button is pressed, then shows sign-in with the reactivated message
- [ ] An expired or used token shows the backend's message and a way to ask for a new link
- [ ] Unit tests cover the changed API calls and the page's two states
- [ ] The page is checked in the running app at 360, 768 and 1280 px, in both themes and both languages
- [ ] `docs/backend/auth.md` and the frontend spec describe a link, not a code
- [ ] The owner checks one real email during review
- [ ] The backend integration suite, the unit tests, lint and Prettier pass
