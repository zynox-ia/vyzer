/**
 * Date Picker (Figma 1:3, "Start date"): campo que entende texto ("May 2027", "Q4",
 * "20/05/2027"), granularidade em pílulas (Day, Month, Quarter, Half-year, Year) e o corpo de
 * cada uma: calendário com fins de semana sombreados e hoje marcado, ou grades de pílulas por
 * ano. DatePickerPanel é o painel solto; DatePicker o abre num Popover a partir de um gatilho.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Popover } from "radix-ui";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactElement } from "react";
import { cn } from "../lib/cn";
import {
  MONTHS_SHORT,
  addDays,
  monthGrid,
  parseDateInput,
  sameDateValue,
  type DateGranularity,
  type DateValue,
} from "../lib/date-value";
import { IconButton } from "./button";
import { TextInput } from "./input";
import { popoverSurface } from "./listbox";
import { SegmentedControl } from "./segmented";

const GRANULARITIES: { value: DateGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "half", label: "Half-year" },
  { value: "year", label: "Year" },
];

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export type DatePickerPanelProps = {
  /** Rótulo no topo (ex.: "Start date", "Target date"). */
  label: string;
  value?: DateValue;
  onValueChange: (value: DateValue) => void;
  /** Granularidade inicial; o padrão vem do valor atual ou é "day". */
  defaultGranularity?: DateGranularity;
  /** Data de hoje (injetável para testes e documentação). */
  today?: Date;
  /** Quantos anos as grades de mês, trimestre e semestre mostram a partir do atual. */
  years?: number;
  className?: string;
};

type Day = { year: number; month: number; day: number };

export function DatePickerPanel({
  label,
  value,
  onValueChange,
  defaultGranularity,
  today = new Date(),
  years = 3,
  className,
}: DatePickerPanelProps) {
  const todayDay: Day = {
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    day: today.getDate(),
  };
  const [granularity, setGranularity] = useState<DateGranularity>(
    defaultGranularity ?? value?.kind ?? "day",
  );
  const [text, setText] = useState("");
  const [invalid, setInvalid] = useState(false);
  const start = value?.kind === "day" ? value : todayDay;
  const [view, setView] = useState({ year: start.year, month: start.month });

  const commitText = () => {
    const parsed = parseDateInput(text, todayDay.year);
    if (!parsed) {
      setInvalid(text.trim() !== "");
      return;
    }
    setInvalid(false);
    setText("");
    setGranularity(parsed.kind);
    if (parsed.kind === "day") setView({ year: parsed.year, month: parsed.month });
    onValueChange(parsed);
  };

  return (
    <div className={cn("flex w-76 flex-col", className)}>
      <div className="flex flex-col gap-2 px-4 pt-4">
        <span className="text-label-sm text-secondary">{label}</span>
        <TextInput
          size="lg"
          aria-label={`${label}: type a date`}
          placeholder="Try: May 2027, Q4, 20/05/2027"
          value={text}
          invalid={invalid}
          onChange={(e) => {
            setText(e.target.value);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitText();
            }
          }}
        />
        <SegmentedControl
          label="Granularity"
          variant="pills"
          size="md"
          value={granularity}
          onValueChange={setGranularity}
          options={GRANULARITIES}
          className="mt-1.5"
        />
      </div>
      <div className="mt-3.5 border-t border-strong" />
      {granularity === "day" ? (
        <DayGrid
          view={view}
          onViewChange={setView}
          today={todayDay}
          value={value?.kind === "day" ? value : undefined}
          onSelect={(d) => onValueChange({ kind: "day", year: d.year, month: d.month, day: d.day })}
        />
      ) : (
        <PeriodGrid
          granularity={granularity}
          fromYear={todayDay.year}
          years={granularity === "year" ? 10 : years}
          value={value}
          onSelect={onValueChange}
        />
      )}
    </div>
  );
}

