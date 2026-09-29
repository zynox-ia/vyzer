---
status: accepted
---

# Defer authentication; fixed workspace/member context for now

The owner decided (2026-09-28) to start real backend and screen implementation before
authentication: Vyzer is internal-only for now, and a login barrier adds no value yet. Better
Auth (ADR-0006) and the session-based Workspace middleware (ADR-0007) are still the target
design — this ADR only sequences them after the domain, not away.

## Decision

- No login screen, no session, no Better Auth wiring yet.
- One seed migration creates exactly one Workspace ("Zynox") and one Member (the owner, Role
  `admin`). Their ids are fixed, known constants (`packages/db/src/seed.ts`), not generated at
  request time.
- The API middleware that ADR-0007 requires still exists and still runs on every procedure —
  it just resolves the active Workspace/Member from those fixed constants instead of from a
  session. The procedure code, the workspace-scoping shape and the authorization tests are
  written exactly as ADR-0007 describes; only the one function that resolves "who is asking"
  is a stand-in.
- No Guest role, no invitations, no multi-workspace switch: out of scope while there is one
  Workspace and one Member.

## Why a stand-in instead of skipping the middleware

Writing every procedure as if a session already existed — and swapping only the resolver
function later — costs nothing now and avoids a second pass over every procedure when auth
lands. The alternative (procedures that trust a `workspaceId` passed by the client) would have
to be rewritten, and their authorization tests thrown away, the day login is added.

## Consequences

- `apps/web` never shows a login screen or reads a session; `useCurrentMember`/equivalent always
  resolves to the seeded Member.
- The day Better Auth is wired in, only the resolver function and the seed migration change;
  ADR-0006 and ADR-0007 apply unmodified.
- Until then, there is no real access control: anyone who can reach the API reaches the one
  Workspace's data. Acceptable for an internal, single-tenant tool; revisit before any external
  or multi-tenant use.
