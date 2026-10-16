# Spec: Foundation

Issue: [VYZ-1](https://linear.app/zynox-dev/issue/VYZ-1/foundation). Decisões de base: ADRs 0003 a 0009 em `docs/adr/`.

## Link do Figma

Arquivo: [Zynox](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Zynox), página `0:1` (o arquivo "Linear Design System (Community)" foi descartado). Login: nós `1:12610` e `1:12645`; sidebar: `1:6569`. Estrutura e medidas vêm do Figma; as cores seguem a ADR-0011 e `docs/specs/design-tokens.md`. Criação de Workspace e settings não têm nó.

Tela sem nó no Figma não trava a entrega: é montada seguindo o layout do Linear com os tokens existentes e registrada em `.figma/` como "sem design", para calibração depois.

## Escopo

A Foundation é entregue em sub-issues, nesta ordem. Cada uma é uma fatia que termina funcionando, com commit próprio.

1. **Monorepo.** Mover o front para `apps/web` e criar `apps/api`, `packages/contract` e `packages/db` vazios e ligados. Nenhum código de back-end ainda.
2. **Esqueleto da API.** Hono + oRPC servindo um procedimento de saúde; Drizzle conectado ao Postgres com a primeira migration; o front chamando a API via `apps/web/src/services` + TanStack Query; Traefik roteando `/api`. Inclui a verificação do TypeScript 7 com oRPC, Drizzle e Better Auth.
3. **Design tokens.** Variáveis do Figma em `tokens.css` (depende do link).
4. **Autenticação.** Tela de login e API, com Better Auth.
5. **Workspace.** Criação, isolamento entre Workspaces (middleware da ADR-0007) e seletor.
6. **Member e Roles.** Convite, listagem e troca de Role (Admin, Member, Guest).
7. **Team.** Criação, Team key, membros e Workflow padrão criado junto com o Team.
8. **App shell e sidebar** com dados reais (Workspace e Teams).

## Comportamento

Tudo segue o Linear atual. Os pontos abaixo fixam o que a Foundation precisa entregar.

**Monorepo (1)**

- `pnpm dev` na raiz sobe o front (porta 3000). A API entra no `pnpm dev` no passo 2, quando passa a existir.
- `pnpm check` e `pnpm build` na raiz cobrem todos os pacotes; nos pacotes sem artefato de build (`contract`, `db`), o build é a checagem de tipos.
- O `AGENTS.md` é atualizado com os novos caminhos (stack, alias `@/`, organização e comandos). Isso faz parte do passo, não é mudança fora do escopo.

**API (2)**

- Front e API ficam na mesma origem: o Traefik manda `zynox.localhost/api/*` para a API no host e o resto para o Vite. Assim os cookies de sessão funcionam sem CORS.
- Migrations geradas por `drizzle-kit generate` e aplicadas por um comando próprio (`pnpm db:migrate`). Ver ADR-0005.

**Autenticação (4)**

- Métodos de login iguais ao Linear: código ou link por e-mail e Google. Sem senha.
- Login por e-mail entra primeiro. Google fica preparado por variáveis de ambiente (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) e só aparece quando elas estiverem definidas; as credenciais não bloqueiam a Foundation.
- E-mail sai por uma interface única da API (ADR-0010): Mailpit no Docker em desenvolvimento, API transacional do Brevo via HTTP em produção (`BREVO_API_KEY`).
- Sessão em cookie httpOnly guardada no Postgres (ADR-0006).
- Rotas do app exigem sessão; sem sessão, redireciona para o login e volta ao destino depois.

**Workspace (5)**

- Depois do primeiro login, quem não tem Workspace cria um: nome e URL (slug). Como no Linear, o Workspace já nasce com um primeiro Team; isso é entregue no passo 7, junto com o modelo de Team.
- Todas as rotas do app ficam sob `/:workspaceSlug/...`. A URL define o Workspace ativo.
- O seletor fica no menu do Workspace, no topo da sidebar, e lista os Workspaces da pessoa.
- Acessar o slug de um Workspace do qual a pessoa não é Member dá "não encontrado", sem revelar que ele existe.

**Member e Roles (6)**

- Admin convida por e-mail escolhendo a Role, lista os Members, muda a Role e remove.
- Guest só vê os Teams para os quais foi convidado (ADR-0006).
- O Workspace sempre mantém pelo menos um Admin.

**Team (7)**

- Criar Team com nome e Team key. A key é sugerida a partir do nome, em maiúsculas, e é única no Workspace. As regras de validação seguem o Linear e são conferidas nele durante a implementação.
- Ao criar o Team, o Workflow padrão do Linear é criado junto: Backlog, Todo, In Progress, Done, Canceled e Duplicate, cada um na sua categoria. A lista também é conferida no Linear.
- Membros do Team: adicionar e remover Members do Workspace.

**App shell e sidebar (8)**

- A sidebar mostra o menu do Workspace (com o seletor) e a seção "Your teams" com os Teams da pessoa.
- Itens de features que ainda não existem (Inbox, Issues, Projects, Views, Cycles) não aparecem. Cada um entra junto com a sua fatia.
- Navegação por teclado com foco visível. Atalhos do Linear entram junto com as features que acionam.

## Estados

Para cada tela (login, criação de Workspace, settings de Members e Teams, sidebar): padrão, hover, foco, desabilitado, vazio (por exemplo, Workspace sem Teams), carregando e erro (falha de rede, sessão expirada, convite inválido ou expirado, Team key duplicada).

## Critérios de aceite

- [ ] Depois do passo 1: `pnpm check` e `pnpm build` passam sem avisos, e `pnpm dev` com Traefik abre `zynox.localhost` com HMR funcionando.
- [ ] TypeScript 7: oRPC, Drizzle e Better Auth compilam, e a inferência chega ao front. Se algo falhar, o erro e a alternativa vão para o responsável antes de mudar a versão.
- [ ] Login por e-mail funcionando de ponta a ponta, com o e-mail capturado no Mailpit. Logout invalida a sessão na hora.
- [ ] Google preparado: com as variáveis definidas, o botão aparece e o fluxo usa as credenciais; sem elas, o botão não aparece.
- [ ] Criar Workspace cria também o primeiro Team com o Workflow padrão.
- [ ] Uma pessoa em dois Workspaces troca entre eles pelo seletor, e cada um mostra só os próprios dados.
- [ ] Todo procedimento da API tem teste de autorização provando que dados de outro Workspace (e, para Guest, de outros Teams) são inacessíveis. Ver ADR-0007.
- [ ] Admin convida, muda Role e remove Member. Guest vê só os Teams dele.
- [ ] Team key única por Workspace, com erro claro em caso de duplicata.
- [ ] Sidebar com dados reais, sem mocks.
- [ ] Telas com nó no Figma batem com ele em todos os estados acima; telas sem nó seguem o layout do Linear e estão registradas em `.figma/` como "sem design". Nenhuma usa valor fora dos tokens.
- [ ] Revisão pelo `figma-fidelity-reviewer` sem bloqueantes, e validação do responsável no navegador.

## Fora do escopo

- Qualquer entidade de trabalho: Issue, Project, Cycle, View, Label e Comment ficam nas suas próprias issues.
- Personalizar o Workflow (VYZ-4). Aqui só existe o padrão.
- Tempo real por SSE: entra com a primeira entidade que mudar enquanto alguém olha (Issue).
- SAML, passkeys e 2FA.
- Deploy na VPS e backup do Postgres.
- Qualquer uso do Redis (ADR-0008).

## Decisões do responsável

- **Dependências aprovadas** (regra 5): `hono`, `@hono/node-server`, `@orpc/server`, `@orpc/client`, `@orpc/contract`, `@orpc/tanstack-query`, `zod`, `drizzle-orm`, `drizzle-kit`, `postgres`, `better-auth`, `vitest`, `tsx` e, se o adaptador do Mailpit precisar, `nodemailer`. O `pg-boss` fica para o primeiro job. Aprovados depois, no passo 2: `@types/node` (API e db) e `allowBuilds: esbuild: true` no `pnpm-workspace.yaml` (script de instalação do esbuild, usado por tsx e drizzle-kit).
- **E-mail:** Mailpit em dev e Brevo em produção, atrás de uma interface (ADR-0010). SPF/DKIM/DMARC ficam para o deploy.
- **Google OAuth:** preparado por variáveis de ambiente; credenciais criadas depois, sem bloquear.
- **Telas sem Figma:** seguem o Linear com os tokens existentes e ficam registradas em `.figma/` como "sem design".
- **Link do Figma:** pedido ao responsável antes do passo 3.
