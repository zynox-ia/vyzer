# Spec: Settings → Administration (Workspace, Members, Teams) e menu "···" da sidebar

Estende [`workspace-team-project.md`](./workspace-team-project.md). Não substitui nem edita aquela spec: a seção "Como isso se encaixa nas etapas" propõe como mesclar; a decisão é do responsável.

## Link do Figma

**Sem frame de conteúdo confirmado.** O nó `33:20122` só contém a navegação lateral de Settings; a área de conteúdo vem vazia (registrado em `.figma/01-design-tokens.md`, linhas 133 e 262). A spec da Fase 8 cita "Members" e "Teams" entre "dezenas de outras páginas" de Settings sem node-id. Não consegui procurá-las com `get_metadata`: o MCP do Figma não está autorizado nesta sessão, e o Figma web aberto no browser da Traycer não expõe as camadas por DOM.

Consequência, pela regra 1 do `AGENTS.md`: a referência de fidelidade é o **Linear ao vivo** (levantamento abaixo), e o que não tiver equivalente segue os tokens e padrões já implementados, sem parar para perguntar. Se alguém com o MCP autorizado achar frames de Members/Teams/Workspace, o revisor de fidelidade os compara na etapa correspondente; divergências vão para `.figma/`.

## Escopo

Telas de produto reais, em `apps/web/src/features/settings/`, no lugar dos placeholders atuais (`settings-placeholder.tsx`):

1. **Settings → Workspace** (`/settings/workspace`).
2. **Settings → Members** (`/settings/members`).
3. **Settings → Teams** (`/settings/teams`), **Create team** (`/settings/teams/new`) e a **configuração de um Team** (`/settings/teams/:team`, com `general` e `members`).
4. **Menu "···" no hover da linha do Team na sidebar**.

Tudo compõe peças existentes do design system. Nenhum token, componente ou dependência novos. As páginas de `/design-system` não mudam.

## Levantamento ao vivo (Linear, workspace `zynox-dev`, 28/09, somente leitura)

### O menu "···" da sidebar existe

A tentativa anterior falhou porque o botão só aparece no hover da linha do Team e fica **fora do botão do Team** (irmão dele, não filho). Achado no DOM de `#teams-boundary-container`:

- Cada `li` de Team contém o botão do nome, o botão `aria-label="Team menu"` (`aria-haspopup="menu"`) e os links Home/Issues/Projects/Views.
- Geometria medida com o hover ativo: linha 194×28 em x=9; botão **24×24, `border-radius: 9999px`**, em x=203, alinhado à direita da linha, centralizado na vertical.
- Itens do menu, na ordem: **Favorite** (`Alt F`) · **Team settings** (link, `/settings/teams/VYZ`) · **Copy URL** (`Ctrl ⇧ ,`) · **Open archive** · **Subscribe ▶** (submenu: "An issue is added to the team", "An issue is marked completed or canceled", "An issue is added to the triage queue") · **Configure Slack notifications…** · **Leave team…**.
- **Workspace não tem "···".** O seletor do topo é um dropdown (`Zynox Workspace Menu`) com: Settings (`G, then S`) · Invite and manage members · Download desktop app · Switch workspace ▶ · Log out (`Alt ⇧ Q`).
- O cabeçalho da seção "Your teams" tem um "+" (`aria-label="Join a team"`) no hover. Não está no escopo pedido; ver "Observações".

### Workspace (`/settings/workspace`)

- Coluna de conteúdo de **640 px** (igual ao slot atual do `SettingsLayout`, `max-w-160`). H1 24/500.
- Bloco superior empilhado (rótulo acima do controle, 13/500): **Logo** (upload, "Recommended size is 256x256px"), **Name** (input), **URL** (`linear.app/` + slug).
- Depois, linhas de rótulo + ajuda à esquerda e controle à direita: seção **Time & region** ("First month of the fiscal year" com Select; "Region", só leitura, "Set when a workspace is created and cannot be changed"), seção **Member onboarding** ("Welcome message", "Default home view", ambos com botão desabilitado "Configure" (sem etiqueta de plano)), seção **Danger zone** ("Delete workspace: Permanently delete the Workspace and its Members immediately" + botão "Delete workspace").
- Não há cartões com borda internos (medido: nenhum contêiner bordado entre 500 e 700 px).

### Members (`/settings/members`)

