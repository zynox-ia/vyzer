/**
 * Button e IconButton (Figma: pílulas de 28 px, label 12 px Medium, padding 10 px). O Button
 * tem um só tamanho: 28 px com 12 px de padding (pedido do responsável, como nas pílulas).
 * Primário invertido (ADR-0011), secundário em superfície de controle com hairline, ghost
 * transparente e danger. Hover e pressionado como camadas translúcidas (skill §12).
 */
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

/*
 * Foco por teclado (focus-line): o mesmo dos campos, 1 px por dentro no tom de hover de campo,
 * sem acento nem halo (pedido do responsável). No primário fica por fora (focus-ring-outside):
 * por dentro, a linha some sobre o fundo claro do botão.
 */

/** Camadas de hover e pressionado sobre qualquer fundo (a cor do fundo não muda). */
const layers =
  "hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] pressed:[background-image:linear-gradient(var(--bg-pressed),var(--bg-pressed))]";

/*
 * Hover como no Linear: só o fundo muda, sem subir nem brilhar. Transição curta de cor
 * (duration-fast), a mesma em todas as variantes e no Icon Button.
 */
const hover = "transition-[color,background-color,background-image] duration-fast ease-standard";

const variantClass: Record<ButtonVariant, string> = {
  // Chapado (#f0eee6 no escuro, grafite no claro); o hover desce um degrau.
  primary: "bg-primary-button text-inverse focus-ring-outside hovered:bg-primary-button-hover",
  // Figma: fundo de controle com relevo (anel de 1 px + contato), sem borda sólida.
  secondary: cn("bg-control-strong text-primary shadow-raised", layers),
  ghost: cn("text-primary", layers),
  danger: cn("bg-danger-subtle text-danger-strong", layers),
};

/**
 * Tamanho único: 28 px (h-control-md), padding horizontal de 12 px (o Figma usa 10; +2 px a
 * pedido do responsável, como nas pílulas), rótulo de 12 px/500 e ícone de 16 px.
 */
const sizeClass = "h-control-md gap-1.5 px-3 text-label-sm";

/** Com ícone à esquerda, o lado do ícone perde 2 px (Figma: 0/8/0/6). */
const leadingPad = "pl-2.5";

const base =
  "relative inline-flex shrink-0 items-center justify-center rounded-full border border-transparent whitespace-nowrap no-underline transition-colors select-none focus-line disabled:cursor-not-allowed disabled:opacity-disabled aria-disabled:cursor-not-allowed aria-disabled:opacity-disabled";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Ícone à esquerda do rótulo. */
  icon?: LucideIcon;
  /** Ícone à direita (ex.: seta de menu). */
  trailingIcon?: LucideIcon;
  /** Mostra o spinner no lugar do ícone e bloqueia cliques, mantendo a largura. */
  loading?: boolean;
  /** Renderiza o filho (ex.: um link) com a aparência de botão. */
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function Button({
  variant = "secondary",
  icon,
  trailingIcon,
  loading = false,
  asChild = false,
  disabled,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  // Com ícone, o spinner ocupa o lugar dele; sem ícone, fica por cima do rótulo invisível.
  // Nos dois casos a largura não muda.
  const spinnerOverLabel = loading && !icon;
  const leading = loading && icon ? LoaderCircle : icon;
  const content: ReactNode = (
    <>
      {leading && (
        <Icon icon={leading} size="sm" className={loading ? "animate-spin" : undefined} />
      )}
      <span className={spinnerOverLabel ? "opacity-0" : undefined}>{children}</span>
      {trailingIcon && (
        <Icon
          icon={trailingIcon}
          size="sm"
          className={spinnerOverLabel ? "opacity-0" : undefined}
        />
      )}
      {spinnerOverLabel && <Icon icon={LoaderCircle} size="sm" className="absolute animate-spin" />}
    </>
  );
  if (asChild) {
    // O filho (ex.: link) recebe só a aparência: sem ícones nem loading. Desabilitado vira
    // aria-disabled, já que links não têm o atributo disabled.
    return (
      <Slot.Root
        aria-disabled={disabled || undefined}
        className={cn(base, hover, variantClass[variant], sizeClass, className)}
        {...rest}
      >
        {children}
      </Slot.Root>
    );
  }
  const classes = cn(
    base,
    hover,
    variantClass[variant],
    sizeClass,
    leading && leadingPad,
    className,
  );
  return (
    <button
      type={type}
      disabled={disabled}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
      onClick={loading ? (e) => e.preventDefault() : rest.onClick}
    >
      {content}
    </button>
  );
}

export type IconButtonSize = "xs" | "sm" | "md" | "lg";

const iconButtonSize: Record<IconButtonSize, string> = {
  xs: "size-control-xs",
  sm: "size-control-sm",
  md: "size-control-md",
  lg: "size-control-lg",
};

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  icon: LucideIcon;
  /** Nome acessível (obrigatório: o botão não tem texto visível). */
  label: string;
  variant?: ButtonVariant;
  size?: IconButtonSize;
  ref?: Ref<HTMLButtonElement>;
};

/** Botão redondo só de ícone (Figma: 28 px, ícone de 16 px). */
export function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        base,
        variantClass[variant],
        iconButtonSize[size],
        variant === "ghost" && "text-secondary hovered:text-primary",
        className,
      )}
      {...rest}
    >
      <Icon icon={icon} size="sm" />
    </button>
  );
}
