import { describe, expect, it } from "vitest";
import { addDays, formatDateValue, monthGrid, parseDateInput } from "./date-value";

describe("parseDateInput", () => {
  it("entende os exemplos do Figma", () => {
    expect(parseDateInput("May 2027", 2026)).toEqual({ kind: "month", month: 5, year: 2027 });
    expect(parseDateInput("Q4", 2026)).toEqual({ kind: "quarter", quarter: 4, year: 2026 });
    expect(parseDateInput("20/05/2027", 2026)).toEqual({
      kind: "day",
      day: 20,
      month: 5,
      year: 2027,
    });
  });

  it("aceita semestre, ano e nome de mês por extenso", () => {
    expect(parseDateInput("h2 2028", 2026)).toEqual({ kind: "half", half: 2, year: 2028 });
    expect(parseDateInput("2030", 2026)).toEqual({ kind: "year", year: 2030 });
    expect(parseDateInput("september", 2026)).toEqual({ kind: "month", month: 9, year: 2026 });
  });

  it("recusa datas inválidas e texto desconhecido", () => {
    expect(parseDateInput("31/02/2027", 2026)).toBeUndefined();
    expect(parseDateInput("Q5", 2026)).toBeUndefined();
    expect(parseDateInput("ma", 2026)).toBeUndefined();
    expect(parseDateInput("", 2026)).toBeUndefined();
  });
});

describe("formatDateValue", () => {
  it("formata cada granularidade", () => {
    expect(formatDateValue({ kind: "day", year: 2026, month: 9, day: 26 })).toBe("Sep 26, 2026");
    expect(formatDateValue({ kind: "quarter", year: 2026, quarter: 4 })).toBe("Q4 2026");
    expect(formatDateValue({ kind: "half", year: 2027, half: 1 })).toBe("H1 2027");
  });
});

describe("monthGrid", () => {
  it("setembro de 2026 começa em 30/08 (domingo) como no Figma", () => {
    const grid = monthGrid(2026, 9);
    expect(grid[0]?.[0]).toEqual({ year: 2026, month: 8, day: 30, outside: true });
    expect(grid[0]?.[2]).toEqual({ year: 2026, month: 9, day: 1, outside: false });
    expect(grid).toHaveLength(6);
  });

  it("addDays atravessa meses", () => {
    expect(addDays({ year: 2026, month: 9, day: 30 }, 1)).toEqual({
      year: 2026,
      month: 10,
      day: 1,
    });
  });
});
