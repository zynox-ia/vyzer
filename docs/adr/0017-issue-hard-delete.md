---
status: accepted
---

# Deleting an Issue is immediate, not a 30-day window

Vyzer permanently deletes an Issue and its Activity events when a Member deletes it. Linear keeps deleted Issues recoverable for 30 days; implementing that window requires soft deletion, restore behavior and a purge scheduler. The owner approved hard delete in D4 of `docs/specs/issue-workflow.md`.
