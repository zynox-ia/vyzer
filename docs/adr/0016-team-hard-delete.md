---
status: accepted
---

# Deleting a Team is immediate, not a 30-day window

Linear schedules a deleted Team for permanent removal after a 30-day restoration window. Vyzer
deletes it immediately (a hard delete), approved by the owner on 2026-09-28 as part of
`docs/specs/settings-administration.md`.

## Why

A restoration window needs its own retention/undo mechanism — a soft-deleted state, a restore
procedure, a background job to actually purge after 30 days. Nothing in the product depends on
Issues yet (a Team's Issues are exactly what a restore would need to bring back intact), so
building that mechanism now has no real payoff. Deleting a Team already refuses when a Project is
still linked to it (`docs/specs/workspace-team-project.md`), which covers the accidental-deletion
case that matters today.

## Consequences

- `team.delete` removes the row; there is no undo.
- When Issues exist and a Team's deletion becomes a heavier, harder-to-reverse action, revisit
  this ADR and add the restoration window then — this is a sequencing choice, not a rejection of
  Linear's behavior.
