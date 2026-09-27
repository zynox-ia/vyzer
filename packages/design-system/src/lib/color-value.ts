/**
 * Cores personalizadas (Icon Picker, Figma 1:1425 "Set custom color"): conversão entre HEX e
 * HSV (matiz, saturação, brilho), o modelo do seletor de área + barra de matiz.
 */
export type HexColor = `#${string}`;

/** h em graus (0–360); s e v de 0 a 1. */
export type Hsv = { h: number; s: number; v: number };

export function isHexColor(value: string): value is HexColor {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** Lê o texto do campo HEX: aceita "ff2fcd", "#FF2FCD" e a forma curta "#f2c". */
export function parseHex(text: string): HexColor | undefined {
  const raw = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${[...raw].map((c) => c + c).join("")}`;
  }
  if (/^[0-9a-f]{6}$/.test(raw)) return `#${raw}`;
  return undefined;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export function hsvToHex({ h, s, v }: Hsv): HexColor {
  const hue = ((h % 360) + 360) % 360;
  const f = (n: number) => {
    const k = (n + hue / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const hex = [f(5), f(3), f(1)]
    .map((c) =>
      Math.round(clamp(c, 0, 1) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
  return `#${hex}`;
}

export function hexToHsv(hex: HexColor): Hsv {
  const n = Number.parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}
