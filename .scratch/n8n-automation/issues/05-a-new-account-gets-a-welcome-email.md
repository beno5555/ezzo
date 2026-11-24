# 05: A new account gets a welcome email

**What to build:** A person who registers, or whose account an administrator creates, receives a welcome email a moment later. The email is sent by the automation, from a template that can be changed in n8n without rebuilding the backend.

- **The workflow** listens on `account-created`, starting with the same signature check as the exception-alert workflow from ticket 02 (raw body, Crypto node, comparison, `401` or `200`, the work after the answer).
- **The email** is HTML built from a template: a greeting with the username, one or two sentences on what WebCity is for, and a link to WebCity. The product's name and the link's address come from `.env`, because the name may change before the hand-in. The text is English (ADR 0006). n8n's attribution line is off.
- **The sender** is the SMTP credential and the sender's address and name from ticket 02's setup.
- **The checklist** for this workflow is added to the `n8n/` README.

The six emails the backend sends itself do not move and do not change (ADR 0008).

Runs on the owner's machine: it needs Docker running and the SMTP account in n8n's credentials file. This ticket is not done until the owner has run the checklist.

Decisions are under "The six workflows" in `.scratch/n8n-automation/spec.md`.

**Blocked by:** 02 (n8n starts from the repository and sends that failure to Telegram), 04 (The backend tells the automation about new accounts, content and reports)

**Status:** in-progress

**Difficulty:** routine (Opus 5.5 medium): it copies ticket 02's webhook pattern, but no test catches a broken workflow; it is proven only by running it.

- [ ] Registering in the running app delivers the welcome email to that address, with the username, the product's name and a working link
- [ ] An account created by an administrator gets the same email
- [ ] Changing the product's name in `.env` and restarting n8n changes the email, with no change to a workflow file
- [x] A post to the webhook with a wrong signature gets `401` and sends nothing
- [ ] With n8n stopped, registration still succeeds
- [ ] The email carries no n8n attribution line
- [x] The workflow file is committed with a fixed id and no pinned data, and a clean start imports and publishes it beside the first one
- [x] The README's checklist for this workflow is written
- [ ] The owner ran the checklist on their machine

## Known limits from ticket 01

Ticket 01 built the backend's sending side (`EventPublisher`, `docs/backend/automation.md`). These limits of it affect this ticket; the full list is in ticket 01's Comments.

- **A lost event is a lost welcome email.** Someone who registers while n8n is down gets no welcome, and nothing resends it. The only trace is the backend's `Log` row (action `EventPublisher.PublishAsync`, details naming `account-created`, not the user).
- **Answer first.** The backend waits up to 3 seconds for n8n's answer inside the registration request. Respond to Webhook runs straight after the signature check, before the email is sent.
- **Check the signature on the raw body**, as ticket 02 does; parsed and rewritten JSON never matches.

## Comments

- **2026-11-24, built, waiting for the owner's run (Claude).** `n8n/workflows/welcome-email.json` (id `wcWelcomeEmail01`): the ticket 02 signature check, then a Code node that writes the HTML from `$env` (product name, frontend address, sender) with the username escaped, then an Email Send node on the `Ezzo SMTP` credential with the attribution line off. Run against the real n8n: the import log publishes both workflows beside each other; a wrong and a missing signature answer `401`; a right one answers `200` and the run reaches the SMTP node, which fails on the placeholder host (`ENOTFOUND smtp.example.com`), so the Code node ran. No mail was sent: the SMTP entry in `credentials.json` is still a placeholder, which is why the delivery, the second-account, the product-name and the n8n-stopped boxes stay open for the owner's checklist (`n8n/README.md`). The ticket also cannot be closed before 02, which it is blocked by.
