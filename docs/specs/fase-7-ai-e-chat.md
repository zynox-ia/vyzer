# Spec: Fase 7 do Design System — AI e chat

Issue: [VYZ-37](https://linear.app/zynox-dev/issue/VYZ-37/fase-7-ai-e-chat), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-37-fase-7-ai-e-chat`, a partir de `vyz-34-fases-4-5-e-6-feedback-dados-e-command-menu`, depois do merge da Fase 8 (VYZ-35).

**Aprovada pelo responsável em 28/09, com todas as recomendações da seção de decisões.**

## Link do Figma

Arquivo `CNJik9Re3oAtqNma67yjou`, seção **Agent** (27:7480): New chat (27:6907), conversa (27:7058), diálogo de chat (27:7230) e Agent personalization (27:7372). O chat do agente dentro de uma issue está na seção **Inbox** (27:19467), nó 27:17787 (diálogo) e a linha de sessão em 27:17705–27:17756 (Activity).

## Como usar o Figma nesta entrega

Mesma regra da Fase 4-5-6 (decisão do responsável, 28/09): o Figma é referência visual geral, não medida nó a nó. O que já existe no design system é reutilizado; o que não tem frame é desenhado a partir do visual já implementado, sem parar para perguntar; nenhuma prop nova só para bater pixel; divergências relevantes vão para `.figma/`, uma linha por componente.

### Nós antigos citados no mapa de fases — todos ainda existem

| Nó     | O que é hoje                                                                                                                                                                      | Onde fica                                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1:3565 | "Sidebar - Project creation assistant": painel do agente encaixado ao lado do formulário de New Project (400 px, com botão Hide)                                                  | Seção Teams → New Project                                                 |
| 1:3581 | Estado vazio desse painel: ícone, "Draft a new project", descrição, 3 sugestões e o composer                                                                                      | Dentro de 1:3565                                                          |
| 1:4612 | As 3 sugestões do painel de New Project ("Outline the scope", "Research customer requests", "Choose the team")                                                                    | Dentro de 1:3581                                                          |
| 1:4622 | Composer do painel de New Project (placeholder "Draft your project with Linear…")                                                                                                 | Dentro de 1:3565                                                          |
| 1:3262 | Botão secundário "Create with Agent" que abre o painel 1:3565                                                                                                                     | Formulário de New Project                                                 |
| 1:6406 | Ícone do botão "Write with Agent" do Composer de update de projeto (Figma 1:6363) — **já implementado** em `apps/web/.../pages/forms/composer.tsx`, hoje com o ícone `ListChecks` | Seção Teams → Projects                                                    |
| 1:8210 | Item "AI filter" (destacado) do menu Add Filter — **já implementado** em `filter-menu.tsx` / `filter-data.tsx`                                                                    | Seção Teams → Issues                                                      |
| 1:5626 | Botão redondo "Ask Linear" da barra flutuante de seleção em massa (bulk selection)                                                                                                | Seção Teams → Projects; pertence à Fase 10 (Patterns), só referência aqui |

Nenhum nó "sumiu"; a reorganização de 28/09 só moveu tudo para dentro da seção Agent e do Inbox.

### Nós novos, fora do mapa original

| Nó                | O que é                                                                                                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 27:6907 / 27:7058 | Página cheia do agente: vazio com sugestões e conversa ativa                                                                       |
| 27:7230           | Diálogo compacto (400×600) do chat, com minimizar, abrir página cheia e fechar                                                     |
| 27:7372           | Agent personalization: Guidance, Skills e MCP connectors                                                                           |
| 27:17787          | Chat do agente dentro de uma issue (Inbox), preso a uma sessão (ex.: Cursor, Codex)                                                |
| 27:17705–27:17756 | Linha de sessão de agente na Activity da issue ("Cursor started by…", disclosure "Finished: …")                                    |
| 1:5319 / 1:5325   | Botões "Agent" e "Chat history" no rodapé flutuante de Issues/Projects                                                             |
| 31:19489          | Dica "Ask Linear ⇥Tab" dentro do campo de busca inline acima da lista de issues (31:19468) — handoff do texto digitado para o chat |

## Escopo

Cada item com página em `/design-system`, seção **AI** (hoje vazia, `plannedIn: "Fase 7 (AI)"` em `registry.ts`), no template único.

1. **Estado vazio com sugestões.** Ícone/marca central, título, subtítulo e até 3 sugestões, com o composer abaixo. Duas densidades:
   - **Página cheia** (27:6907): sugestões em cartão (ícone, título, descrição de 1 linha), grade de 3 colunas.
   - **Painel compacto** (27:7230, 1:3581): sugestões em pílula (ícone + rótulo), empilhadas.
     Como o cartão de sugestão não existe no design system, é uma composição nova (como o Composer de comentário), não um componente de base: botão com `border-default`, `rounded-container`, hover em camada, ícone `text-tertiary`, título `type-heading-3`/descrição `text-secondary`.
2. **Composer do agente.** Campo de texto que cresce (TextArea plain, sem editor rico — ver decisão abaixo), rodapé com botão "Skills" (Menu existente, com chevron), anexar (IconButton ghost) e enviar (IconButton primary, seta para cima, desabilitado sem texto). Placeholder muda por contexto ("Ask Vyzer…", "Reply…", "Tell <Agent> what to do next…"). Nós: 27:6954, 27:7181, 27:7324, 1:4622, 27:17872.
3. **Mensagens.**
   - Usuário: pílula à direita (`bg-control-strong`, `rounded-full`), ícone + texto.
   - Agente: parágrafo à esquerda, sem moldura, ícone pequeno à frente.
   - Streaming: cursor piscando no fim do texto (reaproveita `animate-pulse`).
   - "Pensando": Spinner (Fase 4) + texto secundário, no lugar da resposta.
   - Chamada de ferramenta / ação: linha recolhível "Worked for N seconds" com chevron (Radix Collapsible, como o Group Header da Fase 5), expandindo para o resultado.
   - Rodapé de feedback: IconButtons ghost (útil, não útil, deixar feedback, copiar).
   - Erro: Alert inline (Fase 4, tom `danger`) dentro do fluxo de mensagens.
     Nós: 27:7100–27:7179, 27:17834–27:17870.
4. **Cabeçalho da conversa.** Título (trocável, "Switch agent chat"), favoritar (Switch/Toggle), menu de opções (⋯), e — só no painel compacto — minimizar, abrir página cheia e fechar. Na página cheia, "Move to toolbar" no lugar do fechar. Nós: 27:7065–27:7096, 27:7239–27:7260.
5. **Painel flutuante / chat lateral.** O diálogo compacto (27:7230) e sua versão presa a uma issue no Inbox (27:17787) reaproveitam Dialog (Fase 4) sem scrim modal — é um painel não bloqueante, ancorado, não uma janela central. Como a Fase 8 (App Shell) ainda não existe, este painel entra como um `Dialog` independente, posicionado por CSS (canto inferior direito), e não como parte do painel direito definitivo; troca de contêiner quando a Fase 8 chegar (ver Dependências).
6. **Histórico de conversas.** Sem frame no Figma — só o gatilho "Chat history" (1:5325, 25:6401). Desenhado como Popover com lista de conversas (título + hora relativa, `formatRelativeTime` do Timeline), reaproveitando Popover e ListGroup.
7. **Preferências do agente (Agent personalization).** Página de settings: Field + TextArea "Guidance"; seção Skills com linha vazia ("No skills created" + botão "+" para criar); seção MCP connectors com linha vazia ("No connectors added" + Button "Add connector"). O "cartão vazio com botão" (diferente do EmptyState central da Fase 4: aqui é uma linha dentro de um container com borda) é uma composição nova, seguindo o mesmo espírito do EmptyState mas em layout de linha. Nó: 27:7372.
8. **Sessão de agente na Activity.** Dentro do Timeline (Fase 5, já entregue) — reaproveita `TimelineItem`, mais uma linha recolhível "Finished: …" (o mesmo padrão Collapsible do item 3). Avatar do agente (Cursor, Codex): sem os logos reais, usa `Avatar` com fallback de ícone (ver decisão abaixo). Nós: 27:17705–27:17756.
9. **Gatilhos existentes, só registro — sem componente novo.** "Agent" e "Chat history" no rodapé (1:5319/1:5325, `Button`/`IconButton` ghost); "Create with Agent" (1:3262, `Button` secondary) no formulário de New Project; "Write with Agent" (1:6404) e "AI filter" (1:8210), já implementados em fases anteriores — citados aqui só para manter o mesmo ícone de "agente" (ver decisão) em todos os gatilhos.

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                      |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Banco  | Nada                                                                                                                                                                                                                                             |
| API    | Nada                                                                                                                                                                                                                                             |
| Tela   | Componentes/composições em `packages/design-system/src/components` (só o que for genérico o bastante para virar peça de base) e páginas em `apps/web/src/features/design-system/pages/ai`, registradas em `registry.ts` (seção `ai`, hoje vazia) |

## Comportamento

- **Composer:** Enter insere quebra de linha; **⌘/Ctrl+Enter** envia; o botão de enviar fica desabilitado com o campo vazio.
- **Sugestões:** clique preenche o composer com o texto da sugestão (não envia direto), como no Linear.
- **Painel compacto:** Esc fecha; não há clique-fora para fechar (chat não é descartável sem querer); foco preso dentro enquanto aberto, como o Dialog.
- **Mensagem recolhível ("Worked for…"):** Enter/Espaço expande e recolhe; estado lembrado enquanto a conversa está aberta.
- **Histórico:** ↑ ↓ navegam a lista, Enter troca de conversa, Esc fecha o Popover.
- **Preferências:** Tab percorre Guidance → criar skill → adicionar connector; textarea sem limite visível de linhas (cresce).

## Estados

Padrão (vazio com sugestões), com mensagens, enviando (composer desabilitado + "pensando"), streaming, tool call em andamento e concluída, erro de mensagem, histórico vazio ("No agent chats", já usado no Command Menu — reaproveitar o texto), Skills e MCP connectors vazios, foco visível em todos os controles, dois temas.

## Critérios de aceite

- [ ] Itens 1 a 8 implementados nos dois temas, reaproveitando Dialog, Button, IconButton, Menu, Popover, Alert, Spinner, Timeline e Avatar sempre que possível.
- [ ] Só tokens semânticos; nenhuma dependência nova além das já aprovadas (radix-ui, cmdk, lucide-react).
- [ ] Composer em texto puro (TextArea), sem editor rico — ver decisão 1.
- [ ] Teclado completo (Enter, ⌘/Ctrl+Enter, Esc, setas no histórico) e foco visível.
- [ ] Testes de interação (agente de testes separado) e axe nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Revisão em contexto limpo sem bloqueantes e validação do responsável no navegador.

## Fora do escopo

- **Editor de texto rico** (negrito, menções `@`, comando `/`, anexos funcionais): dependência nova, precisa de ADR — ver decisão 1. O placeholder "@ to mention any issue, project, or document" (27:7341) fica só como texto estático.
- **Upload real de anexos**, execução real de Skills/MCP connectors, qualquer chamada a LLM ou à API.
- **Handoff do Command Menu** ("Ask Linear ⇥Tab", nó 31:19489): outro agente está alterando o Command Menu neste working tree agora; o nó fica registrado para quando essa integração for retomada.
- **Painel direito definitivo do App Shell** (scrim, posição, Fase 8): o painel flutuante desta fase é um `Dialog` isolado, não a versão final.
- **Barra de seleção em massa "Ask Linear"** (1:5626): Fase 10 (Patterns).
- **Telas novas fora de `/design-system`**: nenhuma tela de produto é construída aqui.

## Dependências entre fases

- **Fase 5 (Data Display), já entregue nesta branch:** a linha de sessão do agente na Activity reaproveita `Timeline`/`TimelineItem`.
- **Fase 6 (Command Menu), em andamento em paralelo:** o handoff "Ask Linear" no ⌘K fica pendente até o Command Menu ser mesclado; não modificar seus arquivos aqui.
- **Fase 8 (App Shell), ainda não especificada:** quando o painel direito com scrim existir, o painel flutuante do agente (item 5) troca de contêiner; o conteúdo (mensagens, composer) não muda, só onde ele é montado.

## Decisões para o André

| Decisão                                                                              | Recomendação                                                                                                                                                                     | Alternativa                                                                                                                                   |
| ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Editor de texto rico no composer** (menções, "/", anexos)                       | Fase 7 sai com texto puro (`TextArea`, como o Composer já existente); editor rico entra depois, com ADR própria e dependência nova aprovada à parte, sem bloquear esta entrega   | Trazer o editor já nesta fase: atrasa a entrega, exige aprovar e integrar uma dependência (ex.: Tiptap/Lexical) sem outro uso hoje no produto |
| **2. Avatar de agente** (Cursor, Codex — o Figma usa os logos reais desses produtos) | Sem os SVGs desses logos, usar `Avatar` com fallback de ícone (ex.: `Bot` do lucide) e o nome da ferramenta ao lado em texto, como já feito noutros lugares sem foto             | Pedir os logos ao responsável agora e atrasar a entrega até tê-los                                                                            |
| **3. Painel flutuante sem o right panel da Fase 8**                                  | Construir como `Dialog` independente agora (reaproveitando o componente da Fase 4) e trocar o contêiner quando a Fase 8 existir — troca de posição, não de conteúdo, risco baixo | Esperar a Fase 8 terminar para só então montar o chat lateral, atrasando toda a Fase 7                                                        |

## Tamanho estimado

**G** — maior em volume que as Fases 4-5-6 juntas: 9 itens de escopo, cobrindo duas densidades de painel, mensagens com múltiplos sub-estados e uma página de preferências nova.
