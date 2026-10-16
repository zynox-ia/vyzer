# Spec: Profile (Settings → Personal → Profile)

## Link do Figma

Sem nó no Figma. Referência ao vivo: `https://linear.app/zynox-dev/settings/account/profile`
(Traycer browser, sessão `primary`, 30/09).

Estrutura confirmada ao vivo:

```
Profile
  [avatar]  Profile picture

  Email                              andrejunio.dev@gmail.com   [Change email]
  Full name                          [André Júnio            ]
  Title                              [Dev                     ]  "Your job title or role"
  Username                           [andrejunio.dev          ]  "One word, like a nickname or first name"

Workspace access
  Remove yourself from workspace                          [Leave workspace] (desabilitado aqui —
                                                            provável regra de "não pode ser o único
                                                            membro/admin restante"; não confirmado)
```

## Escopo

Página de Profile funcionando de ponta a ponta, self-service (o próprio Member edita os dados
dele — diferente de `member.update`, que já existe no router mas é `adminOnly`, para um admin
editar outro membro; **não reaproveitar esse endpoint aqui**, precisa de um novo, escopado ao
Member autenticado).

1. **Profile picture**: upload de avatar por Member. Reaproveitar exatamente o pipeline que já
   existe para o logo do Workspace (`apps/api/src/workspace-logo.ts` + rota em `apps/api/src/app.ts`
   - `apps/web/src/services/workspace.ts`) — mesma validação (tamanho, MIME, assinatura de bytes),
     só trocando a chave do objeto para escopo de Member em vez de Workspace.
2. **Full name**: já existe como `member.name`; só falta o endpoint self-service para editar.
3. **Title**: campo novo, texto opcional (cargo/função).
4. **Username**: campo novo, texto, único por Workspace (mesmo padrão de
   `member_workspace_email_unique` em `packages/db/src/schema.ts`).
5. **Email**: só exibição (somente leitura) nesta entrega. O botão "Change email" do Linear real
   fica **fora do escopo** — trocar e-mail de verdade depende de autenticação real (Better Auth,
   ADR-0006/0015), que este projeto ainda não tem (não há tabela de `user`/sessão de auth hoje,
   só o `member` de workspace). Não simular a troca; se quiser incluir mesmo assim, é uma decisão
   para depois que a infra de auth existir — perguntar antes de tentar.
6. **Leave workspace**: ação destrutiva, remove o Member do Workspace atual. Precisa de uma regra
   de quando é permitido (ex.: não pode ser o único Member, ou não pode ser o único admin) — não
   confirmei a regra exata do Linear ao vivo; se ficar ambíguo, perguntar antes de decidir.

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | `packages/db/src/schema.ts`, tabela `member`: adicionar `title` (text, nullable), `username` (text, nullable, `uniqueIndex` por `workspaceId`), `avatarUrl` (text, nullable). Sem tabela nova — são colunas na `member` já existente.                                                                                                                                                                                                                           |
| API    | Endpoint novo, self-service (não `adminOnly`), ex. `profile.update` (nome, title, username) e a rota de upload de avatar espelhando `apps/api/src/app.ts`/`workspace-logo.ts` (novo `member-avatar.ts` com o mesmo formato: `readMemberAvatarUpload`, `memberAvatarObjectKey(workspaceId, memberId, fileName)`, `memberAvatarUrl(fileName)`, rota `/api/member/avatar/:fileName`). "Leave workspace" como endpoint separado (ação destrutiva, ver regra acima). |
| Tela   | `apps/web/src/features/settings/profile.tsx` (arquivo novo, mesmo padrão de `preferences.tsx`: `useQuery`/`useMutation`, otimista + rollback + toast). Upload de avatar seguindo o padrão já usado em `workspace-settings.tsx` para o logo do Workspace.                                                                                                                                                                                                        |

## Comportamento

- Full name, Title e Username gravam ao sair do campo (blur) ou Enter — mesmo padrão já usado para
  "Custom font family" em Preferences (`preferences.tsx`, `commitFamily`). Não grava a cada tecla.
- Username: validar formato (uma palavra, sem espaço — texto do próprio Linear: "One word, like a
  nickname or first name") e unicidade no Workspace; erro de conflito vira toast, sem travar o
  campo.
- Avatar: clique abre seletor de arquivo, mostra preview/loading enquanto envia, atualiza o avatar
  em qualquer lugar do app que já mostra o Member (ex. sidebar, comentários) assim que salvo.
- Email: só texto, sem campo editável nem botão funcional nesta entrega.
- Leave workspace: botão desabilitado quando a regra de negócio não permitir (ver "Escopo"); quando
  habilitado, exige confirmação (reaproveitar o padrão de diálogo de confirmação já usado em ações
  destrutivas do app, ex. delete team).

## Estados

- Carregando: skeleton, mesmo padrão das outras páginas de Settings já migradas.
- Erro ao carregar/gravar: mesmo padrão de `Alert`+Retry / toast+rollback já usado em
  `customize-sidebar.tsx` e `preferences.tsx`.
- Vazio: Title/Username sem valor mostram o placeholder ("Software engineer" / "username").

## Critérios de aceite

- [ ] Full name, Title e Username persistem de verdade (API + banco), por Member.
- [ ] Avatar tem upload real, reaproveitando o pipeline de validação do logo do Workspace, sem
      duplicar a lógica de validação de imagem — extrair o que for comum, se fizer sentido.
- [ ] Email aparece, mas não é editável nesta entrega.
- [ ] Leave workspace existe com a regra de habilitação decidida (ou perguntada) e confirmação antes
      de executar.
- [ ] Endpoint de edição de perfil é self-service (o próprio Member), não reaproveita o
      `member.update` adminOnly existente.
- [ ] Só componentes/tokens já existentes; nenhuma prop nova sem aprovação.
- [ ] `pnpm check` e `pnpm build` sem avisos.

## Fora do escopo

- Trocar e-mail de verdade — depende de autenticação real, ainda não implementada (ADR-0006/0015).
- Qualquer coisa de Security & access / Connected accounts (páginas vizinhas, já mapeadas e
  bloqueadas por infra de auth em specs anteriores).
