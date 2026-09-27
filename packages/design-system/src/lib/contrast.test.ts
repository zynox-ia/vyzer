import { describe, expect, it } from "vitest";
import { apcaContrast, hexToRgba, over, wcagContrast } from "./contrast";

describe("wcagContrast", () => {
  it("dá 21:1 entre preto e branco e é simétrico", () => {
    expect(wcagContrast(hexToRgba("#000000"), hexToRgba("#ffffff"))).toBeCloseTo(21, 5);
    expect(wcagContrast(hexToRgba("#ffffff"), hexToRgba("#000000"))).toBeCloseTo(21, 5);
  });

  it("mede #767676 sobre branco no limite de 4,5:1", () => {
    expect(wcagContrast(hexToRgba("#767676"), hexToRgba("#ffffff"))).toBeCloseTo(4.54, 2);
  });
});

describe("apcaContrast", () => {
  // Vetores de teste publicados com o APCA 0.0.98G.
  it("mede #888 sobre branco em Lc 63,06", () => {
    expect(apcaContrast(hexToRgba("#888888"), hexToRgba("#ffffff"))).toBeCloseTo(63.056, 2);
  });

  it("mede branco sobre #888 em Lc −68,54 (polaridade invertida)", () => {
    expect(apcaContrast(hexToRgba("#ffffff"), hexToRgba("#888888"))).toBeCloseTo(-68.541, 2);
  });

  it("mede preto sobre #aaa em Lc 58,15", () => {
    expect(apcaContrast(hexToRgba("#000000"), hexToRgba("#aaaaaa"))).toBeCloseTo(58.146, 2);
  });
});

describe("over", () => {
  it("compõe a seleção bege a 20% sobre o creme em #e3dacc", () => {
    const result = over([135, 94, 40, 0.2], hexToRgba("#faf9f5"));
    expect(result.slice(0, 3).map(Math.round)).toEqual([227, 218, 204]);
  });
});
