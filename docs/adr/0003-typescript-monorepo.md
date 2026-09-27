# TypeScript on Node in a pnpm monorepo

The back end is TypeScript on Node, in the same repository as the React front, organized as pnpm workspaces: `apps/web` (Vite front), `apps/api` (server), `packages/contract` (API contract and schemas) and `packages/db` (database schema and migrations). One language end to end lets the API contract reach the front as an import, with no code generation. NestJS (too much ceremony for one developer), FastAPI (two languages), Go (no shared types) and Phoenix (niche, strong only at real-time collaboration) were considered and rejected.
