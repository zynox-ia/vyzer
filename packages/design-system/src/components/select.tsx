/**
 * Select (Radix Select): escolha de um valor numa lista curta, sem busca. Mesmo visual dos
 * dropdowns de propriedade do Figma. Para listas longas ou com busca, use o Combobox.
 */
import { Check, ChevronDown } from "lucide-react";
import { Select as RadixSelect } from "radix-ui";
import { useState } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { useFieldControl } from "./field";
import { groupHeading, groupOptions, optionRow, popoverSurface, type ListOption } from "./listbox";

export type SelectProps<T extends string> = {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  options: ListOption<T>[];
  placeholder?: string;
  /**
   * field: caixa de formulário (dentro de um Field). chip: Property Button em relevo, para
   * propriedades de issue e projeto. button: botão compacto em relevo com chevron, para opções
   * de exibição (Display Options, Figma 18:722).
   */
  trigger?: "field" | "chip" | "button";
  /** Nome acessível quando não há Field ao redor. */
  "aria-label"?: string;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  className?: string;
  /** Sem portal, o popover herda o tema do contêiner. */
  portal?: boolean;
};

const triggerClass = {
  field:
    "flex h-control-lg w-fit max-w-full items-center gap-2 rounded-control border border-field outline-field bg-input px-3 text-body-md text-primary transition-colors focus-field hovered:border-field-hover aria-invalid:border-field-danger disabled:cursor-not-allowed disabled:opacity-disabled data-placeholder:text-placeholder",
  chip: "inline-flex h-control-sm w-fit max-w-40 items-center gap-1 rounded-full border border-transparent bg-control-strong pr-2.5 pl-2 text-body-sm text-primary shadow-raised outline-none focus-halo-none hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] focused:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] disabled:cursor-not-allowed disabled:opacity-disabled data-placeholder:text-secondary",
  // Figma 18:757: 24 px, raio 8, relevo, 12 px Regular, chevron à direita. Hover só no fundo;
  // foco na linha de 1 px (focus-ring), como os demais botões.
  button:
    "inline-flex h-control-sm w-fit max-w-40 items-center gap-1 rounded-control border border-transparent bg-control-strong px-2 text-body-sm text-primary shadow-raised transition-[color,background-color,background-image] duration-fast ease-standard focus-ring hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] disabled:cursor-not-allowed disabled:opacity-disabled data-placeholder:text-secondary",
};

export function Select<T extends string>({
  value,
  defaultValue,
  onValueChange,
  options,
  placeholder = "Select…",
  trigger = "field",
  disabled,
  invalid,
  id,
  className,
  portal = true,
  ...rest
}: SelectProps<T>) {
  const { invalid: _i, required: _r, ...a11y } = useFieldControl({ id, disabled, invalid });
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const selected = options.find((o) => o.value === current);
  // Slot de ícone só quando alguma opção tem ícone: lista só de texto não fica com o recuo vazio.
  const hasIcons = options.some((o) => o.icon);

  const content = (
    <RadixSelect.Content
      position="popper"
      sideOffset={4}
      className={cn(popoverSurface, "min-w-(--radix-select-trigger-width) focus-halo-none")}
    >
      <RadixSelect.Viewport className="max-h-80 p-1.5">
        {groupOptions(options).map(([group, items]) => (
          <RadixSelect.Group key={group ?? "_"}>
            {group && <RadixSelect.Label className={groupHeading}>{group}</RadixSelect.Label>}
            {items.map((o) => (
              <RadixSelect.Item
                key={o.value}
                value={o.value}
                disabled={o.disabled}
                className={cn(
                  optionRow,
                  "focus-halo-none data-disabled:opacity-disabled data-highlighted:bg-selected",
                )}
              >
                {hasIcons && (
                  <span className="flex size-4 shrink-0 items-center justify-center">{o.icon}</span>
                )}
                <span className="min-w-0 flex-1 truncate">
                  <RadixSelect.ItemText>{o.label}</RadixSelect.ItemText>
                </span>
                <RadixSelect.ItemIndicator className="text-secondary">
                  <Icon icon={Check} />
                </RadixSelect.ItemIndicator>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Group>
        ))}
      </RadixSelect.Viewport>
    </RadixSelect.Content>
  );

  return (
    <RadixSelect.Root
      value={current}
      onValueChange={(v) => {
        setInner(v as T);
        onValueChange?.(v as T);
      }}
      disabled={a11y.disabled}
    >
      <RadixSelect.Trigger
        {...a11y}
        aria-label={rest["aria-label"]}
        className={cn(triggerClass[trigger], className)}
      >
        {selected?.icon && (
          <span
            className={cn(
              "flex shrink-0 items-center justify-center",
              trigger === "field" ? "size-4" : "size-3.5 [&>svg]:size-3.5",
            )}
          >
            {selected.icon}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-left">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        {trigger === "field" && (
          <RadixSelect.Icon className="text-secondary">
            <Icon icon={ChevronDown} />
          </RadixSelect.Icon>
        )}
        {trigger === "button" && (
          <RadixSelect.Icon className="text-secondary">
            <Icon icon={ChevronDown} size="xs" />
          </RadixSelect.Icon>
        )}
      </RadixSelect.Trigger>
      {portal ? <RadixSelect.Portal>{content}</RadixSelect.Portal> : content}
    </RadixSelect.Root>
  );
}
