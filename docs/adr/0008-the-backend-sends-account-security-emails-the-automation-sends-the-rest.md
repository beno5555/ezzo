# The backend sends every email about an account's security, and the automation sends the rest

The document sent to the academy says n8n sends every transactional email. We split them instead, so that each email has exactly one sender. The backend sends, itself and through MailKit, every email that carries a secret or tells a user that access to their account changed: the password reset request, the reactivation request, "someone tried to register with your email", "your password was reset", account deactivated and account reactivated. The automation sends the welcome email, the digest, birthday emails and the moderation email to administrators. The reason is that an event reaches the automation in a single attempt, so an email sent there can be lost while n8n is down, and n8n stores the data of what it runs; neither is acceptable for an email a user needs in order to keep or recover their account.

## Considered Options

- **The automation sends every email**: what the document describes, with one look and one SMTP configuration. Rejected, because a raw reset token would leave the backend for the first time, and a password reset would stop working whenever n8n is down.
- **Both can send the same email, with MailKit as the fallback**: rejected. Two senders need two copies of every text, and a fallback runs only when something is already broken, so it is the least tested code at the moment it matters.
- **Only emails that carry a token stay in the backend**: rejected by the owner. A notice that a password was reset or an account was deactivated carries no token, but it is how a user learns that someone else acted on their account, so it must not be lost either.

## Consequences

- No event sent to the automation may carry a token, a password or any other secret.
- A new email is placed by the same rule: if losing it could cost a user their account, or it carries a secret, the backend sends it.
- There are two SMTP configurations (the backend's settings and n8n's credential, which may use the same account) and two looks: the backend's emails stay plain, the automation's use templates.
- Of the emails the document lists under n8n, only the welcome email goes through it. The owner accepted this on 2026-11-16: the document commits to features, not to how each is built.
