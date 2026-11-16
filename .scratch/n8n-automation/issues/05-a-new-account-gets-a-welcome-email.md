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

**Status:** ready-for-agent

**Difficulty:** routine (Opus 5.5 medium): it copies ticket 02's webhook pattern, but no test catches a broken workflow; it is proven only by running it.

- [ ] Registering in the running app delivers the welcome email to that address, with the username, the product's name and a working link
- [ ] An account created by an administrator gets the same email
- [ ] Changing the product's name in `.env` and restarting n8n changes the email, with no change to a workflow file
- [ ] A post to the webhook with a wrong signature gets `401` and sends nothing
- [ ] With n8n stopped, registration still succeeds
- [ ] The email carries no n8n attribution line
- [ ] The workflow file is committed with a fixed id and no pinned data, and a clean start imports and publishes it beside the first one
- [ ] The README's checklist for this workflow is written
- [ ] The owner ran the checklist on their machine
