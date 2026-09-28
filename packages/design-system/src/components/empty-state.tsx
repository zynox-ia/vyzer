/**
 * Empty state (Figma 1:6091, 1:6250 e 1:6294, como referência geral): o que aparece quando uma
 * lista, vista ou painel não tem nada. Ícone, título, texto e a ação que resolve, centralizados.
 */
import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

export type EmptyStateProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** Ícone de 32 px que resume o conteúdo que falta (ex.: a vista, o inbox). */
  icon?: LucideIcon;
  /** O que está vazio (ex.: "No issues"). */
  title: ReactNode;
  /** Por que está vazio e o que fazer, em uma ou duas frases. */
  children?: ReactNode;
  /** Botões (ex.: "Create issue"); a ação principal primeiro. */
  action?: ReactNode;
};

/**
 * Ícone decorativo em text-tertiary (o menor peso, §4); título de 16/500, texto de 13 px em
 * text-secondary com até 320 px de largura; 16 px entre os blocos.
 */
export function EmptyState({ icon, title, children, action, className, ...rest }: EmptyStateProps) {
  return (
    <div
      className={cn("flex flex-col items-center gap-4 px-6 py-12 text-center", className)}
      {...rest}
    >
      {icon && <Icon icon={icon} size="xl" className="text-tertiary" />}
      <div className="flex max-w-80 flex-col gap-1">
        <p className="type-heading-3 text-primary">{title}</p>
        {children && <div className="text-body-md text-secondary">{children}</div>}
      </div>
      {action && <div className="flex flex-wrap items-center justify-center gap-2">{action}</div>}
    </div>
  );
}
