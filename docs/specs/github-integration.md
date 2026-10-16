# Spec: Integração com GitHub (Connected accounts + Code & reviews)

## Contexto

GitHub App já criado e credenciado (`.env`: `GITHUB_APP_ID`, `GITHUB_APP_CLIENT_ID`,
`GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_WEBHOOK_SECRET`, `GITHUB_APP_PRIVATE_KEY_PATH` →
`apps/api/secrets/github-app.pem`, gitignored). Permissões: Contents/Metadata/Pull requests/Checks
(read-only). Webhook assinado, evento `pull_request`. Callback OAuth:
`http://zynox.localhost/api/github/callback`. Em dev, o webhook chega via túnel (ngrok) — a URL
pode mudar; reconfirmar com o André se `GET /api/github/webhook` (ou o handshake) falhar em dev.

Decisão do André: esta entrega já traz PRs reais vinculados a issues (não só a conexão OAuth
"decorativa"). Referência: `docs/specs/settings-administration.md`/mapa de arquitetura,
seção "Code & reviews" (`/settings/account/code-and-reviews`) e "Connected accounts"
(`/settings/account/connections`).

## Escopo

1. **Conectar conta do GitHub** (Connected accounts): OAuth "user-to-server" do GitHub App — cada
   Member conecta a própria conta. Mostra "Connected" + usuário do GitHub, com "Disconnect".
2. **Instalar o App num repositório do GitHub**: fluxo de instalação do GitHub App (escolhe
   organização/conta e repositório(s)) — fica no nível do Workspace ou Team (a decidir com o
   Backend qual granularidade faz mais sentido dado o schema atual; se ficar ambíguo, perguntar).
3. **Vincular PRs a issues de verdade**: via webhook (`pull_request`: opened/edited/closed/
   reopened/synchronize/ready_for_review). O vínculo usa o nome da branch: se a branch do PR contém
   o identificador da issue (ex. `vyz-123-alguma-coisa`, case-insensitive), vincula automaticamente.
   Mostra na issue: título do PR, autor, status (draft/open/merged/closed), aprovações/checks se
   vierem no payload do webhook.
4. **Code & reviews (a tela de Settings em si)**: os campos que fazem sentido no Zynox hoje
   persistem de verdade; os que dependem de "coding sessions" (um recurso de IA do Linear que o
   Zynox não tem) só persistem, sem efeito — ver tabela abaixo.

### Code & reviews — campo a campo (mapeado no artefato de arquitetura)

| Campo                                                                                        | Efeito no Zynox                                                                                                                           |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Enable code reviews                                                                          | **Real** — liga/desliga a vinculação de PRs em toda a Workspace.                                                                          |
| Merge strategy (dropdown)                                                                    | Só persistido — o Zynox não faz merge, é só informativo/futuro.                                                                           |
| Auto-convert draft pull requests                                                             | Só persistido — depende de escrever de volta no GitHub (permissão é read-only nesta entrega; escrever é decisão futura, perguntar antes). |
| Code theme (diffs)                                                                           | Fora de escopo agora — o Zynox ainda não renderiza diff de código em lugar nenhum.                                                        |
| Notifications (Comments & reviews, Review requests, etc.)                                    | Só persistido — ver o já decidido em `docs/specs/notifications-settings.md` para o padrão de "persistido sem efeito ainda".               |
| Signed commits / commit signing key                                                          | Fora de escopo — não há "coding sessions" no Zynox.                                                                                       |
| External tools (Configure coding tools, Git attachment format, Open GitHub pull requests in) | Fora de escopo — recurso de ferramentas externas de coding do Linear, sem equivalente no Zynox.                                           |
| On git branch copy… / On open in coding tool…                                                | Fora de escopo, mesma razão.                                                                                                              |

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Banco  | (a) `githubConnection`: por Member, `githubUserId`, `githubLogin`, `githubAvatarUrl`, token de acesso do usuário (ver nota de segurança abaixo), `connectedAt`. (b) `githubInstallation`: `installationId`, conta/organização do GitHub, `workspaceId`, quem instalou. (c) `pullRequest` (ou nome que o Backend achar melhor): `issueId` (nullable até vincular), `installationId`, `repoFullName`, `number`, `title`, `authorGithubLogin`, `url`, `state` (`open`/`draft`/`merged`/`closed`), `headBranch`, `checksStatus`, `reviewDecision`, `createdAt`/`updatedAt`, atualizado a cada evento de webhook (upsert por `installationId`+`repoFullName`+`number`). |
| API    | `apps/api`: rota `GET /api/github/callback` (troca `code` por token, associa ao Member atual), rota `POST /api/github/webhook` (valida assinatura HMAC com `GITHUB_APP_WEBHOOK_SECRET`, processa `pull_request`), `packages/contract`+`apps/api` oRPC: `githubConnection.get/disconnect`, `codeReviews.get/update` (os toggles persistidos da tabela acima), listagem de PRs vinculados a uma issue (exposto no `issue.get` ou endpoint próprio).                                                                                                                                                                                                                  |
| Tela   | `apps/web/src/features/settings/connected-accounts.tsx` (linha do GitHub: Connect/Connected+usuário/Disconnect) e `apps/web/src/features/settings/code-reviews.tsx` (os toggles reais + persistidos, mesmo padrão de `preferences.tsx`). Na issue: uma seção "Pull requests" mostrando os PRs vinculados (autor, status, link pro GitHub).                                                                                                                                                                                                                                                                                                                         |

