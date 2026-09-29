# Spec: Settings → Administration → Security, API e Usage & limits

Complementa [`settings-administration.md`](./settings-administration.md) (Workspace, Members, Teams), que deixou estas três páginas em "Fora do escopo". Billing e Import & export foram removidas da navegação pelo responsável; estas três ele decidiu **manter**. Não edita nenhuma outra spec.

**Estado desta spec: rascunho para aprovação. Nada foi implementado.**

## Veredito por página

A pesquisa no Linear ao vivo mudou duas das três premissas do pedido. Resumo primeiro, evidência depois.

| Página             | Recomendação                                                                  | Motivo em uma linha                                                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Security**       | **Adiar a página inteira** (nav e placeholder ficam)                          | A página de admin do Linear **não** é senha/2FA/sessões (isso é `Security & access`, de outro grupo). É política do Workspace: convite por link, domínios, login, quem pode o quê. Tudo depende de auth, convites ou plano. |
| **API**            | **Construir agora**, em 4 sub-etapas                                          | Chave pessoal de API não depende de sessão: cabe no Member/Workspace fixos da ADR-0015 e é o que o responsável quer para MCP e integrações. Duas seções do Linear (OAuth apps, Webhooks) ficam de fora, com motivo.         |
| **Usage & limits** | **Adiar o conteúdo; registrar a divergência em ADR agora** (placeholder fica) | Nada mede uso de IA ainda: o chat do agente é mock (`features/agent/data.ts`), sem chamada a modelo nem backend. Construir o livro-razão antes do primeiro agente real é adivinhar unidade, preço e ponto de bloqueio.      |

Duas ressalvas de honestidade que o responsável precisa ler antes de aprovar:

1. **Chaves de API não protegem nada enquanto valer a ADR-0015.** Sem login, quem alcança a API já é o Admin sem apresentar token. Uma chave com permissão "Read" só é restrição real para o cliente que **apresenta** a chave; quem omitir o header cai no Member fixo. Hoje as chaves valem por atribuição, "Last used" e por já estarem prontas no dia em que o fallback da seed sair. Ver D7.
2. **O que uma chave chama hoje é o endpoint oRPC** (`/api/rpc`, protocolo RPC do oRPC), não uma API pública documentada (o Linear expõe GraphQL). Para "conectar MCP e outras aplicações" ainda falta uma superfície pública ou um servidor MCP: outra feature, que consome estas chaves. Não está nesta spec (D13).

## Link do Figma

**Sem frame.** O MCP do Figma (`plugin:figma:figma`) não está autorizado nesta sessão, e o `33:20122` só tem a navegação lateral de Settings (registrado em `.figma/01-design-tokens.md`). A referência de fidelidade é o **Linear ao vivo** (levantamento abaixo); o que não tiver equivalente segue os tokens e padrões já implementados. Se alguém com o MCP autorizado achar frames destas páginas, o revisor de fidelidade os compara na etapa correspondente.

## Levantamento ao vivo (Linear, workspace `zynox-dev`, 29/09, somente leitura)

Nada foi criado nem alterado no Linear. Formulários foram abertos e fechados sem enviar.

### Security (admin) — `/settings/security`

Cabeçalho "Security". Seções, na ordem, com o estado real no workspace:

| Seção                            | Linha                                                                                                                                                                                                 | Estado observado                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Workspace access                 | **Invite links** (Switch "Enable invite links")                                                                                                                                                       | desligado                                          |
| Workspace login and restrictions | Approved email domains (lista + botão "Add domain")                                                                                                                                                   | "No approved email domains"                        |
| Authentication methods           | Google authentication · Email & passkey authentication (Switches)                                                                                                                                     | ligados e **desabilitados** (admins sempre entram) |
| Authentication methods           | SAML & SCIM                                                                                                                                                                                           | link "Available on Enterprise"                     |
| Workspace management             | New user invitations · Team creation · Workspace initiatives · Manage workspace labels/templates/pinned views/loops                                                                                   | todas "Available on Basic/Business"                |
| Workspace management             | **API key creation** (Select: All members / Only admins) · **Import data** (Select) · **Modify agent guidance** (Select)                                                                              | os únicos três controles vivos da seção            |
| Workspace management             | File uploads                                                                                                                                                                                          | "Available on Enterprise"                          |
| Integrations & applications      | Review third-party applications · Reduce personal information from support integrations · Prevent guests from interacting with agents                                                                 | "Available on Basic/Enterprise"                    |
| AI & Agents                      | Improve AI features by sharing usage data · Enable Linear Agent web search · Enable Linear Agent MCP connectors (Switches, ligados) · Active MCP connections (link) · Allowed MCP connectors (Select) | vivos                                              |
| Compliance                       | HIPAA compliance                                                                                                                                                                                      | "Available on Enterprise"                          |

