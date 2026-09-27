# Vyzer: regras do projeto

Fonte única das regras para qualquer agente ou pessoa trabalhando aqui.

Stack: Vite + React 19 + TypeScript (strict) + Tailwind v4 + React Router + TanStack Query + Radix (`radix-ui`) + cmdk. Gerenciador: pnpm. Alias `@/` aponta para `src/`.

## Regras inegociáveis

1. **Figma é a fonte da verdade.** Todo valor visual (cor, espaço, raio, tipografia, sombra, ícone) vem do Figma via MCP. Na dúvida, consulte o nó; nunca invente.
2. **Nada hardcoded.** Sem hex, rgb, px, sombras ou durações fixos em componentes. Se faltar token para um valor do Figma, pare e pergunte.
3. **Só tokens semânticos em componentes.** Componentes usam tokens semânticos (ex.: `bg-surface`, `text-muted`), nunca primitivos (ex.: `gray-500`).
4. **Escopo estrito.** Implemente só o que a tarefa pede. Nada de refatorar, renomear ou "melhorar" o que está fora dela; anote e pergunte.
5. **Sem dependências novas sem consulta.** Qualquer `pnpm add` precisa de aprovação prévia.
6. **Radix para primitivos interativos.** Dialog, popover, menu, tooltip, select, tabs etc. vêm de `radix-ui`; paleta de comandos usa `cmdk`. Não recrie comportamento de acessibilidade à mão.
7. **Services assíncronos em `src/services/` chamando a API real, consumidos via TanStack Query.** Componentes não conhecem a origem dos dados.
8. **Estado de filtros na URL.** Filtros, ordenação, busca e aba ativa ficam em search params (React Router), não em estado local.

## Organização

- `src/components/ui`: primitivos reutilizáveis. Reaproveite antes de criar.
- `src/layouts`, `src/features`: só apresentação e composição.
- `src/services`: acesso a dados (mocks por enquanto).
- `src/styles`: tokens e estilos globais.
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

- `pnpm dev`: Vite em http://localhost:3000 (ou http://vyzer.localhost via Traefik).
- `pnpm build`: checagem de tipos + build de produção.
- `pnpm check`: formatação (oxfmt), lint (oxlint) e tipos (tsc).
- `pnpm fix`: corrige formatação e lint automaticamente.
- `docker compose up -d`: Traefik, Postgres e Redis. Veja `infra/README.md`.
