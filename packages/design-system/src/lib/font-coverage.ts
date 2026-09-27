/**
 * Confirma no navegador que uma fonte variável cobre os pesos usados: cada peso precisa
 * escurecer o texto (mais tinta por glifo). Sem o eixo, pesos vizinhos saem iguais.
 * Usado pela página Typography de /design-system e pelos testes das fontes.
 */
export const DESIGN_WEIGHTS = [300, 400, 500] as const;

const SAMPLE = "Vyzer 0123456789";

/** Soma da cobertura (alpha) do texto desenhado num canvas. */
function ink(family: string, weight: number): number {
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 60;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return 0;
  ctx.font = `${weight} 40px "${family}"`;
  ctx.fillText(SAMPLE, 4, 44);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let sum = 0;
  for (let i = 3; i < data.length; i += 4) sum += data[i] ?? 0;
  return sum;
}

export type WeightCoverage = {
  /** Tinta relativa ao peso 400 (1 = igual ao 400). */
  inkByWeight: Record<number, number>;
  /** Todos os pesos carregados e a tinta cresce a cada peso. */
  covered: boolean;
};

export async function measureWeightCoverage(family: string): Promise<WeightCoverage> {
  await Promise.all(DESIGN_WEIGHTS.map((w) => document.fonts.load(`${w} 40px "${family}"`)));
  const loaded = DESIGN_WEIGHTS.every((w) => document.fonts.check(`${w} 40px "${family}"`));
  const raw = DESIGN_WEIGHTS.map((w) => ink(family, w));
  const base = raw[DESIGN_WEIGHTS.indexOf(400)] || 1;
  const increasing = raw.every((v, i) => i === 0 || v > (raw[i - 1] ?? 0));
  return {
    inkByWeight: Object.fromEntries(DESIGN_WEIGHTS.map((w, i) => [w, (raw[i] ?? 0) / base])),
    covered: loaded && increasing,
  };
}