### Security & access (pessoal) — `/settings/account/security`

Esta é a página de senha/sessões que o pedido imaginava, e é do grupo **Personal** (`/settings/security` no Vyzer, hoje placeholder): **Sessions** (dispositivos, Log out, "Revoke all"), **Passkeys**, **Personal API keys** ("Use Linear's GraphQL API to build your own integrations", botão "New API key", linhas com nome · criada · último uso · "Full access" · "2 Teams"), **Commit signing key**, **Authorized applications** (OAuth aprovados, com Revoke).

### API (admin) — `/settings/api`

Texto de abertura + três seções: **OAuth applications** (vazio, "New OAuth application"), **Webhooks** (vazio, "New webhook"), **API keys** ("Control whether workspace members can create personal API keys. View your own keys in Security & access settings.") com a linha **API key creation** (Select: **All members** / **Only admins**) e a linha **Issued keys** ("View and manage issued API keys", "1 API key", leva a `/settings/api/keys`).

- **Issued keys** (`/settings/api/keys`, largura cheia): filtro "Filter by key or member…", filtro de status (All API keys / Active / Inactive), **Export CSV**. Colunas **Key · Created by · Permissions · Created · Last used · Status**, todas ordenáveis (padrão: Created, decrescente). Por linha: botão "View permissions for <key>" (popover) e menu "Open menu" com **Revoke API key**.
- **New API key** (`/settings/account/security/api-keys/new`, página, não diálogo; voltar em "Security settings"): título "Create API key", subtítulo "When using the API key all actions are attributed to you as an individual". **Key name** (placeholder "A descriptive name for this API key…"). **Permissions** ("Only enable the minimum permissions required for your use case"): rádio **Full access** ou **Only select permissions…**, que abre cinco checkboxes: **Read** ("Read all workspace data available to you") · **Write** ("Read and write all workspace data available to you") · **Create issues** ("Create and update issues") · **Create comments** ("Create issue comments") · **Admin** ("Access admin-only API features"). **Team access** ("Set limits around which teams can be accessed via this API key"): rádio **All teams you have access to** ou **Only select teams…**. Botões **Cancel** / **Create**.
- **New OAuth application** (`/settings/api/applications/new`): Application icon (upload, ≥256×256), Application name, Developer name, Developer URL, Description, Redirect URIs, GitHub username, Public (Switch), Client credentials (Switch), Webhooks (Switch). Cancel / Create.
- **New webhook** (`/settings/api/webhooks/new`): Label, URL, Signing secret, **Data change events** (15 tipos: Comments, Customer requests, Customers, Cycles, Documents, Emoji reactions, Initiative updates, Initiatives, Issue Labels, Issue attachments, Issues, Project Labels, Project updates, Projects, Users), **Other events** (Issue SLA), **Team selection** ("This field cannot be modified after creation", padrão "All public teams").
- **Não observado:** o que aparece depois de "Create" (o token exibido uma vez) e a lista de times no "Only select teams…". Assumo o padrão do setor (diálogo com o token e botão Copy, exibido uma única vez); quem tiver a mão no Linear confirma antes da API.2.

### Usage & limits — `/settings/usage`

**Não é uso de plano/seats**, como o pedido supunha: o Linear de hoje mostra **créditos de IA e gasto**, já no formato que o responsável quer reaproveitar.

