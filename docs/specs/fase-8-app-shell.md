# Spec: Fase 8 do Design System — App Shell

Issue: [VYZ-35](https://linear.app/zynox-dev/issue/VYZ-35/fase-8-app-shell), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-35-fase-8-app-shell`, a partir de `vyz-34-fases-4-5-e-6-feedback-dados-e-command-menu`, depois do commit da VYZ-34.

**Aprovada pelo responsável em 28/09, com as recomendações da seção de decisões. A exceção é a decisão 1: `Ctrl+I` entra junto com `]`.**

## Como usar o Figma nesta entrega

O Figma é **referência visual geral**, não medida nó a nó (decisão do responsável, 28/09, já registrada em `docs/specs/fases-4-5-6-feedback-dados-comando.md`):

- O que já existe no design system é reutilizado (Menu, Avatar, Counter, IconButton, Button, Tabs, Dialog, ListGroup recolhível da Fase 5, CommandMenu da Fase 6).
- O que não tem frame, o agente desenha a partir do visual já implementado: tokens, relevo, foco de campo, hover por camada, menus para baixo.
- Não se cria prop nova só para bater um pixel.
- Em `.figma/`, uma linha por peça, só quando a divergência for relevante.

### Nós antigos do mapa da Fase 8: o que ainda existe

O Figma foi reorganizado em 28/09 (ver `mapa-figma-fases`, seção "Reorganização do Figma"). Conferido nesta sessão com `get_metadata` e `get_screenshot`:

| Nó antigo         | O que era                                    | Existe hoje?                                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `1:6569`          | Sidebar (Navbar)                             | **Sim** — dentro da seção Components (`27:6905`). Bate com o Linear ao vivo (Inbox, Reviews, My issues, Agent; Workspace: Projects/Views/More; Your teams: Zynox → Home/Issues/Projects/Views; Try: Invite people/Initiatives/Cycles/Connect Cursor/Connect Codex) |
| `1:6795`, `6:5`   | Top bar (nós dedicados)                      | **Não** — removidos. O padrão de top bar continua visível dentro das telas completas (`25:5446`, `1:4813` etc.) e em `1:5931` (Project Details), mas não como componente isolado                                                                                   |
| `1:5931`          | Top bar (Project Details: breadcrumb + abas) | **Sim**                                                                                                                                                                                                                                                            |
| `1:5937`–`1:5958` | Breadcrumbs                                  | **Sim** — dentro de `1:5931`                                                                                                                                                                                                                                       |
| `1:5988`          | Abas (Overview / Activity / Issues)          | **Sim** — dentro de `1:5931`                                                                                                                                                                                                                                       |
| `1:6113`          | Painel direito (Project sidebar)             | **Sim**, ~396–400 px, com seções recolhíveis Properties / Milestones / Progress / Activity                                                                                                                                                                         |
| `1:6112`          | Scrim do painel direito                      | **Praticamente vazio** — o nó existe mas é um container de 0×0; não há desenho de scrim hoje                                                                                                                                                                       |
| `13:2062`         | Settings ("General")                         | **Não** — removido. O Figma tem hoje uma área de Settings inteiramente nova (`33:20122` em diante, ver abaixo)                                                                                                                                                     |

### Referências novas usadas nesta spec

| Área                                                        | Nós                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sidebar do workspace                                        | `27:6905` → `1:6569` (Navigation)                                                                                                                                                                                                                                 |
| Telas completas com o shell montado                         | `25:5446` (Projects), `1:4813` (Projects, versão anterior), `1:5929` (Mv School › Overview)                                                                                                                                                                       |
| Top bar + painel direito (Project Details)                  | `1:5931` (Header), `1:6113` (Sidebar), `1:6112` (scrim, vazio)                                                                                                                                                                                                    |
| Inbox (mestre-detalhe)                                      | `27:19467` → `27:17223` (lista + detalhe), `27:17787` (painel de chat do agente)                                                                                                                                                                                  |
| Reviews (mestre-detalhe)                                    | `27:17222` → `27:7481`                                                                                                                                                                                                                                            |
| My issues                                                   | `38:2`                                                                                                                                                                                                                                                            |
| Settings — nav + slot                                       | `33:20122` (Preferences, nav) e `33:20615` (Preferences, conteúdo)                                                                                                                                                                                                |
| Settings — exemplos de página (fora do escopo desta fase)   | `33:21592` (Profile), `33:21702` (Notifications), `33:22310` (Code & reviews), `33:22986` (Security & access), `33:23373` (Connected accounts), `33:23548` (Agent personalization), e dezenas de outras (Labels, Templates, SLAs, Statuses, Members, Teams, API…) |
| Menu "/" (referência de atalhos, já implementado na Fase 6) | `1:4653`                                                                                                                                                                                                                                                          |

## Escopo

Camada de layout (`apps/web/src/layouts`, conforme AGENTS.md: sidebar e painel são layout, não componente de DS). Peças reutilizáveis novas, se precisarem existir, vão para o DS.

**1. Sidebar do workspace** — `27:6905` → `1:6569`

- Seletor de workspace: avatar 20 px + nome + chevron (reaproveita `Avatar`, `Menu`).
- Busca (abre o Command Menu, ⌘K) e criar issue (atalho `C`): dois `IconButton` redondos no topo, como no Figma (`1:5022`, `1:5026`).
- Itens de navegação de topo: Inbox, Reviews (com contador), My issues, Agent — ícone 16 px (ver "Decisões para o André" sobre o 14 px do Figma) + label + contador opcional (reaproveita `Counter`).
- Seção **Workspace** (recolhível): Projects, Views, More.
- Seção **Favorites** (recolhível): sem exemplo populado no Figma atual; desenhado pelo padrão do Linear — a seção fica oculta quando vazia e aparece com os itens favoritados quando houver.
- Seção **Your teams** (recolhível): por time, ícone + nome + chevron, com subitens Home / Issues / Projects / Views.
- Seção **Try**: Invite people, Initiatives, Cycles, Connect Cursor, Connect Codex.
- Rodapé: botão de ajuda.
- Item ativo em `accent` (terracota), conforme ADR-0013.
- Recolher com `[` (confirmado ao vivo no Linear: some por completo, com um controle discreto para reabrir — não vira trilho de ícones).
- Redimensionar por arraste (confirmado ao vivo: alça de 7 px na borda, cursor `col-resize`).
- Abaixo de `tablet:` (768 px), a sidebar vira drawer (Radix Dialog/Sheet), como já previsto em `foundations/grid.tsx`.

**2. Top bar de página** — `1:5931` e o padrão equivalente dentro das telas completas

- Breadcrumbs (`1:5937`–`1:5958`): trilha de links (ex. "Zynox › Projects › Mv School") + estrela de favorito + menu "…". Sem componente de Breadcrumb no DS hoje: novo padrão de layout composto a partir dos tokens de texto e do `IconButton`.
- Abas de view (`1:5988`): Overview / Activity / Issues (Project Details) ou Active / Backlog / All issues (Issues) — reaproveita `Tabs`.
- Ações à direita: filtro e display options (`FilterMenu`, `DisplayOptions`, já existentes), adicionar view, copiar link, notificações, fechar painel — `IconButton`.

**3. Painel de detalhes à direita** — `1:6113`

- Largura fixa (~400 px, não redimensionável no Figma).
- Seções recolhíveis (Properties, Milestones, Progress, Activity): reaproveita o padrão de cabeçalho recolhível já implementado para `ListGroup` (Fase 5), não um componente novo.
- Fecha com `]` (confirmado no atalho oficial do Linear: "Toggle right sidebar") e pelo botão "×" (`1:6005`).
- `Ctrl+I` também abre e fecha o painel ("Open sidebar details" no menu de comandos do Linear, capturado em `1:12566` e `38:2`). Aprovado em 28/09 como sinônimo de `]`.
- Scrim: sem desenho hoje (`1:6112` está vazio); o painel de Fase 8 não usa scrim — é um painel fixo ao lado do conteúdo, não um overlay.

**4. Layout de Settings** — `33:20122` (nav) + `33:20615` (slot de conteúdo, exemplo Preferences)

- Link "Back to app" e busca no topo da coluna de navegação.
- Nav lateral por seções: Personal, Issues, Projects, Features, Desktop application, Automations and workflows (e Administration/Your teams para quem for Admin — Fase 8 modela o container; a regra de visibilidade por Role é comportamento de produto, não de layout).
- Slot de conteúdo à direita, no mesmo template de página do resto do app.
- Exemplo de conteúdo nesta fase: **só Preferences**, porque já reaproveita `Select`, `Switch`, `Field` existentes do DS. As demais páginas de Settings (Profile, Labels, Templates, SLAs, Members, Teams, API…) ficam fora do escopo — ver "Fora do escopo" e "Decisões para o André".

**5. Encaixe do ⌘K e do atalho `C`**

- O Command Menu (Fase 6, já implementado) abre pelo botão de busca da sidebar ou por Ctrl/⌘+K, de qualquer tela do shell.
- `C` abre o Composer de criação de issue (Fase da VYZ-33, já implementado) como overlay, não é uma navegação de página.

## Comportamento

- `[` recolhe/expande a sidebar esquerda; `]` abre/fecha o painel direito; arraste na borda da sidebar redimensiona (limites a definir, ver decisões).
- `C` cria issue (Composer); Ctrl/⌘+K abre o Command Menu — ambos já implementados, esta fase só define o gatilho visual no shell.
- Nas listas (Issues, Projects, My issues, Inbox, Reviews), a barra superior segue com breadcrumb + abas + ações; o padrão de mestre-detalhe (Inbox, Reviews) usa duas colunas dentro da mesma área de conteúdo, sem painel direito adicional.
- Em Settings, "Back to app" volta para a última tela do shell principal (não reabre a home).

## Estados

- **Padrão**, **hover**, **foco** (linha de campo, `focus-ring`) nos itens de navegação.
- **Ativo/selecionado**: item da sidebar corrente em `accent`; aba corrente com sublinhado neutro (ADR-0013).
- **Recolhido** (sidebar oculta) e **expandido**.
- **Vazio**: seção Favorites oculta sem itens.
- **Carregando**: linhas do painel direito e das listas em `Skeleton` (Fase 4).
- **Erro**: não é um estado do shell em si; cobre-se nas telas de conteúdo.
- Todos os estados nos dois temas.

## Teclado e acessibilidade

- `[` recolhe/expande a sidebar; `]` abre/fecha o painel direito; `Ctrl/⌘+K` abre o Command Menu; `C` cria issue — todos globais, de qualquer tela do shell.
- Roving tabindex na sidebar (um alvo de Tab por lista, ↑ ↓ navegam dentro do grupo, Enter ativa), como o padrão já usado em lista/tabela/árvore (Fase 5).
- `nav` da sidebar com `aria-label`; painel direito como `aside`/`complementary`; item ativo com `aria-current="page"`.
- Foco visível em todos os itens (`focus-ring`), sem halo nem acento, como o resto do sistema.
- Redimensionar a sidebar por arraste é só de mouse (como no Linear); colapsar/expandir continua 100% por teclado.
- Nav de Settings: lista de links comum, `aria-current` no item ativo.

## Critérios de aceite

- [ ] Sidebar, top bar, painel direito e layout de Settings implementados como layout (`apps/web/src/layouts`), reaproveitando peças existentes do DS.
- [ ] `[`, `]`, `C` e Ctrl/⌘+K funcionam de qualquer tela do shell.
- [ ] Recolher/expandir a sidebar 100% por teclado; redimensionar por mouse.
- [ ] Abaixo de `tablet:`, a sidebar vira drawer.
- [ ] Só tokens semânticos; nenhum valor fixo fora da escala de 4 px; nenhuma dependência nova.
- [ ] Teclado completo e foco visível.
- [ ] Testes de interação (agente de testes separado) e axe nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Revisão em contexto limpo sem bloqueantes e validação do responsável no navegador.

## Fora do escopo

- **Conteúdo das seções do painel direito** (edição de Properties, Milestones, seleção em massa): Fase 10 (Patterns).
- **Conteúdo de cada página de Settings** além do exemplo Preferences (Profile, Notifications, Labels, Templates, SLAs, Statuses, Members, Teams, API, Security…): fica para quando cada área do produto for construída.
- **Painel/tela de chat do Agent**: Fase 7 (AI). Fase 8 só entrega o item "Agent" na sidebar e o slot de conteúdo que a Fase 7 vai preencher.
- **Regras de visibilidade por Role** (Admin vê "Administration", Guest não vê certas Teams): comportamento de produto, não de layout do shell.
- **Dados reais pela API.**

## Dependências entre fases

- **Fase 7 (AI)** precisa: do item "Agent" já roteável na sidebar (entregue aqui) e de decidir se o chat abre em tela cheia (como `27:6907`) ou dentro do painel direito — decisão da própria Fase 7, mas depende do container desta fase já existir.
- **Fase 10 (Patterns)** precisa: do container de Settings (nav + slot, entregue aqui) para detalhar cada página; e do padrão de seção recolhível do painel direito (reaproveitado do `ListGroup` da Fase 5) para especificar edição inline, milestones e seleção em massa.

## Decisões para o André

1. **Atalho `Ctrl+I` do painel direito.** **Decidido em 28/09: implementar os dois, com `Ctrl+I` como sinônimo de `]`.** O atalho aparece no menu de comandos do Linear (`1:12566` e `38:2`: "Open sidebar details · Ctrl I"), embora não conste na lista oficial.
2. **Redimensionar a sidebar por arraste.** Confirmado que o Linear faz isso hoje, mas não é algo trivial (estado persistido, limites min/max, sem token hoje). Recomendação: implementar com limites 200–360 px, persistindo em `localStorage`. Alternativa: adiar para depois, com a sidebar em largura fixa de 244 px nesta fase.
3. **Ícones de 14 px na sidebar.** Já é uma pendência registrada em `.figma/01-design-tokens.md` (fora do escopo desta spec resolver sozinho). Recomendação: usar 16 px (`size-icon-sm`, o degrau mais próximo da escala atual) nesta fase, sem bloquear a entrega; ajustar quando a decisão de 14 px sair.
4. **Escopo de Settings.** O Figma tem dezenas de páginas de configuração novas. Recomendação: esta fase entrega só o container (nav + slot) e o exemplo de Preferences. Alternativa: André pode pedir mais páginas de exemplo já nesta fase, se alguma for prioridade de produto.
5. **Drawer da sidebar no mobile.** Já previsto em `foundations/grid.tsx` ("Mobile: sidebar vira drawer"). Recomendação: implementar nesta fase, já que o comportamento já está documentado. Alternativa: adiar para a Fase 10, mantendo só o breakpoint `tablet:` fixo por enquanto.

Nenhum token novo nem dependência nova é necessário: a fase reaproveita `Avatar`, `Menu`, `Counter`, `IconButton`, `Button`, `Tabs`, `FilterMenu`, `DisplayOptions`, `Dialog`, `ListGroup` (recolhível) e `CommandMenu`, todos já no design system.
