/**
 * Chip / Tag: rótulo compacto de um valor (projeto, label, relação) ou de uma vista salva.
 * - outline (Figma 1:6914, 1:6948, 1:8881, 1:8888): valor numa linha de issue ou num cartão do
 *   board. Pílula de 24 px sem fundo, com o anel de relevo, ícone de 14 px e texto de 12 px.
 * - filled (Figma 1:7524, 1:5655): vista salva ("All projects"). Pílula de 28 px em relevo; a
 *   vista atual (active) ganha a camada de pressionado e texto primário.
 * - draft (Figma 1:7537, 1:5660): vista ainda sem nome ("New view"), com borda tracejada.
 *
 * Não confundir com Badge (estado) nem com Property Button (abre o seletor de uma propriedade).
 * Os estilos são compartilhados com o Toggle Group (chips de "Display properties").
 */
import { X } from "lucide-react";
import { Slot } from "radix-ui";
import type { HTMLAttributes, MouseEventHandler, ReactNode, Ref } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import type { HexColor } from "../lib/color-value";
import { ColorDot, type LabelColor } from "./color-dot";

/**
 * Classes do chip, exportadas para o Toggle Group e para painéis estáticos. Estado ligado por
 * data-state="on", o mesmo atributo que o Radix ToggleGroup põe nos itens.
 */
export const chipStyles = {
  base: "relative inline-flex max-w-50 shrink-0 items-center gap-1.5 rounded-full border border-transparent whitespace-nowrap select-none transition-[color,background-color,background-image] duration-fast ease-standard",
  size: {
    sm: "h-control-sm px-2",
    md: "h-control-md px-2.5",
  },
  variant: {
    // Figma: borda #28282b sobre #121213 e #2f3033 sobre #1a1a1b, o anel de 9% achatado.
    outline: "text-body-sm text-secondary shadow-raised",
    filled:
      "bg-control-strong text-label-sm text-secondary shadow-raised data-[state=on]:[background-image:linear-gradient(var(--bg-pressed),var(--bg-pressed))] data-[state=on]:text-primary",
    draft: "border-dashed border-strong text-label-sm text-placeholder",
  },
  /** Chip clicável (botão, link, item de Toggle Group): hover só no fundo e linha de foco. */
  interactive:
    "cursor-default focus-ring data-[state=off]:hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] disabled:cursor-not-allowed disabled:opacity-disabled",
};

export type ChipVariant = keyof typeof chipStyles.variant;
export type ChipSize = keyof typeof chipStyles.size;

type ChipBase = Omit<HTMLAttributes<HTMLElement>, "children" | "color" | "onClick"> & {
  /** Rótulo visível. Omitido no chip só de ícone ou só de contagem (dê um `label`). */
  children?: ReactNode;
  /**
   * Nome para leitores de tela no lugar do conteúdo visível: obrigatório quando o chip só tem
   * ícone ou contagem (ex.: "Urgent priority", "Blocked by 2 issues").
   */
  label?: string;
  /** Ícone de 14 px antes do rótulo (ProjectIcon, StatusIcon, PriorityIcon, Icon). */
  icon?: ReactNode;
  /** Bolinha de cor da label, no lugar do ícone. */
  color?: LabelColor | HexColor;
  /** Contagem depois do rótulo (algarismos tabulares). */
  count?: number;
  /** Conteúdo depois do rótulo (ex.: o lápis do rascunho "New view"). */
  trailing?: ReactNode;
  /** outline: valor (24 px). filled: vista salva (28 px). draft: vista sem nome (28 px). */
  variant?: ChipVariant;
  /** Altura; o padrão segue a variante (outline sm, as demais md). */
  size?: ChipSize;
  className?: string;
};

/** Só leitura: não recebe foco. */
type ReadOnly = {
  onClick?: never;
  asChild?: never;
  active?: never;
  disabled?: never;
  onRemove?: never;
  removeLabel?: never;
  ref?: never;
};

/** Clicável: botão, ou o elemento filho com asChild (ex.: o link de uma vista). */
type Clickable = {
  onClick?: MouseEventHandler<HTMLElement>;
  /** Renderiza o filho (ex.: NavLink) com a aparência do chip; o filho traz o rótulo. */
  asChild?: boolean;
  /** Vista atual (filled): camada de pressionado e texto primário. No botão, vira aria-pressed. */
  active?: boolean;
  disabled?: boolean;
  onRemove?: never;
  removeLabel?: never;
  ref?: Ref<HTMLButtonElement>;
};

