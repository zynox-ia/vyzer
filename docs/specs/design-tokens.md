# Spec: Design tokens

Issue: [VYZ-12](https://linear.app/zynox-dev/issue/VYZ-12/design-system). Status: **substituída**. Os tokens agora vivem em `packages/design-system` e são documentados em `/design-system`; as decisões vigentes estão na [ADR-0013](../adr/0013-design-system-package-and-rules.md). Esta spec fica como histórico da V2.

Direção visual: [ADR-0011](../adr/0011-warm-monochrome-visual-direction.md), alterada pela [ADR-0012](../adr/0012-terracotta-accent-and-type-pairing.md). Referência de paleta e contenção: [`docs/design/reference-anthropic.md`](../design/reference-anthropic.md). Implementação: `apps/web/src/styles/tokens.css`. Valores e contrastes recalculáveis com `node docs/design/palette-contrast.mjs`.

## Origem

- **Estrutura** (níveis de superfície, texto, borda, estados, tipografia, raios, espaçamento): do Figma [Zynox](https://www.figma.com/design/CNJik9Re3oAtqNma67yjou/Zynox), página `0:1`. Sem variáveis no Figma; inventário com node-ids em `.figma/inventory/`.
- **Cores**: ADR-0011 e ADR-0012. As cores do Figma (visual do Linear) não são usadas; o inventário guarda os originais.

| Área do Figma                                    | Nós                                              |
| ------------------------------------------------ | ------------------------------------------------ |
| Login (2 variações)                              | `1:12610`, `1:12645`                             |
| Sidebar                                          | `1:6569`                                         |
| Projects (lista, New view)                       | `1:4813`, `1:5330`, `1:5635`                     |
| New Project (modal, 8 dropdowns, comando "/")    | seção `1:2`                                      |
| Project details                                  | `1:5929`, `1:6338`, `1:6363`, `1:6421`, `1:6442` |
| Issues (lista, board, filtro, display, detalhes) | seção `1:6791`                                   |

## Regras

- Componentes usam só os utilitários semânticos abaixo (regra 3). Primitivos (`--vz-*`) ficam fora do `@theme` e não geram utilitários; as escalas padrão do Tailwind (cores, tamanhos, raios, sombras, blur, pesos, tracking, leading) foram removidas.
- Dois temas com os mesmos tokens: `<html data-theme="dark">` (padrão) ou `"light"`; "seguir o sistema" resolve para um dos dois.
- Monocromático com acento mínimo: o terracota (`accent`) aparece **só** no indicador do item ativo da sidebar, no checkbox marcado, no anel de foco e em contadores de destaque. Nunca em botões, fundos ou texto corrido, e não é status.
- Botão primário invertido; links na cor do texto principal, sublinhados; seleção (sidebar, linhas) em cinza de superfície, um degrau acima do hover.
- Profundidade por degrau de superfície e hairline de 1 px. Sombra só em popover e modal.
- Cor nunca é o único indicador: todo status tem ícone de formato próprio.
- Tema claro: conteúdo sobre o creme; nenhuma superfície mais clara que `#faf9f5`.

## Tokens

### Superfícies (`bg-*`)

| Token                                     | Escuro      | Claro       | Uso                                                             |
| ----------------------------------------- | ----------- | ----------- | --------------------------------------------------------------- |
| `bg-app`                                  | `#0e0e0d`   | `#f0eee6`   | Janela, calha em volta do painel                                |
| `bg-sidebar`                              | `#141413`   | `#f0eee6`   | Sidebar                                                         |
| `bg-panel`                                | `#141413`   | `#faf9f5`   | Painel de conteúdo (lista, página)                              |
| `bg-surface`                              | `#1a1a18`   | `#faf9f5`   | Cards, modal                                                    |
| `bg-subtle`                               | `#1a1a18`   | `#f0eee6`   | Cabeçalho de grupo, cabeçalho de tabela                         |
| `bg-popover`                              | `#1f1e1d`   | `#faf9f5`   | Dropdowns e menus (com sombra e borda)                          |
| `bg-control`                              | `#1a1a18`   | `#f0eee6`   | Pills, chips, trilho de abas, botão secundário                  |
| `bg-input`                                | `#1a1a18`   | `#faf9f5`   | Inputs (com hairline)                                           |
| `bg-control-strong`                       | `#1f1e1d`   | `#e8e6dc`   | Hover de controles sobre `bg-control` (botão secundário, chips) |
| `bg-hover`                                | `#1a1a18`   | `#e8e6dc`   | Hover de item, linha e card                                     |
| `bg-selected`                             | `#1f1e1d`   | `#e3dacc`   | Linha selecionada, item ativo da sidebar, aba ativa             |
| `bg-inverse`                              | `#faf9f5`   | `#141413`   | Botão primário                                                  |
| `bg-inverse-hover`                        | `#e8e6dc`   | `#3d3d3a`   | Hover do botão primário                                         |
| `bg-accent`                               | terracota   | terracota   | Indicador do item ativo da sidebar                              |
| `bg-scrim`                                | grafite 70% | grafite 25% | Atrás de modal e painel lateral                                 |
| `bg-{success,info,warning,danger}-subtle` | cor a 15%   | cor a 15%   | Fundo de badge                                                  |
| `bg-label-*`                              | ver Labels  | ver Labels  | Bolinha de label                                                |

Valores do feedback V1: escuro `bg-app`, painel/sidebar, hover e seleção; claro canvas `#faf9f5`, sidebar e cabeçalhos `#f0eee6`, hover `#e8e6dc`. Derivados: escuro `bg-surface`, `bg-subtle`, `bg-popover`, `bg-control`, `bg-input`; claro `bg-selected` (`#e3dacc`, o "oat" quente da referência).

### Texto e ícones (`text-*`)

| Token                                       | Escuro     | Claro            | Uso                                                 |
| ------------------------------------------- | ---------- | ---------------- | --------------------------------------------------- |
| `text-primary`                              | `#faf9f5`  | `#141413`        | Texto padrão, títulos, links                        |
| `text-secondary`                            | `#b0aea5`  | `#5e5d59`        | Metadados, rótulos, ícones padrão                   |
| `text-tertiary`                             | `#87867f`  | `#87867f`        | Placeholder, identificadores, datas                 |
| `text-inverse`                              | `#0e0e0d`  | `#faf9f5`        | Texto sobre `bg-inverse`                            |
| `text-accent`                               | terracota  | terracota escuro | Contadores de destaque (acento como texto, ≥ 4,5:1) |
| `text-{success,info,warning,danger}`        | ver Status | ver Status       | Ícones de status                                    |
| `text-{success,info,warning,danger}-strong` | ver Status | ver Status       | Texto de badge                                      |

### Acento

| Token                                                    | Escuro                                | Claro                                 | Uso                                                                                        |
| -------------------------------------------------------- | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `accent` (`bg-accent`, `outline-focus`, `accent-accent`) | `oklch(0.672 0.131 38.8)` = `#d97757` | `oklch(0.597 0.131 38.8)` = `#c06041` | Indicador ativo da sidebar, checkbox marcado, anel de foco (2 px, afastamento 2 px); ≥ 3:1 |
| `text-accent`                                            | `oklch(0.672 0.131 38.8)` = `#d97757` | `oklch(0.502 0.131 38.8)` = `#a04424` | Contadores de destaque; texto, então ≥ 4,5:1                                               |

### Bordas (`border-*`), hairline de 1 px

| Token            | Escuro       | Claro        | Uso                                           |
| ---------------- | ------------ | ------------ | --------------------------------------------- |
| `border-subtle`  | `#1f1e1d`    | `#e8e6dc`    | Painel, divisórias                            |
| `border-default` | `#262624`    | `#d1cfc5`    | Modal, cards, inputs, chips, botão secundário |
| `border-strong`  | `#30302e`    | `#bdbbb1`    | Popovers, input em foco                       |
| `border-danger`  | cor `danger` | cor `danger` | Input com erro                                |

### Status e labels (OKLCH)

Todas as cores usam a mesma luminosidade e croma por tema; só o matiz varia. O croma alvo é 0,15; quando o matiz não comporta esse croma naquele L dentro do sRGB, usa o máximo possível (valor exato em cada coluna). Badges: cor a 15% no fundo; texto na cor cheia no escuro, e num degrau mais escuro do mesmo matiz no claro (ADR-0012).

| Cor    | Matiz | Escuro (L 0,72)                   | Claro (L 0,52)                    | Uso            |
| ------ | ----- | --------------------------------- | --------------------------------- | -------------- |
| green  | 150   | `oklch(0.72 0.15 150)` `#53be70`  | `oklch(0.52 0.14 150)` `#0a7e3a`  | success, label |
| blue   | 245   | `oklch(0.72 0.15 245)` `#43acfb`  | `oklch(0.52 0.13 245)` `#036eae`  | info, label    |
| amber  | 75    | `oklch(0.72 0.15 75)` `#da950b`   | `oklch(0.52 0.11 75)` `#8d5e00`   | warning, label |
| red    | 25    | `oklch(0.72 0.15 25)` `#f47b74`   | `oklch(0.52 0.15 25)` `#af3c3a`   | danger, label  |
| purple | 305   | `oklch(0.72 0.15 305)` `#bb8aef`  | `oklch(0.52 0.15 305)` `#7d4dad`  | label          |
| pink   | 350   | `oklch(0.72 0.15 350)` `#e97ab2`  | `oklch(0.52 0.15 350)` `#a53c75`  | label          |
| cyan   | 205   | `oklch(0.72 0.12 205)` `#17bac8`  | `oklch(0.52 0.085 205)` `#117780` | label          |
| orange | 50    | `oklch(0.72 0.15 50)` `#ee8545`   | `oklch(0.52 0.135 50)` `#a44c06`  | label          |
| lime   | 125   | `oklch(0.72 0.15 125)` `#8fb43f`  | `oklch(0.52 0.13 125)` `#587502`  | label          |
| indigo | 275   | `oklch(0.72 0.145 275)` `#8b9bfe` | `oklch(0.52 0.15 275)` `#525dbd`  | label          |

Texto de badge no claro: success `oklch(0.435 0.12 150)` `#00622a`; info `oklch(0.445 0.11 245)` `#04588c`; warning `oklch(0.45 0.095 75)` `#744c00`; danger `oklch(0.46 0.15 25)` `#9a2929`.

Mapeamento:

| Grupo          | Neutro                                                                                             | success                  | info                          | warning                    | danger                       |
| -------------- | -------------------------------------------------------------------------------------------------- | ------------------------ | ----------------------------- | -------------------------- | ---------------------------- |
| Workflow       | Backlog (círculo tracejado), Todo (círculo), Canceled (círculo com X), Duplicate (círculo cortado) | Done (círculo com check) | In Review (círculo com ponto) | In Progress (meio círculo) | —                            |
| Prioridade     | No priority (reticências), High, Medium, Low (barras)                                              | —                        | —                             | —                          | Urgent (triângulo de alerta) |
| Project health | —                                                                                                  | On track (check)         | —                             | At risk (alerta)           | Off track (X)                |

Labels: bolinha colorida + texto neutro (`text-secondary`).

### Tipografia

Corpo em **Inter Variable** (`font-sans`); títulos de página em **Inter Tight Variable** (`font-display`), maiores e em semibold, para contrastar com o corpo. Ambas OFL, self-hosted em `apps/web/src/assets/fonts/`. Pesos `font-normal` (400), `font-medium` (500), `font-semibold` (600).

| Token           | Tamanho | Linha / tracking | Uso                                                                                  |
| --------------- | ------- | ---------------- | ------------------------------------------------------------------------------------ |
| `text-2xs`      | 10 px   | normal           | Palavra entre teclas de atalho ("G then I"), único papel do 10 px no Figma (`1:943`) |
| `text-micro`    | 11 px   | normal           | Contadores, iniciais de avatar                                                       |
| `text-mini`     | 12 px   | normal           | Metadados, chips, botões, identificadores no board                                   |
| `text-small`    | 13 px   | normal           | Texto padrão, identificadores na lista                                               |
| `text-regular`  | 15 px   | normal           | Título de issue no modal                                                             |
| `text-large`    | 18 px   | normal           | Título do login                                                                      |
| `text-heading`  | 20 px   | 28 px / -0,01 em | Título de página (`font-display font-semibold`)                                      |
| `text-title`    | 24 px   | 32 px / -0,16 px | Nome do Project (`font-display font-semibold`, Figma `1:6452`)                       |
| `leading-tight` | —       | 16 px            | Títulos de card do board                                                             |
| `tracking-id`   | —       | -0,02 em         | Identificadores (VYZ-12)                                                             |

### Raios

| Token          | Valor   | Uso                                                                         |
| -------------- | ------- | --------------------------------------------------------------------------- |
| `rounded-xs`   | 4 px    | Checkbox, teclas                                                            |
| `rounded-sm`   | 6 px    | Itens de toggle, linha do menu "/"                                          |
| `rounded-md`   | 8 px    | Itens da sidebar, linhas, cabeçalho de grupo, inputs, itens de menu, avatar |
| `rounded-lg`   | 10 px   | Card de formulário, painel de detalhes                                      |
| `rounded-xl`   | 12 px   | Painel de conteúdo, popovers, modal (o 21 px do Figma fica no inventário)   |
| `rounded-full` | 9999 px | Botões (inclusive de ícone), pills, chips, badges                           |

### Sombras

| Token            | Escuro                                              | Claro                          |
| ---------------- | --------------------------------------------------- | ------------------------------ |
| `shadow-popover` | 3 camadas pretas a 13% (`0 1 1`, `0 2 5`, `0 3 8`)  | as mesmas em grafite a 6%      |
| `shadow-modal`   | 5 camadas pretas a 12,5% e 10% (`0 1 1` … `0 4 40`) | as mesmas em grafite a 6% e 5% |

### Movimento

Transições de 120 ms com `cubic-bezier(0.2, 0, 0, 1)`; `prefers-reduced-motion: reduce` zera transições e animações.

### Espaçamento e tamanhos

Escala nativa do Tailwind v4 (`--spacing: 0.25rem`). Referências do Figma: sidebar 244 px (`w-61`); controles 24, 28, 32 e 44 px; linha de lista 44 px; cabeçalho de grupo 36 px; ícones 14, 16 e 18 px; coluna do board 348 px; popovers 238 e 302 px; painel de detalhes 436 px; modal 920 px.

## Estados sem desenho no Figma

Registrados como "sem design" em `.figma/01-design-tokens.md`: hover de linha e card (`bg-hover`), anel de foco (terracota), durações de transição, erro de input (`border-danger` + `text-danger-strong`) e desabilitado (opacidade 50%, como no Figma).

## Contrastes

Luminância relativa do WCAG 2.x. "Sobre bg-panel" é a superfície principal; "Mínimo" é o pior caso entre todas as superfícies do tema. Metas: acento (anel de foco, indicadores) e ícones ≥ 3:1 em todas as superfícies; acento como texto e texto de badge ≥ 4,5:1.

| Tema   | Tipo              | Token                     | Valor               | Sobre bg-panel | Mínimo | Pior fundo  |
| ------ | ----------------- | ------------------------- | ------------------- | -------------- | ------ | ----------- |
| escuro | texto             | text-primary              | `#faf9f5`           | 17.50          | 15.80  | bg-popover  |
| escuro | texto             | text-secondary            | `#b0aea5`           | 8.29           | 7.48   | bg-popover  |
| escuro | texto             | text-tertiary             | `#87867f`           | 5.04           | 4.55   | bg-popover  |
| escuro | acento (foco)     | accent                    | `#d97757`           | 5.90           | 5.33   | bg-popover  |
| escuro | acento como texto | text-accent               | `#d97757`           | 5.90           | 5.33   | bg-popover  |
| escuro | ícone status      | success                   | `#53be70`           | 7.87           | 7.11   | bg-popover  |
| escuro | ícone status      | info                      | `#43acfb`           | 7.49           | 6.76   | bg-popover  |
| escuro | ícone status      | warning                   | `#da950b`           | 7.27           | 6.57   | bg-popover  |
| escuro | ícone status      | danger                    | `#f47b74`           | 6.96           | 6.29   | bg-popover  |
| escuro | ícone label       | green                     | `#53be70`           | 7.87           | 7.11   | bg-popover  |
| escuro | ícone label       | blue                      | `#43acfb`           | 7.49           | 6.76   | bg-popover  |
| escuro | ícone label       | amber                     | `#da950b`           | 7.27           | 6.57   | bg-popover  |
| escuro | ícone label       | red                       | `#f47b74`           | 6.96           | 6.29   | bg-popover  |
| escuro | ícone label       | purple                    | `#bb8aef`           | 7.02           | 6.34   | bg-popover  |
| escuro | ícone label       | pink                      | `#e97ab2`           | 6.93           | 6.25   | bg-popover  |
| escuro | ícone label       | cyan                      | `#17bac8`           | 7.81           | 7.05   | bg-popover  |
| escuro | ícone label       | orange                    | `#ee8545`           | 7.09           | 6.40   | bg-popover  |
| escuro | ícone label       | lime                      | `#8fb43f`           | 7.70           | 6.95   | bg-popover  |
| escuro | ícone label       | indigo                    | `#8b9bfe`           | 7.21           | 6.51   | bg-popover  |
| escuro | texto de badge    | success                   | `#53be70`           | 6.12           | 5.45   | bg-popover  |
| escuro | texto de badge    | info                      | `#43acfb`           | 5.90           | 5.27   | bg-popover  |
| escuro | texto de badge    | warning                   | `#da950b`           | 5.78           | 5.10   | bg-popover  |
| escuro | texto de badge    | danger                    | `#f47b74`           | 5.58           | 4.94   | bg-popover  |
| escuro | botão primário    | text-inverse / bg-inverse | `#0e0e0d / #faf9f5` | —              | 18.33  | —           |
| escuro | borda             | border-subtle             | `#1f1e1d`           | 1.11           | —      | —           |
| escuro | borda             | border-default            | `#262624`           | 1.22           | —      | —           |
| escuro | borda             | border-strong             | `#30302e`           | 1.39           | —      | —           |
| claro  | texto             | text-primary              | `#141413`           | 17.50          | 13.31  | bg-selected |
| claro  | texto             | text-secondary            | `#5e5d59`           | 6.26           | 4.76   | bg-selected |
| claro  | texto             | text-tertiary             | `#87867f`           | 3.47           | 2.64   | bg-selected |
| claro  | acento (foco)     | accent                    | `#c06041`           | 3.99           | 3.04   | bg-selected |
| claro  | acento como texto | text-accent               | `#a04424`           | 5.96           | 4.53   | bg-selected |
| claro  | ícone status      | success                   | `#0a7e3a`           | 4.91           | 3.74   | bg-selected |
| claro  | ícone status      | info                      | `#036eae`           | 5.18           | 3.94   | bg-selected |
| claro  | ícone status      | warning                   | `#8d5e00`           | 5.34           | 4.06   | bg-selected |
| claro  | ícone status      | danger                    | `#af3c3a`           | 5.65           | 4.30   | bg-selected |
| claro  | ícone label       | green                     | `#0a7e3a`           | 4.91           | 3.74   | bg-selected |
| claro  | ícone label       | blue                      | `#036eae`           | 5.18           | 3.94   | bg-selected |
| claro  | ícone label       | amber                     | `#8d5e00`           | 5.34           | 4.06   | bg-selected |
| claro  | ícone label       | red                       | `#af3c3a`           | 5.65           | 4.30   | bg-selected |
| claro  | ícone label       | purple                    | `#7d4dad`           | 5.64           | 4.29   | bg-selected |
| claro  | ícone label       | pink                      | `#a53c75`           | 5.69           | 4.33   | bg-selected |
| claro  | ícone label       | cyan                      | `#117780`           | 5.02           | 3.82   | bg-selected |
| claro  | ícone label       | orange                    | `#a44c06`           | 5.51           | 4.20   | bg-selected |
| claro  | ícone label       | lime                      | `#587502`           | 5.03           | 3.83   | bg-selected |
| claro  | ícone label       | indigo                    | `#525dbd`           | 5.45           | 4.14   | bg-selected |
| claro  | texto de badge    | success                   | `#00622a`           | 5.86           | 4.53   | bg-selected |
| claro  | texto de badge    | info                      | `#04588c`           | 5.80           | 4.51   | bg-selected |
| claro  | texto de badge    | warning                   | `#744c00`           | 5.87           | 4.55   | bg-selected |
| claro  | texto de badge    | danger                    | `#9a2929`           | 5.88           | 4.56   | bg-selected |
| claro  | botão primário    | text-inverse / bg-inverse | `#faf9f5 / #141413` | —              | 17.50  | —           |
| claro  | borda             | border-subtle             | `#e8e6dc`           | 1.19           | —      | —           |
| claro  | borda             | border-default            | `#d1cfc5`           | 1.48           | —      | —           |
| claro  | borda             | border-strong             | `#bdbbb1`           | 1.83           | —      | —           |

## Pontos em aberto

1. **`text-tertiary` no claro** (`#87867f`): 3,47:1 no painel e 2,64:1 na seleção, abaixo de 4,5:1 como texto. No escuro passa em tudo (mínimo 4,55:1). Opções: restringir a placeholder e metadados não essenciais, ou escurecer só no claro (um degrau entre `#87867f` e `#5e5d59`).
2. **Bordas hairline** têm 1,11 a 1,83:1, abaixo de 3:1 (WCAG 1.4.11 para limites de componente). Inputs e controles também se distinguem pelo degrau de superfície; se for preciso 3:1 na borda de inputs, `border-strong` precisa ficar mais forte.

## Critérios de aceite

- [x] `tokens.css` com primitivos e semânticos dos dois temas, no `@theme` do Tailwind v4, status e labels em `oklch()`.
- [x] Nenhum utilitário de primitivo ou de escala padrão do Tailwind disponível (inclui text-shadow, ease, animate, container, perspective e famílias de fonte).
- [x] Troca de tema escuro/claro/sistema, padrão escuro, preferência em localStorage, sem piscar.
- [x] `/_design` (só em desenvolvimento): tipografia, sidebar, lista de issues, botões em todos os estados, inputs, badges, modal.
- [x] `pnpm check` e `pnpm build` sem avisos; `/_design` fora do build de produção.
- [ ] Aprovação do responsável vendo `/_design`.

## Fora do escopo

Componentes reais (`src/components/ui`) e telas: entram nos passos seguintes, usando estes tokens.
