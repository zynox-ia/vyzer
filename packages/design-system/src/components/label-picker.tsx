/**
 * Label Picker (Figma 1:1105, "Add labels"): multisseleção com checkbox e bolinha de cor,
 * dica "Start typing to create a new label" com a lista vazia, linha "Create new workspace
 * label" ao digitar e, ao criar, a escolha da cor ("Pick a color for label").
 */
import { Popover } from "radix-ui";
import { useState, type ReactElement } from "react";
import { cn } from "../lib/cn";
import { ColorDot, LABEL_COLORS, type LabelColor } from "./color-dot";
import { ComboboxPanel } from "./combobox";
import { popoverSurface } from "./listbox";

export type LabelItem = { value: string; label: string; color: LabelColor };

export type LabelPickerPanelProps = {
  labels: LabelItem[];
  value: string[];
  onValueChange: (value: string[]) => void;
  /** Cria o label e devolve o valor dele (é marcado em seguida). */
  onCreate: (name: string, color: LabelColor) => string;
  shortcut?: string[];
  autoFocusSearch?: boolean;
  className?: string;
};

export function LabelPickerPanel({
  labels,
  value,
  onValueChange,
  onCreate,
  shortcut = ["P", "L"],
  autoFocusSearch = false,
  className,
}: LabelPickerPanelProps) {
  const [creating, setCreating] = useState<string>();

  if (creating !== undefined) {
    return (
      // Chaves distintas: cada etapa monta um cmdk novo (sem destaque apontando para linhas
      // que não existem mais).
      <ComboboxPanel<LabelColor>
        key="color"
        label={`Color for label ${creating}`}
        searchPlaceholder="Pick a color for label"
        numbered={false}
        autoFocusSearch
        className={className}
        options={LABEL_COLORS.map((c) => ({
          value: c.value,
          label: c.label,
          icon: <ColorDot color={c.value} />,
        }))}
        onValueChange={(color) => {
          const created = onCreate(creating, color);
          onValueChange([...value, created]);
          setCreating(undefined);
        }}
      />
    );
  }

  return (
    <ComboboxPanel
      key="labels"
      multiple
      label="Labels"
      searchPlaceholder={value.length > 0 ? "Change or add labels…" : "Add labels…"}
      shortcut={shortcut}
      autoFocusSearch={autoFocusSearch}
      className={className}
      emptyHint="Start typing to create a new label"
      createLabel="Create new workspace label"
      onCreate={(name) => setCreating(name)}
      value={value}
      onValueChange={onValueChange}
      options={labels.map((l) => ({
        value: l.value,
        label: l.label,
        icon: <ColorDot color={l.color} />,
      }))}
    />
  );
}

export type LabelPickerProps = Omit<LabelPickerPanelProps, "autoFocusSearch"> & {
  children: ReactElement;
  portal?: boolean;
};

export function LabelPicker({ children, portal = true, className, ...panel }: LabelPickerProps) {
  const content = (
    <Popover.Content
      align="start"
      sideOffset={4}
      aria-label="Labels"
      className={cn(popoverSurface, "w-72", className)}
    >
      <LabelPickerPanel {...panel} autoFocusSearch />
    </Popover.Content>
  );
  return (
    <Popover.Root>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}