- Cabeçalho "Usage & limits" ("Track usage, manage credits, and set spend limits across your workspace").
- **AI credits** ("Credits apply to usage of Coding sessions and Loops"): "Workspace credits $0.00 remaining" + **Add credits**; "Automatic reload: Disabled" + **Manage**; linha **Spend limits** ("Set workspace and user limits", "No limits set", leva a `/usage/spend-limits`).
- **Analytics**: seletor de período ("Week", "Sep 28 – Oct 4", Change period / Previous / Next), total do período ("$0.00 total spend…"), **gráfico de barras por dia** (eixo em dólares), legenda por **Feature** (Coding sessions, Loops, cada uma com botão de série e valor), link "View all usage sessions". Vazio: "No usage this week".
- **History** (`/usage/history`): "We retain up to 6 months of usage history"; período; filtro "Add filter", Display options; colunas **User · Team · Feature · Started · Last activity · Cost**; vazio: "No usage in this period".
- **Spend limits** (`/usage/spend-limits`): **Reset schedule** ("Daily at 4 PM (GMT-3) · Weekly on Sunday · Monthly on the 12th", Edit); **Workspace limit** (Default limit, "No limit set", Set limit, Reset frequency "Weekly"); **User limits** (Per-user limit, idem); **Overrides** (limites por usuário).

## 1. Security: adiar

Nada aqui é construível hoje sem inventar controle. Cada seção, com o que a bloqueia e quando volta:

| Seção do Linear                                                                                              | Por que não agora                                                                                                                        | Volta quando                                                          |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Invite links, Approved email domains, New user invitations                                                   | Convites estão excluídos pela ADR-0015; sem login não há quem use o link                                                                 | Auth (Better Auth, ADR-0006) e convites existirem                     |
| Google / Email & passkey authentication                                                                      | Escolhem métodos de login que não existem                                                                                                | Auth                                                                  |
| SAML & SCIM, File uploads, Review third-party apps, HIPAA, Reduce personal information, Prevent guests…      | São "Available on Enterprise/Basic": gated por plano, sem mutação real (mesmo tratamento do Member onboarding na spec de Administration) | Nunca por plano; só se o responsável quiser a linha desabilitada (D1) |
| Team creation, Workspace initiatives, Manage labels/templates/pinned views/loops                             | Política "quem pode" sobre domínios que ainda não existem, ou que hoje só têm um Member (Admin)                                          | Cada domínio existir **e** houver mais de um Member                   |
| **API key creation**                                                                                         | Único controle vivo com consumidor, mas é a **mesma linha** da página API                                                                | Já entra na API.3; aqui só quando Security voltar                     |
| Import data                                                                                                  | Import & export foi removida da navegação                                                                                                | Não se aplica                                                         |
| Modify agent guidance, AI & Agents (web search, MCP connectors, data sharing, Active/Allowed MCP connectors) | Configuram o agente de IA, que hoje é mock                                                                                               | Agente real e Usage & limits existirem                                |

- **O que fica:** item de nav "Security" (`/settings/security-admin`, já existe) e o placeholder atual. Rota `security-admin` mantida (`/settings/security` é o Personal "Security & access").
- **Alternativa (D1, contra a recomendação):** entregar o esqueleto de todas as linhas **desabilitadas** com o rótulo de bloqueio, como a spec de Administration fez com "Available on Enterprise". Copia o Linear campo a campo, mas resulta numa página quase toda inerte e exige inventar o texto do bloqueio ("Available with authentication" não existe no Linear). Só vale se o responsável quiser ver a estrutura.
- **Cuidado com a regra "campo a campo" (memória do projeto):** cortar uma linha do Linear exige aprovação por item. Esta spec **não corta**: ela **sequencia** (tabela acima) e pede a aprovação em D1.

## 2. API: construir agora

### Modelo

**Chave pessoal (Personal API key)** pertence a um Member, num Workspace. Toda ação com a chave é atribuída a esse Member ("all actions are attributed to you"). A chave **nunca excede o Role do Member**: permissão efetiva = permissão da chave **e** Role do Member (uma chave "Admin" de um Member comum continua sem poder de admin).

