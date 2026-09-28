/**
 * Alert inline (sem desenho no Figma): aviso dentro da página ou de um formulário, que fica até a
 * situação mudar (ao contrário do Toast, que some sozinho). Tons de status (st-*) sobre o fundo a
 * 15%: info, sucesso, aviso e erro, sempre com ícone e texto (a cor nunca é o único sinal).
 */
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { IconButton } from "./button";

export type AlertTone = "info" | "success" | "warning" | "danger";

/** Ícone, nome do tom (lido antes do título) e cores; os ícones são os do Health Badge. */
const tones: Record<AlertTone, { icon: LucideIcon; label: string; bg: string; fg: string }> = {
  info: { icon: Info, label: "Info", bg: "bg-info-subtle", fg: "text-info" },
  success: { icon: CircleCheck, label: "Success", bg: "bg-success-subtle", fg: "text-success" },
  warning: { icon: TriangleAlert, label: "Warning", bg: "bg-warning-subtle", fg: "text-warning" },
  danger: { icon: CircleAlert, label: "Error", bg: "bg-danger-subtle", fg: "text-danger" },
};

/**
 * Classes do alerta: 44 px numa linha (ícone de 16, título de 13/500 e
 * botões de 28 px centrados na primeira linha), raio de contêiner e sem borda nem sombra.
 */
export const alertStyles = {
  root: "flex w-full items-start gap-2 rounded-container py-2 pr-2 pl-3",
  icon: "mt-1.5",
  text: "flex min-w-0 flex-1 flex-col gap-0.5 py-1",
  title: "text-label-md text-primary",
  description: "text-body-md text-secondary",
};

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, "title"> & {
  /** info (padrão), success, warning ou danger. */
  tone?: AlertTone;
  /** Frase curta que resume o aviso. */
  title?: ReactNode;
  /** Detalhe e o que fazer, em uma ou duas frases. */
  children?: ReactNode;
  /** Botão à direita (ex.: "Retry"). */
  action?: ReactNode;
  /** Mostra o X de dispensar. */
  onDismiss?: () => void;
};

/**
 * Sem role por padrão (aviso presente ao carregar a página). Um erro que aparece depois de uma
 * ação leva role="alert"; um aviso que muda sozinho, role="status".
 */
export function Alert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
  ...rest
}: AlertProps) {
  const t = tones[tone];
  return (
    <div className={cn(alertStyles.root, t.bg, className)} {...rest}>
      <Icon icon={t.icon} label={t.label} className={cn(alertStyles.icon, t.fg)} />
      <div className={alertStyles.text}>
        {title && <p className={alertStyles.title}>{title}</p>}
        {children && <div className={alertStyles.description}>{children}</div>}
      </div>
      {action}
      {onDismiss && <IconButton icon={X} label="Dismiss" onClick={onDismiss} />}
    </div>
  );
}
