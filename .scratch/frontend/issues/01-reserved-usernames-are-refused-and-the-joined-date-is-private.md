# 01: Reserved usernames are refused, and the joined date is private

**What to build:** Three small backend changes that the pages need.

- **Reserved usernames.** `mine`, `search`, `account_deactivated` and `account_deleted` are refused wherever a username is set: registration, an administrator creating an account, a user editing their own profile, and an administrator editing a profile. The comparison ignores letter case. The first two collide with the endpoints beside the read by username, so such a user's profile could never be read by name. The last two are the placeholder names shown for unavailable accounts, so a real user could pose as one. The list lives in one place.
- **The joined date is private.** The shape returned by the public reads of a user (by id and by username) no longer carries the joined date. The user's own full shape and the admin account shape keep it.
- **The username's last change is visible to its owner.** The user's own full shape gains the time the username was last changed. It is empty when the username was never changed.

Decisions are under "Backend changes" in `.scratch/frontend/spec.md`.

**Blocked by:** None (can start immediately)

**Status:** done

**Difficulty:** routine: one validation rule at four entry points and two DTO changes, all following existing patterns and covered by the integration suite.

- [x] Each of the four names is refused at registration, in lower case and in mixed case
- [x] Each is refused when an administrator creates an account, when a user edits their own profile and when an administrator edits a profile
- [x] The refusal uses an existing failure shape and a message of its own in `ResponseMessages`
- [x] A name that only contains a reserved word (`mine2`, `searcher`) is accepted
- [x] The public reads of a user, by id and by username, no longer return the joined date, for a guest and for a signed-in user
- [x] The user's own profile and the admin account list still return the joined date
- [x] The user's own profile returns no last-changed time before a username change and the time of the change after one
- [x] The full integration suite passes
- [x] `docs/backend/controllers.md`, `docs/backend/auth.md` where it applies, `README.md` and the Postman collection describe the three changes
