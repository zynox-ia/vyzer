# Spec: Fase 9 do Design System — Data Visualization

Issue: [VYZ-36](https://linear.app/zynox-dev/issue/VYZ-36/fase-9-data-visualization), sub-issue da [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Branch `vyz-36-fase-9-data-visualization`, a partir de `vyz-34-fases-4-5-e-6-feedback-dados-e-command-menu`, depois do commit da VYZ-34.

**Aprovada pelo responsável em 28/09, com as recomendações da seção de decisões. A exceção é a decisão 1: no mesmo dia, o responsável trocou o SVG feito à mão pelo Recharts ([ADR-0014](../adr/0014-recharts-for-charts.md)).**

## Como usar o Figma nesta entrega

Mesma regra combinada em 28/09 para as Fases 4–6 (referência visual geral, não medida nó a nó):

- O que já existe no design system é reutilizado (Progress em barra e anel, `HealthBadge`, `EmptyState`, `Skeleton`, `Tooltip`).
- Os gráficos de Insights não têm frame no arquivo `CNJik9Re3oAtqNma67yjou` (a reorganização de 28/09 não criou uma seção Insights); o agente desenha a partir dos tokens e do comportamento atual do Linear, sem parar para perguntar.
- Não se cria prop nova só para bater um pixel.
- Em `.figma/`, uma linha por componente, só quando a divergência for relevante.

### Nós antigos citados no mapa (`mapa-figma-fases`) — o que ainda existe

Conferido agora por `get_metadata`, nó a nó:

| Nó     | O que era                                                               | Ainda existe?                                                                       |
| ------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 1:5161 | Ícone 16 px dentro do bloco de Progress antigo                          | Sim                                                                                 |
| 1:6257 | Bloco de Progress antigo (só Scope/Completed, sem Started, sem gráfico) | Sim, mas é uma versão anterior de 25:3040 (ver abaixo); não é a referência a seguir |
| 1:5142 | Badge "No updates" (saúde)                                              | Sim                                                                                 |
| 1:5177 | Badge "Off track · 13d" (saúde)                                         | Sim                                                                                 |
| 1:6376 | Vetor 16 px (ícone de saúde)                                            | Sim                                                                                 |

Os cinco resolvem hoje (28/09), inclusive 1:6376 — que a tabela "não existem mais" do `mapa-figma-fases` (levantada mais cedo na mesma noite) listava como removido. Ou foi restaurado entre um levantamento e outro, ou aquele achado estava incorreto; vale a pena o André conferir se o arquivo mudou de novo depois deste horário. De qualquer forma, a referência funcional de saúde hoje é a mesma família: `HealthBadge`, já implementado (Fase 5, `badge.tsx`, Figma 1:5143), reaproveitado sem mudança de API.

### Referências atuais (28/09) usadas nesta spec

| Área                                               | Nós                                                                                                                                                                    |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Progress do projeto (burn-up)                      | 25:3040 (card "Zynox OS › Overview"), 25:3047–25:3130 (legenda Scope/Started/Completed e desenho do gráfico) — versão completa; 25:4689 é a tela-mãe (Project Details) |
| Progress por assignee/label (dentro do mesmo card) | 25:3140–25:3225 (abas Assignees/Labels, cada linha com `ProgressBar` existente + "N% of M")                                                                            |
| Progresso de milestone (diálogo de Update)         | 25:4227–25:4246 ("Progress since Sep 18", lista com diamante e "0% → 75%") — fora do escopo desta fase, ver "Fora do escopo"                                           |
| Saúde do projeto                                   | 1:5142, 1:5177, 25:4124 (pill "On track" no cabeçalho do diálogo de update), 25:4964 (coluna Health da lista de projetos)                                              |
| Sparkline + indicador de status                    | 25:5421, 25:5430, 25:5437–25:5438 (coluna Status da lista de projetos: ícone + "33%" + traço)                                                                          |
| Insights (barras empilhadas, linhas, legenda)      | Sem frame no arquivo; desenhado a partir do Linear atual (regra "Zynox replica o Linear como ele é hoje")                                                              |

## Escopo

Cada item com página em `/design-system/data-visualization`.

1. **BurnUpChart** (25:3040): gráfico de progresso de projeto e ciclo. Três séries de papel fixo, todas **sólidas** (a spec original pedia Scope tracejada; o Linear ao vivo e o Figma 25:3040 mostram sólida — corrigido na revisão de fidelidade) e com o mesmo traço de **1,5 px**: Scope (neutra, teto do total), Started (`--hue-amber`) e Completed (`--hue-indigo`) — cada uma com contagem na legenda ("Scope · 9", "Started · 4", "Completed · 2") **e preenchimento em gradiente** (0% → transparente, opacidade de topo em `--opacity-subtle`), como o gráfico real do projeto no Linear (conferido ao vivo em 28/09 — não só Completed). Eixo X em **escala de tempo real** (não categórica): `date` recebe uma data ISO (`AAAA-MM-DD`); o eixo mostra só **duas** marcas — início e fim reais do período (`ticks` explícito, nunca esconde a data inicial), rótulo em 12 px. **Hachura de fim de semana**: um `<pattern>` diagonal na cor de superfície/borda cobre sábados e domingos do período, igual ao Linear real — independente da densidade dos pontos de dado. Não é um componente de séries genéricas: as três cores são fixas por papel, não vêm da paleta categórica do item 4.
2. **Indicador de saúde**: reaproveita o `HealthBadge` já implementado (Fase 5) para a coluna Health da lista de projetos (25:4964) e o pill do cabeçalho do diálogo de update (25:4124, "On track"). Conferir os glifos atuais (`CircleCheck`/`TriangleAlert`/`CircleAlert`/`CircleDashed`) contra 1:5142/1:5177: se o Figma usa ícone de tendência (seta ondulada) e a diferença for perceptível, trocar o glifo mantendo os tons e o restante da API; registrar em `.figma/` se a divergência for mantida.
3. **Sparkline**: novo componente, traço fino de ~1,25 px, sem eixo nem grade — o par percentual + tendência da coluna Status (25:5421). Variante `line` em **duotone**, igual ao traço real da coluna Status (conferido ao vivo em 28/09): uma linha em `--hue-indigo` (a reta do primeiro ao último valor, atrás) e uma em `currentColor` (o traço real dos dados, na frente) — mesmo par de cores do Linear, sem inventar uma segunda métrica. Variante `bar`: mesma leitura em barras finas, num tom só (sem frame dedicado no Figma nem referência de duotone em barra; desenhado a partir do mesmo traço, cobrindo "barras simples" do escopo pedido).
4. **Paleta categórica de dados** (fundação dos itens 5–6): 8 tokens novos `--fill-chart-1…8` / `--stroke-chart-1…8` reordenados (ver "Decisões para o André" abaixo). Usada só por séries de identidade livre (por assignee, por label, por time) — nunca por estado de workflow, que usa os tokens de status já existentes (`st-success`, `st-warning` etc., mesmos do `StatusIcon`).
5. **StackedBarChart**: barras empilhadas por categoria (ex.: issues por status, por ciclo), sem frame no Figma — segue o Insights do Linear hoje. Cada segmento recebe a cor certa pelo tipo de dado (status → tokens de status; identidade livre → paleta categórica do item 4), nunca embutida no componente.
6. **LineChart** (multi-série) + **Legend**: linhas de throughput/velocidade do Insights, sem frame no Figma. Legenda: swatch + rótulo + valor, sempre com texto (nunca só cor).
7. **Tooltip de ponto**: ao passar o mouse ou focar um marco (ponto, barra ou segmento), mostra data/categoria + valor(es); construído sobre a aparência do `Tooltip` já existente (`tooltipStyles`), mas ancorado ao marco, não a um gatilho Radix.
8. **Estados vazio e carregando**: reaproveita `EmptyState` (sem dados ainda) e `Skeleton` (placeholders no formato do gráfico) para todos os itens acima.

## Fatia vertical

| Camada | O que entra                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Banco  | Nada                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| API    | Nada                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Tela   | Componentes em `packages/design-system/src/components` (novos: `burn-up-chart.tsx`, `sparkline.tsx`, `stacked-bar-chart.tsx`, `line-chart.tsx`, `chart-tooltip.tsx`, `chart-legend.tsx`), tokens em `packages/design-system/src/styles` (`primitives.css`, `themes.css`), dependência `recharts` só no `packages/design-system` (ADR-0014), exports em `index.ts`, páginas em `apps/web/src/features/design-system/pages/data-visualization` e registro em `registry.ts` |

## Comportamento

- **BurnUpChart, StackedBarChart, LineChart:** decorativos por padrão (`aria-hidden`) com uma tabela textual alternativa disponível (visualmente oculta ou num toggle "Ver como tabela"), já que nenhum SVG de gráfico é navegável ponto a ponto por teclado de forma prática.
- **Tooltip de ponto:** aparece no hover do marco e, quando o gráfico expõe um marco focável (ex.: o card do card de Insights com Tab por segmento), no foco por teclado; Esc fecha; nunca é o único jeito de ler um valor (a legenda e a tabela alternativa sempre têm os números).
- **Sparkline:** puramente decorativo (`aria-hidden`), sempre ao lado de um valor textual (o "33%" já cumpre isso no Figma) — nunca sozinho.
- **Legend:** cada item é texto + swatch, nunca só a cor; clicável quando a página quer permitir isolar uma série (fora do escopo desta fase: a interação de toggle fica para quando uma tela real usar o gráfico).

## Estados

| Componente                  | Padrão                         | Vazio                              | Carregando                               | Erro                                           |
| --------------------------- | ------------------------------ | ---------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| BurnUpChart                 | linhas Scope/Started/Completed | `EmptyState` ("No progress yet")   | `Skeleton` no formato da área do gráfico | mensagem inline (`Alert`, Fase 4), sem gráfico |
| Sparkline                   | traço                          | oculto (mostra só o valor textual) | `Skeleton` (traço estreito)              | oculto                                         |
| StackedBarChart / LineChart | barras/linhas + legenda        | `EmptyState`                       | `Skeleton`                               | `Alert` inline                                 |
| Tooltip de ponto            | oculto                         | —                                  | —                                        | —                                              |
| Indicador de saúde          | `HealthBadge` por tom          | `health="none"` (já existe)        | `Skeleton` (bloco curto)                 | —                                              |

Todos nos dois temas.

## Teclado e acessibilidade

| Componente         | Teclado                                                                                     | Texto alternativo                                      |
| ------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| BurnUpChart        | não navegável por teclado (decorativo); dados completos na tabela alternativa               | Tabela: data × Scope × Started × Completed             |
| StackedBarChart    | idem                                                                                        | Tabela: categoria × valor por segmento                 |
| LineChart          | idem                                                                                        | Tabela: data × valor por série                         |
| Sparkline          | não focável                                                                                 | `aria-hidden`; o valor ao lado já é o texto acessível  |
| Tooltip de ponto   | abre no foco quando o marco é focável (Tab/Shift+Tab); Esc fecha                            | Mesmo texto do tooltip, presente na tabela alternativa |
| Legend             | itens focáveis só se clicáveis (toggle de série); senão, texto decorativo lido em sequência | —                                                      |
| Indicador de saúde | herda do `HealthBadge` (já acessível: ícone + texto, nunca só cor)                          | —                                                      |

## Critérios de aceite

- [ ] Todos os itens do escopo implementados, reaproveitando `ProgressBar`, `HealthBadge`, `EmptyState`, `Skeleton` e `Tooltip` onde already existem.
- [ ] Só tokens semânticos, passados ao Recharts como variáveis CSS. A única dependência nova é `recharts` (ADR-0014), que fica escondida atrás dos componentes do DS.
- [ ] Paleta categórica nova validada pelo script da skill `dataviz` (`validate_palette.js`) nos dois temas, adjacente e sem qualquer FAIL.
- [ ] Cada gráfico tem tabela textual alternativa e nunca depende só de cor para status ou identidade.
- [ ] Testes de interação (agente de testes separado) e axe nos dois temas.
- [ ] `pnpm check`, `pnpm build` e `pnpm test` passando sem avisos.
- [ ] Uma revisão em contexto limpo no fim (`figma-fidelity-reviewer`), sem bloqueantes, e validação do responsável no navegador.

## Fora do escopo

- **Progresso de milestone no diálogo de update** (25:4227, lista "Progress since Sep 18" com diamante e delta %): não é um gráfico; melhor encaixe é Activity/Timeline (Fase 5) ou Patterns (Fase 10, junto do padrão de milestone já registrado como não implementado em `.figma/`). Fica anotado aqui para quem pegar aquelas fases.
- **Interação de isolar série pela legenda** (clique para ocultar/mostrar uma linha/barra): a API do `Legend` permite, mas a interação só entra quando uma tela real do produto usar o gráfico.
- **Dados reais pela API**: todas as páginas de `/design-system` usam dados estáticos de exemplo.
- **AI e chat** (Fase 7), **App Shell** (Fase 8) e o restante de **Patterns** (Fase 10).
- **Drag and drop** e qualquer interação de arrastar em gráficos (não pedida, não existe no Linear para estes componentes).

## Dependências entre fases

- Reaproveita `ProgressBar`/`ProgressRing`/`Spinner` (Fase 4), `HealthBadge` (Fase 5, já implementado em `badge.tsx`), `EmptyState`/`Skeleton` (Fase 4) e `Tooltip`/`tooltipStyles` (Fase 4/refinos de 27–28/09). Nenhuma mudança de API nesses componentes é esperada; se o item 2 (glifos de saúde) pedir troca de ícone, é uma alteração pontual no `badge.tsx` existente, não uma nova versão.
- Não bloqueia nem é bloqueada pelas Fases 7, 8 e 10.

## Decisões para o André

### 1. Biblioteca de gráficos ou SVG feito à mão

**Decidido em 28/09: Recharts** ([ADR-0014](../adr/0014-recharts-for-charts.md)).

A recomendação original era SVG próprio, e a primeira versão da fase foi feita assim. Depois de ver o resultado, o responsável preferiu uma biblioteca consolidada. O miolo dos gráficos foi refeito em Recharts, e continuam iguais:

- a API pública dos componentes;
- os 8 tokens da paleta;
- as páginas de documentação;
- os testes.

As regras de uso estão na ADR:

- o Recharts fica atrás dos componentes do DS;
- toda cor vem de token semântico;
- a tabela alternativa e o tooltip por teclado continuam obrigatórios;
- a animação respeita os tokens de movimento e o movimento reduzido.

### 2. Paleta categórica de dados

Os tokens `--fill-chart-1…10` / `--stroke-chart-1…10` já existem em `theme.css`, mas hoje apontam 1:1 para as mesmas variáveis de matiz usadas em status e labels (`--hue-*`), na ordem `green, blue, amber, red, purple, pink, cyan, orange, lime, indigo`. Isso tem dois problemas medidos pela skill `dataviz`:

1. **Colisão com status:** `--fill-chart-5` é literalmente `--hue-red`, a mesma cor de `st-danger`. A skill proíbe isso ("status colors are reserved... never reused for series"): um gráfico "por assignee" que sorteasse vermelho para uma pessoa pareceria um alerta.
2. **A ordem atual falha na validação:** rodando `validate_palette.js` nas 10 cores na ordem atual, o par adjacente pink↔orange fica com ΔE 15,0 (normal-vision), exatamente no limite, e no claro o par âmbar↔verde fica em ΔE 4,7 (abaixo do piso de 6) —161 falhas reais de diferenciação para quem enxerga cores normalmente ou tem daltonismo.

**Recomendação:** 8 tokens (não 10), reservando vermelho para status e excluindo ciano da rotação (ele sobra por não ter uma ordem que o encaixe sem derrubar o pior par; fica disponível como cor avulsa para uso pontual, fora da rotação categórica). Ordem: **indigo, amber, pink, lime, blue, green, purple, orange** — a que passa todos os testes computados nos dois temas com a maior margem entre as ordens testadas (pior par adjacente: ΔE CVD 11,9–12,7 contra o alvo de 8; pior par em visão normal: ΔE 18,1 contra o piso de 15).

No claro, os valores existentes (`--hue-*-light`, L 0,55) já passam sem alteração. No escuro, os valores existentes (`--hue-*-dark`, L 0,72) passam em contraste e em separação de cor, mas ficam acima da faixa de luminosidade recomendada para paleta categórica no escuro (L 0,48–0,67) — a mesma faixa em que os ícones/badges de status não precisam entrar, porque são cor única de significado fixo, não uma série entre várias. Por isso a proposta é um **conjunto novo de 8 primitivos só para o escuro**, mesma matiz e croma, L rebaixado para 0,66 (mantém a mesma separação e o mesmo contraste, agora dentro da faixa):

| Papel            | Claro (reaproveita `--hue-*-light`) | Escuro (novo, L 0,66) |
| ---------------- | ----------------------------------- | --------------------- |
| chart-1 · indigo | `#5a66c7`                           | `#7989ea`             |
| chart-2 · amber  | `#986603`                           | `#c78200`             |
| chart-3 · pink   | `#af467e`                           | `#d4679f`             |
| chart-4 · lime   | `#607e09`                           | `#7da127`             |
| chart-5 · blue   | `#0b77ba`                           | `#2b99e7`             |
| chart-6 · green  | `#05893e`                           | `#3eab5e`             |
| chart-7 · purple | `#8656b7`                           | `#a878db`             |
| chart-8 · orange | `#b25201`                           | `#d97230`             |

Alternativa mais simples (menos fiel à skill): manter os 10 tokens como estão hoje, sem novo primitivo de escuro nem exclusão de vermelho/ciano — mais rápido de implementar, mas carrega a colisão com status e o par abaixo do piso no claro (âmbar↔verde, ΔE 4,7) para dentro do produto. Não recomendado.

O **BurnUpChart** (item 1 do escopo) não usa essa paleta categórica: suas três séries têm papel fixo (Scope/Started/Completed), então usam tokens já existentes (`--hue-amber`, `--hue-indigo`, mais uma linha neutra) — sem token novo.
