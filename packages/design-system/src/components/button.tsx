/**
 * Button e IconButton (Figma: pílulas de 24 e 28 px, label 12 px Medium, padding 8–10 px).
 * Primário invertido (ADR-0011), secundário em superfície de controle com hairline, ghost
 * transparente e danger. Hover e pressionado como camadas translúcidas (skill §12).
 */
import { LoaderCircle, type LucideIcon } from "lucide-react";
import { Slot } from "radix-ui";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

/** Camadas de hover e pressionado sobre qualquer fundo (a cor do fundo não muda). */
const layers =
  "hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] pressed:[background-image:linear-gradient(var(--bg-pressed),var(--bg-pressed))]";

const variantClass: Record<ButtonVariant, string> = {
  /*
   * Degradê de 3 tons; no hover sobe 5 px com brilho por trás e volta ao pressionar.
   * O ::after cobre os 5 px deixados embaixo, para o hover não piscar ao subir.
   */
  primary: cn(
    "bg-inverse [background-image:linear-gradient(180deg,var(--primary-stop-1),var(--primary-stop-2),var(--primary-stop-3))] text-inverse focus-ring-outside",
    "transition-[translate,box-shadow] duration-fast ease-standard",
    "hovered:-translate-y-(--motion-lift) hovered:shadow-glow pressed:translate-y-0 pressed:shadow-none",
    "after:absolute after:inset-x-0 after:top-full after:h-(--motion-lift) after:content-['']",
  ),
  secondary: cn("border-default bg-control text-primary", layers),
  ghost: cn("text-primary", layers),
  danger: cn("bg-danger-subtle text-danger-strong", layers),
};

/** Alturas da escala compartilhada (§6); padding horizontal ≥ vertical (§1). */
const sizeClass: Record<ButtonSize, string> = {
  sm: "h-control-sm gap-1 px-2 text-label-sm",
  md: "h-control-md gap-1.5 px-2.5 text-label-sm",
  lg: "h-control-lg gap-1.5 px-3 text-label-md",
  xl: "h-control-xl gap-2 px-4 text-label-md",
};

/** Com ícone à esquerda, o lado do ícone perde 2 px (Figma: 0/8/0/6). */
const leadingPad: Record<ButtonSize, string> = {
  sm: "pl-1.5",
  md: "pl-2",
  lg: "pl-2.5",
  xl: "pl-3.5",
};

const iconSize = { sm: "xs", md: "sm", lg: "sm", xl: "md" } as const;

const base =
  "relative inline-flex shrink-0 items-center justify-center rounded-full border border-transparent whitespace-nowrap no-underline transition-colors select-none focus-ring disabled:cursor-not-allowed disabled:opacity-disabled aria-disabled:cursor-not-allowed aria-disabled:opacity-disabled";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
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
  size = "md",
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
        <Icon
          icon={leading}
          size={iconSize[size]}
          className={loading ? "animate-spin" : undefined}
        />
      )}
      <span className={spinnerOverLabel ? "opacity-0" : undefined}>{children}</span>
      {trailingIcon && (
        <Icon
          icon={trailingIcon}
          size={iconSize[size]}
          className={spinnerOverLabel ? "opacity-0" : undefined}
        />
      )}
      {spinnerOverLabel && (
        <Icon icon={LoaderCircle} size={iconSize[size]} className="absolute animate-spin" />
      )}
    </>
  );
  if (asChild) {
    // O filho (ex.: link) recebe só a aparência: sem ícones nem loading. Desabilitado vira
    // aria-disabled, já que links não têm o atributo disabled.
    return (
      <Slot.Root
        aria-disabled={disabled || undefined}
        className={cn(base, variantClass[variant], sizeClass[size], className)}
        {...rest}
      >
        {children}
      </Slot.Root>
    );
  }
  const classes = cn(
    base,
    variantClass[variant],
    sizeClass[size],
    leading && leadingPad[size],
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
