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
- [ ] Checked in the running app on a desktop width and on a phone width

## Comments

- **Last box left unticked: not checked against the real backend.** The cloud session had no Docker daemon and no `appsettings*.json`, so the backend could not run. The page was driven in the running frontend (`ng serve`) with the API answered by Playwright route handlers, at 360, 768 and 1280 px, in both themes and in Georgian: paging, both filters (the state goes as its name), all five actions with confirmation, the immediate change and the revert with a toast on a refusal, create and edit with the refusal beside the field, the guest and non-administrator turn-aways, and the phone navigation folding away. A run against the real backend on a desktop and a phone width is still to be done by whoever has the backend.
- **Edit is offered for active accounts only.** `GET api/users/{id}` (the profile the dialog is filled from) and `PUT api/users/{id}` both go through the `User` query filter, so the backend cannot read or edit a deactivated account's profile. Restore it first, then edit. Offering it for deactivated accounts needs a backend change: the owner's call.
- **An administrator can act on their own account** from the table (remove their own role, deactivate or delete themself), and their session stays valid until the access token expires. The spec does not mention it; every such action still asks first.
- **Shared with the other branches:** `shared/load-failure/` is copied unchanged from `origin/worktree-post-page`, as asked. The copy on `origin/worktree-chat` differs (its `message` input accepts null, and it has no built-in vertical padding), so whichever of the three merges second has a conflict in that folder that is not caused by this ticket.
- **The wide column** is set in `app.css` (`main:has(> app-admin-layout)`), not in `app.ts`/`app.html`, because the chat branch rewrites those two files for its own wide page. When the chat merges, its per-page `mainClass` could take over, and that rule can go.
- **Left as they were, from the standards review:** the row action's switch is spread over five small files; the two dialogs repeat the register page's form fields and its bio rule; the table's header and cell classes repeat in one template. Each is a judgement call and none is a documented-rule breach worth the churn now.