## Nota de segurança (importante, decisão do Backend com aprovação antes de seguir)

- O token OAuth do usuário (Connected accounts) precisa ser armazenável e **reversível** (usado
  depois pra chamar a API do GitHub em nome do Member) — diferente de `apiKey.tokenHash`, que é
  hash de mão única porque o Zynox nunca precisa "usar" a própria API key de volta. Isso exige
  algum mecanismo de criptografia em repouso (uma chave de app, ex. `APP_ENCRYPTION_KEY` no `.env`)
  que **não existe ainda no projeto**. Se não houver um jeito simples e correto dentro do que já
  existe, perguntar antes de inventar a primeira peça de criptografia de segredos do Zynox.
- Para ler Pull Requests via webhook/instalação do GitHub App, o caminho mais simples e seguro é
  **não** guardar nenhum token de longa duração: gerar um "installation access token" sob demanda
  (JWT assinado com `GITHUB_APP_PRIVATE_KEY_PATH` + `installationId`), válido por ~1h, toda vez que
  for preciso chamar a API do GitHub. Isso evita o problema de armazenamento acima para a parte de
  PRs; só o token OAuth do usuário (pra "Connected" mostrar quem conectou) precisaria de
  armazenamento reversível, e mesmo esse uso é só de identificação (login/avatar) — considerar se
  dá pra buscar login/avatar uma vez no callback e **não guardar o token de usuário depois**,
  evitando o problema de criptografia por completo. Se essa simplificação servir, prefiram ela.

## Comportamento

- Vincular por nome de branch é automático (webhook); não expor um "vincular manualmente" nesta
  entrega — se achar que falta, perguntar antes de adicionar.
- Reprocessar um PR (reenvio de webhook, ou o mesmo PR chegando fora de ordem) deve ser idempotente
  (upsert pela chave natural, não duplicar linhas).
- Desconectar a conta (Connected accounts) remove a associação do Member, mas não desfaz PRs já
  vinculados (o vínculo é da Workspace/instalação, não do Member que conectou).

## Estados

- Connected accounts: "Connect" (não conectado) → OAuth → "Connected as @usuário" + "Disconnect".
- Erro no callback OAuth ou no webhook: log server-side; não travar a tela — Connected accounts
  volta pro estado "Connect" com um toast de erro se a troca de código falhar.
- Code & reviews: mesmo padrão de carregamento/erro das outras páginas de Settings.

## Critérios de aceite

- [ ] Connected accounts → GitHub: fluxo de OAuth real, mostra o usuário conectado.
- [ ] Instalação do GitHub App documentada/testável localmente (via túnel).
- [ ] Webhook valida assinatura e processa `pull_request` de verdade, com idempotência.
- [ ] PR aparece vinculado na issue certa quando a branch bate com o identificador.
- [ ] "Enable code reviews" liga/desliga a vinculação; os demais campos da tabela persistem sem
      fingir efeito que não existe.
- [ ] Nenhum segredo (token, chave privada) aparece em log, resposta de API ou é commitado.
- [ ] `pnpm check`/`pnpm build` sem avisos; testes cobrindo o webhook (assinatura válida/inválida,
      idempotência) e o vínculo por branch.

## Fora do escopo

- Escrever de volta no GitHub (aprovar/comentar/merge) — permissões são read-only nesta entrega.
- Merge strategy, signed commits, coding tools externos — recursos do Linear sem equivalente hoje.
- Diff de código nas issues — o Zynox não renderiza diff em lugar nenhum ainda.
