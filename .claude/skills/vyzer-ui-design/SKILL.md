---
name: vyzer-ui-design
description: Fundamentos teóricos e regras matemáticas de design de interfaces para CONSTRUIR ou ALTERAR o Vyzer Design System (packages/design-system) — tokens, cores, contraste, tipografia, pesos, espaçamento, raios, sombras, ícones, estados, foco, animação, densidade e componentes. Use somente quando o trabalho for criar, alterar ou revisar o próprio design system. NÃO use para construir telas do produto: telas seguem exclusivamente o design system.
---

# Vyzer UI Design — fundamentos para construir o design system

Esta skill é a ferramenta de **construção** do Vyzer Design System. Depois que um token ou componente existe no design system, **ele** é a fonte da verdade, não esta skill.

- **Construindo ou alterando o design system** (`packages/design-system`, páginas de `/design-system`): use esta skill para calcular e justificar cada decisão.
- **Construindo telas do produto:** não use esta skill. Use somente os tokens e componentes do design system, como documentados em `/design-system`. Se a tela precisar de algo que o design system não tem, **não improvise na tela**: proponha a adição ao design system (aí sim usando esta skill), aguarde aprovação e só então use na tela.

As ADRs têm precedência sobre esta skill: quando uma ADR define um valor, a ADR vence.

## Como usar

1. Antes de qualquer decisão visual, identifique qual(is) seção(ões) abaixo se aplicam.
2. Calcule em vez de "achar": use as fórmulas e limites desta skill.
3. No relatório de cada entrega, cite a regra usada em uma linha. Ex.: "Gap ícone–texto 6 px (§10, 0,5× o tamanho do texto de 13 px, arredondado ao grid)."
4. Se uma decisão pedida pelo usuário violar um limite desta skill (principalmente acessibilidade), implemente-a, **meça**, mostre o número e proponha a alternativa. Não desobedeça em silêncio, não obedeça em silêncio.

---

## §1. Grid e espaçamento

- **Unidade base: 4 px.** Todo espaçamento, altura e dimensão é múltiplo de 4 (exceção: bordas de 1 px e ajustes ópticos de 1–2 px documentados).
- Escala recomendada: 0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96. O passo cresce com o tamanho (progressão quase geométrica), porque a percepção de diferença é relativa (lei de Weber-Fechner): 4→8 é óbvio, 44→48 não é.
- **Proximidade (Gestalt):** o espaço **dentro** de um grupo deve ser menor que o espaço **entre** grupos. Razão mínima de 1,5×, ideal 2×. Ex.: itens de um menu a 4 px entre si, seções do menu a 8–12 px.
- **Padding interno de controles:** horizontal ≥ vertical. Em botões e inputs, padding horizontal ≈ 0,75–1× a altura da fonte × 1,5 (na prática, 8–12 px em controles de 28–32 px).
- Alinhe tudo a colunas e linhas de base consistentes; um desalinhamento de 1–2 px é percebido como erro, não como estilo.

## §2. Tipografia

### Escala
- Use **escala modular**: tamanho(n) = base × razão^n. Para UI densa, razões pequenas: **1,125 (segunda maior)** a **1,2 (terça menor)**. Razões maiores (1,25–1,333) só para páginas de conteúdo/marketing.
- Base de UI do Vyzer: **13 px** (corpo e listas), com 12 px para metadados e 11 px como mínimo absoluto (só caption/kbd/contadores).
- Arredonde o resultado ao inteiro mais próximo e remova tamanhos que difiram menos de ~10% do vizinho (indistinguíveis).

### Altura de linha
- Corpo/UI: 1,4–1,5 × o tamanho. Títulos: 1,1–1,25. Quanto maior a fonte, menor a razão.
- Arredonde a altura de linha para **múltiplo de 4 px** (ex.: 13 px → 20 px; 12 px → 16 px; 24 px → 32 px). Isso mantém o ritmo vertical no grid.

