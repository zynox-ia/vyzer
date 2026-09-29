# Workspace, Team e Project — fatia vertical inicial

## Link do Figma

- [Projects list, nó 25:4964](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Vyzer?node-id=25-4964)
- [Project Details, nó 25:4689](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Vyzer?node-id=25-4689)

As telas do produto já existem e serão mantidas visualmente. O Figma e os componentes atuais são referência para preservar a apresentação; esta fatia substitui a origem dos dados.

## Escopo

Persistir e expor Workspace, Member, Team e Project; aplicar em todas as procedures o middleware de resolução de Workspace/Member definido pelas ADRs 0007 e 0015; e consumir a API real nas telas de Projects e nos nomes de Team usados pela sidebar.

O Workspace inicial chama-se `Zynox`. Os Teams iniciais mantêm os nomes `Zynox` e `Vyzer`, alinhados aos exemplos atuais. A seed cria exatamente um Workspace e um Member `admin`, com ids fixos definidos em `packages/db/src/seed.ts`. Os dados de Team e Project iniciais serão necessários para substituir a lista de exemplo por registros persistidos.

A seed também cria os seis Projects do exemplo atual e seus vínculos com Team. O Member `admin` é André Júnio (`andrejunio.dev@gmail.com`).

Não haverá mudança visual nem alteração no design system. As telas continuam usando somente componentes e tokens existentes.

## Etapas de implementação

**Sequenciais, não paralelas.** Cada etapa é uma fatia vertical completa (banco → API → services → tela) só da própria entidade, fechada, testada e revisada antes de a próxima começar. Nenhuma etapa toca arquivos da etapa seguinte. Ao fim de cada etapa: `pnpm check`/`build`/`test` verdes, commit local, mensagem ao coordenador — e só depois da confirmação a próxima etapa começa.

### Etapa 1 — Workspace e Member

| Camada   | O que entra                                                                                                                                                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco    | Tabelas `workspace` e `member`. Seed idempotente: 1 Workspace (`Zynox`), 1 Member admin (André Júnio, `andrejunio.dev@gmail.com`), ids fixos.                                                                                                           |
| API      | Middleware de resolução de Workspace/Member (ADR-0007 + ADR-0015) aplicado a toda procedure futura. Uma procedure mínima que prove o contexto funciona (ex.: retornar o Workspace/Member resolvidos).                                                   |
| Services | Nenhum ainda, a menos que a etapa 1 já exponha algo visível (ver Tela).                                                                                                                                                                                 |
| Tela     | O nome do Workspace na sidebar (`WorkspaceMenu`) passa a vir da API em vez do valor fixo `"Zynox"` passado como prop — é o único ponto visível desta etapa, prova que o pipeline banco→API→tela funciona ponta a ponta antes de Team/Project existirem. |

Critérios de aceite da etapa 1:

- [ ] Schema e migration de `workspace`/`member` only.
- [ ] Seed idempotente com ids fixos.
- [ ] Middleware de contexto testado (isolamento: outro Workspace/Member não vaza).
- [ ] `WorkspaceMenu` mostra o nome real vindo da API.
- [ ] Nenhum arquivo de Team ou Project tocado.

### Etapa 2 — Team

| Camada   | O que entra                                                                                                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco    | Tabela `team` (workspaceId, name, slug, key, ícone/cor, timestamps), únicos por Workspace. Seed dos Teams `Zynox` e `Vyzer`.                                                                                                                                                                                        |
| API      | Contrato + router de Team: list/create/update/delete, escopados pelo contexto da etapa 1. Bloqueio de delete com Project associado fica documentado aqui mas só é testável de verdade na etapa 3 (quando Project existir) — anote como pendência, não implemente a checagem contra uma tabela que ainda não existe. |
| Services | `apps/web/src/services/teams.ts`.                                                                                                                                                                                                                                                                                   |
| Tela     | Seção "Your teams" da sidebar e o Team do breadcrumb passam a vir da API. `projects-list.tsx`/`project-detail.tsx` continuam com `project-data.tsx` por enquanto — não mexer ainda.                                                                                                                                 |

Critérios de aceite da etapa 2:

- [ ] Schema e migration de `team` only (mais o que a etapa 1 já criou).
- [ ] CRUD/list de Team no contrato/router, com teste de isolamento por Workspace.
- [ ] Sidebar usa Team real.
- [ ] Nenhum arquivo de Project tocado.

### Etapa 3 — Project e Project-Team

| Camada   | O que entra                                                                                                                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco    | Tabela `project` + junção `project_team` (N:N). Seed dos seis Projects de exemplo com seus vínculos de Team.                                                                                      |
| API      | Contrato + router de Project: list (com `teamSlug` opcional)/detail/create/update/delete. Agora sim, a checagem de "Team não pode ser excluído com Project associado" (etapa 2) ganha teste real. |
| Services | `apps/web/src/services/projects.ts`.                                                                                                                                                              |
| Tela     | `projects-list.tsx`, `project-detail.tsx`, `teams/:team/projects` passam a consumir a API real, substituindo `project-data.tsx` nessas telas.                                                     |

Critérios de aceite da etapa 3: os originais do documento (schema completo, seed dos 6 Projects, CRUD/list de Project, telas consumindo Services, estados de erro/vazio/carregando, teste de isolamento) — ver seção "Critérios de aceite" abaixo, que descreve o resultado final depois das três etapas.

