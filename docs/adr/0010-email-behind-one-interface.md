# Email sending behind one interface: Mailpit in dev, Brevo in production

The API sends email through a single interface with two adapters: in development, SMTP to a Mailpit container that captures messages without delivering them; in production, Brevo's transactional email API called over plain HTTP, with no SDK, using `BREVO_API_KEY`. Better Auth (login codes, invitations) only sees the interface, so switching providers touches one adapter.

## Consequences

Domain authentication for the sending domain (SPF, DKIM, DMARC) is not configured yet. It must be done in the deploy phase, before production email is enabled, or messages will land in spam.
