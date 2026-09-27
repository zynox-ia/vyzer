import { describe, expect, it } from "vitest";
import { sectorPath } from "./StatusIcon";

/** Pontos finais dos setores do Figma (nó 6:1543), em sextos, a partir das 12 h. */
describe("sectorPath", () => {
  it("usa o arco menor até metade e o maior depois", () => {
    expect(sectorPath(1 / 6)).toBe("M7 7V3.5A3.5 3.5 0 0 1 10.0311 5.2500Z");
    expect(sectorPath(1 / 3)).toBe("M7 7V3.5A3.5 3.5 0 0 1 10.0311 8.7500Z");
    expect(sectorPath(1 / 2)).toBe("M7 7V3.5A3.5 3.5 0 0 1 7.0000 10.5000Z");
    expect(sectorPath(2 / 3)).toBe("M7 7V3.5A3.5 3.5 0 1 1 3.9689 8.7500Z");
    expect(sectorPath(5 / 6)).toBe("M7 7V3.5A3.5 3.5 0 1 1 3.9689 5.2500Z");
  });

  it("limita o progresso entre 0 e 1", () => {
    expect(sectorPath(2)).toBe(sectorPath(1));
    expect(sectorPath(-1)).toBe(sectorPath(0));
  });
});
