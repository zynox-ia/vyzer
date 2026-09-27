/**
 * Property Button (Figma 1:3289, chips "Backlog", "Priority", "Lead" do New Project): pílula de
 * 24 px em relevo, ícone de 14 px, rótulo de 12 px Regular. Mostra o valor de uma propriedade e
 * abre o seletor dela (use como gatilho do Select ou do Combobox).
 */
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "../lib/cn";

export type PropertyButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Ícone do valor atual (StatusIcon, PriorityIcon, avatar, ícone lucide). */
  leading?: ReactNode;
  /** Sem valor: o rótulo fica em text-secondary (ex.: "Lead"). */
  empty?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export function PropertyButton({
  leading,
  empty = false,
  className,
  children,
  type = "button",
  ...rest
}: PropertyButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "relative inline-flex h-control-sm max-w-40 shrink-0 items-center gap-1 rounded-full border border-transparent bg-control-strong pr-2 pl-1.5 text-body-sm whitespace-nowrap shadow-raised select-none focus-ring",
        "transition-[color,background-color,translate,box-shadow] duration-fast ease-standard hovered:-translate-y-(--motion-lift) hovered:shadow-glow-secondary pressed:translate-y-0",
        "hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))] disabled:cursor-not-allowed disabled:opacity-disabled",
        "after:absolute after:inset-x-0 after:top-full after:h-(--motion-lift) after:content-['']",
        empty ? "text-secondary" : "text-primary",
        className,
      )}
      {...rest}
    >
      {leading && (
        <span className="flex size-3.5 shrink-0 items-center justify-center [&>svg]:size-3.5">
          {leading}
        </span>
      )}
      <span className="truncate">{children}</span>
    </button>
  );
}
