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

**Blocked by:** 07 (The shell gives navigation on a desktop, on a phone and to a guest), 08 (The auth pages)

**Status:** ready-for-agent

**Difficulty:** routine: a paged table, two dialog forms and five confirmed actions, all on existing endpoints and on patterns earlier tickets set.

- [ ] Only an administrator reaches the admin addresses; anyone else is turned away
- [ ] The table shows accounts in every state, and each filter narrows it
- [ ] An administrator creates an account, and it appears in the table
- [ ] An administrator edits an account's profile; a refusal by the server shows beside its field
- [ ] Deactivate, restore and delete each ask first and then change the row's state
- [ ] Granting and removing the administrator role each ask first and then change the row
- [ ] A row offers only the actions that fit its state
- [ ] The admin and account `…Api` methods are unit-tested against the HTTP testing backend, including the state filter sent as text
- [ ] Checked in the running app on a desktop width and on a phone width
