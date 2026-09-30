# Spec: Customize sidebar (painel de Preferences → App sidebar)

## Link do Figma

Sem nó no Figma. Referência ao vivo: `https://linear.app/zynox-dev/settings/account/preferences`,
botão "Customize" na seção "Interface and theme". Capturado nesta sessão via inspeção do DOM
(Traycer browser, sessão `primary`, viewport 1280×800) — registrar em `.figma/` depois da
implementação.

Estrutura confirmada ao vivo (dialog `role="dialog" aria-modal="true"`, 480px de largura, botão de
fechar no canto):

```
Customize sidebar                                    [x]
Default badge style                    [1 Count ▾]

Personal
  ⠿ Inbox                              [Always show ▾]
  ⠿ Reviews                            [Always show ▾]
  ⠿ My issues                          [Always show ▾]
  ⠿ Agent                              [Always show ▾]
  ⠿ Drafts                             [Show when badged ▾]

Workspace
  ⠿ Projects                           [Always show ▾]
  ⠿ Views                              [Always show ▾]
  ⠿ Members                            [Don't show ▾]
  ⠿ Teams                              [Don't show ▾]
```

Confirmado nas opções de cada dropdown:

- "Default badge style": `1 Count` / `Dot`.
- "Inbox" (isolado, único dropdown aberto): `Always show` / `Show when badged` — sem `Don't show`.
- "Drafts" (isolado, único dropdown aberto): `Always show` / `Show when badged` / `Don't show`.
- "Members" (checado com um dropdown adicional já aberto ao fundo — menos confiável):
  `Always show` / `Don't show`.
- Os demais itens (Reviews, My issues, Agent, Projects, Views, Teams) não foram confirmados com
  isolamento total — leituras repetidas contaminaram-se entre si (os dropdowns do Linear não
  fecham com Escape/clique-fora sintéticos, então checagens em sequência acabaram lendo o dropdown
  anterior). Não fabricar certeza aqui: ao implementar, se for relevante manter os mesmos estados
  por item, reconfirmar ao vivo com o dialog reaberto do zero a cada leitura.
- **Reordenar (⠿)**: confirmado — cada linha tem `aria-roledescription="sortable"` e um ícone de
  alça (drag handle) no HTML capturado. É drag-and-drop de verdade, não só cosmético.

## Escopo

Nada fica de fora. Esta entrega cobre a fatia completa — banco, API e tela — e os itens que a
sidebar do Vyzer ainda não tem:

1. Dar função ao botão "Customize" (hoje sem `onClick`, em
   `apps/web/src/features/settings/preferences.tsx`, linha ~113): abre um `Dialog` reproduzindo a
   estrutura capturada acima — "Default badge style" + duas listas (Personal, Workspace) com
   visibilidade por item e reordenação por drag-and-drop.
2. Persistir de verdade a escolha (badge style, visibilidade por item, ordem) e fazer a sidebar
   real (`apps/web/src/layouts/app-shell/sidebar.tsx`) obedecer isso — nada de painel decorativo.
3. Criar os itens que a sidebar do Vyzer ainda não tem, para que o painel listre exatamente os
   nove itens do Linear:
   - **Drafts** (Personal): Vyzer não tem nenhuma noção de "issue não publicada" hoje — não há
     coluna nem tabela para isso em `packages/db/src/schema.ts`. Precisa de infra nova (ver
     "Fatia vertical").
   - **Members** (Workspace): link de sidebar apontando para uma listagem de membros do workspace.
     Verificar se `/settings/members` já serve para isso ou se é uma rota de produto separada
     (Linear trata como item de navegação principal, não só de Settings).
   - **Teams** (Workspace): mesma lógica, para a lista de times do workspace.

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | (a) Tabela nova `memberSidebarPreference` (ou equivalente): `id`, `workspaceId` (FK cascade), `memberId` (FK cascade), `badgeStyle` (enum `count`/`dot`, default `count`), `createdAt`/`updatedAt`. (b) Tabela nova `sidebarItemPreference`: `id`, `memberSidebarPreferenceId` (FK cascade) **ou** direto `memberId`, `itemKey` (enum/text: `inbox`, `reviews`, `my-issues`, `agent`, `drafts`, `projects`, `views`, `members`, `teams`), `visibility` (enum `always`/`when-badged`/`hidden`), `sortOrder` (integer), unique em `(memberId, itemKey)` — seguir o padrão de `sortOrder`/`check` já usado em `issue` (schema.ts:478,488). (c) Tabela nova `issueDraft` para o item "Drafts": `id`, `workspaceId` (FK cascade), `creatorId` (FK `member`), `teamId` (FK `team`, nullable — time ainda não escolhido), `title`, `description`, `createdAt`, `updatedAt`. Publicar o draft cria uma linha real em `issue` (com `number`/`statusId` definidos nesse momento) e apaga o draft — não reaproveitar a tabela `issue` diretamente pra draft, porque `teamId`/`statusId` são `notNull` lá hoje. |
| API    | `packages/contract` + `apps/api`: endpoints para ler/gravar as preferências de sidebar do membro logado (badge style, visibilidade e ordem por item) e CRUD de `issueDraft` (criar, listar do membro, atualizar, publicar, descartar). Seguir o padrão oRPC já usado pelos outros routers de Settings.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Tela   | `PreferencesPage`: painel "Customize" via `Dialog`, lendo/gravando pela API (TanStack Query) em vez de `useState` local. `sidebar.tsx`: os itens existentes (Inbox, Reviews, My issues, Agent, Projects, Views) passam a checar a preferência persistida antes de renderizar/esconder, e ganham a ordem salva. Dois itens novos de sidebar: "Drafts" (Personal) e "Members"/"Teams" (Workspace), cada um com sua rota/lista mínima viável (reaproveitando telas de Settings existentes quando fizer sentido, sem duplicar).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