### Tracking (letter-spacing) da Inter
- A Inter publica uma fórmula de "dynamic metrics": **tracking (em) = a + b · e^(c · tamanho)**, com a = −0,0223, b = 0,185, c = −0,1745 (confira os valores em rsms.me/inter/dynmetrics antes de fixar). Resultado: texto pequeno ~0 ou levemente positivo; títulos negativos (≈ −0,02 em a 24 px).
- A Inter Tight já vem com tracking reduzido: não aplique a fórmula por cima; ajuste só se medir colisão.

### Pesos e hierarquia
- Hierarquia se constrói nesta ordem de força: **tamanho > cor/contraste > peso > caixa/tracking**. Use o mínimo de alavancas necessário.
- Diferenças de peso menores que 200 unidades são pouco perceptíveis em texto pequeno; para diferenciar dois níveis pelo peso, use degraus de ≥ 100 **e** mude também cor ou tamanho.
- **Pesos finos (200–300) exigem tamanho grande.** Traços finos perdem legibilidade em telas e somem em tema escuro (o brilho do fundo "come" o traço). Regras:
  - **200:** somente ≥ 40 px (números de métricas, displays).
  - **300:** somente ≥ 24 px (títulos de página, headings grandes).
  - **400–500:** qualquer tamanho; 500 é o peso de ênfase da UI.
  - Nunca use 200/300 em texto de interface, labels, botões ou tabelas.
- No máximo **3 níveis de texto** num mesmo bloco (ex.: primário, secundário, terciário). Mais que isso vira ruído.

### Comprimento de linha
- Texto corrido: **45–75 caracteres** por linha (ideal ~66). Use `max-width` em `ch`. Listas e tabelas não seguem essa regra.

## §3. Cor e contraste

### Contraste (WCAG 2.2)
- Luminância relativa: para cada canal sRGB c (0–1): c ≤ 0,04045 → c/12,92; senão ((c + 0,055)/1,055)^2,4. L = 0,2126 R + 0,7152 G + 0,0722 B.
- Razão de contraste = (L₁ + 0,05) / (L₂ + 0,05), com L₁ a mais clara.
- Mínimos: **4,5:1** texto normal; **3:1** texto grande (≥ 24 px, ou ≥ 18,66 px em 700) e componentes não textuais (ícones, bordas de controle, indicador de foco); **7:1** nível AAA.
- Texto desabilitado é isento, mas deve continuar legível (alvo ≥ 3:1).
- Use `docs/design/palette-contrast.mjs` para medir. Toda tabela de tokens documenta as medidas.

### APCA (complementar)
- O WCAG 2 superestima o contraste em temas escuros. Para o tema escuro, confira também o APCA (Lc): **Lc ≥ 75** texto de corpo, **≥ 60** texto de UI secundário, **≥ 45** títulos grandes, **≥ 30** texto desabilitado/placeholder, **≥ 15** divisores. WCAG continua sendo o critério de aprovação; APCA é o critério de qualidade.