| Decisão               | Proposta                                                                                                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formato do token      | `vyz_` + 32 bytes aleatórios em base64url. O prefixo `vyz_` permite detectar vazamento em scanners de segredo                                                                                      |
| Armazenamento         | **Só o hash SHA-256** do token (token de alta entropia, sem necessidade de bcrypt), mais os 8 primeiros caracteres para exibição na tabela. O token completo aparece **uma única vez**, na criação |
| Expiração             | **Sem expiração**, como o Linear (não há campo de validade). Revogar = marcar `revoked_at`; a chave revogada aparece como **Inactive**                                                             |
| Permissões            | `full`, ou uma seleção de `read`, `write`, `issues:create`, `comments:create`, `admin` (as cinco observadas). `write` implica `read`. Ver D5                                                       |
| Escopo de Team        | "All teams" por padrão; "Only select teams" exige a tabela de Team. Ver D6                                                                                                                         |
| Política do Workspace | `workspace.api_key_policy`: `all_members` (padrão) ou `admins`. Criar chave sob `admins` por um não-admin → `FORBIDDEN`                                                                            |
| "Last used"           | `last_used_at` atualizado quando uma requisição autenticada por chave chega, no máximo uma escrita por chave por minuto                                                                            |

### Como a chave autentica (a costura que a ADR-0015 deixou)

A ADR-0015 mantém o middleware do ADR-0007 e troca só "a função que resolve quem está pedindo". Aqui ela ganha um primeiro ramo real:

1. Header `Authorization: Bearer vyz_…` presente → hash, busca `api_key` não revogada → Workspace e Member **da chave**, mais as permissões dela no contexto. Chave desconhecida ou revogada → `UNAUTHORIZED` (nunca cai no seed: quem apresenta credencial inválida é recusado).
2. Sem header → o resolver da seed (ADR-0015), como hoje. **A web nunca envia token**; nada muda para ela.

Enforcement por tipo de procedure (regra; o mecanismo, `meta` no contrato ou middleware, fica com o implementador dentro do formato do ADR-0007):

| Procedure                                   | Exige da chave                                           |
| ------------------------------------------- | -------------------------------------------------------- |
| Consulta (list/get/current)                 | `read` (ou `write`, `full`)                              |
| Mutação                                     | `write` (ou `full`)                                      |
| `adminOnly`                                 | `admin` (ou `full`) **e** Role admin do Member           |
| Criar issue / comentário (quando existirem) | `issues:create` / `comments:create` (ou `write`, `full`) |

Toca `apps/api/src/orpc.ts` (assinatura do resolver passa a receber os headers, que já estão no `Context`). Arquivo compartilhado com o Time A: ver "Coordenação".

### Fatia vertical

| Etapa     | Banco                                                                                                                                                                                                          | API (contrato + router)                                                                                                                                                                                                                                                            | Tela                                                                                                                                                | Depende de                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **API.1** | `api_key` (`id`, `workspace_id`, `member_id`, `name`, `token_prefix`, `token_hash` único, `permissions` jsonb, `created_at`, `last_used_at`, `revoked_at`); `workspace.api_key_policy` (default `all_members`) | `apiKey.create` `{ name, permissions }` → `{ key, token }` (token só aqui); `apiKey.list` `{ scope: "mine" \| "workspace" }` (`workspace` exige admin); `apiKey.revoke` `{ id }`; `workspace.update` aceita `apiKeyPolicy` (admin); resolver por Bearer; enforcement de permissões | nenhuma                                                                                                                                             | Etapa 1.1b da Administration (concluída) |
| **API.2** | —                                                                                                                                                                                                              | —                                                                                                                                                                                                                                                                                  | Seção **Personal API keys** em `/settings/security`; página `/settings/security/api-keys/new`; diálogo do token exibido uma vez; revogar pela linha | API.1                                    |
| **API.3** | —                                                                                                                                                                                                              | —                                                                                                                                                                                                                                                                                  | `/settings/api` (abertura, seção API keys com **API key creation** e **Issued keys**); `/settings/api/keys` (tabela larga)                          | API.1, API.2                             |
| **API.4** | `api_key.team_scope` (jsonb, nulo = todos)                                                                                                                                                                     | `apiKey.create` aceita `teamIds`; leitura do Team filtra por escopo                                                                                                                                                                                                                | Campo **Team access** no formulário; coluna Permissions mostra "N Teams"                                                                            | Tabela `team` (Time A, 2.1)              |

