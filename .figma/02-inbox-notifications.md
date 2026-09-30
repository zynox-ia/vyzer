# 02 — Inbox e Notifications (referência: Linear ao vivo)

Sem frame confirmado no Figma (MCP não autorizado na sessão da spec). Nós conhecidos: seção Inbox `27:19467`, detalhe `27:17223`, Settings → Notifications `33:21702` (não lido). Tudo abaixo foi **medido/observado no Linear (`zynox-dev`, 29/09)**; quem implementar deve rechecar contra o Linear e contra o Figma se o MCP estiver disponível. Spec: `docs/specs/inbox-notifications.md`.

## Confirmado ao vivo (base da fidelidade)

- **Layout:** duas colunas; lista de ~389 px (viewport 1280) e painel de detalhe no resto. Painel sem seleção: "No notification selected", ou "N unread notification(s)" quando há não lidas.
- **Linha:** 55 px; avatar/ícone do ator de 32 px a ~18 px da borda; linha 1 = ID (13, peso 450; 500 se não lida) + título (13, 500, truncado) + ícone de status/prioridade à direita; linha 2 = ator + resumo (12, 450) + tempo relativo (`2d`) à direita. Nome acessível começa com "Read" ou "Unread".
- **Não lida:** ponto de destaque junto ao avatar, texto em cor primária (em vez de secundária), ID em peso 500. Sidebar mostra contador quando há não lidas e nada quando zero; **não conta adiadas**.
- **Adiada** (com "Show snoozed"): terceira linha "Snoozed for 59min", altura ~79 px, ainda não lida. Menu de Snooze: "Unsnooze notification" no topo quando já adiada; presets An hour from now / Tomorrow 9:00 / Next week (segunda 9:00) / A month from now / Custom…. Ao adiar, a linha sai da lista e a seleção avança para a próxima.
- **Ler:** abrir marca como lida; `U` alterna lida/não lida.
- **Display options:** Enable priority inbox; Group unreads by = No grouping | Focus (Focus = seções "Unread" e "Read", cabeçalho ~30 px); Ordering = Newest | Oldest | Priority; Show snoozed; Show unread first. Com Priority inbox ligado: abas Priority/Other (`/inbox/priority`, `/inbox/other`), "Include in priority inbox", "Badge count" (Priority & Other | Priority only | None).
- **Add filter:** Notification type, From, Team, Project, Issue priority, Issue status type.
- **Priority notifications (Settings):** Assigned to you, Document activity, Issue activity, Mentions, Project activity, Project updates, Replies, Resolved threads, Reviews, Update reminders (todos ligados por padrão) + Custom filters.
- **Tipos de notificação (Settings, canal Desktop):** Assignments, Status changes, Comments and replies, Mentions, Reactions (desligado por padrão), Subscriptions, Document changes, Updates, Reminders and deadlines, Loops, Apps and integrations, Billing, Reviews, Triage.

## Divergências intencionais do Vyzer (uma linha cada)

- **Seleção na URL:** `/inbox/:notificationId` (Vyzer) em vez de trocar para a URL da issue com `#comment-…` (Linear), para sobreviver a recarregar sem perder a lista (spec D10).
- **Filtro e Display options só na URL:** o Linear os persiste por usuário (observado); o Vyzer segue a regra 8 do `AGENTS.md`, sem persistência por usuário (spec D11). Formato legível em search params, sem o `?filter=` em base64.
- **Filtro/Display options: a preferência de Priority inbox é a exceção:** é configuração de Settings e fica no banco por Member.
- **Só o que funciona aparece na UI:** canais Desktop/Mobile/Email/Slack, "Updates from Linear", agentes, Loops, Reviews, Document/Project activity e o sino de View **não são cortados**: estão sequenciados no backlog da spec (etapas 4.9 a 4.16) e entram quando o domínio, o gatilho ou a credencial existir (spec D2/D3); até lá, nenhum item morto na UI.

## Não observado (revisor deve conferir)

- Agrupamento de atividades da mesma issue numa entrada; texto de cada tipo de notificação; opções de "Include in priority inbox"; "Mark all as read" com uma não lida; Delete/Undo; atalhos `H` (adiar) e `⌫` (apagar); seleção múltipla; estado vazio da Inbox sem nenhuma notificação; retorno de uma adiada na hora certa.
