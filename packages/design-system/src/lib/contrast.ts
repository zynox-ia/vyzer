/**
 * Medidas de contraste usadas pela documentação e pelos testes do design system (skill §3).
 * WCAG 2.x é o critério de aprovação; APCA (Lc) é o critério de qualidade no tema escuro.
 * Cores entram como RGBA 0–255 (alpha 0–1); `toRgba` resolve qualquer cor CSS pelo navegador.
 */
export type Rgba = [number, number, number, number];

let ctx: CanvasRenderingContext2D | null = null;

/** Resolve qualquer cor CSS (hex, oklch, color-mix, rgb com alpha) para RGBA pelo navegador. */
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

export function hexToRgba(hex: string): Rgba {
  const h = hex.replace("#", "");
  return [
    Number.parseInt(h.slice(0, 2), 16),
    Number.parseInt(h.slice(2, 4), 16),
    Number.parseInt(h.slice(4, 6), 16),
    1,
  ];
}

export function toHex([r, g, b]: Rgba): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Compõe uma cor translúcida sobre um fundo opaco. */
export function over(fg: Rgba, bg: Rgba): Rgba {
  const a = fg[3];
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1];
}

export function withAlpha(c: Rgba, alpha: number): Rgba {
  return [c[0], c[1], c[2], c[3] * alpha];
}

/** Luminância relativa do WCAG 2.x. */
export function luminance([r, g, b]: Rgba): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Razão de contraste WCAG 2.x (1 a 21). A ordem dos argumentos não importa. */
export function wcagContrast(a: Rgba, b: Rgba): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
  return (x + 0.05) / (y + 0.05);
}

/**
 * Contraste APCA (SAPC 0.0.98G-4g), em Lc. Positivo: texto escuro sobre fundo claro;
 * negativo: texto claro sobre fundo escuro. Compare metas pelo valor absoluto.
 */
export function apcaContrast(text: Rgba, background: Rgba): number {
  const y = ([r, g, b]: Rgba) => {
    const raw =
      0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;
    return raw > 0.022 ? raw : raw + (0.022 - raw) ** 1.414;
  };
  const yText = y(text);
  const yBg = y(background);
  if (Math.abs(yBg - yText) < 0.0005) return 0;
  if (yBg > yText) {
    const sapc = (yBg ** 0.56 - yText ** 0.57) * 1.14;
    return sapc < 0.1 ? 0 : (sapc - 0.027) * 100;
  }
  const sapc = (yBg ** 0.65 - yText ** 0.62) * 1.14;
  return sapc > -0.1 ? 0 : (sapc + 0.027) * 100;
}
