/**
 * Combobox (Figma 1:904, 1:935, 1:1013, 6:1543, 1:1105): busca no topo com o atalho à direita,
 * lista filtrável com marcação do valor atual e números que escolhem direto. Suporta
 * multisseleção com checkbox (labels, dependências) e criação a partir da busca.
 *
 * ComboboxPanel é a lista em si (cmdk), usável solta: dentro de um Popover (Combobox), de um
 * submenu (Menu) ou fixa numa página. Combobox = ComboboxPanel + Radix Popover + gatilho.
 */
import { Command } from "cmdk";
import { Plus } from "lucide-react";
import { Popover } from "radix-ui";
import { useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { KbdSequence } from "./kbd";
import {
  CheckBox,
  OptionContent,
  groupOptions,
  optionRow,
  popoverSurface,
  type ListOption,
} from "./listbox";

type Single<T> = { multiple?: false; value?: T; onValueChange: (value: T) => void };
type Multiple<T> = { multiple: true; value: T[]; onValueChange: (value: T[]) => void };

export type ComboboxPanelProps<T extends string> = (Single<T> | Multiple<T>) & {
  /** Nome acessível da lista (ex.: "Priority"). */
  label: string;
  options: ListOption<T>[];
  /** Placeholder da busca (ex.: "Change priority…"). */
  searchPlaceholder?: string;
  /** Atalho de teclado que abre este seletor, mostrado no topo (ex.: ["P", "P"]). */
  shortcut?: string[];
  /** Mostra números e aceita a tecla do número para escolher (só na seleção única). */
  numbered?: boolean;
  /** Número da primeira opção: 0 quando ela é "nenhum" (No priority, No lead). */
  numberFrom?: 0 | 1;
  emptyText?: string;
  /** Dica quando a lista e a busca estão vazias (ex.: "Start typing to create a new label"). */
  emptyHint?: string;
  /** Cria um item a partir da busca; mostra a linha "Create …" quando não há igual. */
  onCreate?: (query: string) => void;
  /** Rótulo da linha de criação (padrão: "Create"). */
  createLabel?: string;
  /** Chamado depois de uma escolha que deve fechar o painel (seleção única, criação). */
  onDone?: () => void;
  /** Foca a busca ao montar. */
  autoFocusSearch?: boolean;
  className?: string;
};

export function ComboboxPanel<T extends string>(props: ComboboxPanelProps<T>) {
  const {
    label,
    options,
    searchPlaceholder = "Search…",
    shortcut,
    numbered = !props.multiple,
    numberFrom = 1,
    emptyText = "No results",
    emptyHint,
    onCreate,
    createLabel = "Create",
    onDone,
    autoFocusSearch = false,
    className,
  } = props;
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocusSearch) inputRef.current?.focus();
  }, [autoFocusSearch]);

  const isSelected = (v: T) => (props.multiple ? props.value.includes(v) : props.value === v);
  const choose = (v: T) => {
    if (props.multiple) {
      props.onValueChange(
        props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v],
      );
    } else {
      props.onValueChange(v);
      setSearch("");
      onDone?.();
    }
  };
  // Números seguem a ordem visível, atravessando grupos.
  const ordered = groupOptions(options).flatMap(([, items]) => items);
  const query = search.trim();
  const canCreate =
    onCreate !== undefined &&
    query !== "" &&
    !options.some((o) => o.label.toLowerCase() === query.toLowerCase());
  const showNumbers = numbered && !props.multiple && search === "";

  return (
    <Command
      label={label}
      loop
      className={className}
      onKeyDown={(e) => {
        if (!showNumbers || e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
        const n = Number(e.key);
        if (!Number.isInteger(n) || n < numberFrom || n > 9) return;
        const target = ordered[n - numberFrom];
        if (target && !target.disabled) {
          e.preventDefault();
          choose(target.value);
        }
      }}
    >
      <div className="flex h-9 items-center gap-2 border-b border-subtle pr-3 pl-3.5">
        <Command.Input
          ref={inputRef}
          value={search}
          onValueChange={setSearch}
          placeholder={searchPlaceholder}
          className="h-full min-w-0 flex-1 bg-transparent text-body-md text-primary outline-none placeholder:text-placeholder"
        />
        {shortcut && <KbdSequence keys={shortcut} />}
      </div>
      <Command.List className="max-h-80 overflow-y-auto p-1.5">
        {options.length > 0 && !canCreate && (
          <Command.Empty className="px-2 py-2 text-body-sm text-secondary">
            {emptyText}
          </Command.Empty>
        )}
        {options.length === 0 && query === "" && emptyHint && (
          <Command.Item disabled value="__hint" className={cn(optionRow, "opacity-disabled")}>
            <span className="flex size-4 shrink-0 items-center justify-center">
              <Icon icon={Plus} className="text-secondary" />
            </span>
            <span className="min-w-0 flex-1 truncate">{emptyHint}</span>
          </Command.Item>
        )}
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
                onSelect={() => choose(o.value)}
                className={cn(
                  optionRow,
                  "data-[disabled=true]:opacity-disabled data-[selected=true]:bg-selected",
                )}
              >
                {props.multiple && <CheckBox checked={isSelected(o.value)} />}
                <OptionContent
                  option={o}
                  selected={!props.multiple && isSelected(o.value)}
                  index={showNumbers ? ordered.indexOf(o) + numberFrom : undefined}
                />
              </Command.Item>
            ))}
          </Command.Group>
        ))}
        {canCreate && (
          <Command.Item
            value={`__create:${query}`}
            onSelect={() => {
              onCreate(query);
              setSearch("");
              onDone?.();
            }}
            className={cn(optionRow, "data-[selected=true]:bg-selected")}
          >
            <span className="flex size-4 shrink-0 items-center justify-center">
              <Icon icon={Plus} />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {createLabel}: <span className="text-secondary">“{query}”</span>
            </span>
          </Command.Item>
        )}
      </Command.List>
    </Command>
  );
}

export type ComboboxProps<T extends string> = ComboboxPanelProps<T> & {
  /** Gatilho (normalmente um PropertyButton). */
  children: ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Sem portal, o popover herda o tema do contêiner. */
  portal?: boolean;
  /** Largura do popover. */
  width?: "sm" | "md";
};

const widthClass = { sm: "w-56", md: "w-72" };

export function Combobox<T extends string>({
  children,
  open: openProp,
  onOpenChange,
  portal = true,
  width = "md",
  onDone,
  ...panel
}: ComboboxProps<T>) {
  const [innerOpen, setInnerOpen] = useState(false);
  const open = openProp ?? innerOpen;
  const setOpen = (next: boolean) => {
    setInnerOpen(next);
    onOpenChange?.(next);
  };
  const content = (
    <Popover.Content
      align="start"
      sideOffset={4}
      aria-label={panel.label}
      className={cn(popoverSurface, widthClass[width])}
    >
      <ComboboxPanel
        {...(panel as ComboboxPanelProps<T>)}
        autoFocusSearch
        onDone={() => {
          setOpen(false);
          onDone?.();
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

/**
 * Superfície com a aparência do popover, fixa na página (sem posicionamento flutuante): para
 * mostrar um painel aberto numa documentação ou embutir um painel numa tela.
 */
export function PopoverSurface({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(popoverSurface, "relative", className)}>{children}</div>;
}
