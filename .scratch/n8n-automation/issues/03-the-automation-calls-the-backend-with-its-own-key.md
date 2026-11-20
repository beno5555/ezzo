# 03: The automation calls the backend with its own key and can only raise a moderation status

**What to build:** The automation can flag or hide a post or a comment by calling the two moderation routes with its API key, and it can do nothing else with that key. An administrator's use of the same routes does not change.

- **The key.** A request carries it in the `X-Api-Key` header. A second authentication scheme, beside the JWT scheme, recognises it. The key is one setting, compared in constant time. When no key is configured the scheme refuses every caller: an empty key never matches.
- **No `User` row.** The automation has no id, no username and no role an administrator could grant.
- **What the key opens.** The two moderation routes accept an administrator or the automation. Every other existing route ignores the key, so a request that carries only the key gets `401`. This ticket also defines the rule for routes under `/api/internal` (only the key; anyone else, an administrator included, gets `401`), which tickets 08 and 11 apply to the first such routes.
- **Raise only.** The automation may set Flagged or Hidden. It is refused, with `403` and the failure envelope, when it sends Visible, or sends Flagged for content that is Hidden. Setting the status the content already has succeeds and changes nothing. Content that does not exist answers `404`. The moderation service is told that the caller is the automation, the way services are already told that a caller is an administrator.
- **Rate limits.** The automation's requests are counted in one bucket of their own, not by IP.
- **Logs.** A `Log` row for something the automation did has no user id, is marked as an authorized request, and names the automation in its details. Today a row without a user id is marked unauthorized, so the database logger changes.
- **A test helper** sends a request with the test host's API key, for this ticket and the later ones.

Decisions are under "The automation's identity" and "Moderation by the automation" in `.scratch/n8n-automation/spec.md`.

**Blocked by:** None (can start immediately). It needs none of 02's code; the owner lifted the block on 2026-11-21, so it runs as a local lane beside 02.

**Status:** ready-for-agent

**Difficulty:** tricky: a second authentication scheme and an authorization boundary, where a mistake opens every route to a leaked key.

- [ ] With the key, each moderation route sets Flagged and Hidden on Visible content, and Hidden on Flagged content
- [ ] With the key, Visible is refused with `403` whatever the current status, and Flagged is refused for Hidden content; the status is unchanged afterwards (tested as a table of from-status, to-status and caller)
- [ ] With the key, setting the status the content already has succeeds
- [ ] An administrator still sets any of the three statuses on both routes; an ordinary user and a guest are still refused
- [ ] A wrong key, an empty key and a missing key are refused on the moderation routes
- [ ] The key alone gets `401` on a sample of ordinary routes and of administrator routes, including account deactivation, deletion and granting the administrator role
- [ ] A host with no key configured refuses a request that sends an empty key
- [ ] The automation's requests do not share a rate-limit bucket with requests from the same IP
- [ ] The `Log` row for the automation's change has no user id, is marked authorized and names the automation; rows for users and for background jobs are written as before
- [ ] `docs/backend/auth.md` describes the second scheme and what the key opens; `automation.md` and `controllers.md` describe the raise-only rule; the settings list in `CLAUDE.md` names the key setting
- [ ] The full suite passes, and its `Duration` is recorded in this ticket's comments

## Comments

- **2026-11-21, running beside 02 (owner).** Ticket 02 runs at the same time in another local lane. Where the two meet:
  - **The setting's name is `AutomationApi:Key`.** This ticket defines it (an options class with that section), and 02's setup script writes the generated key into `appsettings.Development.json` under that name. Do not pick another name: git will not flag the mismatch, and the key would never be read.
  - **Shared files.** Both lanes may edit `docs/backend/automation.md`, `CLAUDE.md` (Config prerequisites) and `README.md`. Keep both sides on a conflict. 02 owns everything under `n8n/`; this ticket owns the backend's authentication, the moderation service and the database logger.
