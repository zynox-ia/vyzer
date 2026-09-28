/**
 * Geometria dos gráficos (VYZ-36) sem papel de token: o Recharts precisa de números simples para
 * calcular path, margem e tamanho de ladrilho — não dá pra passar `var(--token)` para essas props
 * (não são propriedades CSS, o Recharts só usa o valor pra fazer a conta). Para não espalhar
 * números soltos pelos componentes, cada um mora aqui, uma vez só, com a origem da medição. Onde
 * o valor já bate com um token existente (`--radius-inline` etc.), o comentário cita o token —
 * não é uma proposta nova.
 *
 * As quatro espessuras de traço que ERAM valores propostos aqui (linha, sparkline, hachura de fim
 * de semana) foram aprovadas em 28/09 e viraram tokens em `theme.css`
 * (`--chart-line-width`/`--chart-sparkline-width`/`--chart-sparkline-bar-radius`/
 * `--chart-weekend-hatch-width`): os componentes agora passam `style={{ strokeWidth:
 * "var(--chart-line-width)" }}` direto, sem constante aqui. Exceção: o raio da barra da Sparkline
 * (`SPARKLINE_BAR_RADIUS` abaixo) — o `radius` do `Bar` do Recharts calcula o path do arco em
 * JavaScript, no render, não como propriedade CSS, então `var()` nunca resolve ali; a função lê o
 * valor computado do token em `document.documentElement` uma vez, para não duplicar o número.
 */

/** Lê um token de comprimento (px) do CSS em `document.documentElement`, uma vez — para valores
 * que o Recharts consome como número em JavaScript (não como propriedade CSS), onde `var()` não
 * tem como resolver. `document` sempre existe aqui: os componentes de gráfico só rodam no
 * navegador. Sem stylesheet carregado (ex.: um teste que não importa `styles/index.css`), cai no
 * `fallback`. */
