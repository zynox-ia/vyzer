# Vyzer: regras do projeto

Fonte única das regras para qualquer agente ou pessoa trabalhando aqui.

Monorepo pnpm (ADR-0003). Front (`apps/web`): Vite + React 19 + TypeScript (strict) + Tailwind v4 + React Router + TanStack Query + Radix (`radix-ui`) + cmdk. Back-end (`apps/api`): Node + Hono + oRPC, Drizzle, Better Auth (ADRs 0004 a 0006). Gerenciador: pnpm. No front, o alias `@/` aponta para `apps/web/src/`.

## Regras inegociáveis

1. **Figma é a fonte da verdade.** Todo valor visual (cor, espaço, raio, tipografia, sombra, ícone) vem do Figma via MCP. Na dúvida, consulte o nó; nunca invente.
2. **Nada hardcoded.** Sem hex, rgb, px, sombras ou durações fixos em componentes. Se faltar token para um valor do Figma, pare e pergunte.
3. **Só tokens semânticos em componentes.** Componentes usam tokens semânticos (ex.: `bg-surface`, `text-muted`), nunca primitivos (ex.: `gray-500`).
4. **Escopo estrito.** Implemente só o que a tarefa pede. Nada de refatorar, renomear ou "melhorar" o que está fora dela; anote e pergunte.
5. **Sem dependências novas sem consulta.** Qualquer `pnpm add` precisa de aprovação prévia.
6. **Radix para primitivos interativos.** Dialog, popover, menu, tooltip, select, tabs etc. vêm de `radix-ui`; paleta de comandos usa `cmdk`. Não recrie comportamento de acessibilidade à mão.
7. **Services assíncronos em `apps/web/src/services/` chamando a API real, consumidos via TanStack Query.** Componentes não conhecem a origem dos dados.
8. **Estado de filtros na URL.** Filtros, ordenação, busca e aba ativa ficam em search params (React Router), não em estado local.

## Design system

- O Vyzer Design System (`packages/design-system`, documentado em `/design-system`) é a fonte da verdade visual. Telas do produto usam **somente** seus tokens e componentes.
- A skill `vyzer-ui-design` (`.claude/skills/vyzer-ui-design/SKILL.md`) é usada **apenas** para criar, alterar ou revisar o próprio design system. Não é consultada para construir telas.
- Se uma tela precisar de algo que o design system não tem, não improvise na tela: proponha a adição ao design system, aguarde aprovação e só então use.
- As ADRs têm precedência sobre a skill.

## Organização

- `apps/web`: o front. Caminhos abaixo relativos a `apps/web/`:
  - `src/components/ui`: primitivos reutilizáveis. Reaproveite antes de criar.
  - `src/layouts`, `src/features`: só apresentação e composição.
  - `src/services`: acesso a dados, chamando a API.
  - `src/features/design-system`: documentação do design system (rota `/design-system`, só em desenvolvimento).
- `packages/design-system`: tokens, estilos globais, ícones e componentes (`@vyzer/design-system`).
- `apps/api`: servidor da API.
- `packages/contract`: contrato da API, compartilhado entre `apps/api` e `apps/web`.
- `packages/db`: schema do banco e migrations.
- `docs/specs`: uma spec por feature, a partir de `docs/specs/TEMPLATE.md`.
- `.figma/`: notas de implementação por parte validada (node-id, tokens, divergências).

## Fluxo de trabalho

1. **Spec**: copie `docs/specs/TEMPLATE.md`, preencha com o link do nó do Figma e peça aprovação.
2. **Implementar** conforme a spec aprovada.
3. **Revisão em contexto limpo**: um revisor sem o histórico da implementação compara o resultado com o Figma (subagente `figma-fidelity-reviewer`) e classifica achados como bloqueante ou menor.
4. **Corrigir os bloqueantes.**
5. **Validação do responsável** (humano) no navegador.
6. **Commit** só depois da validação.

Mudança pequena (ajuste pontual, correção de bug, config) dispensa spec, mas segue os passos 4 a 6.

## Definição de pronto

- Bate com o nó do Figma em todos os estados da spec (padrão, hover, foco, vazio, carregando, erro).
- Nenhum valor visual fora dos tokens; nenhum primitivo em componente.
- Acessível por teclado, com foco visível.
- `pnpm check` e `pnpm build` passam sem avisos.
- Revisão sem bloqueantes em aberto e validada pelo responsável.

## Comandos

Todos rodam na raiz e cobrem os pacotes do monorepo.

- `pnpm dev`: Vite (porta 3000) e API (porta 3001) juntos; use http://vyzer.localhost via Traefik.
- `pnpm db:generate`: gera a migration SQL a partir do schema (`packages/db`).
- `pnpm db:migrate`: aplica as migrations pendentes.
- `pnpm build`: checagem de tipos + build de produção de cada pacote.
- `pnpm check`: formatação (oxfmt), lint (oxlint) e tipos (tsc) de todos os pacotes.
- `pnpm fix`: corrige formatação e lint automaticamente.
- `pnpm test`: Vitest (unitários em Node; design system e páginas de `/design-system` num Chromium real, com axe-core).
- `docker compose up -d`: Traefik, Postgres e Redis. Veja `infra/README.md`.
