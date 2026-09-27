# Contract-first API with oRPC on Hono

The API is oRPC 1.x mounted on a Hono server, with the contract defined first in `packages/contract` and consumed by the front through oRPC's TanStack Query integration. Hono's own RPC client was rejected because its docs warn that IDE performance degrades as routes grow, and Vyzer will have hundreds of procedures; tRPC would also work, but oRPC adds contract-first definitions and OpenAPI output.