function readLengthToken(name: string, fallback: number): number {
  if (typeof document === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Raio do marcador ativo (círculo do ponto em foco/hover): skill dataviz, marks-and-anatomy.md
 * ("marker >= 8px, r >= 4") — não é uma medição do Linear, é a regra já adotada pela fase. */
export const CHART_MARKER_RADIUS = 4;

/** Anel de 2 px na cor da superfície ao redor do marcador ativo: skill dataviz ("surface ring"). */
export const CHART_MARKER_RING_WIDTH = 2;

/** Raio do canto superior do segmento do topo numa barra empilhada: já é o valor de
 * `--radius-inline` (4 px) — não é token novo, só não dá pra referenciar via `var()` porque o
 * `radius` do `Bar` do Recharts calcula o path do arco com um número, não com uma propriedade
 * CSS. */
export const STACKED_BAR_TOP_RADIUS = 4; // --radius-inline

/** Espessura máxima de uma barra empilhada: skill dataviz, marks-and-anatomy.md ("bar <= 24px"). */
export const STACKED_BAR_MAX_SIZE = 24;

/** Vão de 2 px entre segmentos de uma barra empilhada (skill dataviz, "surface gap"): sem prop
 * nativo de gap no `Bar` empilhado do Recharts, desenhado como um traço (`stroke`) na cor da
 * superfície ao redor de cada segmento. */
export const STACKED_BAR_SEGMENT_GAP = 2;

/** Raio do topo das barras da Sparkline (variant="bar"): geometria na escala de 32×16 — o
 * `--radius-inline` (4 px) ficaria desproporcional numa barra tão fina. Token aprovado
 * `--chart-sparkline-bar-radius` (1 px); lido do CSS porque o `radius` do `Bar` do Recharts é
 * geometria calculada em JS, não uma propriedade CSS (ver `readLengthToken` acima). */
export const SPARKLINE_BAR_RADIUS = readLengthToken("--chart-sparkline-bar-radius", 1);

/** Hachura de fim de semana do BurnUpChart: ladrilho e rotação aproximados do padrão real do
 * Linear (medido em 28/09: ladrilho ~5,66×10,65 px, ~62°, arredondado para uma grade mais simples
 * de calcular). `width`/`height`/`patternTransform` de um `<pattern>` são atributos de
 * geometria, não propriedades CSS — `var()` não se aplica aqui de qualquer forma. A espessura da
 * linha do traço da hachura usa o token aprovado `--chart-weekend-hatch-width` direto via
 * `style` no componente (é `stroke-width`, uma propriedade CSS de verdade). */
export const WEEKEND_PATTERN_WIDTH = 6;
export const WEEKEND_PATTERN_HEIGHT = 11;
export const WEEKEND_PATTERN_ROTATION_DEG = 60;

/** Opacidade de uma série/segmento não-destacado quando outro está em hover (LineChart,
 * StackedBarChart): mesmo valor de `--opacity-inactive` (40%) já usado pela Legend para o mesmo
 * papel — `strokeOpacity`/`fillOpacity` do Recharts são atributos de apresentação SVG, não
 * propriedades CSS, então não aceitam `var()` diretamente. */
export const CHART_INACTIVE_OPACITY = 0.4;

/** Nº de marcas do eixo Y oculto usadas para desenhar a grade horizontal (LineChart,
 * StackedBarChart): "poucos ticks" (skill dataviz) — 3 linhas finas, nunca a grade cheia padrão
 * do Recharts. O BurnUpChart não usa grade nenhuma (medido ao vivo no Linear, 28/09: as
 * "gridlines" do card Progress real são hairlines quase invisíveis, função de borda, não de
 * grade de leitura). */
export const CHART_GRID_TICK_COUNT = 3;

/** Margem interna do `ComposedChart`/`BarChart`/`LineChart` do Recharts (BurnUpChart,
 * StackedBarChart e LineChart usam a mesma): respiro mínimo pra o marcador ativo e o tique do
 * eixo não cortarem na borda do container. `margin` é geometria de layout do Recharts, não uma
 * propriedade CSS — não é medição do Linear, é uma decisão de composição sem frame de referência.
 * Sem token: não é um valor de espaçamento do DS (não é padding de um elemento HTML), é o inset
 * interno do SVG que o Recharts desenha. */
export const CHART_MARGIN = { top: 4, right: 4, bottom: 0, left: 4 };

/** Tamanho padrão da Sparkline (Figma 25:5437/25:5438, coluna Status da lista de projetos):
 * elemento inline pequeno ao lado de um valor textual, sem `ResponsiveContainer`. */
export const SPARKLINE_WIDTH = 32;
export const SPARKLINE_HEIGHT = 16;

/** Margem interna da Sparkline: mesma razão de "respiro mínimo" do `CHART_MARGIN`, mas numa
 * escala muito menor (32×16) — usar `CHART_MARGIN` aqui cortaria o traço. */
export const SPARKLINE_MARGIN = { top: 2, right: 1, bottom: 2, left: 1 };

/** Vão entre barras da Sparkline (variant="bar"): percentual do `barCategoryGap` do Recharts, não
 * um pixel — não há `var()` possível aqui de qualquer forma. Proporção visual escolhida para a
 * escala de 32px de largura, sem frame de referência. */
export const SPARKLINE_BAR_CATEGORY_GAP = "30%";

/** Swatch da Legend genérica (`chart-legend.tsx`, StackedBarChart/LineChart): quadrado de 12×12,
 * com o retângulo do "mark=swatch" a 1px de inset (10×10, raio 2) e a linha do "mark=line" na
 * metade da altura — geometria do próprio SVG do componente, sem frame no Figma (skill dataviz,
 * marks-and-anatomy.md: "marker >= 8px" já cumprido pelos 12px). O traço da linha reaproveita
 * `CHART_MARKER_RING_WIDTH` (2px): mesmo valor, sem token comum ainda entre os dois papéis. */
export const LEGEND_SWATCH_SIZE = 12;
export const LEGEND_SWATCH_INSET = 1;
export const LEGEND_SWATCH_RADIUS = 2;

/** Swatch da legenda de papel fixo do BurnUpChart (própria, não a Legend genérica acima): quadrado
 * de 6×6, raio 1 — escala menor porque acompanha o rótulo curto (Scope/Started/Completed) e o
 * valor, não uma lista de itens variável. Sem frame dedicado no Figma 25:3047. */
export const BURN_UP_LEGEND_SWATCH_SIZE = 6;
export const BURN_UP_LEGEND_SWATCH_RADIUS = 1;
