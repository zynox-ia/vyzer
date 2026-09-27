# Workspace isolation enforced by mandatory API middleware

Every API procedure runs behind a middleware that resolves the active Workspace from the session and scopes all data access to it; a procedure cannot reach Workspace data without it. Each procedure has an authorization test proving that another Workspace's data (and, for Guests, other Teams' data) is unreachable. Postgres row-level security is not used now; it stays available as an extra layer of defense later.

## Consequences

Isolation depends on application code, so a procedure without its authorization test is treated as unfinished.