## Modelo proposto

- **Workspace**: `id`, `name`, `createdAt`, `updatedAt`.
- **Member**: `id`, `workspaceId`, `name`, `email`, `role`; o valor inicial é `admin`. A coluna representa os papéis definidos no domínio, sem implementar Guest ou convites nesta fatia.
- **Team**: `id`, `workspaceId`, `name`, `slug`, `key`, ícone/cor compatíveis com `ProjectIconValue`, timestamps. `key` e `slug` são únicos dentro do Workspace; `key` fica disponível para o domínio de Issues futuro.
- **Project**: `id`, `workspaceId`, `name`, ícone/cor compatíveis com `ProjectIconValue`, status, saúde, prioridade, lead opcional (Member), data-alvo opcional e timestamps.
- **Project-Team**: relação muitos-para-muitos. Um Project pode pertencer a vários Teams; uma relação só pode existir quando ambos pertencem ao mesmo Workspace.

O contrato de `Project` não aceita `workspaceId` do chamador. A lista pode receber `teamSlug` para escopo por Team; o servidor resolve o Team dentro do Workspace do contexto e retorna apenas Projects ligados a ele. A rota de Project individual continua usando o id opaco da API.

`issues` e `progress` não são propriedades graváveis nesta fatia: dependem de Issues, que estão fora do escopo; o contrato os calcula como zero até a fatia de Issues. `milestone` não será migrado da string de exemplo, pois Milestone é outro conceito de domínio. As colunas de contagem e progresso permanecem na lista.

## Comportamento

- `/projects` lista Projects persistidos do Workspace; `/teams/:team/projects` lista os Projects associados ao Team correspondente ao `slug` da rota.
- Abrir `/projects/:projectId` carrega o Project pela API. Um id inexistente preserva o EmptyState existente de Project não encontrado.
- Sidebar e breadcrumb de Team mostram os Teams retornados pela API, com nome e ícone persistidos.
- Busca, filtros, ordenação, agrupamento, aba ativa e favorito continuam nos search params atuais. A consulta considera o filtro Team da rota sem alterar os demais parâmetros.
- Procedures de criação, atualização e exclusão ficam disponíveis no contrato/backend. Esta fatia não acrescenta formulários de CRUD no frontend; os controles visuais existentes permanecem fora de implementação funcional.
- Excluir um Team com Projects associados retorna conflito e não altera os dados. Excluir ou atualizar um Team sem vínculos só afeta registros dentro do Workspace do contexto.
- O middleware resolve os ids fixos da seed em todo procedimento e associa o Member e Workspace carregados ao contexto. Procedures não recebem Workspace arbitrário do cliente.

## Estados

- **Padrão**: conteúdo atual renderizado com dados vindos da API.
- **Hover, foco, ativo e desabilitado**: seguem os estados e componentes existentes do design system; sem alteração visual.
- **Vazio**: lista sem resultados mantém o EmptyState/texto atual de lista vazia; nenhum Project encontrado mantém o EmptyState existente.
- **Carregando**: indicar carregamento com o componente de Skeleton/Spinner já existente, sem deslocar controles ou inventar token.
- **Erro**: apresentar feedback acessível com componentes existentes; permitir nova tentativa pela query/refetch. Erros de rede não são tratados como lista vazia nem como Project inexistente.

## Segurança e testes

- Cada procedure de leitura e mutação é testada com dados de outro Workspace e comprova que não os lista, lê, atualiza nem exclui.
- Nenhuma procedure pode consultar ou mutar dados sem o middleware obrigatório de Workspace/Member.
- O contexto da seed é testável sem depender de sessão; não há login, sessão ou troca de Workspace.

## Critérios de aceite

- [ ] Schema, relações e migrations SQL representam Workspace → Team → Project com Projects associados a um ou mais Teams.
- [ ] A seed é idempotente e cria um Workspace e um Member admin com ids fixos, além dos dados iniciais de Team/Project acordados.
- [ ] CRUD/list de Team e Project está descrito no contrato compartilhado e implementado no router.
- [ ] Todas as procedures usam Workspace resolvido pelo middleware e têm teste de isolamento por Workspace.
- [ ] Projects list, detail e Teams exibidos pela sidebar consomem dados reais via Services e TanStack Query.
- [ ] A lista mantém os search params e os estados existentes; falha de rede, carregamento, vazio e not found são estados distintos.
- [ ] Nenhuma tela de `/design-system` é alterada; nenhum componente, token ou dependência de design system é criado.

## Fora do escopo

Issue, Workflow, Status de Issue, Cycle, Label, Triage, Guest, convite, autenticação/Login, sessão real, múltiplos Workspaces e seletor de Workspace. Formulários de CRUD no frontend também ficam fora desta entrega. Não alterar as páginas de `/design-system` nem implementar Milestone.

## Decisões aprovadas

- Semear `Aname CRM`, `Plugga OS`, `Mv School`, `ZynCloud`, `Zynox OS` e `Teste` com seus atributos de Project e vínculo de Team. `issues` e `progress` começam em zero; `milestone` não é persistido.
- Usar `andrejunio.dev@gmail.com` no Member admin fixo.
- Bloquear exclusão de Team enquanto houver Projects associados; limitar atualização e exclusão ao Workspace do contexto.
