/** A fonte servida é variável e cobre os pesos do design system (300–500). */
import { describe, expect, it } from "vitest";
import { measureWeightCoverage } from "../lib/font-coverage";
import "./index.css";

describe("Figtree Variable", () => {
  it("carrega e cobre os pesos 300 a 500", async () => {
    const result = await measureWeightCoverage("Figtree Variable");
    expect(result.covered, JSON.stringify(result.inkByWeight)).toBe(true);
  });
});
