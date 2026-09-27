/**
 * Combobox (Figma 1:904, 1:935, 6:1543: "Change priority…", "Change status…", "Lead"):
 * popover com busca no topo e atalho à direita, lista filtrável com marcação do valor atual e
 * números (0–9) que selecionam direto (com a busca vazia). Radix Popover + cmdk.
 */
import { Command } from "cmdk";
import { Popover } from "radix-ui";
import { useState, type ReactElement } from "react";
import { cn } from "../lib/cn";
import { KbdSequence } from "./kbd";
import { OptionContent, groupOptions, optionRow, popoverSurface, type ListOption } from "./listbox";

export type ComboboxProps<T extends string> = {
  /** Nome acessível da lista (ex.: "Priority"). */
  label: string;
  value?: T;
  onValueChange: (value: T) => void;
  options: ListOption<T>[];
  /** Placeholder da busca (ex.: "Change priority…"). */
  searchPlaceholder?: string;
  /** Atalho de teclado que abre este seletor, mostrado no topo (ex.: ["P", "P"]). */
  shortcut?: string[];
  /** Mostra números e aceita a tecla do número para escolher. */
  numbered?: boolean;
  /** Número da primeira opção: 0 quando ela é "nenhum" (No priority, No lead), como no Figma. */
  numberFrom?: 0 | 1;
  emptyText?: string;
  /** Gatilho (normalmente um PropertyButton). */
  children: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Sem portal, o popover herda o tema do contêiner. */
  portal?: boolean;
  /** Foca a busca ao abrir (padrão). Desligue em exemplos abertos de forma estática. */
  focusOnOpen?: boolean;
  className?: string;
};

export function Combobox<T extends string>({
  label,
  value,
  onValueChange,
  options,
  searchPlaceholder = "Search…",
  shortcut,
  numbered = true,
  numberFrom = 1,
  emptyText = "No results",
  children,
  open: openProp,
  onOpenChange,
  portal = true,
  focusOnOpen = true,
  className,
}: ComboboxProps<T>) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
    if (!next) setSearch("");
  };
  const [search, setSearch] = useState("");
  const select = (v: T) => {
    onValueChange(v);
    setOpen(false);
  };
  // Números seguem a ordem visível, atravessando grupos.
  const ordered = groupOptions(options).flatMap(([, items]) => items);

  const content = (
    <Popover.Content
      align="start"
      sideOffset={4}
      aria-label={label}
      onOpenAutoFocus={focusOnOpen ? undefined : (e) => e.preventDefault()}
      className={cn(popoverSurface, "w-72", className)}
      onKeyDown={(e) => {
        if (!numbered || search !== "" || e.metaKey || e.ctrlKey || e.altKey) return;
        const n = Number(e.key);
        if (e.key.length === 1 && Number.isInteger(n) && n >= numberFrom && n <= 9) {
          const target = ordered[n - numberFrom];
          if (target && !target.disabled) {
            e.preventDefault();
            select(target.value);
          }
        }
      }}
    >
      <Command label={label} loop>
        <div className="flex h-9 items-center gap-2 border-b border-subtle pr-3 pl-3.5">
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder={searchPlaceholder}
            className="h-full min-w-0 flex-1 bg-transparent text-body-md text-primary outline-none placeholder:text-placeholder"
          />
          {shortcut && <KbdSequence keys={shortcut} />}
        </div>
        <Command.List className="max-h-80 overflow-y-auto p-1.5">
          <Command.Empty className="px-2 py-2 text-body-sm text-secondary">
            {emptyText}
          </Command.Empty>
          {groupOptions(options).map(([group, items]) => (
            <Command.Group
              key={group ?? "_"}
              heading={group}
              className={cn(
                "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1",
                "[&_[cmdk-group-heading]]:text-label-sm [&_[cmdk-group-heading]]:text-secondary",
              )}
            >
              {items.map((o) => (
                <Command.Item
                  key={o.value}
                  value={o.value}
                  keywords={[o.label, ...(o.keywords ?? [])]}
                  disabled={o.disabled}
                  onSelect={() => select(o.value)}
                  className={cn(
                    optionRow,
                    "data-[disabled=true]:opacity-disabled data-[selected=true]:bg-selected",
                  )}
                >
                  <OptionContent
                    option={o}
                    selected={o.value === value}
                    index={numbered && search === "" ? ordered.indexOf(o) + numberFrom : undefined}
                  />
                </Command.Item>
              ))}
            </Command.Group>
          ))}
        </Command.List>
      </Command>
    </Popover.Content>
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      {portal ? <Popover.Portal>{content}</Popover.Portal> : content}
    </Popover.Root>
  );
}
