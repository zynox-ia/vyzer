/**
 * Utilitários das páginas de Foundations: resolvem qualquer cor CSS (hex, oklch, color-mix)
 * para RGB pelo próprio navegador e medem contraste WCAG 2.x. Não são usados por componentes.
 */
export type Rgba = [number, number, number, number];

let ctx: CanvasRenderingContext2D | null = null;

export function toRgba(cssColor: string): Rgba {
  if (!ctx) {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    ctx = canvas.getContext("2d", { willReadFrequently: true });
  }
  if (!ctx) return [0, 0, 0, 1];
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r = 0, g = 0, b = 0, a = 255] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a / 255];
}

/** Compõe uma cor translúcida sobre um fundo opaco. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}

function luminance([r, g, b]: Rgba): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: Rgba, b: Rgba): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

export function toHex([r, g, b]: Rgba): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Lê o valor resolvido de uma variável CSS dentro de um elemento (que define o tema). */
export function readVar(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}
