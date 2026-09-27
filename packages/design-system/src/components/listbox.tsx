/**
 * Visual comum dos dropdowns de propriedade (Figma 1:904, 1:935, 6:1543), usado pelo Select e
 * pelo Combobox: popover de raio 12, linhas de 32 px com destaque de raio 8 a 6 px da borda,
 * slot de ícone de 16 px, marcação do selecionado e número de atalho à direita.
 */
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { Icon } from "../icons/Icon";

export type ListOption<T extends string = string> = {
  value: T;
  label: string;
  /** Ícone do valor (StatusIcon, PriorityIcon, avatar ou ícone lucide). */
  icon?: ReactNode;
  /** Termos extras para a busca do Combobox. */
  keywords?: string[];
  /** Grupo com rótulo (ex.: "Users from the project team"). */
  group?: string;
  disabled?: boolean;
};

/** Superfície do popover (Figma: r12, borda #323336, sombra de 3 camadas → shadow-md). */
export const popoverSurface =
  "z-dropdown overflow-hidden rounded-xl border border-strong bg-popover text-primary shadow-md outline-none data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out";

/** Linha da lista (Figma: destaque h32 r8 com 6 px de folga; conteúdo a 14 px da borda). */
export const optionRow =
  "flex h-menu-item cursor-default items-center gap-2 rounded-control px-2 text-body-md text-primary outline-none select-none";

/** Rótulo de grupo (Figma 1:927: 12 px/500, px 14, py 8). */
export const groupHeading = "px-2 pt-2 pb-1 text-label-sm text-secondary";

/**
 * Checkbox visual de uma linha de multisseleção (Figma 1:1241: 14 px, raio 3 → 4). Não é
 * interativo: a linha inteira é a opção.
 */
export function CheckBox({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={
        checked
          ? "flex size-3.5 shrink-0 items-center justify-center rounded-inline border border-checked bg-checked text-on-checked"
          : "flex size-3.5 shrink-0 items-center justify-center rounded-inline border border-control"
      }
    >
      {checked && <Icon icon={Check} className="size-2.5" />}
    </span>
  );
}

/** Conteúdo da linha: ícone, rótulo, marcação e número de atalho. */
export function OptionContent({
  option,
  selected,
  index,
}: {
  option: ListOption;
  selected: boolean;
  /** Número do atalho (0–9); omitido não mostra número. */
  index?: number;
}) {
  return (
    <>
      <span className="flex size-4 shrink-0 items-center justify-center">{option.icon}</span>
      <span className="min-w-0 flex-1 truncate">{option.label}</span>
      {selected && <Icon icon={Check} className="text-secondary" />}
      {index !== undefined && index <= 9 && (
        <span aria-hidden className="w-3 text-right text-label-sm text-secondary tabular-nums">
          {index}
        </span>
      )}
    </>
  );
}

/** Agrupa as opções mantendo a ordem de chegada de cada grupo. */
export function groupOptions<T extends string>(options: ListOption<T>[]) {
  const map = new Map<string | undefined, ListOption<T>[]>();
  for (const o of options) {
    const list = map.get(o.group) ?? [];
    list.push(o);
    map.set(o.group, list);
  }
  return [...map.entries()];
}
