# Vyzer: regras do projeto

Fonte única das regras para qualquer agente ou pessoa trabalhando aqui.

Monorepo pnpm (ADR-0003). Front (`apps/web`): Vite + React 19 + TypeScript (strict) + Tailwind v4 + React Router + TanStack Query + Radix (`radix-ui`) + cmdk. Design system (`packages/design-system`, ADR-0013): tokens, componentes e ícones, documentados no Storybook. Back-end (`apps/api`): Node + Hono + oRPC, Drizzle, Better Auth (ADRs 0004 a 0006). Gerenciador: pnpm. No front, o alias `@/` aponta para `apps/web/src/`.

## Regras inegociáveis

1. **Figma é a fonte da verdade.** Todo valor visual (cor, espaço, raio, tipografia, sombra, ícone) vem do Figma via MCP. Na dúvida, consulte o nó; nunca invente.
2. **Nada hardcoded.** Sem hex, rgb, px, sombras ou durações fixos em componentes. Se faltar token para um valor do Figma, pare e pergunte.
3. **Só tokens semânticos em componentes.** Componentes usam tokens semânticos do design system (ex.: `bg-panel`, `text-secondary`, `border-control`), nunca primitivos (`--vz-*`). As escalas padrão do Tailwind não existem.
4. **Escopo estrito.** Implemente só o que a tarefa pede. Nada de refatorar, renomear ou "melhorar" o que está fora dela; anote e pergunte.
5. **Sem dependências novas sem consulta.** Qualquer `pnpm add` precisa de aprovação prévia.
6. **Radix para primitivos interativos.** Dialog, popover, menu, tooltip, select, tabs etc. vêm de `radix-ui`; paleta de comandos usa `cmdk`. Não recrie comportamento de acessibilidade à mão.
7. **Services assíncronos em `apps/web/src/services/` chamando a API real, consumidos via TanStack Query.** Componentes não conhecem a origem dos dados.
8. **Estado de filtros na URL.** Filtros, ordenação, busca e aba ativa ficam em search params (React Router), não em estado local.

## Organização

- `packages/design-system` (`@vyzer/design-system`): tokens (`src/styles`), componentes (`src/components/<Nome>/`, cada um com `.tsx` e `.stories.tsx`), ícones (`src/icons`) e páginas de Foundations e QA. Reaproveite antes de criar; componente reutilizável nasce aqui, não no app.
- `apps/web`: o front. Caminhos abaixo relativos a `apps/web/`:
  - `src/layouts`, `src/features`: só apresentação e composição, usando o design system.
  - `src/services`: acesso a dados, chamando a API.
- `apps/api`: servidor da API.
- `packages/contract`: contrato da API, compartilhado entre `apps/api` e `apps/web`.
- `packages/db`: schema do banco e migrations.
- `docs/specs`: uma spec por feature, a partir de `docs/specs/TEMPLATE.md`.
- `.figma/`: notas de implementação por parte validada (node-id, tokens, divergências).

## Fluxo de trabalho

1. **Spec**: copie `docs/specs/TEMPLATE.md`, preencha com o link do nó do Figma e peça aprovação.
2. **Implementar** conforme a spec aprovada.
3. **Revisão em contexto limpo**: um revisor sem o histórico da implementação compara o resultado com o Figma e com o Storybook (subagente `figma-fidelity-reviewer`) e classifica achados como bloqueante ou menor.
4. **Corrigir os bloqueantes.**
5. **Validação do responsável** (humano) no navegador.
6. **Commit** só depois da validação.

Mudança pequena (ajuste pontual, correção de bug, config) dispensa spec, mas segue os passos 4 a 6.

## Definição de pronto

- Bate com o nó do Figma em estrutura e medidas, e com os tokens do design system em cor, em todos os estados da spec (padrão, hover, foco, vazio, carregando, erro), nos dois temas.
- Nenhum valor visual fora dos tokens; nenhum primitivo em componente.
- Acessível por teclado, com foco visível.
- `pnpm check`, `pnpm test`, `pnpm build` e `pnpm build-storybook` passam sem avisos.
- Revisão sem bloqueantes em aberto e validada pelo responsável.

## Comandos

Todos rodam na raiz e cobrem os pacotes do monorepo.

- `pnpm dev`: Vite (porta 3000) e API (porta 3001) juntos; use http://vyzer.localhost via Traefik.
- `pnpm db:generate`: gera a migration SQL a partir do schema (`packages/db`).
- `pnpm db:migrate`: aplica as migrations pendentes.
- `pnpm build`: checagem de tipos + build de produção de cada pacote.
- `pnpm test`: Vitest (projeto Node para pacotes e API; projeto Storybook que roda cada story num Chromium com checagem de acessibilidade).
- `pnpm storybook`: documentação do design system em http://localhost:6006.
- `pnpm build-storybook`: build estático do Storybook.
- `pnpm check`: formatação (oxfmt), lint (oxlint) e tipos (tsc) de todos os pacotes.
- `pnpm fix`: corrige formatação e lint automaticamente.
- `docker compose up -d`: Traefik, Postgres e Redis. Veja `infra/README.md`.
