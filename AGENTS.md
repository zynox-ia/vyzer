# Vyzor: guia de desenvolvimento

Stack: Vite + React 19 + TypeScript (strict) + Tailwind v4 + React Router. Gerenciador: pnpm.

## Comandos

- `pnpm dev` (porta 3000), `pnpm build`, `pnpm check` (format, lint, types), `pnpm fix`

## Regras de design → código

- O Figma (via MCP) é a única fonte de valores visuais.
- Todo valor visual é token em `src/styles/tokens.css` (`@theme`). Sem hex, px ou sombras fixos em componentes.
- Se faltar token para um valor do Figma, parar e perguntar.
- Só camada de apresentação em `components/`, `layouts/` e `features/`. Dados via `services/`.
- Reaproveitar componentes de `components/ui` antes de criar novos.
- Alias `@/` aponta para `src/`.