### Construção de paleta
- Trabalhe em **OKLCH**: L é luminosidade perceptual, então cores com o mesmo L parecem igualmente claras. Paletas categóricas (status, labels, gráficos) = mesmo L e C, variando só H.
- Espaçamento de matizes em paletas categóricas: distribua H para maximizar a distância entre vizinhos (≥ 30° entre cores adjacentes quando possível).
- Neutros quentes: croma baixo (C ≈ 0,003–0,012) com matiz ~60–90°. Nunca misture neutros quentes e frios na mesma tela.
- **Tema escuro:** elevação = superfície mais clara (não sombra). Evite preto puro (#000) em fundos grandes; evite branco puro em texto longo (use ~#faf9f5).
- **Cor nunca é o único indicador** (WCAG 1.4.1): combine com ícone, texto ou forma.
- **Orçamento de ênfase:** uma cor de destaque perde força a cada uso. Uma ação primária por vista; acento em < 5% da área.

## §4. Hierarquia visual

- Cada tela tem **um** ponto focal principal. Pergunte: "o que o usuário deve ver primeiro?" e garanta que isso vença em tamanho, contraste ou posição.
- Ações: **uma primária** por contexto; secundárias com menos peso visual; destrutivas separadas das demais.
- Rebaixar é mais eficaz que destacar: para dar ênfase a A, reduza o contraste de B.
- Leitura em F/Z: informação mais importante no topo-esquerda; ações de conclusão no fim do fluxo.

## §5. Raios de borda

- **Regra de aninhamento:** raio interno = raio externo − padding entre eles (mínimo 0). Ex.: card com raio 12 e padding 8 → elementos internos com raio 4. Raios iguais aninhados parecem "grossos" nos cantos.
- O raio cresce com o tamanho do elemento: controles pequenos (badges, checkbox, kbd) < controles (botões, inputs, itens de menu) < contêineres (cards, popovers) < superfícies grandes (modais, painéis).
- Pílula (`full`) só onde a forma comunica algo (avatar, radio, switch, status, chips/tags quando o design pedir).
- Seja consistente: elementos do mesmo papel têm o mesmo raio em todo o sistema.

## §6. Tamanho e áreas de clique

- **Lei de Fitts:** T = a + b · log₂(D/W + 1). Alvos maiores e mais próximos são mais rápidos. Ações frequentes = alvos maiores e próximos do ponto de atenção.
- Área de clique mínima: **24 × 24 px** (WCAG 2.2, 2.5.8). Desktop confortável: **28–32 px** de altura para controles. Toque (mobile): **44 × 44 px** (Apple HIG) / 48 dp (Material).
- Se o visual for menor que o mínimo (ex.: ícone de 16 px), amplie a área clicável com padding invisível, não o ícone.
- Escala de alturas compartilhada entre Button, Input, Select, IconButton: ex. xs 20 · sm 24 · md 28 · lg 32 · xl 40. Componentes equivalentes no mesmo tamanho têm exatamente a mesma altura.

## §7. Complexidade e escolhas

- **Lei de Hick:** T = b · log₂(n + 1). Mais opções = decisão mais lenta. Menus longos precisam de agrupamento, busca ou divulgação progressiva.
- **Divulgação progressiva:** mostre o essencial; o avançado atrás de "mais opções", menus ou painéis.
- **Carga cognitiva / lei de Miller:** agrupe informação em blocos pequenos (≈ 4–7 itens) para facilitar leitura; não é um limite rígido de itens em menus.
- **Lei de Jakob:** usuários esperam que o produto funcione como os que já usam. No Vyzer, a referência de comportamento é o Linear (atalhos, padrões de lista, menus).

## §8. Movimento

- Limites de percepção (Nielsen): **≤ 100 ms** parece instantâneo; **≤ 1 s** mantém o fluxo; **> 10 s** perde a atenção (precisa de progresso).
- Durações: micro-interações (hover, cor, toggle) **100–150 ms**; entrada de overlays (popover, menu, tooltip) **150–200 ms**; modais/sheets **200–300 ms**. Saída ≈ **70–80%** da entrada.
- Easing: entrada = **ease-out** (desacelera ao chegar); saída = **ease-in**; movimento dentro da tela = ease-in-out. Nunca linear em movimentos de posição.
- Distância pequena: deslocamentos de 4–8 px em entradas; escala de 0,96–0,98 → 1 em popovers.
- Tooltip: atraso de abertura ~400–700 ms na primeira, instantâneo entre tooltips vizinhos.
- `prefers-reduced-motion: reduce` → remova deslocamentos e escalas, mantenha só opacidade rápida.

## §9. Elevação e sombras

- Luz vem de cima: sombras deslocadas para baixo (y > 0), x = 0.
- Sombra realista = **duas camadas**: uma curta e mais escura (contato) + uma longa e difusa (ambiente). Blur ≈ 2× o deslocamento y.
- Quanto mais alto o elemento (tooltip < popover < modal), maior o deslocamento e o blur, menor a opacidade relativa.
- Tema escuro: sombras quase invisíveis; use superfície mais clara + hairline para separar.

## §10. Ícones e alinhamento óptico

- Tamanho do ícone ≈ **altura da linha do texto** vizinho, ou 1,2–1,25× o tamanho da fonte (13 px → 16 px).
- Gap ícone–texto ≈ **0,4–0,6×** o tamanho da fonte, arredondado ao grid (13 px → 6 px; 12 px → 4–6 px).
- Ícones herdam cor via `currentColor` e usam o mesmo stroke em todo o sistema.
- **Alinhamento óptico:** formas pontudas/assimétricas (play, seta, triângulo) precisam ser deslocadas 1–2 px para parecerem centralizadas. Círculos parecem menores que quadrados do mesmo tamanho (ajuste ~+5–10%).
- Centralize ícone com texto pela **altura x/cap height**, não pela caixa do texto.

## §11. Gestalt aplicada

- **Proximidade:** agrupe por espaço antes de usar bordas.
- **Similaridade:** mesma aparência = mesma função. Nunca estilize igual coisas que se comportam diferente.
- **Região comum:** fundos/bordas agrupam quando o espaço não basta.
- **Alinhamento e continuidade:** bordas alinhadas criam linhas implícitas que organizam a tela.
- **Figura e fundo:** overlays precisam de separação clara (sombra, scrim, contraste).

## §12. Estados

- Todo elemento interativo tem: default, hover, **focus-visible**, active/pressed, disabled — e quando aplicável selected, loading, error, read-only.
- Hover e selected como **camadas translúcidas** sobre a superfície (ex.: 4% e 7%), para funcionarem em qualquer fundo.
- Foco: visível só com teclado (`:focus-visible`), contraste ≥ 3:1 com o entorno, nunca removido sem substituto.
- Disabled: reduz contraste, remove hover e cursor de ação, mantém legibilidade; explique o porquê via tooltip quando não for óbvio.
- Loading: mantenha a dimensão do componente (sem saltos de layout); spinner ou skeleton no lugar do conteúdo.

## §13. Densidade

- Densidade muda **espaço**, não tamanho de fonte. Compact = um degrau abaixo na escala de espaçamento e altura (ex.: linhas de 36 → 32 px; padding 8 → 6 px).
- Listas estilo Linear: linha de 32–36 px, texto 13 px, metadados 12 px.

## §14. Formulários

- Label sempre visível, acima do campo. **Placeholder não é label.**
- Texto de ajuda abaixo do campo; erro substitui a ajuda, diz o que aconteceu e como corrigir ("Team key já está em uso. Tente outra.").
- Valide ao sair do campo (blur) ou ao enviar, não a cada tecla.
- Largura do campo sugere o tamanho esperado do conteúdo.
- Ordem de tab = ordem visual.

## §15. Conteúdo

- Rótulos de ação com verbo ("Salvar alterações", não "OK").
- Frases curtas, sentence case, sem ponto final em botões e labels.
- Estados vazios explicam o que é a tela e oferecem a próxima ação.

---

## Checklist antes de entregar qualquer peça visual

- [ ] Todos os valores vêm de tokens e respeitam o grid de 4 px (§1)
- [ ] Hierarquia tipográfica com ≤ 3 níveis por bloco; pesos finos só nos tamanhos permitidos (§2)
- [ ] Contraste medido e documentado: texto ≥ 4,5:1, não-texto ≥ 3:1, nos dois temas (§3)
- [ ] Um ponto focal e uma ação primária por contexto (§4)
- [ ] Raios seguem a escala e a regra de aninhamento (§5)
- [ ] Áreas de clique ≥ 24 px; alturas iguais entre componentes equivalentes (§6)
- [ ] Movimento com duração e easing corretos e reduced-motion (§8)
- [ ] Ícones no tamanho e gap corretos, alinhamento óptico conferido (§10)
- [ ] Todos os estados implementados, foco visível com teclado (§12)
- [ ] Cada decisão relevante citada no relatório com a regra correspondente

## Fontes de referência (consulte; não copie texto)

- WCAG 2.2 (W3C) — contraste, foco, tamanho de alvo, uso de cor
- APCA / SAPC (Myndex) — contraste perceptual
- Inter dynamic metrics (rsms.me/inter/dynmetrics) — tracking
- Nielsen Norman Group — tempos de resposta, heurísticas de usabilidade
- Leis de Fitts e de Hick; princípios da Gestalt
- Apple Human Interface Guidelines e Material Design — alvos de toque, movimento, elevação
- Practical Typography (Butterick) — comprimento de linha, entrelinha
- OKLCH / CSS Color Level 4 — espaço de cor perceptual