function DayGrid({
  view,
  onViewChange,
  today,
  value,
  onSelect,
}: {
  view: { year: number; month: number };
  onViewChange: (v: { year: number; month: number }) => void;
  today: Day;
  value?: Day;
  onSelect: (d: Day) => void;
}) {
  const weeks = monthGrid(view.year, view.month);
  const initial =
    value && value.year === view.year && value.month === view.month
      ? value
      : today.year === view.year && today.month === view.month
        ? today
        : { ...view, day: 1 };
  const [focused, setFocused] = useState<Day>(initial);
  const moved = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const same = (a: Day, b?: Day) =>
    b !== undefined && a.year === b.year && a.month === b.month && a.day === b.day;
  // O dia com tabIndex 0 precisa estar no mês visível (depois de "Next month", vira o dia 1).
  const tabTarget: Day =
    focused.year === view.year && focused.month === view.month ? focused : { ...view, day: 1 };

  // Quando o foco muda pelo teclado, leva o foco do navegador para o novo dia.
  useEffect(() => {
    if (!moved.current) return;
    moved.current = false;
    gridRef.current
      ?.querySelector<HTMLButtonElement>(
        `[data-day="${focused.year}-${focused.month}-${focused.day}"]`,
      )
      ?.focus();
  }, [focused]);

  const shift = (months: number) => {
    const d = new Date(view.year, view.month - 1 + months, 1);
    onViewChange({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const deltas: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };
    let next: Day | undefined;
    if (e.key in deltas) next = addDays(tabTarget, deltas[e.key] ?? 0);
    if (e.key === "PageUp" || e.key === "PageDown") {
      const d = new Date(
        tabTarget.year,
        tabTarget.month - 1 + (e.key === "PageUp" ? -1 : 1),
        tabTarget.day,
      );
      next = { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
    }
    if (!next) return;
    e.preventDefault();
    moved.current = true;
    setFocused(next);
    if (next.month !== view.month || next.year !== view.year) {
      onViewChange({ year: next.year, month: next.month });
    }
  };

  return (
    <div className="flex flex-col pt-2 pb-2">
      <div className="flex h-9 items-center justify-between pr-2 pl-4">
        <span className="text-body-sm text-primary" aria-live="polite">
          {MONTHS_LONG[view.month - 1]} {view.year}
        </span>
        <span className="flex gap-1">
          <IconButton icon={ChevronLeft} label="Previous month" onClick={() => shift(-1)} />
          <IconButton icon={ChevronRight} label="Next month" onClick={() => shift(1)} />
        </span>
      </div>
      {/* Grade ARIA em divs: o layout é CSS grid (fins de semana em faixa contínua), que <table>
          não permite; o foco fica nos dias (roving tabindex), não no contêiner. */}
      {/* oxlint-disable-next-line jsx-a11y/interactive-supports-focus */}
      <div
        ref={gridRef}
        role="grid"
        aria-label={`${MONTHS_LONG[view.month - 1]} ${view.year}`}
        onKeyDown={onKeyDown}
        className="grid grid-cols-7 gap-x-2 px-2 pt-2"
      >
        {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role */}
        <div role="row" className="contents">
          {WEEKDAYS.map((w, i) => (
            <span
              key={w}
              // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
              role="columnheader"
              aria-label={w}
              className={cn(
                "flex h-7 items-center justify-center text-body-md text-secondary",
                (i === 0 || i === 6) && "rounded-t-md bg-hover",
              )}
            >
              {w}
            </span>
          ))}
          {/* Linha sob os dias da semana, de ponta a ponta (Figma 1:195) */}
          <span aria-hidden className="col-span-7 -mx-2 border-t border-strong" />
        </div>
        {weeks.map((week, wi) => (
          // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
          <div key={week[0]?.day ?? wi} role="row" className="contents">
            {week.map((d, di) => {
              const weekend = di === 0 || di === 6;
              const isToday = same(d, today);
              const isSelected = same(d, value);
              const isFocused = same(d, tabTarget);
              return (
                <span
                  key={`${d.month}-${d.day}`}
                  // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                  role="gridcell"
                  aria-selected={isSelected}
                  className={cn(
                    "flex h-8.5 items-center justify-center",
                    weekend && "bg-hover",
                    weekend && wi === weeks.length - 1 && "rounded-b-md",
                  )}
                >
                  <button
                    type="button"
                    data-day={`${d.year}-${d.month}-${d.day}`}
                    tabIndex={isFocused ? 0 : -1}
                    aria-label={`${MONTHS_LONG[d.month - 1]} ${d.day}, ${d.year}${isToday ? " (today)" : ""}`}
                    aria-current={isToday ? "date" : undefined}
                    onClick={() => {
                      setFocused(d);
                      onSelect(d);
                    }}
                    className={cn(
                      "flex size-6.5 items-center justify-center rounded-full text-body-md transition-colors focus-ring hovered:bg-hover",
                      d.outside ? "text-secondary" : "text-primary",
                      isToday &&
                        "border border-control-hover bg-control-strong font-medium text-primary",
                      isSelected &&
                        "border-transparent bg-inverse text-inverse hovered:bg-inverse-hover",
                    )}
                  >
                    {d.day}
                  </button>
                </span>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function PeriodGrid({
  granularity,
  fromYear,
  years,
  value,
  onSelect,
}: {
  granularity: Exclude<DateGranularity, "day">;
  fromYear: number;
  years: number;
  value?: DateValue;
  onSelect: (v: DateValue) => void;
}) {
  const list = Array.from({ length: years }, (_, i) => fromYear + i);
  const pill = (v: DateValue, text: string) => {
    const selected = sameDateValue(value, v);
    return (
      <button
        key={text}
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(v)}
        className={cn(
          // shrink-0: na coluna de anos (com rolagem) o flex encolhia as pílulas abaixo de 24 px
          "flex h-control-sm shrink-0 items-center justify-center rounded-full border px-2 text-label-sm transition-colors focus-ring",
          selected
            ? "border-transparent bg-inverse text-inverse hovered:bg-inverse-hover"
            : "border-strong text-primary hovered:bg-hover",
        )}
      >
        {text}
      </button>
    );
  };

  if (granularity === "year") {
    // Passo de 36 px entre anos (Figma 1:874–1:901: linhas de 36 com a pílula de 24).
    return (
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4">
        {list.map((y) => pill({ kind: "year", year: y }, String(y)))}
      </div>
    );
  }
  const cols = { month: "grid-cols-3", quarter: "grid-cols-4", half: "grid-cols-2" }[granularity];
  return (
    <div className="flex max-h-72 flex-col gap-3 overflow-y-auto px-4 pt-2 pb-4">
      {list.map((y) => (
        <div key={y} className="flex flex-col gap-2">
          <span className="text-label-sm text-secondary">{y}</span>
          <div className={cn("grid gap-2", cols)}>
            {granularity === "month" &&
              MONTHS_SHORT.map((m, i) => pill({ kind: "month", year: y, month: i + 1 }, m))}
            {granularity === "quarter" &&
              ([1, 2, 3, 4] as const).map((q) =>
                pill({ kind: "quarter", year: y, quarter: q }, `Q${q}`),
              )}
            {granularity === "half" &&
              ([1, 2] as const).map((h) => pill({ kind: "half", year: y, half: h }, `H${h}`))}
          </div>
        </div>
      ))}
    </div>
  );
}

export type DatePickerProps = Omit<DatePickerPanelProps, "className"> & {
  /** Gatilho (normalmente um PropertyButton com a data atual). */
  children: ReactElement;
  portal?: boolean;
};

/** Abre o DatePickerPanel num Popover; fecha ao escolher. */
export function DatePicker({ children, portal = true, onValueChange, ...panel }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const content = (
    <Popover.Content
      align="start"
      sideOffset={4}
      aria-label={panel.label}
      className={cn(popoverSurface, "rounded-control")}
    >
      <DatePickerPanel
        {...panel}
        onValueChange={(v) => {
          onValueChange(v);
          setOpen(false);
        }}
      />
    </Popover.Content>
  );
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}
