# Real-time via SSE invalidation, no sync engine

Clients keep one Server-Sent Events connection per Workspace; when data changes, the server emits which entity changed and the client invalidates the affected TanStack Query queries. Mutations use optimistic updates so the UI responds immediately. This is not Linear's local-first sync engine: changes from other people arrive after a refetch, not instantly.

Sync engines (Zero, ElectricSQL, PowerSync) were considered and deferred, with no spike now. The decision is revisited only if there is real discomfort with performance, after Issue and Project are in use.
