---
status: proposed
---

# Usage & limits tracks AI agent usage, not a paid plan

Linear's Settings → Administration → Usage & limits shows the workspace's spend on Linear's own AI
features (credits balance, automatic reload, spend limits, analytics by feature, usage history).
Zynox keeps the page in the same place in the navigation and borrows its layout, but gives it a
different purpose: following the token usage and limits of the AI agents the owner intends to run
inside the product. Proposed on 2026-09-29 from `docs/specs/settings-security-api-usage.md`.

## Why

Zynox is an internal tool, not a SaaS with a plan (the owner already removed Billing from the
navigation for this reason). Credits you buy, automatic top-ups and plan tiers have no meaning
here. What does have meaning is knowing how much the agents in the product consume and being able
to cap it. The Linear page is already shaped like that (period, chart by day, history table, limits
with a reset schedule), so the layout carries over and only the subject changes.

## Decision

- The route and nav item stay (`/settings/usage`, "Usage & limits"), and the layout stays close to
  Linear's: summary of limits, analytics for a period, history table, limits and per-user
  overrides.
- Linear's purchase and plan concepts are **not** replicated: no "Add credits", no "Automatic
  reload", no balance.
- The subject is the usage of Zynox's own agents, grouped by agent where Linear groups by feature.

## Not decided here

- The measured unit (tokens versus cost) and whether limits are enforced before or after a call.
- The shape of the usage record and how long it is kept.
- Any implementation. There is no agent runtime to measure yet (the agent chat is a static mock),
  so the page stays a placeholder until the first real model call goes through a single point in
  `apps/api`; those questions are answered then, in the Usage spec.

## Consequences

- Anyone building this page must not copy Linear's credit and billing rows; this ADR is the
  reference for why.
- Every difference from Linear that comes with the real implementation (unit, grouping, limits)
  still needs its own line in the Usage spec, per ADR-0001.