API.2 e API.3 são sequenciais porque a tabela de Issued keys só tem o que mostrar depois que existe criação.

### Telas

**Personal API keys (`/settings/security`, Personal → Security & access).** Só esta seção entra; Sessions, Passkeys, Commit signing key e Authorized applications dependem de auth/OAuth e ficam de fora, **sem** cabeçalho vazio (D3). Cabeçalho da seção "Personal API keys" + botão **New API key**; linhas: nome · "Created <data>" · "Last used <data>" (ou "Never used") · "Full access" ou lista curta de permissões · "All teams" (ou "N Teams" na API.4) · botão de revogar. Vazio: `EmptyState` "No API keys" com ação **New API key**.

**Create API key (`/settings/security/api-keys/new`).** Página no `SettingsLayout` (640 px), com link de volta a "Security & access". Campos na ordem do Linear: **Key name** (obrigatório), **Permissions** (rádio Full access / Only select permissions…, esta abrindo os cinco `Checkbox` com a descrição de cada), **Team access** (só na API.4). Cancel / Create; Create desabilitado sem nome, e sem nenhuma permissão marcada quando em "Only select". Enter num campo de texto **não** envia. Sucesso: `Dialog` com o token em campo somente leitura, botão **Copy** (toast "Copied"; falha do clipboard vira toast de erro), aviso de que ele não será mostrado de novo, botão **Done**. Fechar o diálogo volta para a lista.

**API (`/settings/api`).** Coluna de 640 px. H1 "API" + texto de abertura; seção **API keys** com a linha **API key creation** (Select All members / Only admins; salva ao escolher, como o autosave da spec de Administration, D16) e a linha **Issued keys** ("View and manage issued API keys", contagem, link para `/settings/api/keys`). Somente Admin altera a política; não-admin vê o Select desabilitado. Seções OAuth applications e Webhooks **não aparecem** (D9, D10).

**Issued keys (`/settings/api/keys`).** Largura cheia (variante larga do `SettingsLayout`, D13 da Administration). `Table` com colunas **Key** (nome + prefixo), **Created by**, **Permissions** (com o botão que abre o `Popover` da lista de permissões), **Created**, **Last used**, **Status** (Active/Inactive). Ordenação por coluna em search param (`?sort=created&dir=desc`), filtro de status e busca em search params (regra 8). Menu da linha ("Open menu"): **Revoke API key** com `Confirm` danger. Só Admin vê a lista do Workspace inteiro; não-admin recebe só as próprias (mesma tabela, `scope: "mine"`). **Export CSV** adiado (D11).

### Estados

| Estado         | Comportamento                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Carregando     | `Skeleton` no lugar das linhas, sem deslocar controles                                                                                                                       |
| Vazio          | Lista pessoal: `EmptyState` com **New API key**. Issued keys: `EmptyState` "No API keys" (sem ação, quem cria é a página pessoal)                                            |
| Erro           | `Alert` com nova tentativa; erro de rede não vira "vazio". Falha ao criar mantém o formulário e mostra `Alert`/`FormMessage`; falha ao revogar mostra toast e mantém a linha |
| Sem permissão  | Não-admin: Select de política desabilitado; criar com política `admins` mostra o motivo em vez do formulário. A API devolve `FORBIDDEN` de qualquer forma                    |
| Chave revogada | Linha continua na tabela como **Inactive**; menu sem "Revoke"; presente em "All API keys" e "Inactive"                                                                       |

### Critérios de aceite

**API.1**

