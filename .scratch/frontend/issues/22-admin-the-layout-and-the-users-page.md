# 22: Admin: the layout and the users page

**What to build:** An administrator opens the admin panel and manages accounts.

- **Layout.** A side navigation with Users, Reports, Moderation, Logs and Statistics, each at its own address. On a phone the navigation collapses. Areas not built yet keep their placeholder.
- **Users table,** from the admin account list, loaded by pages. Each row shows the username, the email, whether the account is an administrator, its state (active, deactivated, deleted), and its joined, deactivated and deleted dates.
- **Filters.** By state and by username. The state is sent by name.
- **Create.** A dialog with the same fields as registration.
- **Edit.** A dialog with the profile fields of the chosen account.
- **Row actions,** each after a confirmation: deactivate, restore, delete, grant the administrator role, remove it. A row offers only the actions that fit its state: Restore for a deactivated account, Deactivate for an active one.
- **After an action** the row shows its new state without the list being read from the start.

Decisions are under "Admin panel" in `.scratch/frontend/spec.md`. The backend's side is under `AdminController` and the account controllers in `docs/backend/controllers.md`.

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 08 (The auth pages), and the frontend setup (27, 28, 29)

**Status:** done

**Difficulty:** routine: a paged table, two dialog forms and five confirmed actions, all on existing endpoints and on patterns earlier tickets set.

- [x] Only an administrator reaches the admin addresses; anyone else is turned away
- [x] The table shows accounts in every state, and each filter narrows it
- [x] An administrator creates an account, and it appears in the table
- [x] An administrator edits an account's profile; a refusal by the server shows beside its field
- [x] Deactivate, restore and delete each ask first and then change the row's state
- [x] Granting and removing the administrator role each ask first and then change the row
- [x] A row offers only the actions that fit its state
- [x] The admin and account `…Api` methods are unit-tested against the HTTP testing backend, including the state filter sent as text
- [x] Checked in the running app on a desktop width and on a phone width

## Comments

- **Checked in the running app, against the real backend.** First pass: the API mocked in the browser, at 360, 768 and 1280 px, in both themes and in Georgian. Second pass, after the Docker daemon was started (the cloud container does not start it; `scripts/test-linux.sh` does): the backend on `https://localhost:7102` over a SQL Server container, migrated with `dotnet ef database update`, the frontend through the dev proxy, signed in through the real form as an administrator. Passed on the real backend: paging by scrolling; the state filter by name and the username filter; deactivate, restore, grant, remove and delete (the row changes at once, and the server's own read agrees afterwards); create, with the name lower-cased by the server and a taken name refused beside its field; edit, filled from the real profile with the date of birth on its own calendar day, a taken name refused beside its field, and the stored name shown in the row; a real non-administrator turned away from `/admin/users`; and 360 px with cards, no sideways scroll and the navigation folding away.
- **Edit is offered for active accounts only (owner, 2026-11-22).** The admin list shows every account, deactivated and deleted ones too, greyed, and a deactivated row offers Restore and Delete; to edit it, restore it first. The profile fields (bio, date of birth) of a deactivated account cannot be read or edited, because `GET api/users/{id}` and `PUT api/users/{id}` go through the `User` query filter. Whether the backend should allow that is kept under "After the deadline" in `.scratch/roadmap.md`, not as a ticket.
- **An administrator can act on their own account** from the table (remove their own role, deactivate or delete themself), and their session stays valid until the access token expires. The spec does not mention it; every such action still asks first.
- **Shared with the other branches:** `shared/load-failure/` is copied unchanged from `origin/worktree-post-page`, as asked. The copy on `origin/worktree-chat` differs (its `message` input accepts null, and it has no built-in vertical padding), so whichever of the three merges second has a conflict in that folder that is not caused by this ticket.
- **The wide column** is set in `app.css` (`main:has(> app-admin-layout)`), not in `app.ts`/`app.html`, because the chat branch rewrites those two files for its own wide page. When the chat merges, its per-page `mainClass` could take over, and that rule can go.
- **Left as they were, from the standards review:** the row action's switch is spread over five small files; the two dialogs repeat the register page's form fields and its bio rule; the table's header and cell classes repeat in one template. Each is a judgement call and none is a documented-rule breach worth the churn now.
- **Added at the owner's request (2026-11-22):** the username box searches by itself once the owner has stopped typing for 500 ms (`Debouncer` in `core/timing/`, any later key restarts the wait; Search and Enter still search at once), and the phone navigation button turns its menu icon a quarter turn while the list is open. The same `Debouncer` now also runs the search page's typing (below, ticket 16).
- **The typing pause is 500 ms on both search boxes** (the owner's pick; the spec said 300 ms for `/search` and now says 500 ms). Checked against the real backend: no request while typing 200 ms apart, one request after the pause, the address replaced without history entries, an emptied field clears the list, Enter does not repeat, normal search hides the deleted and deactivated accounts, and the admin box still finds them.
