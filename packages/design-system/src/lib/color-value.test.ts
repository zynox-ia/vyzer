import { describe, expect, it } from "vitest";
import { hexToHsv, hsvToHex, isHexColor, parseHex } from "./color-value";

describe("parseHex", () => {
  it("aceita com e sem #, maiúsculas e a forma curta", () => {
    expect(parseHex("ff2fcd")).toBe("#ff2fcd");
    expect(parseHex(" #FF2FCD ")).toBe("#ff2fcd");
    expect(parseHex("#f2c")).toBe("#ff22cc");
  });

  it("recusa o que não é cor", () => {
    expect(parseHex("")).toBeUndefined();
    expect(parseHex("#ff2fc")).toBeUndefined();
    expect(parseHex("pink")).toBeUndefined();
  });
});

describe("HSV ↔ HEX", () => {
  it("converte as cores primárias e os extremos", () => {
    expect(hsvToHex({ h: 0, s: 1, v: 1 })).toBe("#ff0000");
    expect(hsvToHex({ h: 120, s: 1, v: 1 })).toBe("#00ff00");
    expect(hsvToHex({ h: 240, s: 1, v: 1 })).toBe("#0000ff");
    expect(hsvToHex({ h: 360, s: 1, v: 1 })).toBe("#ff0000");
    expect(hsvToHex({ h: 90, s: 0, v: 1 })).toBe("#ffffff");
    expect(hsvToHex({ h: 90, s: 1, v: 0 })).toBe("#000000");
  });

  it("ida e volta preserva a cor", () => {
    for (const hex of ["#ff2fcd", "#26b5ce", "#4cb782", "#808080", "#123456"] as const) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  it("isHexColor só aceita #rrggbb", () => {
    expect(isHexColor("#ff2fcd")).toBe(true);
    expect(isHexColor("#f2c")).toBe(false);
    expect(isHexColor("orange")).toBe(false);
  });
});