- [ ] O token completo nunca é persistido, logado nem devolvido depois da criação; teste lê a linha crua e não encontra o token.
- [ ] Bearer válido resolve Workspace/Member da chave; inválido ou revogado → `UNAUTHORIZED`; sem header → seed (ADR-0015). Um teste por caso.
- [ ] Chave `read` recebe `FORBIDDEN` numa mutação; chave `admin` de Member comum recebe `FORBIDDEN` em `adminOnly`; `full` de Admin passa.
- [ ] `apiKey.list` isolada por Workspace (ADR-0007); `scope: "workspace"` exige admin; `revoke` de chave de outro Workspace → `NOT_FOUND`.
- [ ] Política `admins`: não-admin não cria chave; `all_members`: cria.
- [ ] `last_used_at` atualiza sem escrever a cada requisição.

**API.2**

- [ ] Formulário com os campos e textos do Linear; Create desabilitado enquanto inválido; token exibido uma vez e copiável.
- [ ] Chave criada aparece na lista pessoal e funciona contra `/api/rpc` com `Authorization: Bearer` (teste de ponta a ponta).
- [ ] Revogar remove o acesso imediatamente (mesma chave passa a receber `UNAUTHORIZED`).

**API.3**

- [ ] `/settings/api` e `/settings/api/keys` deixam de ser placeholder; ordenação, busca e filtro de status na URL.
- [ ] Política salva ao escolher e reflete em API.2 na hora.
- [ ] Sem OAuth applications, Webhooks, Export CSV nem link de Docs/Slack.

**API.4**

- [ ] Team access aparece; chave restrita não lê Team fora do escopo (teste de isolamento).

**Geral**

- [ ] `pnpm check`, `pnpm build`, `pnpm test` verdes por sub-etapa; nenhum valor fora dos tokens; nenhum token, componente ou dependência de DS criados; nada em `/design-system` alterado.
- [ ] Revisor de fidelidade compara com o Linear ao vivo (`/settings/api`, `/settings/api/keys`, `/settings/account/security`, `/settings/account/security/api-keys/new`); divergência sem registro em `.figma/` é bloqueante.

## 3. Usage & limits: adiar o conteúdo, decidir o propósito agora

**Avaliação honesta:** é cedo. O responsável quer esta página para acompanhar **tokens e limites dos agentes de IA dentro do produto**, mas hoje não há o que medir: `features/agent` é uma conversa simulada com dados fixos, sem chamada a modelo, sem provedor escolhido, sem gateway no `apps/api`. Um livro-razão feito agora teria de adivinhar (a) a unidade (tokens ou dinheiro), (b) a tabela de preço por modelo, (c) onde o limite é aplicado (antes da chamada ou depois), (d) o que é "agente" no modelo de dados. Errar isso custa uma migration e uma tela refeitas; esperar custa nada, porque a página só tem valor com dados reais.

**O que vale fazer agora (barato e evita drift): a ADR.** Ela registra que `Usage & limits` mantém o lugar e o layout do Linear, mas com **propósito diferente** (uso de IA dos agentes do Vyzer, não plano/seats/créditos comprados), para ninguém construir "Add credits" ou "Automatic reload" por copiar o Linear. Rascunho em [`docs/adr/0017-usage-and-limits-tracks-ai-agent-usage.md`](../adr/0017-usage-and-limits-tracks-ai-agent-usage.md), `status: proposed`. Só contém o que o responsável já decidiu; unidade e limites ficam explicitamente em aberto.

**Esboço-alvo (não é escopo; para o dia em que houver agente).** O layout do Linear traduz quase 1:1:

| Linear                                                     | Vyzer (proposta, revisar na hora)                                                                                               |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| AI credits, Add credits, Automatic reload                  | **Não entra.** Não há compra nem plano (mesmo raciocínio de Billing removida)                                                   |
| Spend limits (workspace, por usuário, reset)               | **Limites de uso** por Workspace e por Member, com agenda de reset (diária/semanal/mensal); unidade a decidir                   |
| Analytics: período, total, barras por dia                  | `StackedBarChart` do DS por **Agent** no lugar de Feature, com `Legend` e seletor de período composto com `Menu` + `IconButton` |
| History: User, Team, Feature, Started, Last activity, Cost | `Table` com User, Team, **Agent**, Started, Last activity, **Tokens** (ou custo)                                                |
| Overrides por usuário                                      | Igual, depois dos limites                                                                                                       |

