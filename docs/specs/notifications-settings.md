# Spec: Notifications (Settings → Personal → Notifications)

## Link do Figma

`https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Zynox?node-id=33-21702` (nó "Main Content
(Notifications)"). Cruzado com o Linear ao vivo (`https://linear.app/zynox-dev/settings/account/notifications`
e as subpáginas `/desktop`, `/mobile`, `/email`) em 30/09.

## Escopo

Estrutura completa (nada cortado — ver "Efeito real vs. só persistido" abaixo pra saber o que cada
toggle realmente faz hoje):

```
Notifications

Inbox
  Priority inbox                                    [toggle]
  Priority notifications → 11 types                 (link, abre lista de tipos)

Push notifications
  🖥 Desktop  ⬤ Enabled for assignments, status changes, 13 others    >
  📱 Mobile   ⬤ Enabled for assignments, status changes, 13 others    >
  ✉️ Email    ⬤ Enabled for all notifications                        >
  #  Slack    ⬤ Disabled                                             >

Updates from Zynox
  Changelog
    Show updates in sidebar                         [toggle, on]
    Changelog newsletter                             [toggle, off]
  Marketing
    Marketing and onboarding                         [toggle, on]
  Other updates
    Invite accepted                                  [toggle, on]
    Privacy and legal updates                        [toggle, on]
    Data processing agreement (DPA)                  [toggle, off]
```

Cada linha "Push notifications" leva a uma subpágina (`/settings/notifications/desktop`, `/mobile`,
`/email`, `/slack`) com o mesmo formato: um toggle mestre (quando existe) + uma lista de ~14 tipos
de notificação (Assignments, Status changes, Comments and replies, Mentions, Reactions,
Subscriptions, Document changes, Updates, Reminders and deadlines, Loops, Apps and integrations,
Billing, Reviews, Triage), cada um com um checkbox.

