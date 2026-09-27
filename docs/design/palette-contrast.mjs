// Deriva e mede a paleta do Vyzer nos dois temas (docs/specs/design-tokens.md).
// Uso: node docs/design/palette-contrast.mjs            → tabela Markdown de contraste
//      node docs/design/palette-contrast.mjs --json     → valores derivados em JSON
//
// Contraste: luminância relativa do WCAG 2.x. Status e labels: OKLCH com a mesma
// luminosidade (L) e croma (C) em todas as cores, variando só o matiz (H).

const hex2rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const rgb2hex = (c) =>
  "#" +
  c
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, v)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const lin = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const delin = (v) => (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055);
const lum = (h) => {
  const [r, g, b] = hex2rgb(h).map(lin);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const mix = (fg, bg, alpha) =>
  rgb2hex(hex2rgb(fg).map((v, i) => v * alpha + hex2rgb(bg)[i] * (1 - alpha)));

// OKLCH → sRGB linear (sem clamp), para testar gama.
const oklchToLinear = (L, C, H) => {
  const a = C * Math.cos((H * Math.PI) / 180);
  const b = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
};
const inGamut = (L, C, H) => oklchToLinear(L, C, H).every((v) => v >= -0.0005 && v <= 1.0005);
const oklch = (L, C, H) => rgb2hex(oklchToLinear(L, C, H).map(delin));
const toOklchL = (hex) => {
  const [r, g, b] = hex2rgb(hex).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return [L, Math.hypot(A, B), ((Math.atan2(B, A) * 180) / Math.PI + 360) % 360];
};

// Superfícies (aprovadas no feedback V1 + derivadas) e texto.
const themes = {
  dark: {
    surfaces: {
      "bg-app": "#0e0e0d",
      "bg-sidebar": "#141413",
      "bg-panel": "#141413",
      "bg-surface": "#1a1a18",
      "bg-subtle": "#1a1a18",
      "bg-popover": "#1f1e1d",
      "bg-control": "#1a1a18",
      "bg-input": "#1a1a18",
      "bg-control-strong": "#1f1e1d",
      "bg-hover": "#1a1a18",
      "bg-selected": "#1f1e1d",
    },
    text: { "text-primary": "#faf9f5", "text-secondary": "#b0aea5", "text-tertiary": "#87867f" },
    borders: {
      "border-subtle": "#1f1e1d",
      "border-default": "#262624",
      "border-strong": "#30302e",
    },
    // Status/labels: começa em L 0,72 e sobe se necessário.
    inverse: "#0e0e0d", // text-inverse sobre bg-inverse (= text-primary)
    L0: 0.72,
    dir: 1,
  },
  light: {
    surfaces: {
      "bg-app": "#faf9f5",
      "bg-sidebar": "#f0eee6",
      "bg-panel": "#faf9f5",
      "bg-surface": "#f0eee6",
      "bg-subtle": "#f0eee6",
      "bg-popover": "#faf9f5",
      "bg-control": "#f0eee6",
      "bg-input": "#faf9f5",
      "bg-control-strong": "#e8e6dc",
      "bg-hover": "#e8e6dc",
      "bg-selected": "#e3dacc",
    },
    text: { "text-primary": "#141413", "text-secondary": "#5e5d59", "text-tertiary": "#87867f" },
    borders: {
      "border-subtle": "#e8e6dc",
      "border-default": "#d1cfc5",
      "border-strong": "#bdbbb1",
    },
    inverse: "#faf9f5",
    L0: 0.55,
    dir: -1,
  },
};

const ACCENT_BASE = "#d97757"; // terracota da referência
const CHROMA = 0.15;
const hues = {
  success: 150, // verde
  info: 245, // azul
  warning: 75, // âmbar
  danger: 25, // vermelho
};
const labelHues = {
  green: 150,
  blue: 245,
  amber: 75,
  red: 25,
  purple: 305,
  pink: 350,
  cyan: 205,
  orange: 50,
  lime: 125,
  indigo: 275,
};

const out = {};
for (const [name, t] of Object.entries(themes)) {
  const surf = Object.values(t.surfaces);
  // Croma por matiz: CHROMA, limitado ao máximo que cabe no sRGB naquele L (ciano e âmbar saturam antes).
  const chroma = (L, H) => {
    let c = CHROMA;
    while (c > 0.02 && !inGamut(L, c, H)) c -= 0.005;
    return c;
  };
  const color = (L, H) => oklch(L, chroma(L, H), H);
  const allHues = [...new Set([...Object.values(hues), ...Object.values(labelHues)])];
  // L dos ícones/bolinhas: parte de L0 e anda até todos terem ≥ 3:1 em todas as superfícies.
  let L = t.L0;
  for (
    let i = 0;
    i < 200 && !allHues.every((H) => surf.every((s) => contrast(color(L, H), s) >= 3));
    i++
  )
    L += t.dir * 0.005;
  // Texto de badge: mesmo matiz; L anda a partir do L dos ícones até ≥ 4,5:1 sobre o fundo a 15% em todas as superfícies.
  const badgeL = (H) => {
    const bgColor = color(L, H);
    let bl = L;
    for (
      let i = 0;
      i < 200 && !surf.every((s) => contrast(color(bl, H), mix(bgColor, s, 0.15)) >= 4.5);
      i++
    )
      bl += t.dir * 0.005;
    return bl;
  };
  const status = Object.fromEntries(Object.entries(hues).map(([k, H]) => [k, color(L, H)]));
  const badge = Object.fromEntries(Object.entries(hues).map(([k, H]) => [k, color(badgeL(H), H)]));
  const labels = Object.fromEntries(Object.entries(labelHues).map(([k, H]) => [k, color(L, H)]));
  const chromas = Object.fromEntries(
    Object.entries(labelHues).map(([k, H]) => [k, +chroma(L, H).toFixed(3)]),
  );
  const badgeLs = Object.fromEntries(
    Object.entries(hues).map(([k, H]) => [k, +badgeL(H).toFixed(3)]),
  );

  // Acento: terracota (matiz e croma da base) com L ajustado até a meta em todas as superfícies.
  // Anel de foco e indicadores: ≥ 3:1. Acento usado como texto (contadores): ≥ 4,5:1.
  const [aL, aC, aH] = toOklchL(ACCENT_BASE);
  const fitAccent = (min) => {
    let l = aL;
    for (let i = 0; i < 200; i++) {
      let c = aC;
      while (!inGamut(l, c, aH) && c > 0.02) c -= 0.005;
      const hex = oklch(l, c, aH);
      if (surf.every((s) => contrast(hex, s) >= min))
        return { hex, css: `oklch(${+l.toFixed(3)} ${+c.toFixed(3)} ${+aH.toFixed(1)})` };
      l += t.dir * 0.005;
    }
    throw new Error("acento não converge");
  };
  const accentFit = fitAccent(3);
  const accentTextFit = fitAccent(4.5);
  const accent = accentFit.hex;
  const accentText = accentTextFit.hex;
  out[name] = {
    ...t,
    L: +L.toFixed(3),
    chromas,
    badgeLs,
    status,
    badge,
    labels,
    accent,
    accentCss: accentFit.css,
    accentText,
    accentTextCss: accentTextFit.css,
  };
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}

const rows = [];
const worst = (fn, surf) => {
  const cs = Object.entries(surf).map(([k, v]) => [k, fn(v)]);
  return cs.reduce((a, b) => (b[1] < a[1] ? b : a));
};
for (const [name, t] of Object.entries(out)) {
  const surf = t.surfaces;
  const row = (kind, token, value, fn) => {
    const [on, min] = worst(fn, surf);
    rows.push([name, kind, token, value, fn(surf["bg-panel"]).toFixed(2), min.toFixed(2), on]);
  };
  for (const [k, v] of Object.entries(t.text)) row("texto", k, v, (s) => contrast(v, s));
  row("acento (foco)", "accent", t.accent, (s) => contrast(t.accent, s));
  row("foco A (acento 25%)", "focus-a", mix(t.accent, surf["bg-panel"], 0.25), (s) =>
    contrast(mix(t.accent, s, 0.25), s),
  );
  row("foco B (acento 100%)", "focus-b", t.accent, (s) => contrast(t.accent, s));
  row("acento como texto", "text-accent", t.accentText, (s) => contrast(t.accentText, s));
  for (const [k, v] of Object.entries(t.status)) row("ícone status", k, v, (s) => contrast(v, s));
  for (const [k, v] of Object.entries(t.labels)) row("ícone label", k, v, (s) => contrast(v, s));
  for (const [k, v] of Object.entries(t.badge))
    row("texto de badge", k, v, (s) => contrast(v, mix(t.status[k], s, 0.15)));
  rows.push([
    name,
    "botão primário",
    "text-inverse / bg-inverse",
    `${t.inverse} / ${t.text["text-primary"]}`,
    "—",
    contrast(t.inverse, t.text["text-primary"]).toFixed(2),
    "—",
  ]);
  for (const [k, v] of Object.entries(t.borders))
    rows.push([name, "borda", k, v, contrast(v, surf["bg-panel"]).toFixed(2), "—", "—"]);
}
console.log(
  `OKLCH status/labels: escuro L ${out.dark.L}, C ${JSON.stringify(out.dark.chromas)}; claro L ${out.light.L}, C ${JSON.stringify(out.light.chromas)}, texto de badge L ${JSON.stringify(out.light.badgeLs)}\n`,
);
console.log("| Tema | Tipo | Token | Valor | Sobre bg-panel | Mínimo | Pior fundo |");
console.log("| ---- | ---- | ----- | ----- | -------------- | ------ | ---------- |");
for (const r of rows)
  console.log(
    `| ${r[0] === "dark" ? "escuro" : "claro"} | ${r[1]} | ${r[2]} | \`${r[3]}\` | ${r[4]} | ${r[5]} | ${r[6]} |`,
  );