- Tabela **larga**: 1016 px, ou seja, a área inteira do cartão de Settings, não os 640 px.
- Cabeçalho da página: H1 "Members" + filtro "All" (Active/Application) + **Export CSV** + **Invite**.
- Colunas: **Name** (avatar + nome + handle `andrejunio.dev`), **Email**, **Status** (mostra o Role: "Admin"), **Teams** ("2 teams"), **Joined** ("Sep 11"), **Last seen** ("Online"). Linhas agrupadas em "Active" (1) e "Application" (3, bots Codex/Cursor/Linear).
- Menu da linha (botão "Open menu" no hover, observado na própria linha): **Update name…** · **Update username…** · **Manage team access…** · **Revoke access…**. Para outros Members pode haver "Change role"; não observável com um Member só.

### Teams (`/settings/teams`)

- Tabela larga (1016 px). Cabeçalho: H1 "Teams" + filtro "Active" + **Export CSV** + **Create team**.
- Colunas: **Name** (nome + key `VYZ`), **Visibility** ("Workspace"), **Members** (número, link para a aba de membros do time), **Issues** (número, link para as issues do time), **Created** ("Sep 26"). Grupo "Active".
- A linha inteira leva a `/settings/teams/VYZ` (usa a **key**, não o slug).
- Menu da linha (botão "Open menu"): **Settings ▶** (submenu com as subpáginas) · **Leave team…** · **Delete…**.

### Configuração de um Team (`/settings/teams/VYZ`)

- Página "Overview": breadcrumb "Teams › Zynox", título "Zynox", subtítulo "Accessible to all workspace members", e um **hub de links** agrupados: Team overview (**General**, **Members**, Slack notifications) · Issues, projects, and documents (Issue labels, Project labels, Templates, Recurring issues) · Workflow (Issue statuses, Project statuses, Workflows & automations, Triage, Cycles) · AI & Agents (Team agents, Agent skills, Agent connectors, Project updates, Resolved thread summaries) · Team hierarchy (Parent team) · **Danger zone** (Leave team, Retire team, Delete team: "Permanently delete this team and all its data, with a 30-day restoration window").
- **General** (`/general`): já coberta pelo pattern **Settings Form** do design system (`features/design-system/pages/patterns/settings-form.tsx`): Name, Identifier ("Used in issue IDs"), Description ("A short summary shown on the team page"), Estimates, Create issues by email, Timezone, Other; botão de ícone "Choose icon" ao lado do Name. Rótulo à esquerda, controle à direita, Save no rodapé desabilitado sem alterações.
- **Members** (`/members`): lista de membros do time.
- **Create team** (`/settings/new-team`): "Icon & Name" (botão "Choose icon" + input), "Identifier" ("Used as a prefix for team issues (e.g. ENG-123)"), botão "Create team". No workspace real aparece o aviso de limite de times do plano (não se aplica a nós).

## Reuso do design system

