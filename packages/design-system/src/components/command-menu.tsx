/**
 * Command Menu (⌘K; família do menu "/", Figma 1:4653): busca global de ações e navegação numa
 * janela modal. cmdk dentro do DialogPanel: digitar filtra, ↑ ↓ navegam, Enter executa. Linhas,
 * rótulos de grupo e separadores são os do menu "/" (menuStyles), com os atalhos em Kbd.
 *
 * Páginas (submenus): o consumidor guarda a pilha e troca os itens; o menu mostra a trilha em
 * chips, limpa a busca e volta o destaque para a primeira linha a cada página e chama onBack com
 * Backspace na busca vazia.
 *
 * CommandPanel é o conteúdo sem a janela (embutido numa tela); CommandMenu = CommandPanel +
 * DialogPanel + o atalho Ctrl/⌘+K. Para documentar o menu aberto, monte as mesmas classes
 * (commandMenuStyles, CommandItemContent) sem o cmdk: ele rola a página até a linha destacada ao
 * montar.
 */
import { Command, useCommandState } from "cmdk";
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { Dialog as DialogPrimitive, VisuallyHidden } from "radix-ui";
import {
  isValidElement,
  useEffect,
  useState,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { Chip } from "./chip";
import { Dialog, DialogPanel } from "./dialog";
import { KbdSequence } from "./kbd";
import { menuStyles } from "./menu";

/** Classes do menu, exportadas para montar a aparência fora do cmdk (documentação). */
export const commandMenuStyles = {
  /**
   * Superfície do menu "/" (raio 10, borda forte, bg-popover, sombra md: Foundations → Shadows,
   * "command menu") sobre a base do Dialog, com 640 px de largura máxima.
   */
  surface: "max-w-160 overflow-hidden rounded-container bg-popover shadow-md",
  header: "flex flex-col border-b border-default px-4",
  trail: "flex flex-wrap gap-1 pt-3",
  /** Busca de 48 px com texto de 16 px: a entrada principal da tela. */
  input:
    "h-12 w-full min-w-0 bg-transparent text-body-lg text-primary outline-none placeholder:text-placeholder",
  list: "max-h-100 scroll-py-1 overflow-y-auto p-1",
  /**
   * Linha: as medidas do item do menu "/" (menuStyles.item: 36 px, raio 6, 10 px nas laterais),
   * com os atributos do cmdk (data-selected e data-disabled valem "true" ou "false").
   */
  item: "flex h-command-item cursor-default items-center gap-2 rounded-sm px-2.5 text-body-md text-primary outline-none select-none data-[selected=true]:bg-selected data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-disabled",
  /** Rótulo de grupo e separador: os do menu "/". */
  groupHeading: menuStyles.label,
  separator: menuStyles.separator,
  empty: "px-3 py-8 text-center text-body-md text-secondary",
};

/** O rótulo do menu "/" aplicado ao cabeçalho que o cmdk gera no grupo. */
const groupClass =
  "[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:text-label-sm [&_[cmdk-group-heading]]:text-secondary";

export type CommandPanelProps = {
  /** Nome acessível do menu e da busca (padrão: "Command menu"). */
  label?: string;
  placeholder?: string;
  /** Trilha das páginas abertas, da primeira à atual (ex.: ["Change status"]). */
  pages?: string[];
  /** Volta uma página: Backspace com a busca vazia. */
  onBack?: () => void;
  /** Resultados ainda chegando: linha de carregamento no topo da lista. */
  loading?: boolean;
  emptyText?: string;
  /** CommandGroup, CommandItem e CommandSeparator da página atual. */
  children: ReactNode;
  className?: string;
};

export function CommandPanel({
  label = "Command menu",
  placeholder = "Type a command or search…",
  pages = [],
  onBack,
  loading = false,
  emptyText = "No results",
  children,
  className,
}: CommandPanelProps) {
  const [search, setSearch] = useState("");
  // Linha destacada (controlada só para poder zerar: vazia, o cmdk destaca a primeira).
  const [value, setValue] = useState("");
  // Cada página começa com a busca vazia e a primeira linha destacada (ajuste durante a
  // renderização, sem efeito).
  const trail = pages.join("\u0000");
  const [lastTrail, setLastTrail] = useState(trail);
  if (trail !== lastTrail) {
    setLastTrail(trail);
    setSearch("");
    setValue("");
  }
  return (
    <Command
      label={label}
      loop
      value={value}
      onValueChange={setValue}
      className={cn("flex flex-col", className)}
      onKeyDown={(e) => {
        if (e.key === "Backspace" && search === "" && pages.length > 0 && onBack) {
          e.preventDefault();
          onBack();
        }
      }}
    >
      <div className={commandMenuStyles.header}>
        {pages.length > 0 && (
          <div className={commandMenuStyles.trail}>
            {pages.map((p, i) => (
              // A trilha pode repetir um nome; a posição faz parte da chave.
              // oxlint-disable-next-line react/no-array-index-key
              <Chip key={`${p}-${i}`}>{p}</Chip>
            ))}
          </div>
        )}
        <Command.Input
          value={search}
          onValueChange={setSearch}
          placeholder={placeholder}
          className={commandMenuStyles.input}
        />
      </div>
      <Command.List className={commandMenuStyles.list} aria-busy={loading || undefined}>
        {loading && (
          <Command.Item
            forceMount
            disabled
            value="Loading results"
            className={cn(commandMenuStyles.item, "text-secondary")}
          >
            <span className={menuStyles.iconSlot}>
              <Icon icon={LoaderCircle} className="animate-spin motion-reduce:animate-none" />
            </span>
            Loading…
          </Command.Item>
        )}
        {!loading && <Command.Empty className={commandMenuStyles.empty}>{emptyText}</Command.Empty>}
        {children}
      </Command.List>
    </Command>
  );
}

export function CommandGroup({ className, ...rest }: ComponentProps<typeof Command.Group>) {
  return <Command.Group className={cn(groupClass, className)} {...rest} />;
}

/**
 * Divisória entre grupos (a do menu "/"); some enquanto há busca. Não usa o Command.Separator:
 * o role="separator" dele não é permitido dentro da lista (role="listbox"); aqui é só visual.
 */
export function CommandSeparator({ className }: { className?: string }) {
  const searching = useCommandState((state) => state.search !== "");
  if (searching) return null;
  return <div aria-hidden className={cn(commandMenuStyles.separator, className)} />;
}

export type CommandItemContentProps = {
  /** Ícone lucide, ou um ícone pronto (StatusIcon, Avatar), no slot de 20 px. */
  icon?: LucideIcon | ReactElement;
  /** Teclas do atalho, em Kbd à direita (ex.: ["G", "I"]). */
  shortcut?: string[];
  /** then (padrão): em sequência. plus: juntas (Ctrl + K). */
  shortcutMode?: "then" | "plus";
  children: ReactNode;
};

/** Conteúdo de uma linha (ícone, rótulo, atalho); reaproveitado nos menus estáticos. */
export function CommandItemContent({
  icon,
  shortcut,
  shortcutMode,
  children,
}: CommandItemContentProps) {
  return (
    <>
      <span className={menuStyles.iconSlot}>
        {icon && (isValidElement(icon) ? icon : <Icon icon={icon} />)}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {shortcut && <KbdSequence keys={shortcut} mode={shortcutMode} />}
    </>
  );
}

export type CommandItemProps = Omit<ComponentProps<typeof Command.Item>, "children"> &
  CommandItemContentProps;

/**
 * Linha do menu: ícone, rótulo e atalho. O rótulo em texto é o valor da busca (sem as teclas do
 * atalho); use keywords para sinônimos.
 */
export function CommandItem({
  icon,
  shortcut,
  shortcutMode,
  value,
  className,
  children,
  ...rest
}: CommandItemProps) {
  return (
    <Command.Item
      value={value ?? (typeof children === "string" ? children : undefined)}
      className={cn(commandMenuStyles.item, className)}
      {...rest}
    >
      <CommandItemContent icon={icon} shortcut={shortcut} shortcutMode={shortcutMode}>
        {children}
      </CommandItemContent>
    </Command.Item>
  );
}

export type CommandMenuProps = CommandPanelProps & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Ctrl/⌘+K abre e fecha, de qualquer ponto da página (padrão: ligado). */
  hotkey?: boolean;
  /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
  portal?: boolean;
};

/**
 * O menu numa janela modal, a 15% do topo: a busca não se move quando a lista encolhe. Esc fecha
 * e o foco volta para onde estava. Ao fechar, a busca some; a pilha de páginas é do consumidor.
 */
export function CommandMenu({
  open,
  onOpenChange,
  hotkey = true,
  portal,
  label = "Command menu",
  ...panel
}: CommandMenuProps) {
  useEffect(() => {
    if (!hotkey) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [hotkey, open, onOpenChange]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPanel
        placement="top"
        portal={portal}
        aria-describedby={undefined}
        className={commandMenuStyles.surface}
      >
        <VisuallyHidden.Root asChild>
          <DialogPrimitive.Title>{label}</DialogPrimitive.Title>
        </VisuallyHidden.Root>
        <CommandPanel label={label} {...panel} />
      </DialogPanel>
    </Dialog>
  );
}