## Comportamento

- Botão "Customize" abre o `Dialog` (reaproveitar `packages/design-system/src/components/dialog.tsx`,
  já com `backdrop-blur-sm` no overlay). Fecha via "x", `Escape` e clique fora — padrão do `Dialog`.
- Cada linha: alça de arrastar + ícone (14px, mesmo token da sidebar) + label + `Select` de
  visibilidade (`trigger="button"`, `h-control-sm`/`text-body-sm` — o caso de uso que o componente
  já documenta como "Display Options").
- Arrastar uma linha reordena o item dentro do mesmo grupo (Personal ou Workspace) e persiste a
  nova ordem ao soltar.
- Mudar o `Select` de visibilidade grava imediatamente (sem botão "Salvar" — mesmo padrão dos
  outros toggles/selects de Preferences) e reflete na sidebar real sem precisar recarregar a
  página.
- "Default badge style" no topo, mesma estrutura de `Select`, também persistido.

## Estados

- Padrão: todos os itens existentes em "Always show", na ordem atual do código
  (`sidebar.tsx`); "Drafts"/"Members"/"Teams" entram com o padrão mais razoável dentro da lógica
  acima (ex.: "Members"/"Teams" como "Don't show" por padrão, espelhando o Linear).
- Vazio: lista de Drafts vazia mostra o padrão de empty state já usado em outras listas do Vyzer
  (reaproveitar, não criar um novo).
- Carregando: skeleton/spinner padrão do DS enquanto a preferência ainda não carregou da API.
- Erro: toast padrão do DS se a gravação falhar (reaproveitar o padrão de erro já usado em outras
  mutações de Settings).
- Hover/foco/aberto-fechado do `Select` e do `Dialog`: herdados dos componentes existentes.

## Critérios de aceite

- [ ] Botão "Customize" abre o `Dialog` com "Default badge style" + Personal (Inbox, Reviews, My
      issues, Agent, Drafts) + Workspace (Projects, Views, Members, Teams) — os nove itens.
- [ ] Visibilidade e badge style persistem de verdade (API + banco) por membro.
- [ ] Reordenar por drag-and-drop persiste a ordem.
- [ ] A sidebar real (`sidebar.tsx`) respeita a visibilidade e a ordem salvas para todos os itens.
- [ ] "Drafts": existe uma forma de salvar uma issue como rascunho (sem time/status definidos),
      listá-los, retomar e publicar (vira uma `issue` real nesse momento).
- [ ] "Members" e "Teams" existem como itens de sidebar navegáveis (rota real, não só o link no
      painel).
- [ ] Só usa componentes e tokens já existentes no design system — nenhuma prop nova, nenhum valor
      hardcoded.
- [ ] Acessível por teclado (tab entre selects e alças, `Escape` fecha o dialog, foco visível); a
      reordenação por drag-and-drop também precisa de um caminho por teclado (padrão de
      dnd-kit/Radix já usado no projeto, se houver, ou o mais próximo disso).
- [ ] `pnpm check` e `pnpm build` sem avisos.

## Fora do escopo

- Novo token, cor ou variante de componente — se faltar algo no design system durante a
  implementação, parar e perguntar (regra do projeto), não inventar.
- Qualquer coisa em `Code theme`/`Font` (linhas vizinhas em Preferences) — fora do painel Customize.