| Necessidade                                                      | Peça existente                                                                                                                                    |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tabelas de Members e Teams (ordenação, hover de linha, setas ↑↓) | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead` (com `onSort`), `TableCell`                                                          |
| Menu "···" da sidebar, "Open menu" das linhas, submenu           | `Menu`, `MenuTrigger`, `MenuContent variant="dropdown"`, `MenuItem` (com `icon` e `shortcut`), `MenuSub*`, `MenuSeparator` (Radix Dropdown)       |
| Botão "···"                                                      | `IconButton icon={Ellipsis} variant="ghost" size="sm" iconSize="14"` com `className="rounded-full"` (o mesmo ajuste do botão de ajuda da sidebar) |
| Confirmar exclusão                                               | `Confirm variant="danger"` (Radix AlertDialog; Cancel recebe o foco inicial)                                                                      |
| Editar nome de Member                                            | `Dialog`/`DialogContent`/`DialogFooter` + `TextInput` + `Button`                                                                                  |
| Formulários                                                      | `Field`, `FormLabel`, `HelperText`, `FormMessage`, `TextInput`, `TextArea`, `Select`; layout de linha do pattern Settings Form                    |
| Ícone + cor do Workspace/Team                                    | `IconPicker` + `ProjectIcon` + `ProjectIconValue` (o mesmo valor já usado em Team/Project)                                                        |
| Avatar de Member                                                 | `Avatar` (ícone de pessoa; o DS não tem iniciais, decisão já registrada)                                                                          |
| Role                                                             | `Badge` (`tone="neutral"`) ou texto simples; fica com o implementador dentro do que já existe                                                     |
| Feedback de salvar/copiar                                        | `useToast` (o `ToastProvider` já é montado em `main.tsx`); erro de rede com `Alert tone="danger"`                                                 |
| Carregando / vazio / erro                                        | `Skeleton`, `EmptyState`, `Alert`, e `refetch` do TanStack Query                                                                                  |
| Linhas rótulo-esquerda/controle-direita em Workspace             | `SettingsGroup`/`SettingsRow` de `features/settings/settings-row.tsx` (já usados em Preferences)                                                  |

Composição local nova (apps/web, não DS): tabela larga → `SettingsLayout` ganha uma variante larga (`max-w-content`, 72 rem, token existente) em vez do `max-w-160` fixo. Ver D13.

## Proposta por tela

### 1. Workspace

| Campo do Linear                | Proposta                                                                                                                                                                 | Motivo                                                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Name                           | **Entra.** `TextInput`, Save no rodapé (padrão Settings Form). Nome do Workspace na sidebar atualiza pelo cache da query                                                 | Já existe no schema                                                                                                        |
| Logo (upload 256×256)          | **Entra como upload** de imagem no RustFS, junto do ícone + cor existente; o logo salvo tem prioridade visual                                                            | Upload limitado a PNG/JPG/WebP/SVG de até 5 MB; ícone continua como fallback quando `logoUrl` é nulo                       |
| URL (linear.app/<slug>)        | **Entra.** Slug editável, validado como segmento de URL; prefixo do domínio fixo                                                                                         | O Linear permite editar a URL mesmo sem roteamento por Workspace no Zynox                                                  |
| First month of the fiscal year | **Entra.** Select salvo como mês de 1 a 12; começa em January                                                                                                            | Exibido pelo Linear; entra em Reports/Initiatives quando esses domínios existirem                                          |
| Region                         | **Entra como leitura.** United States, constante em workspace.current, não editável nem persistido                                                                       | O Linear define ao criar; não há configuração de região nesta etapa                                                        |
| Member onboarding              | **Entra como leitura desabilitada.** Welcome message e Default home view mostram um botão "Configure" desabilitado, sem etiqueta de plano (o Zynox não tem planos pagos) | São controles gated no Linear; não há mutação fora do plano Enterprise                                                     |
| Delete workspace               | **Entra.** Danger zone com exclusão hard imediata, somente Admin; workspace.delete exige adminOnly                                                                       | Decisão explícita do responsável; sem Workspace/Member fixos, o middleware deixa de resolver até pnpm db:migrate re-seedar |

Resultado: a página segue o conteúdo visível do Linear; o onboarding aparece desabilitado e a exclusão é imediata.

### 2. Members

- Tabela larga, agrupamento e abas do Linear **não** entram: sem Members "Application" e sem Status além de Active, o filtro e os grupos seriam controles mortos.
- Colunas nesta fase: **Name** (Avatar + nome), **Email**, **Status** (mostra o Role, como o Linear; fica "Admin"), **Joined**. Ordenação por coluna em search param (`?sort=name&dir=asc`), regra 8.
- Colunas **adiadas**: **Last seen** (exige sessão/presença, ADR-0015) e **Teams** (exige a tabela de vínculo Team↔Member, proposta em D5; entra na sub-etapa 2.1).
- Botões **Invite** e **Export CSV**: **omitidos** (ADR-0015 exclui convites; CSV fica adiado, D6).
- Menu da linha ("Open menu", no hover e no foco): só **Update name…** (Dialog com `TextInput`). "Update username…" (não existe username), "Manage team access…" (depende de D5 e de Guest) e "Revoke access…" (sem auth, e o último Admin não pode ser revogado) ficam de fora.
- Leitura aberta a qualquer Member do Workspace; edição só por Admin (D14).

### 3. Teams

**Lista (`/settings/teams`)**

- Colunas: **Name** (`ProjectIcon` + nome + key), **Members** (contagem, exige D5), **Issues**, **Created**. Sem **Visibility** (D7: só existe "Workspace"; times privados exigem plano pago no Linear).
- **Issues**: mostrar `0` vindo do contrato, como já foi decidido para `issues`/`progress` de Project na spec principal, ou omitir a coluna (D7). Recomendação: **mostrar 0**, para não reabrir o layout quando Issues chegar. Sem link, pois não existe a lista de issues.
- Botão **Create team** leva a `/settings/teams/new`. **Export CSV** adiado (D6).
- Menu da linha ("Open menu"): **Team settings** (navega) e **Delete team…** (`Confirm`, com o texto do conflito). "Leave team…" fica de fora (D5/D11). O submenu "Settings ▶" do Linear vira o único item "Team settings", pois o hub tem poucas subpáginas (D9).
- A linha inteira navega para `/settings/teams/:team` (`:team` = slug, igual às rotas `teams/:team/...` já implementadas; o Linear usa a key, D8).

**Create team (`/settings/teams/new`)**

- Campos: ícone + cor (`IconPicker`), **Name**, **Identifier** (key; "Used as a prefix for team issues (e.g. ENG-123)"). Botão **Create team** (desabilitado enquanto inválido). Slug derivado do nome, único por Workspace.
- Validação: key maiúscula, alfanumérica, começando por letra; unicidade por Workspace vira `FormMessage` no campo ("This identifier is already taken.", texto já usado no pattern). Limite de tamanho da key: **a confirmar** (D8); o formulário real do Linear está bloqueado por limite de plano, não consegui testá-lo.
- Sucesso: navega para `/settings/teams/:team` e mostra toast.

**Configuração de um Team**

- **Overview** (`/settings/teams/:team`): cabeçalho com link de volta para "Teams" (reaproveitar o breadcrumb do top bar do App Shell se servir fora dele; senão links simples), título, e um hub **reduzido** com só o que existe hoje: **General**, **Members** e **Danger zone** (só **Delete team**). Os demais cartões do hub (Slack, labels, templates, workflow, cycles, AI…) pertencem a domínios futuros; **não aparecem** (nada de linhas mortas). O hub cresce por domínio.
- **General** (`/general`): pattern Settings Form do DS com Name, Identifier, Description e o botão de ícone. **Estimates**, **Create issues by email**, **Timezone** e **Other** ficam de fora (sem Issues nem Cycles; D10). Save no rodapé, desabilitado sem alterações.
- **Members** (`/members`): tabela só de leitura (Name, Email, Status) dos Members do Team. Sem "Add members" agora.
- Vazio, erro e "Team não encontrado" (slug inexistente, do mesmo jeito que Project não encontrado): `EmptyState`.

### 4. Menu "···" na sidebar

- Componente local em `layouts/app-shell/` (não DS), usado dentro de `TeamNavGroup` (`sidebar-nav.tsx`), com `Menu` + `IconButton` + `MenuItem`.
- Botão **irmão** do botão que abre/fecha o grupo (nunca dentro dele: botão dentro de botão é HTML inválido e quebra o foco). 24×24, `rounded-full`, alinhado à direita da linha. `aria-label="Team menu"`.
- Visibilidade: aparece no **hover** da linha, no **foco** de qualquer coisa na linha (`focus-within`) e enquanto o menu estiver aberto (`data-state="open"`). Some fora disso, mas continua alcançável por teclado. Ao abrir, esconde/sobrepõe o chevron de recolher só o suficiente para não haver dois controles empilhados (o Linear posiciona o botão fora da largura da linha; o implementador mede e escolhe, sem valor fixo).
- Itens **desta entrega**: **Team settings** (navega para `/settings/teams/:team`) e **Copy URL** (copia `origin + /teams/:team` e mostra toast "Link copied"). Sem hint de atalho (Linear mostra `Ctrl ⇧ ,`; não mostramos atalho que não funciona).
- Itens do Linear **adiados até existir o domínio** (D11): Favorite (Favorites está oculto na sidebar), Open archive (Issues), Subscribe (Notifications), Configure Slack notifications (integração), Leave team… (D5).
- **Workspace não ganha "···"**, porque o Linear também não tem: é o dropdown do seletor, que já existe. Ligações que faltam nele estão em D12.

## Fatia vertical

### Novo no banco

| Etapa | Mudança                                                                                     | Nota                                                               |
| ----- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1.1   | `workspace.icon` (jsonb `ProjectIconValue`, default `{kind:"icon",name:"Zap",color:"red"}`) | Só se D1 for aprovado; o default mantém o visual de hoje           |
| 1.2   | `member.created_at`                                                                         | Coluna "Joined". Seed idempotente mantém o valor existente         |
| 2.1   | `team_member (team_id, member_id, created_at)`, chave composta                              | D5. Seed vincula o admin ao Team Zynox                             |
| 2.1   | `team.description` (text, nulo)                                                             | D10. Entra junto do schema de Team da Etapa 2, sem migration extra |

### API (contrato compartilhado + router)

Toda procedure passa pelo middleware de Workspace/Member (ADR-0007/0015). **Mutações exigem Role admin** (D14). Leituras não.

| Etapa | Procedure        | Entrada → saída                                            | Erros                                                                                          |
| ----- | ---------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1.1   | workspace.update | { name?, icon?, slug?, fiscalYearStartMonth? } → Workspace | FORBIDDEN (não admin); nome vazio, slug ou mês inválidos → validação                           |
| 1.1b  | workspace.delete | sem entrada → void                                         | FORBIDDEN (não admin); exclusão imediata com cascade de Members                                |
| 1.2   | `member.list`    | — → `{ id, name, email, role, createdAt }[]`               | —                                                                                              |
| 1.2   | `member.update`  | `{ id, name }` → Member                                    | `FORBIDDEN`; `NOT_FOUND` se o Member é de outro Workspace                                      |
| 2.1   | `team.list`      | — → Team + `memberCount` + `issueCount` (=0 até Issues)    | —                                                                                              |
| 2.1   | `team.create`    | `{ name, key, icon }` → Team (slug derivado)               | `CONFLICT` (key ou slug), `FORBIDDEN`                                                          |
| 2.1   | `team.delete`    | `{ id }` → `void`                                          | `CONFLICT` com Project associado (só testável de verdade na Etapa 3), `NOT_FOUND`, `FORBIDDEN` |
| 2.2   | `team.get`       | `{ team: slug }` → Team                                    | `NOT_FOUND`                                                                                    |
| 2.2   | `team.update`    | `{ id, name?, key?, icon?, description? }` → Team          | `CONFLICT` (key), `NOT_FOUND`, `FORBIDDEN`                                                     |
| 2.2   | `team.members`   | `{ id }` → Member[]                                        | `NOT_FOUND`                                                                                    |

O CRUD base de Team já está previsto na Etapa 2 da spec principal; esta spec só acrescenta `get`, `members`, os campos `memberCount`/`issueCount`/`description` e a exigência de admin. Cada procedure ganha teste de isolamento por Workspace (ADR-0007) e, nas mutações, teste de `FORBIDDEN` para não-admin (Member criado só no teste).

### Services e telas

- `apps/web/src/services/workspace.ts` (já existe) expõe `updateWorkspace` e `deleteWorkspace`; `members.ts` e `teams.ts` novos. Tudo consumido via TanStack Query; mutações invalidam as queries afetadas (sidebar e `currentWorkspace`).
- `features/settings/`: `workspace-settings.tsx`, `members.tsx`, `teams.tsx`, `team-create.tsx`, `team-settings/{overview,general,members}.tsx`. Removem-se de `settingsPlaceholderPages` (`routes/index.tsx`) as rotas `workspace`, `teams`, `members`, `teams/zynox`, `teams/zynox` e `teams/new`.
- `nav-data.ts`: o grupo **Your teams** hoje é fixo (`Zynox`, `Zynox`, `Create a team`). Passa a vir do service de Teams (a seção "Administration" continua estática). Mudança na 2.1.
- `SettingsLayout` ganha a variante larga (D13).

## Como isso estende `workspace-team-project.md`

As etapas continuam **sequenciais**, cada uma fechada, testada e revisada antes da seguinte. Proposta: fatiar as etapas 1 e 2 assim.

| Sub-etapa                             | Entra                                                                                                                                                 | Depende de                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **1.1** Workspace settings            | `workspace.icon` (D1), `workspace.update` + guarda de admin, página `/settings/workspace`, `WorkspaceMenu` lendo o ícone                              | Etapa 1 atual (concluída, commit `fe7b579`) |
| **1.2** Members                       | `member.created_at`, `member.list`/`member.update`, página `/settings/members` (sem coluna Teams), variante larga do layout                           | 1.1 (guarda de admin)                       |
| **1.1b** Workspace fields/delete      | workspace.slug, fiscal_year_start_month, Region read-only, onboarding gated e workspace.delete imediato                                               | 1.1 e 1.2                                   |
| **2.1** Teams: tabela, criar, excluir | `team`, `team_member`, seed, `team.list/create/delete`, `/settings/teams`, `/settings/teams/new`, coluna Teams em Members, `nav-data` a partir da API | 1.1b                                        |
| **2.2** Team settings                 | `team.get/update/members`, `team.description`, `/settings/teams/:team` (mais `/general` e `/members`)                                                 | 2.1                                         |
| **2.3** Menu "···" da sidebar         | componente do menu, integração em `TeamNavGroup`, Copy URL                                                                                            | 2.2 (destino de "Team settings")            |

A sidebar e o breadcrumb com Team real (Etapa 2 original) ficam na 2.1, já que `team.list` nasce ali. Nada muda na Etapa 3. A checagem "Team não pode ser excluído com Project associado" continua como pendência documentada até a Etapa 3; na 2.1 a UI de exclusão já trata o `CONFLICT` genericamente.

## Comportamento

- **Navegação**: as rotas listadas acima; "Back to app" de Settings não muda. Linha da tabela de Teams é um link real (a linha inteira clicável via link na célula de nome, com o restante da linha como área de clique, sem depender só de `onClick` na `tr`).
- **Estado na URL** (regra 8): ordenação das tabelas em search params (`sort`, `dir`). Não há filtro nem busca nesta fase. Aba/subpágina do Team fica no path.
- **Teclado**: tabelas seguem o `Table` do DS (Tab por controles, ↑↓ entre linhas). Menu "Open menu" da linha e "···" da sidebar abrem com Enter/Espaço, navegam com setas, fecham com Esc e devolvem o foco ao gatilho (Radix). O "···" é alcançável por Tab a partir da linha do Team e aparece com foco visível.
- **Salvar**: padrão Settings Form: Save desabilitado sem alterações, `loading` ao enviar, toast de sucesso, `FormMessage` por campo em erro de validação/conflito. Enter num campo de texto **não** envia (só o botão Save).
- **Excluir Team**: `Confirm` danger ("Delete team?", descrição com o efeito), Cancel com o foco inicial. Em `CONFLICT`, fecha o `Confirm` e mostra um `Alert`/toast de erro explicando o motivo; nada é alterado.
- **Copy URL**: `navigator.clipboard.writeText`; se falhar, toast de erro (não silencia).
- **Idioma**: toda a UI em inglês (ADR-0002). Textos-base: "Workspace", "Members", "Teams", "Create team", "Team settings", "Delete team", "Update name…", "Copy URL", "Save", "Link copied".

## Estados

Vale para cada página/tabela/formulário, exceto onde indicado.

| Estado                              | Comportamento                                                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Padrão                              | Dados reais da API                                                                                                                                                                                             |
| Hover / foco / ativo / desabilitado | Como nos componentes do DS; "···" e "Open menu" aparecem no hover da linha e no foco                                                                                                                           |
| Carregando                          | `Skeleton` no lugar de linhas/campos, sem deslocar controles                                                                                                                                                   |
| Vazio                               | Members nunca fica vazio (há o admin). Teams vazio (todos excluídos): `EmptyState` com ação **Create team**. Sidebar sem Teams: seção "Your teams" oculta, como Favorites vazio                                |
| Erro                                | `Alert` acessível com nova tentativa (`refetch`); erro de rede não vira "lista vazia" nem "não encontrado"                                                                                                     |
| Não encontrado                      | Slug de Team inexistente: `EmptyState`, como Project não encontrado                                                                                                                                            |
| Sem permissão                       | Não-admin: campos de edição desabilitados/omitidos e ações de mutação ausentes; a API devolve `FORBIDDEN` de qualquer forma. Sem auth hoje o Member é sempre o admin; o estado é testado com contexto injetado |

## Critérios de aceite

**1.1 Workspace**

- [ ] `/settings/workspace` deixa de ser placeholder e edita Name (e ícone, se D1) com Save no padrão Settings Form.
- [ ] `WorkspaceMenu` e a sidebar refletem o nome/ícone salvos sem recarregar a página.
- [ ] `workspace.update` exige admin e tem teste de `FORBIDDEN` e de isolamento.
- [ ] URL (slug) e First month of the fiscal year são editáveis e persistem; Region mostra United States somente para leitura.
- [ ] Member onboarding mostra Welcome message e Default home view desabilitados (botão "Configure"), sem etiqueta de plano.
- [ ] Danger zone chama workspace.delete, que exige Admin e apaga Workspace e Members imediatamente.

**1.2 Members**

- [ ] `/settings/members` lista os Members do Workspace em `Table` larga (Name, Email, Status, Joined), ordenável por search param.
- [ ] "Update name…" abre Dialog, salva, atualiza a lista e o que mais mostre esse nome.
- [ ] `member.list`/`member.update` isolados por Workspace; teste de não-admin.
- [ ] Sem Invite, Export CSV, abas, Last seen, Update username, Revoke.

**2.1 Teams**

- [ ] `/settings/teams` lista Teams reais (Name+key, Members, Issues=0, Created); linha leva a `/settings/teams/:team`.
- [ ] Create team cria Team válido, trata conflito de key/slug e navega para a configuração.
- [ ] Delete team com `Confirm`; conflito tratado; teste de `CONFLICT` documentado para a Etapa 3.
- [ ] Sidebar "Your teams", breadcrumb e o grupo "Your teams" da nav de Settings vêm da API (nada fixo em `nav-data.ts`).
- [ ] Coluna **Teams** aparece em Members.

**2.2 Team settings**

- [ ] Overview reduzido, General (Name, Identifier, Description, ícone) e Members funcionam ponta a ponta.
- [ ] Renomear/trocar key persiste e reflete na sidebar; key duplicada mostra erro no campo.
- [ ] `team.get/update/members` testados (isolamento, `NOT_FOUND`, `FORBIDDEN`).

**2.3 Menu "···"**

- [ ] O botão aparece no hover, no foco e com o menu aberto; alcançável por Tab; nome acessível "Team menu".
- [ ] "Team settings" navega; "Copy URL" copia e confirma; foco volta ao gatilho ao fechar.
- [ ] Não há item sem função (Favorite, Archive, Subscribe, Slack e Leave ficam de fora).
- [ ] Revisor confirma no Linear ao vivo: posição, tamanho (24×24, raio total) e ordem de itens; divergência não registrada em `.figma/` é bloqueante.

**Geral**

- [ ] `pnpm check`, `pnpm build` e `pnpm test` verdes em cada sub-etapa; commit local e mensagem ao coordenador antes da próxima.
- [ ] Nenhum valor visual fora dos tokens; nenhum token, componente ou dependência de DS criados.
- [ ] Nenhuma página de `/design-system` alterada.

## Pendências para o responsável

Recomendação primeiro; alternativa entre parênteses. Se a resposta for "siga as recomendações", nada mais é preciso.

| #   | Pergunta                                              | Recomendação                                                                                                                                                                                                                                                                                                                                                                            |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D0  | Frames de Figma para Members/Teams/Workspace          | Alguém com o MCP autorizado roda `get_metadata` a partir de `33:20122`; até lá, Linear ao vivo é a referência                                                                                                                                                                                                                                                                           |
| D1  | Logo do Workspace                                     | Upload PNG/JPG/WebP/SVG para RustFS, até 5 MB; persistir a URL em `workspace.logoUrl`; manter `workspace.icon` como fallback se não houver logo                                                                                                                                                                                                                                         |
| D2  | URL (slug) do Workspace                               | Entra como campo editável validado em formato de segmento URL, ainda sem roteamento por Workspace                                                                                                                                                                                                                                                                                       |
| D3  | Fiscal year, Region, Member onboarding                | Fiscal year entra (mês default 1); Region constante read-only United States; onboarding desabilitado, sem etiqueta de plano                                                                                                                                                                                                                                                             |
| D4  | Delete workspace com 1 Workspace e sem auth           | Hard delete imediato, Admin-only; depois as procedures retornam erro de contexto até re-seed com pnpm db:migrate (aprovado, seguindo ADR-0016)                                                                                                                                                                                                                                          |
| D5  | Team↔Member: modelar vínculo?                         | **Sim**, `team_member` na 2.1 (alimenta coluna Teams, "Members" da lista e do Team, e "Leave team" no futuro). Sem UI de adicionar/remover agora                                                                                                                                                                                                                                        |
| D6  | Export CSV (Members e Teams) e ações extras de Member | **Adiar** CSV (sem consumidor, trivial depois). Row menu de Member só com "Update name…"                                                                                                                                                                                                                                                                                                |
| D7  | Colunas "Issues" e "Visibility" de Teams              | **Issues = 0** vindo do contrato (mesmo critério de Project); **Visibility omitida** (só existe "Workspace")                                                                                                                                                                                                                                                                            |
| D8  | Identificadores de Team                               | Slug **imutável** após criar; **key editável**, única por Workspace (`[A-Z][A-Z0-9]*`; limite de tamanho a confirmar); rotas de Settings usam **slug**, não a key do Linear                                                                                                                                                                                                             |
| D9  | Hub de configuração do Team                           | **Hub reduzido** (General, Members, Danger zone) com subpáginas reais; o hub cresce por domínio (alternativa: uma única página com General + Members em seções)                                                                                                                                                                                                                         |
| D10 | Campos de General do Team                             | Entra **Description** (`team.description`); adiados Timezone, Estimates, Create issues by email, Other                                                                                                                                                                                                                                                                                  |
| D11 | Itens do menu "···"                                   | **Team settings + Copy URL** agora; Favorite/Archive/Subscribe/Slack/Leave voltam com seus domínios; sem hints de atalho                                                                                                                                                                                                                                                                |
| D12 | Menu do Workspace com entradas mortas                 | Ligar **Workspace settings** → `/settings/workspace` e **Invite people** → `/settings/members` (o Linear faz o mesmo); **esconder** "Create workspace" e "Log out" enquanto valer o ADR-0015. Toca `workspace-menu.tsx`, da Luna; pede aprovação                                                                                                                                        |
| D13 | Layout largo para tabelas                             | `SettingsLayout` com variante larga (`max-w-content`, token existente); Workspace/Preferences/General seguem em 640 px                                                                                                                                                                                                                                                                  |
| D14 | Autorização das mutações                              | Só **admin** muda Workspace, Members e Teams; leitura para todos os Members. Exige guarda de Role no middleware (arquivo `orpc.ts`, da Luna)                                                                                                                                                                                                                                            |
| D15 | Excluir Team: hard delete?                            | **Hard delete** agora (não há Issues); o Linear tem janela de 30 dias, então é divergência deliberada a registrar em ADR curta quando aprovada (ADR-0001)                                                                                                                                                                                                                               |
| D16 | Salvar: botão ou autosave                             | **Revisto em 29/09, decisão direta do responsável: autosave, sem botão Save**, batendo com o comportamento real do Linear. Name/URL salvam ao sair do campo ou Enter, só se o valor mudou e é válido; Icon e fiscal year salvam na hora da escolha. Falha mostra toast de erro e mantém o valor digitado; sucesso não tem aviso à parte (a sidebar/menu atualizando já é a confirmação) |

## Team → General: decisões de 29/09 (revisam o D10)

O D10 acima (campos cortados) foi **revisto pelo responsável em 29/09**: o General do Team ganha os quatro grupos do Linear, observados ao vivo (Team VYZ, somente leitura).

| Grupo                  | Decisão                                                                                                                                                                                 | Estado                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Timezone               | Construído: Select pesquisável com o fuso IANA (`team.timezone`, padrão `America/Sao_Paulo`), rótulo "GMT-3:00 – Brasilia Time"                                                         | Feito                                                                                                                                                                                                                                                                                                                                                                             |
| Estimates              | Construído o Select do Team (`team.estimation`: `none`, `exponential`, `fibonacci`, `linear`, `tshirt`, rótulos e ordem exatos do Linear). O campo `estimate` mora na Issue (Time B)    | Feito. **[não confirmado ao vivo]** os campos extras que o Linear pode mostrar ao ativar (Extended estimates, Allow zero estimates, Default estimate): não foram observados para não gravar no Linear real; ficam para depois                                                                                                                                                     |
| Other                  | Construído: switch "Enable detailed issue history" (`team.detailedIssueHistory`)                                                                                                        | O campo e o switch existem; o **efeito** (uma entrada de histórico por mudança de campo, em vez de agrupar) depende da lógica de `issue_event` do Time B e é etapa futura                                                                                                                                                                                                         |
| Create issues by email | Construída só a **configuração**: switch (`team.issueEmailEnabled`), endereço `<slug>-<12 hex>@intake.zynox.app.br` gerado no servidor, Copy e Reset (o endereço antigo deixa de valer) | O endereço existe mas **não recebe nada**. **Etapa futura com dependência explícita:** receber e-mail de verdade e criar a Issue exige infraestrutura que não existe (registro MX para o domínio de intake, servidor ou serviço de recebimento e leitura/parsing da mensagem, anexos, resposta a uma issue existente). Só depois dessa infraestrutura o switch passa a ter efeito |

Também de 29/09: limites do Linear medidos ao vivo, Name do Team com 48 caracteres e Identifier com 7 (D8), e o General do Team salva sozinho, como o Workspace (D16).

## Fora do escopo

Autenticação, sessão, Guest, convites (Invite), múltiplos Workspaces, seletor/criação de Workspace, upload de arquivos exceto o logo do Workspace, Members "Application" (bots do Linear), Last seen/presença, Export CSV, Retire/arquivar Team, hierarquia de Teams (Parent team), Visibility privada, todas as subpáginas de Team ligadas a Issues/Cycles/Workflow/Triage/AI/Slack, Billing, Security, API, Applications, Usage e Import/export. Nenhuma alteração em `/design-system`.

## Observações (fora do pedido, para o coordenador)

- O "+" "Join a team" no cabeçalho de "Your teams" (Linear) não está modelado; para nós faria mais sentido "Create team", que depende de D14. Não incluído.
- Os itens "Invite people" da sidebar (seção "Try") e do `WorkspaceMenu` hoje não fazem nada; D12 cobre o segundo, o primeiro fica como está.
- `Members` mostra o handle (`andrejunio.dev`) abaixo do nome no Linear; nosso schema não tem username, então a célula só mostra o nome.
- Medições vieram de leitura do DOM do Linear (screenshots travaram no browser da Traycer nesta sessão). Larguras e ordem de itens estão confirmadas; comparação pixel a pixel fica para o revisor de fidelidade.