Tudo sai de peças existentes do DS (`StackedBarChart`, `Legend`, `Table`, `Select`, `Menu`, `IconButton`, `EmptyState`, `Skeleton`); nenhum componente novo é previsto.

**Gatilho para reabrir (vira a spec própria de Usage):** existir uma chamada real a um modelo passando por um ponto único no `apps/api` que possa registrar uso. Nesse momento decidem-se, com dados reais na mão: unidade (recomendação já: **tokens** entrada/saída/cache, porque não dependem de tabela de preço), granularidade do registro (por chamada, agregada por dia) e onde o limite bloqueia.

**Alternativa (D14):** entregar já as três rotas (`/usage`, `/usage/history`, `/usage/spend-limits`) com `EmptyState` "No usage yet". Copia a forma do Linear vazio, mas é o placeholder com mais rotas e nenhuma fonte de dados por trás. Não recomendo.

## Reuso do design system

| Necessidade                         | Peça existente                                                                    |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| Linhas rótulo/controle, agrupamento | `SettingsGroup` / `SettingsRow` (`features/settings/settings-row.tsx`)            |
| Select de política, filtros         | `Select`, `TextInput`                                                             |
| Tabela de chaves (ordenação, hover) | `Table*` com `onSort`, como em Members                                            |
| Rádios e checkboxes do formulário   | `RadioGroup`, `Checkbox` (`choice.tsx`), `FormLabel`, `HelperText`, `FormMessage` |
| Token exibido uma vez               | `Dialog` + `TextInput` somente leitura + `Button`; `useToast` para "Copied"       |
| Permissões da linha                 | `Popover`                                                                         |
| Revogar                             | `Menu` + `Confirm variant="danger"`                                               |
| Carregando/vazio/erro               | `Skeleton`, `EmptyState`, `Alert`                                                 |
| Layout largo para a tabela          | `SettingsLayout` variante larga (já criada na Administration)                     |

Nenhum token, componente ou dependência novos. O que é composição local (formulário de criação, popover de permissões) fica em `apps/web/src/features/settings/`, não no DS.

## Coordenação com os outros times

- **Time A (Workspace/Team/Project):** API.1 mexe em `apps/api/src/orpc.ts` (resolver recebe headers), em `packages/db/src/schema.ts` (nova tabela e coluna) e no contrato; todos arquivos que o Time A também altera. Recomendo que a API.1 comece só **depois** do merge da 2.1 dele (que traz a tabela `team`, necessária à API.4) para evitar conflito de migration e de `orpc.ts`. API.2 e API.3 são só front e podem seguir a API.1.
- **Time B (Issues/Workflow):** quando Issues existir, `issues:create` e `comments:create` passam a ter o que enforçar, e webhooks (D10) ganham eventos. Nada a fazer agora.
- **Numeração de ADR:** o rascunho usa `0017`; se outro time criar ADR nesse número antes do merge, renumerar na integração.

## Pendências para o responsável

Recomendação primeiro; alternativa entre parênteses. "Siga as recomendações" fecha tudo.

