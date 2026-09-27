/**
 * Valores de data com granularidade (Figma 1:3, "Start date"): dia, mês, trimestre, semestre
 * ou ano. Formatação em inglês (ADR-0002) e leitura do texto digitado no campo do seletor.
 */
export type DateGranularity = "day" | "month" | "quarter" | "half" | "year";

export type DateValue =
  | { kind: "day"; year: number; month: number; day: number }
  | { kind: "month"; year: number; month: number }
  | { kind: "quarter"; year: number; quarter: 1 | 2 | 3 | 4 }
  | { kind: "half"; year: number; half: 1 | 2 }
  | { kind: "year"; year: number };

/** Meses 1–12. */
export const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function formatDateValue(v: DateValue): string {
  switch (v.kind) {
    case "day":
      return `${MONTHS_SHORT[v.month - 1]} ${v.day}, ${v.year}`;
    case "month":
      return `${MONTHS_SHORT[v.month - 1]} ${v.year}`;
    case "quarter":
      return `Q${v.quarter} ${v.year}`;
    case "half":
      return `H${v.half} ${v.year}`;
    case "year":
      return String(v.year);
  }
}

export function sameDateValue(a: DateValue | undefined, b: DateValue): boolean {
  return a !== undefined && formatDateValue(a) === formatDateValue(b) && a.kind === b.kind;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Lê o texto do campo (Figma: "Try: May 2027, Q4, 20/05/2027"). Aceita dd/mm/aaaa,
 * "May 2027" (ou "may"), "Q4" / "Q4 2027", "H1" / "H1 2027" e "2027". Sem ano, usa o ano
 * de referência. Devolve undefined quando não entende.
 */
export function parseDateInput(text: string, referenceYear: number): DateValue | undefined {
  const t = text.trim().toLowerCase().replace(/\s+/g, " ");
  if (t === "") return undefined;

  let m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(t);
  if (m) {
    const [day, month, year] = [Number(m[1]), Number(m[2]), Number(m[3])];
    if (month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month)) {
      return { kind: "day", year, month, day };
    }
    return undefined;
  }

  m = /^q([1-4])(?: (\d{4}))?$/.exec(t);
  if (m) {
    return {
      kind: "quarter",
      quarter: Number(m[1]) as 1 | 2 | 3 | 4,
      year: m[2] ? Number(m[2]) : referenceYear,
    };
  }

  m = /^h([12])(?: (\d{4}))?$/.exec(t);
  if (m) {
    return { kind: "half", half: Number(m[1]) as 1 | 2, year: m[2] ? Number(m[2]) : referenceYear };
  }

  m = /^(\d{4})$/.exec(t);
  if (m) return { kind: "year", year: Number(m[1]) };

  m = /^([a-z]+)(?: (\d{4}))?$/.exec(t);
  if (m) {
    const word = m[1] ?? "";
    const index = MONTHS_LONG.findIndex((name) => word.length >= 3 && name.startsWith(word));
    if (index >= 0) {
      return { kind: "month", month: index + 1, year: m[2] ? Number(m[2]) : referenceYear };
    }
  }
  return undefined;
}

/** Grade do mês com semanas completas (domingo a sábado), incluindo dias vizinhos. */
export function monthGrid(year: number, month: number) {
  const first = new Date(year, month - 1, 1);
  const start = new Date(year, month - 1, 1 - first.getDay());
  const weeks: { year: number; month: number; day: number; outside: boolean }[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      week.push({
        year: cursor.getFullYear(),
        month: cursor.getMonth() + 1,
        day: cursor.getDate(),
        outside: cursor.getMonth() !== month - 1,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Soma dias a uma data (para a navegação por setas no calendário). */
export function addDays(
  v: { year: number; month: number; day: number },
  days: number,
): { year: number; month: number; day: number } {
  const d = new Date(v.year, v.month - 1, v.day + days);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
