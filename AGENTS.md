## Engineering Principles

### Think Before Coding
- Understand the relevant code before modifying it.
- Identify assumptions, dependencies and potential regressions.
- Surface meaningful ambiguities and technical tradeoffs.
- Challenge unnecessarily complex or unsafe approaches.
- Ask for clarification only when a decision cannot be safely inferred.

### Simplicity First
- Implement the smallest complete solution.
- Prefer existing patterns and components.
- Avoid speculative features, unnecessary abstractions and premature configurability.
- Keep code maintainable without introducing additional complexity.

### Surgical Changes
- Change only what the requested outcome requires.
- Preserve unrelated behavior, formatting and architecture.
- Do not refactor adjacent code without a clear dependency.
- Remove artifacts made obsolete by your own changes.
- Keep diffs focused and reviewable.

### Goal-Driven Execution
- Establish observable success criteria before implementation.
- Implement, verify and correct until the criteria are satisfied.
- Prefer automated tests for testable behavior.
- Validate UI changes against approved visual references.
- Never claim completion without evidence.
- Report unresolved issues or verification limitations.

### Execution Policy
- Default to direct implementation.
- Use subagents only when isolation, specialization or parallelism offers a measurable benefit.
- Do not require specs, tickets or planning documents for routine development.
- Apply verification proportional to the risk and scope.
- Escalate destructive, irreversible or product-defining decisions for approval.

## Project Context

Zynox is a management platform modelled on Linear's concepts (see `CONTEXT.md`, `docs/adr/`). pnpm monorepo: `apps/web` (Vite, React 19, TypeScript strict, Tailwind v4, React Router, TanStack Query, Radix, cmdk), `apps/api` (Hono, oRPC, Drizzle, Better Auth), `packages/design-system`, `packages/contract`, `packages/db`. In the web app `@/` maps to `apps/web/src/`.

- The design system (`packages/design-system`) is the source of truth for UI; Figma is a visual reference. Screens use only its tokens and components. No hardcoded hex/px/shadows/durations; semantic tokens only. Missing token or component: propose it, do not improvise.
- Radix for interactive primitives, `cmdk` for the command palette. No new dependencies without approval.
- Data goes through `apps/web/src/services/` + TanStack Query. Filters, sorting, search and active tab live in URL search params.
- Never run destructive database operations or touch `.env` secrets. No commits, merges or pushes without explicit approval.
- Verify with `pnpm check` (format, lint, types), `pnpm test` and `pnpm build`, scoped to what changed.

## Agents and Models

Primary works alone by default; delegate only when it measurably helps. Task size decides: QUICK = Primary only, check affected parts. STANDARD = Explorer if isolated investigation saves context; Reviewer if regression risk is significant. CRITICAL = investigate dependencies first, independent review, impact-sized checks, ask before destructive or product-defining steps.

| Role     | Does                                                              | Access    | Claude Code (`.claude/agents/`)                                            | Codex (`.codex/agents/`)   |
| -------- | ----------------------------------------------------------------- | --------- | -------------------------------------------------------------------------- | -------------------------- |
| Primary  | Implements, integrates, verifies                                  | Full      | Sonnet 5.5; Opus 5.5 only for critical architecture or persistent failures | `gpt-5.6-luna`             |
| Explorer | Locates code, traces flows, finds impact and bug causes           | Read-only | Haiku 5.5 by default; pass `model: sonnet` or `opus` per call when harder  | `gpt-5.6-luna`, low effort |
| Reviewer | Finds real regressions, logic and security defects, missing tests | Read-only | Sonnet 5.5; pass `model: opus` for critical reviews                        | `gpt-5.6-luna`, max effort |

- Do not escalate a model just because many files are involved. Never swap a requested model silently.
- Claude Code and Codex do not call each other; there is no cross-CLI integration. Use each runtime's own agents.
- Primary fixes what Reviewer reports. `figma-fidelity-reviewer` is the separate visual-fidelity check for UI work.
- Skills (installed globally, in `~/.agents/skills`): `diagnosing-bugs`, `codebase-design`, `tdd` (only for testable behavior), `code-review`, `prototype`.