| #   | Pergunta                                    | Recomendação                                                                                                                                                                                                                                                                                             |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Security (admin): construir algo agora?     | **Adiar a página inteira**; nav e placeholder ficam; cada seção volta com a dependência que a bloqueia (tabela da seção 1). (Alternativa: esqueleto com todas as linhas desabilitadas, exigindo inventar o texto do bloqueio.) Pede aprovação por item, pela regra de paridade com o Linear              |
| D2  | API: construir agora?                       | **Sim**, em API.1 a API.4                                                                                                                                                                                                                                                                                |
| D3  | Onde nasce a criação de chave?              | Na seção **Personal API keys** de `/settings/security` (Personal), como o Linear; a página `/settings/api` fica com política e lista. Toca uma página fora das três, mas só essa seção. (Alternativa: botão "New API key" na página API, uma divergência a registrar em ADR)                             |
| D4  | Formato e armazenamento do token            | `vyz_` + 32 bytes base64url; só hash SHA-256 salvo; mostrado uma vez; sem expiração                                                                                                                                                                                                                      |
| D5  | Permissões do formulário                    | As **cinco do Linear** (Read, Write, Create issues, Create comments, Admin) mais Full access. Read/Write/Admin já são aplicadas; as duas de criação são gravadas e passam a valer quando Issues/Comments existirem. (Alternativa: esconder as duas até lá, um corte temporário que precisa de aprovação) |
| D6  | Team access antes de existir Team           | **Sem o campo** até a API.4; chaves nascem "All teams". É sequenciamento, não corte                                                                                                                                                                                                                      |
| D7  | Chave sem auth: aceitar o fallback da seed  | **Sim**: sem header → Member fixo (ADR-0015); com Bearer inválido → `UNAUTHORIZED`. Registrar no README/abertura que as permissões só restringem quem apresenta a chave até a auth chegar. (Alternativa: modo `API_KEY_REQUIRED` por env; quebra a web, que não envia token — não recomendo)             |
| D8  | Política "API key creation"                 | `workspace.api_key_policy` (`all_members`/`admins`), padrão `all_members`; aplicada em `apiKey.create`; testada com contexto injetado (Member criado só no teste)                                                                                                                                        |
| D9  | OAuth applications                          | **Adiar até a auth**: exigem servidor de autorização com tela de consentimento de usuário logado e upload de ícone. A chave pessoal cobre MCP e integrações. Seção omitida                                                                                                                               |
| D10 | Webhooks                                    | **Adiar até existir Issues**: a maioria dos 16 tipos de evento é de Issues, Comments, Cycles, Customers…; a entrega (assinatura HMAC, retentativas) usaria pg-boss (ADR-0008). Independe de auth. Seção omitida                                                                                          |
| D11 | Export CSV e textos "Docs"/"Join our Slack" | **Adiar** CSV (mesmo critério da D6 da Administration); **omitir** Docs/Slack (não temos docs nem canal). Texto de abertura adaptado ao Vyzer, sem citar GraphQL (a API é oRPC), a aprovar na revisão                                                                                                    |
| D12 | O que aparece depois de "Create" no Linear  | Não observado; assumir diálogo com token uma vez e **Copy**. Confirmar no Linear antes da API.2                                                                                                                                                                                                          |
| D13 | Superfície pública para MCP e apps externos | **Fora desta spec.** Chave hoje chama `/api/rpc` (oRPC). OpenAPI (`@orpc/openapi`, dependência nova) ou um servidor MCP do Vyzer é uma spec própria que consome estas chaves; decidir quando o responsável for conectar o primeiro cliente MCP                                                           |
| D14 | Usage & limits: construir agora?            | **Adiar o conteúdo**, aprovar a ADR-0017 agora. (Alternativa: três rotas vazias com `EmptyState`)                                                                                                                                                                                                        |
| D15 | Unidade e limites de Usage                  | **Decidir na spec própria de Usage**, com o primeiro agente real. Inclinação: tokens, por Workspace e Member, com reset diário/semanal/mensal como o Linear                                                                                                                                              |

## Fora do escopo

Auth, sessão, convites, Guest, domínios aprovados, SAML/SCIM, Sessions/Passkeys/Commit signing key/Authorized applications (Personal), OAuth applications, Webhooks, Export CSV, servidor MCP e API pública documentada, expiração e rotação de chave, limite de taxa (rate limit), compra de créditos e planos, e qualquer coisa de Usage além da ADR. Nenhuma alteração em `/design-system`, nenhuma migration, nenhum código nesta entrega.

## Limites da pesquisa

- MCP do Figma indisponível (não autorizado). Nenhum frame consultado.
- Leitura por DOM, sem screenshots (travam no browser da Traycer). Estruturas, textos, colunas e ordem de itens estão confirmados; medidas em pixel não foram levantadas e ficam para o revisor de fidelidade.
- Não observados: o token exibido após criar a chave, a lista de times em "Only select teams…", o popover "View permissions", os Selects de "Import data" e "Modify agent guidance", e as opções dos filtros de History. O Select de "API key creation" foi aberto e tem exatamente "All members" e "Only admins".
