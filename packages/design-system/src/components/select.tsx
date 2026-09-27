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
   * propriedades de issue e projeto.
   */
  trigger?: "field" | "chip";
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
    "flex h-control-md w-full items-center gap-2 rounded-control border border-control bg-input px-2 text-body-md text-primary transition-colors focus-ring hovered:border-control-hover aria-invalid:border-danger disabled:cursor-not-allowed disabled:opacity-disabled data-placeholder:text-placeholder",
  chip: "inline-flex h-control-sm max-w-40 items-center gap-1 rounded-full border border-transparent bg-control-strong pr-2 pl-1.5 text-body-sm text-primary shadow-raised focus-ring hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] disabled:cursor-not-allowed disabled:opacity-disabled data-placeholder:text-secondary",
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

  const content = (
    <RadixSelect.Content
      position="popper"
      sideOffset={4}
      className={cn(popoverSurface, "min-w-(--radix-select-trigger-width)")}
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
                  "data-disabled:opacity-disabled data-highlighted:bg-selected",
                )}
              >
                <span className="flex size-4 shrink-0 items-center justify-center">{o.icon}</span>
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
              trigger === "chip" ? "size-3.5 [&>svg]:size-3.5" : "size-4",
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
      </RadixSelect.Trigger>
      {portal ? <RadixSelect.Portal>{content}</RadixSelect.Portal> : content}
    </RadixSelect.Root>
  );
}