- **Desktop e Mobile**: no Linear real, a lista inteira aparece **desabilitada** com o aviso
  "Desktop notifications require Linear Desktop" (mesma coisa pra Mobile) — não há app nativo.
  Zynox também não tem app desktop/mobile (mesma situação já registrada em Preferences → "Open in
  desktop app"). Replicar o mesmo estado desabilitado, sem simular funcionalidade que não existe.
- **Email**: no Linear é a única totalmente funcional (toggle mestre "Enable email notifications",
  dropdown "Notification format" com `Digest`/`Immediate`, dois toggles de "Email digest settings",
  e os ~14 tipos editáveis). Zynox **não tem envio de e-mail** (procurei: não há
  nodemailer/Resend/SES/SMTP no projeto) — replicar a tela, mas ver "Efeito real" abaixo.
- **Slack**: desabilitado no Linear também (sem integração conectada). Zynox não tem OAuth do
  Slack — replicar como desabilitado, mesma lógica de "Connected accounts" (já mapeado como
  bloqueado por falta de infra de OAuth em specs anteriores).
- **Priority notifications** (o link "11 types" em Inbox): no Linear é uma lista curada de tipos
  elegíveis a "prioridade" — não consegui confirmar a lista exata ao vivo nesta rodada (a URL usada
  não existia). Decisão de escopo: reaproveitar a mesma lista de ~14 tipos usada nas outras
  páginas, em vez de replicar uma curadoria do Linear que não confirmei — mais simples e
  consistente. Se quiser a lista exata do Linear depois, é só pedir uma nova checagem ao vivo.

## Efeito real vs. só persistido

| Toggle/campo                                      | Efeito hoje no Zynox                                                                                                                                                                                                                                                                |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Priority inbox                                    | **Real** — a Inbox (`/inbox`) já existe; separa as notificações marcadas como prioritárias do resto.                                                                                                                                                                                |
| Priority notifications (por tipo)                 | **Real**, mas só faz sentido pros tipos que o Zynox realmente gera hoje: `NotificationType` em `packages/db/src/schema.ts:654` só tem `assigned`/`unassigned` (mapeiam a "Assignments"). Os outros ~13 tipos da lista ficam só persistidos, sem notificação real pra filtrar ainda. |
| Desktop / Mobile (toda a página)                  | **Só persistido, desabilitado** — sem app nativo, replica o estado do Linear real.                                                                                                                                                                                                  |
| Email (toggle mestre, formato, digest, tipos)     | **Só persistido** — sem infra de envio de e-mail no projeto. Não construir um sistema de envio de e-mail pra isso; se quiser isso de verdade, é uma decisão de infra maior, pra perguntar separadamente.                                                                            |
| Slack (toda a página)                             | **Só persistido, desabilitado** — sem OAuth do Slack (mesma razão de "Connected accounts").                                                                                                                                                                                         |
| Show updates in sidebar / Changelog newsletter    | **Só persistido** — Zynox não tem changelog/sistema de novidades.                                                                                                                                                                                                                   |
| Marketing and onboarding                          | **Só persistido** — sem sistema de e-mail de marketing.                                                                                                                                                                                                                             |
| Invite accepted / Privacy and legal updates / DPA | **Só persistido** — dependem de envio de e-mail, que não existe.                                                                                                                                                                                                                    |

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banco  | (a) `notificationPreference` — flags de nível "member" que não são uma matriz: `priorityInboxEnabled` (bool), `emailEnabled`/`emailFormat`(`digest`/`immediate`)/`emailDigestDelayLowPriority`/`emailDigestUrgentImmediate` (bools+enum), `showChangelogInSidebar`, `changelogNewsletter`, `marketingAndOnboarding`, `inviteAccepted`, `privacyAndLegalUpdates`, `dataProcessingAgreement` (todos bool). Mesmo padrão de `memberPreference` (uma linha por Member, criada sob demanda). (b) `notificationTypePreference` — a matriz canal × tipo, mesmo padrão relacional de `sidebarItemPreference`: `memberId`, `channel` (enum: `priority`,`desktop`,`mobile`,`email`,`slack`), `type` (enum com os ~14 tipos), `enabled` (bool), único em `(memberId, channel, type)`. |
| API    | `packages/contract` + `apps/api`: `notificationPreferences.get`/`update` (patch parcial, flags de nível member) e `notificationTypePreferences.get`/`update` (por canal, mesmo padrão de `sidebarPreferences`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Tela   | `apps/web/src/features/settings/notifications.tsx` (página principal, cards Inbox/Push notifications/Updates) + `apps/web/src/features/settings/notifications-channel.tsx` (subpágina reutilizável pros 5 canais: priority/desktop/mobile/email/slack — mesmo componente, propriedades diferentes). Rotas novas em `apps/web/src/routes/index.tsx`: `/settings/notifications/{priority,desktop,mobile,email,slack}`.                                                                                                                                                                                                                                                                                                                                                       |

## Comportamento

- Toggles gravam na hora que mudam (otimista + rollback + toast), mesmo padrão de sempre.
- Desktop/Mobile/Slack: os controles da página inteira ficam desabilitados, com o mesmo texto de
  aviso do Linear ("Desktop notifications require Linear Desktop", etc., adaptado pro Zynox).
- Email: os controles ficam habilitados (persistem normalmente), mas sem nenhum envio de verdade —
  não simular confirmação de "e-mail enviado".
- Priority notifications: os tipos que o Zynox não gera ainda (todos exceto Assignments) ficam
  com o checkbox habilitado mas persistido sem efeito — ver tabela acima; não desabilitar
  visualmente (o Linear real também não desabilita esses, só os canais sem infra).

## Estados

- Carregando/erro: mesmo padrão (`Skeleton`, `Alert`+Retry) já usado nas outras páginas de Settings.
- Desabilitado (Desktop/Mobile/Slack): copy explicando o motivo, mesmo padrão visual de campo
  desabilitado já usado no design system.

## Critérios de aceite

- [ ] Estrutura visual bate com o Figma (nó 33:21702) e com a página real do Linear.
- [ ] Priority inbox e Priority notifications (só o tipo "Assignments") têm efeito real na Inbox.
- [ ] Os demais toggles/campos persistem de verdade, sem fingir efeito que não existe.
- [ ] Desktop, Mobile e Slack aparecem desabilitados com o motivo, replicando o Linear real.
- [ ] Só componentes/tokens já existentes; nenhuma prop nova sem aprovação.
- [ ] `pnpm check` e `pnpm build` sem avisos.

## Fora do escopo

- Envio de e-mail de verdade (Email, Marketing, Invite accepted, Privacy/DPA) — infra de e-mail não
  existe no projeto; decisão maior, separada.
- App desktop/mobile nativo — não existe.
- Integração com Slack (OAuth) — mesma razão de "Connected accounts", já mapeado como bloqueado.
- Curadoria exata da lista "Priority notifications" do Linear — reaproveitamos a lista geral de
  tipos em vez disso (ver "Escopo").