/** Removível: botão de remover no fim; Backspace ou Delete com o foco nele também removem. */
type Removable = {
  onRemove: () => void;
  /** Nome do botão de remover (padrão: "Remove" + o rótulo). */
  removeLabel?: string;
  onClick?: never;
  asChild?: never;
  active?: never;
  disabled?: never;
  ref?: never;
};

export type ChipProps = ChipBase & (ReadOnly | Clickable | Removable);

const defaultSize: Record<ChipVariant, ChipSize> = { outline: "sm", filled: "md", draft: "md" };

export function Chip(props: ChipProps) {
  const {
    children,
    label,
    icon,
    color,
    count,
    trailing,
    variant = "outline",
    size = defaultSize[variant],
    className,
    onClick,
    asChild,
    active,
    disabled,
    onRemove,
    removeLabel,
    ref,
    ...rest
  } = props;
  // Só ícone (Figma 1:8881, prioridade no cartão): quadrado, com o ícone no centro.
  const iconOnly = children === undefined && count === undefined;
  const classes = cn(
    chipStyles.base,
    chipStyles.size[size],
    chipStyles.variant[variant],
    iconOnly && (size === "sm" ? "w-control-sm" : "w-control-md"),
    iconOnly && "justify-center px-0",
  );
  // Com `label`, o leitor de tela lê só o nome; o conteúdo visível fica escondido dele.
  const hidden = label ? true : undefined;

  const lead = (
    <>
      {icon && (
        <span
          aria-hidden={hidden}
          className="flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-3.5"
        >
          {icon}
        </span>
      )}
      {color && !icon && (
        <span className="flex size-3.5 shrink-0 items-center justify-center">
          <ColorDot color={color} />
        </span>
      )}
    </>
  );
  const text = (content: ReactNode) =>
    content === undefined || content === null ? null : (
      <span aria-hidden={hidden} className="min-w-0 truncate">
        {content}
      </span>
    );
  const tail = (
    <>
      {count !== undefined && (
        <span aria-hidden={hidden} className="tabular-nums">
          {count}
        </span>
      )}
      {trailing && (
        <span aria-hidden className="flex shrink-0 items-center">
          {trailing}
        </span>
      )}
      {label && <span className="sr-only">{label}</span>}
    </>
  );

  if (onRemove) {
    const name = removeLabel ?? `Remove ${label ?? (typeof children === "string" ? children : "")}`;
    return (
      <span {...rest} className={cn(classes, "pr-1", className)}>
        {lead}
        {text(children)}
        {tail}
        <button
          type="button"
          aria-label={name.trim()}
          onClick={onRemove}
          // O botão de remover é o único alvo de foco do chip: Backspace e Delete também removem.
          onKeyDown={(e) => {
            if (e.key === "Backspace" || e.key === "Delete") {
              e.preventDefault();
              onRemove();
            }
          }}
          className="flex size-4 shrink-0 items-center justify-center rounded-full text-secondary transition-[color,background-color] duration-fast ease-standard focus-ring hovered:bg-hover hovered:text-primary"
        >
          <Icon icon={X} size="xs" />
        </button>
      </span>
    );
  }

  if (onClick || asChild || active !== undefined) {
    const state = active ? "on" : "off";
    const interactive = cn(classes, chipStyles.interactive, className);
    if (asChild) {
      // O filho (link) vira o chip; o rótulo dele entra entre o ícone e a contagem.
      return (
        <Slot.Root {...rest} ref={ref} data-state={state} onClick={onClick} className={interactive}>
          {lead}
          <Slot.Slottable child={children}>{text}</Slot.Slottable>
          {tail}
        </Slot.Root>
      );
    }
    return (
      <button
        {...rest}
        ref={ref}
        type="button"
        data-state={state}
        aria-pressed={active}
        disabled={disabled}
        onClick={onClick}
        className={interactive}
      >
        {lead}
        {text(children)}
        {tail}
      </button>
    );
  }

  return (
    <span {...rest} className={cn(classes, className)}>
      {lead}
      {text(children)}
      {tail}
    </span>
  );
}
