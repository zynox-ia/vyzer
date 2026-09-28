# Spec: Fase 10 do Design System — Patterns

Issue: [VYZ-38](https://linear.app/zynox-dev/issue/VYZ-38/fase-10-patterns), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-38-fase-10-patterns`, a partir de `vyz-34-fases-4-5-e-6-feedback-dados-e-command-menu`, depois do merge da Fase 8 (VYZ-35).

**Aprovada pelo responsável em 28/09, com todas as recomendações da seção de decisões.**

Patterns são composições documentadas das peças já existentes no design system, não componentes novos — exceto o que faltar de fato (regra do responsável, ver escopo 4).

## Como usar o Figma nesta entrega

Mesma regra da VYZ-34 (decisão do responsável, 28/09): o Figma é referência visual geral, não medida nó a nó. O que já existe no design system é reutilizado; o que não tem frame, o agente desenha a partir do visual já implementado, sem parar para perguntar; não se cria prop nova só para bater um pixel; divergências relevantes vão para `.figma/`, uma linha por peça.

### Nós citados no briefing: o que ainda existe

Levantamento de 28/09 no arquivo `CNJik9Re3oAtqNma67yjou`, com `get_metadata` e `get_screenshot`.

| Nó            | Situação            | O que mostra                                                                                                                                                                                                                                                 |
| ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 25:4689       | Existe              | "Teams → Project Details": Overview completo (propriedades, labels, recursos, latest update com saúde e deltas de milestone, descrição, lista de milestones), sidebar 25:2040 (Properties, Activity) e os menus de milestone                                 |
| 25:5446       | Existe              | Popover de atualização do projeto sobre a lista de Projects                                                                                                                                                                                                  |
| 27:19467      | Existe              | Seção Inbox: lista, detalhe de issue (27:17223), chat do agente (27:17787), composer de New Issue (27:19344) e os menus Add Filter, Assign to, Copy, More, Convert to, Team                                                                                  |
| 1:3241        | Existe              | Modal "New project" (Radix Dialog atual): nome, propriedades, descrição, milestones, botão Create project                                                                                                                                                    |
| 1:3412        | Existe              | Mesmo modal "New project", variante de estado (conteúdo igual ao 1:3241)                                                                                                                                                                                     |
| 1:5676        | Existe, fragmento   | Cabeçalho "All projects" com Cancel / Create view — parte do fluxo de New view                                                                                                                                                                               |
| 1:3176        | Existe              | Formulário "Create milestone" (nome, descrição, Cancel/Add milestone) e a lista de milestones com o item "Teste"                                                                                                                                             |
| 1:6237        | Existe              | Cabeçalho "Milestones" vazio, com o texto de ajuda "Add milestones to organize work within your project and break it into more granular stages"                                                                                                              |
| 1:6023–1:6103 | Existem, mas soltos | Não formam um frame único. 1:6023 é só o campo de título ("Project name", texto "Mv School"); 1:6103 é só o placeholder "Add description…". Não há contêiner de edição inline completo nessa faixa — são nós de campo isolados, sem o resto da tela ao redor |
| 1:5413        | Existe, mas vazio   | Frame 1112×212 chamado "Text", sem conteúdo visível renderizado. Não dá para confirmar o que representava; tratado como não confiável                                                                                                                        |
| 1:5613        | Existe              | A peça útil do par: barra flutuante "N selected · Actions · ✕", exatamente a barra de ações da seleção em massa                                                                                                                                              |

Conclusão: dos nós antigos, só **1:5413** não rende nada aproveitável. Os demais servem de referência, com o cuidado de que 1:6023–1:6103 não têm o "entorno" da tela (o agente compõe a partir do Linear, como pede a regra).

### Outras referências usadas

| Área                                              | Nós                                                                                                                                                                                                                                                  |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu de milestone ("...")                         | 25:4687, 25:4690, 25:4910 (Edit, Edit target date, Copy → Copy link/Copy name as link/Copy link to issues, Move milestone to, Convert to project, Delete)                                                                                            |
| Hover card de milestone (já implementado, Fase 5) | 25:6683                                                                                                                                                                                                                                              |
| Detalhe de issue — topo e corpo                   | 27:17223                                                                                                                                                                                                                                             |
| Menu More da issue                                | 27:18222 (Team, Due date, Add link, Add pull request, Add document, Create related, Mark as, Copy, Convert to, Make a copy, Favorite, Remind me, Show description history, Delete)                                                                   |
| Submenu Copy da issue                             | efa5e2b2 (Copy ID, Copy URL, Copy title, Copy title as link, Copy issue as Markdown, Copy everything as Markdown, Copy git branch name, Copy as prompt) — nome de asset, sem node-id próprio estável; conteúdo capturado a partir de 27:18222 → Copy |
| Submenu Convert to                                | 27:18890 (Issue…, Sub-issue…, Parent issue…, Blocked issue…, Blocking issue…)                                                                                                                                                                        |
| Submenu Team                                      | 27:18970 (Vyzer · VYZ, Zynox · ZYN)                                                                                                                                                                                                                  |
| Assign to                                         | 46babfbd (No assignee, pessoas, Invite and assign…) — capturado a partir do menu de assignee em 27:19467                                                                                                                                             |
| Settings "General"                                | Removido na reorganização de 28/09 (nós 13:2010, 13:1751, 13:1980, 13:2062, 13:2081, 13:2263, 13:1937 não existem mais — ver mapa de fases). Segue o Linear                                                                                          |

## Escopo

Cada pattern ganha uma página em `/design-system` (seção Patterns), no template único, com link para os componentes de base que usa.

1. **Formulário de settings** (seções, linha de rótulo e controle, salvar)
   - Sem frame vivo (o nó antigo de Settings "General" foi removido). Segue o Linear.
   - Composição: seções com título e hairline (`border-default`) separando-as; cada linha usa `Field` com `orientation="horizontal"` (rótulo à esquerda, controle à direita — já existe, `packages/design-system/src/components/field.tsx`) com `TextInput`, `Select`, `Switch` ou `IconPicker` conforme o campo; `Button` primário "Save" no rodapé.
   - Depende da Fase 8 (App Shell) para o layout de página com a navegação lateral de Settings; a página de documentação mostra o padrão isolado (só o formulário), como todo item de `/design-system` — sem esperar a Fase 8.

2. **Edição inline de título, descrição e propriedades**
   - Nós 1:6023 (título) e 1:6103 (descrição), soltos — segue o Linear para o comportamento de alternância.
   - Título e descrição: alternam entre texto estático e `TextInput`/`TextArea` `variant="plain"` (já existem) ao clicar; título salva com Enter ou blur; descrição salva com blur; Esc cancela e volta ao texto anterior nos dois casos.
   - Propriedades: reaproveita o padrão `PropertyButton` já usado no New Project e no Creation Composer (Status via `StatusIcon`, Priority via `PriorityIcon`, Lead/Assignee via `Avatar`, Labels via `Chip`/`LabelPicker`).
   - Nota de implementação (não é decisão do André, é escolha de código): se a alternância "texto estático ↔ campo editável com Enter/Esc/blur" se repetir nas 3+ situações desta fase, o agente pode extrair um hook compartilhado (ex. `useInlineEdit`) em vez de reescrever a lógica em cada página — sem prop nova em componente existente, sem token novo.

3. **Lista de milestones e detalhe de um milestone**
   - Lista: nó 25:3409 (dentro do Project Details) e 1:3176 (formulário antigo "Create milestone", ainda existe). Linha: ícone diamond do lucide (já decidido na Fase 5, Hover Card — "losango do lucide para milestone, preenchido quando concluído") + nome + "X% of N" + data + `IconButton` "…".
   - Menu "…" da linha: `Edit…`, `Edit target date…`, `Copy` (submenu: Copy link, Copy name as link, Copy link to issues), `Move milestone to`, `Convert to project`, `Delete…` — tudo com `Menu`/`MenuSub`/`MenuItem` já existentes (Fase 3).
   - Criar milestone: formulário curto (nome, descrição opcional, Cancel/Add milestone), como 1:3176 — composição com `Field`, `TextInput`, `TextArea` plain e `Button`.
   - Detalhe do milestone: **sem frame no Figma** — segue o Linear. Nome editável inline (padrão do item 2), target date (`DatePicker`, existente), descrição, `ProgressBar` (existente, Fase 4) com a porcentagem, lista de issues do milestone filtrando `IssueList` (existente, Fase 5), breadcrumb de volta ao projeto.
   - Hover card do milestone (Fase 5, já implementado) é reaproveitado como prévia ao passar o mouse sobre uma referência a um milestone nesta fase.

4. **Seleção em massa com barra de ações flutuante**
   - A seleção nas linhas já existe (`IssueList`/`Table`, Fase 5: prop `selected`/`onSelectedChange`, `aria-selected`, Space marca, Esc limpa). Falta só a barra.
   - Nó 1:5613 tem frame: pílula flutuante fixa na base da lista, com "N selected", um gatilho "Actions" e um `IconButton` de fechar (✕).
   - Peça nova proposta: um componente pequeno (`SelectionBar` ou nome equivalente), porque tem frame próprio no Figma e é reutilizável entre Issues, Projects e a Fase 5 em geral — não é "prop nova para bater pixel", é peça que falta de fato (regra do escopo desta fase). Construído só com `Button`/`IconButton`/`Menu` e tokens já existentes (`bg-surface`, `shadow-raised`, `rounded-full`, `--z-index-sticky`); nenhum token ou dependência nova.
   - "Actions" abre um `Menu` (existente) com as ações em massa do contexto (ex.: mudar status, arquivar, deletar — conteúdo de exemplo na página, como os outros patterns).

5. **Atualização de projeto com saúde** (popover 25:5446)
   - Reaproveita o padrão Composer já existente (`docs/specs/composer-de-criacao.md` não cobre este, mas `apps/web/.../pages/forms/composer.tsx` já implementa o modo "update"), dentro de um `Popover` (existente, Fase 3).
   - Diferença do exemplo atual do Composer: no lugar do texto estático "On track", usa `HealthBadge` (já existe, `badge.tsx`) como gatilho de mudança de saúde; a lista "Progress since Sep 18" vira múltiplos milestones com delta (0% → X%, data), não uma linha única.
   - Fica documentado na página de Patterns (é o padrão real de uso, popover sobre a lista de projetos), com um link a partir da página do Composer em Forms.

6. **Página de detalhe de issue (corpo e sidebar de propriedades)**
   - Referência principal: 27:17223 (Inbox → detalhe de ZYN-241).
   - Corpo: título grande editável inline (item 2), descrição em `TextArea` plain — **sem editor de texto rico** (ver "Decisões pendentes"), "+ Add sub-issues" (`Button` ghost), ícones de ação no topo (link, copiar, branch, mais) via `IconButton`.
   - Menus do topo, todos com `Menu`/`MenuSub`/`MenuItem` existentes:
     - **More** (27:18222): Team, Due date, Add link, Add pull request, Add document, Create related, Mark as, Copy, Convert to, Make a copy, Favorite, Remind me, Show description history, Delete;
     - **Copy** (submenu do More): Copy ID, Copy URL, Copy title, Copy title as link, Copy issue as Markdown, Copy everything as Markdown, Copy git branch name, Copy as prompt;
     - **Convert to** (27:18890): Issue…, Sub-issue…, Parent issue…, Blocked issue…, Blocking issue…;
     - **Team** (27:18970): lista de times (Vyzer, Zynox);
     - **Assign to**: lista de pessoas + "Invite and assign…".
   - Sidebar de propriedades: `PropertyButton` em coluna (Status, Priority, Assignee, Team, Project, Labels), mesmo padrão do Creation Composer.
   - Depende da Fase 8 (App Shell) para o layout de duas colunas com o painel direito e o scrim (nós 1:6112/1:6113) e os breadcrumbs do topo. Depende da Fase 7 (AI) só para o botão/painel "Agent" (Dialog - Agent chat, 27:17787) — **fora do escopo aqui**, citado apenas como algo que aparece na mesma tela no Figma.

7. **Atividade e comentários**
   - Nó: seção Activity em 25:4689 e 27:17223.
   - `Timeline`/`TimelineItem` (Fase 5, existentes) para os eventos; Composer em modo "comment" (Forms, existente) para o campo de novo comentário; corpo de um comentário como o slot `body` do `TimelineItem`.
   - "Unsubscribe"/"Subscribe" no cabeçalho da Activity: `Button` ghost, sem peça nova.

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                              |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | Nada                                                                                                                                                                                                                                     |
| API    | Nada                                                                                                                                                                                                                                     |
| Tela   | Componente novo `SelectionBar` em `packages/design-system/src/components` (só se aprovado — ver escopo 4), exports em `index.ts`; páginas de pattern em `apps/web/src/features/design-system/pages/patterns` e registro em `registry.ts` |

## Comportamento

- **Settings:** Tab percorre as linhas na ordem visual; Enter num campo de texto não submete a seção inteira; Save fica desabilitado sem alterações pendentes (padrão dos outros formulários do sistema).
- **Edição inline (título/descrição/propriedades):** clique ou Enter no modo foco entra em edição; Enter salva (título) ou quebra linha (descrição, que usa `autoGrow`); Esc cancela e restaura o valor anterior; blur salva.
- **Milestones:** lista navegável por teclado como o `IssueList`; menu "…" abre com Enter/Space no botão e fecha com Esc, devolvendo o foco ao botão; detalhe do milestone abre em navegação normal de rota (Enter na linha), com breadcrumb Alt/Backspace-friendly como as demais telas.
- **Seleção em massa:** Space marca/desmarca a linha (já implementado); a barra aparece ao primeiro item marcado e some com zero selecionados; Esc limpa a seleção (mesmo atalho do `IssueList`) e fecha a barra; "Actions" abre por Enter/clique, navega por seta e fecha com Esc sem perder a seleção.
- **Atualização de projeto:** igual ao Composer existente (Enter no título vai para a descrição não se aplica aqui — é só um campo); ⌘/Ctrl+Enter publica a atualização; Esc fecha o popover sem publicar.
- **Detalhe de issue:** título recebe foco ao entrar em modo de edição; os menus do topo seguem o padrão de `Menu`/`ContextMenu` já testado (seta para navegar, Enter para executar, Esc fecha e devolve o foco ao gatilho); atalhos de teclado documentados nos itens do menu (ex. Ctrl+Shift+M para Team, Ctrl+C para Copy title as link) só como rótulo visual — a ligação real do atalho fica fora do escopo (sem funcionalidade real, é documentação do padrão).
- **Atividade/comentários:** Composer em modo comment mantém o comportamento já definido (Enter quebra linha, ⌘/Ctrl+Enter publica).

## Teclado e acessibilidade

- Toda peça nova ou composta mantém foco visível (`focus-ring`/`focus-ring-within`, sem halo nem acento — regra do ADR-0013).
- `SelectionBar`: `role="toolbar"` com `aria-label` (ex. "Bulk actions"), contagem anunciada via região `aria-live="polite"` para quem usa leitor de tela, já que a contagem muda sem navegação.
- Formulário de settings: cada linha usa `FormLabel`/`HelperText` (existentes) para associar rótulo e controle; mensagens de erro usam `FormMessage`.
- Edição inline: o elemento em modo de edição some do fluxo de leitura assim que vira `TextInput`/`TextArea` (sem duplicar o texto estático e o campo ao mesmo tempo).
- Menus (More, Copy, Convert to, Team, Assign to): `MenuSub`/`MenuSubContent` já cobrem o padrão de acessibilidade de submenu (Fase 3); nenhuma revisão nova necessária além de repetir o padrão.
- Milestone: barra de progresso usa `ProgressBar` com `aria-valuenow`/`aria-valuemax` já implementados.

## Estados

Padrão, hover, foco, ativo/selecionado, desabilitado, vazio (lista de milestones sem itens, ver 1:6237), carregando e erro, conforme o pattern. Todos nos dois temas.

- **Settings:** vazio não se aplica; erro por campo usa `FormMessage`; Save "carregando" usa o estado de loading já existente no `Button`.
- **Milestones:** vazio usa o texto de 1:6237 ("Add milestones to organize work within your project and break it into more granular stages") com `EmptyState` (existente, Fase 4) ou o texto inline, o que for mais fiel ao nó.
- **Seleção em massa:** a barra só existe no estado "≥ 1 selecionado"; sem seleção, ela não é renderizada (não é um estado "vazio" da própria barra).
- **Detalhe de issue:** carregando usa `Skeleton` (existente, Fase 4) nas áreas de título, propriedades e activity.

## Critérios de aceite

- [ ] Os 7 patterns do escopo têm página em `/design-system` (seção Patterns), compostos só com peças existentes, exceto o `SelectionBar` (novo, justificado no escopo 4).
- [ ] Nenhuma dependência nova nem token novo sem aprovação registrada nesta spec.
- [ ] Só tokens semânticos; `radix-ui` para os primitivos interativos.
- [ ] Teclado completo e foco visível em cada pattern, conforme a seção acima.
- [ ] Testes de interação (agente de testes separado) e axe nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Revisão em contexto limpo (figma-fidelity-reviewer + revisão de código) sem bloqueantes, e validação do responsável no navegador.
- [ ] Divergências relevantes do Figma registradas em `.figma/`, uma linha por peça.

## Fora do escopo

- **Editor de texto rico** para descrição (negrito, menções, "/"): é dependência nova e pede ADR — ver "Decisões pendentes". Esta fase usa `TextArea` plain em todo lugar que hoje editaria descrição, como já decidido na VYZ-33.
- **Gráfico de progresso do projeto** (linha Sep 1 → Oct, nó 25:3040): é Fase 9 (Data Visualization). Os patterns desta fase usam só `ProgressBar`/`ProgressRing` para milestones.
- **Painel/botão "Agent"** no detalhe de issue e "Write with Agent" funcional: é Fase 7 (AI), só citado como presente na mesma tela do Figma.
- **App Shell real** (sidebar, top bar, painel direito com scrim, breadcrumbs, navegação de Settings): é Fase 8. Os patterns aqui são documentados isolados, como todo item de `/design-system`, sem esperar o shell.
- **Seção "Dependencies"** do Project Details (nós 25:2855/25:3603, "Add dependency"): não estava no escopo pedido; fica para uma entrega futura se o responsável pedir.
- **Atalhos de teclado reais** dos itens de menu (Ctrl+Shift+M, Ctrl+C etc.): só o rótulo visual (`Kbd`, existente) é documentado; a ligação funcional fica fora do escopo.
- **Dados reais pela API** em qualquer pattern.

## Dependências entre fases

| Depende de                  | O quê                                                                                                   | Como este pattern lida com isso agora                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Fase 8 (App Shell)          | Layout de página com sidebar de Settings; painel direito com scrim para o detalhe de issue; breadcrumbs | Página isolada em `/design-system`, sem o shell ao redor — igual a todos os outros componentes documentados |
| Fase 7 (AI)                 | Botão/painel "Agent" no detalhe de issue; "Write with Agent" funcional no Composer de update            | Fora do escopo; citado só como contexto da mesma tela no Figma                                              |
| Fase 9 (Data Visualization) | Gráfico de progresso do projeto (linha temporal)                                                        | Fora do escopo; Patterns usa `ProgressBar`/`ProgressRing` (já existentes) para milestones, sem gráfico      |

## Decisões pendentes

Decisão que precisa de aprovação do André (dependência nova, pede ADR):

| Decisão                                                                                                                         | Recomendação                                                                                                                                                                                                                   | Alternativa                                                                                                                                   |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Editor de texto rico para descrição (negrito, @menções, comando "/"), usado no detalhe de issue e na edição inline de descrição | **Adiar.** Manter `TextArea` plain (já decidido na VYZ-33) nesta fase; abrir uma spec e uma ADR específicas para o editor quando o responsável priorizar, escolhendo a biblioteca (ex. Tiptap ou Lexical) e o efeito no bundle | Aprovar a dependência agora e ampliar o escopo desta fase para incluir o editor, adiando a entrega dos demais patterns até a ADR estar pronta |

Não é uma decisão pendente, mas fica registrado aqui para rastreio: documentar os patterns que dependem da Fase 8 (Settings, detalhe de issue) de forma isolada, como todo item de `/design-system`, é uma escolha consistente com o que já existe — não precisa de aprovação para seguir assim.
