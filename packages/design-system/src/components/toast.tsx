/**
 * Toast (Figma 31:19913, o aviso de exclusão do Linear): aviso curto e temporário no canto
 * inferior direito. Serve ao resultado de uma ação ("Deleted VYZ-3", com Undo) e às notificações
 * do sistema (menção no inbox, e-mail novo, conexão perdida). Radix Toast: anúncio para leitor de
 * tela, pausa no hover e no foco, F8 leva ao aviso, Esc e swipe para a direita fecham.
 *
 * ToastProvider fica na raiz (renderiza a pilha e a área dos avisos); useToast() devolve a função
 * que mostra um aviso. ToastSurface é o aviso fixo na página, para documentação.
 */
import { CircleAlert, CircleCheck, Info, TriangleAlert, X, type LucideIcon } from "lucide-react";
import { Toast as ToastPrimitive } from "radix-ui";
import {
  createContext,
  use,
  useCallback,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { Avatar } from "./avatar";
import { IconButton } from "./button";
import { popoverSurface } from "./listbox";

export type ToastVariant = "default" | "success" | "info" | "warning" | "error";

export type ToastAction = {
  label: string;
  onClick: () => void;
  /** Como fazer o mesmo sem o botão, para o leitor de tela (o aviso some). Padrão: o rótulo. */
  altText?: string;
};

export type ToastOptions = {
  /** Frase curta, sem ponto final (ex.: "Deleted", "Ana mentioned you"). */
  title: string;
  /** O objeto de que o aviso fala, ao lado do título (ex.: o ícone de status e "VYZ-3"). */
  subject?: { label: string; icon?: ReactNode };
  /** Detalhe opcional: o que fazer, ou a prévia do item (assunto do e-mail, trecho do comentário). */
  description?: ReactNode;
  /** default (padrão), success, info, warning ou error: ícone e cor de status (st-*). */
  variant?: ToastVariant;
  /** Ícone próprio no lugar do de status, para avisos que não são status (ex.: Mail). */
  icon?: LucideIcon;
  /** Quem originou o aviso (menção, comentário, e-mail): o avatar vai no lugar do ícone. */
  avatar?: { name: string; src?: string };
  /** Ação em texto, abaixo do detalhe (ex.: "View issue", "Open", "Retry"). */
  action?: ToastAction;
  /** Mostra o Undo, que desfaz a ação e fecha o aviso. */
  onUndo?: () => void;
  /** Tempo na tela em ms; o padrão é o do Radix (5 s), pausado no hover e no foco. */
  duration?: number;
};

/** Ícone de status (o padrão não tem): o rótulo entra no anúncio antes do título. */
const variantIcon: Record<
  Exclude<ToastVariant, "default">,
  { icon: LucideIcon; label: string; className: string }
> = {
  success: { icon: CircleCheck, label: "Success", className: "text-success" },
  info: { icon: Info, label: "Info", className: "text-info" },
  warning: { icon: TriangleAlert, label: "Warning", className: "text-warning" },
  error: { icon: CircleAlert, label: "Error", className: "text-danger" },
};

/** Ações em texto: hover só no fundo, numa folga de 4 px em volta do rótulo. */
const textAction =
  "-mx-1 rounded-sm px-1 text-label-md transition-[color,background-color] duration-fast ease-standard select-none focus-line hovered:bg-hover pressed:bg-pressed";

/**
 * Classes do toast, exportadas para montar a aparência fora do Radix (documentação). Superfície
 * dos popovers (popoverSurface: raio 12, borda forte, bg-popover, sombra md) com 12 px de
 * respiro. Linha de cima: ícone ou avatar, título com o objeto e o X; abaixo, o detalhe e as
 * ações em texto (Figma 31:19913: nada de botão em pílula ao lado do X).
 */
export const toastStyles = {
  viewport: "fixed right-0 bottom-0 z-toast m-0 flex w-full max-w-100 list-none flex-col gap-2 p-4",
  root: cn(
    popoverSurface,
    "z-toast flex w-full items-start gap-2 p-3 focus-ring",
    "data-[state=open]:animate-slide-up data-[state=closed]:animate-fade-out",
    // Swipe para a direita: segue o dedo; solto antes do limite, volta; depois, some onde parou.
    "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[translate] data-[swipe=cancel]:duration-fast data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x)",
  ),
  /** Centrado na primeira linha de texto (20 px). */
  leading: "flex h-5 shrink-0 items-center",
  body: "flex min-w-0 flex-1 flex-col gap-0.5",
  header: "flex items-start gap-2",
  title: "flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-label-md text-primary",
  subject: "inline-flex min-w-0 items-center gap-1",
  /** Entrelinha de 18 px (o body-md tem 20): o detalhe quebrado em duas linhas fica junto. */
  description: "text-body-md leading-4.5 text-secondary",
  actions: "flex flex-wrap items-center gap-3 pt-1",
  /** A ação principal em text-primary; o Undo, secundário, em text-secondary. */
  action: cn(textAction, "text-primary"),
  undo: cn(textAction, "text-secondary hovered:text-primary"),
  /**
   * X discreto (Figma: glifo de 12 px num alvo de 24): o alvo de 24 px fica na linha de 20 px
   * sem aumentá-la, pelas margens negativas.
   */
  dismiss: "-my-0.5 -mr-1 [&>svg]:size-icon-xs",
};

function Leading({ variant, icon, avatar }: Pick<ToastOptions, "variant" | "icon" | "avatar">) {
  let glyph: ReactNode = null;
  // Avatar de 16 px, como os ícones: o texto começa na mesma coluna em todos os avisos.
  if (avatar) glyph = <Avatar name={avatar.name} src={avatar.src} size="sm" />;
  else if (icon) glyph = <Icon icon={icon} className="text-secondary" />;
  else if (variant && variant !== "default") {
    const v = variantIcon[variant];
    glyph = <Icon icon={v.icon} label={v.label} className={v.className} />;
  }
  return glyph && <span className={toastStyles.leading}>{glyph}</span>;
}

/**
 * O conteúdo do aviso. live monta as peças do Radix (título e detalhe anunciados, ações com
 * altText, X que fecha); sem ele, elementos comuns com a mesma aparência (ToastSurface).
 */
function ToastContent({
  live,
  title,
  subject,
  description,
  variant = "default",
  icon,
  avatar,
  action,
  onUndo,
}: Omit<ToastOptions, "duration"> & { live: boolean }) {
  const Title = live ? ToastPrimitive.Title : "p";
  const Description = live ? ToastPrimitive.Description : "div";
  const withAction = (altText: string, node: ReactNode) =>
    live ? (
      <ToastPrimitive.Action asChild altText={altText}>
        {node}
      </ToastPrimitive.Action>
    ) : (
      node
    );
  const dismiss = <IconButton icon={X} label="Dismiss" size="sm" className={toastStyles.dismiss} />;
  return (
    <>
      <Leading variant={variant} icon={icon} avatar={avatar} />
      <div className={toastStyles.body}>
        <div className={toastStyles.header}>
          <Title className={toastStyles.title}>
            {title}
            {subject && (
              <span className={toastStyles.subject}>
                {subject.icon}
                <span className="truncate">{subject.label}</span>
              </span>
            )}
          </Title>
          {live ? <ToastPrimitive.Close asChild>{dismiss}</ToastPrimitive.Close> : dismiss}
        </div>
        {description && (
          <Description className={toastStyles.description}>{description}</Description>
        )}
        {(action || onUndo) && (
          <div className={toastStyles.actions}>
            {action &&
              withAction(
                action.altText ?? action.label,
                <button type="button" className={toastStyles.action} onClick={action.onClick}>
                  {action.label}
                </button>,
              )}
            {onUndo &&
              withAction(
                "Undo",
                <button type="button" className={toastStyles.undo} onClick={onUndo}>
                  Undo
                </button>,
              )}
          </div>
        )}
      </div>
    </>
  );
}

type ToastEntry = ToastOptions & { id: number; open: boolean };

function ToastItem({
  duration,
  open,
  onOpenChange,
  id: _id,
  ...options
}: ToastEntry & { onOpenChange: (open: boolean) => void }) {
  const urgent = options.variant === "error" || options.variant === "warning";
  return (
    <ToastPrimitive.Root
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      // Erro e aviso interrompem o leitor de tela (assertive); os demais esperam a vez (polite).
      type={urgent ? "foreground" : "background"}
      className={toastStyles.root}
    >
      <ToastContent live {...options} />
    </ToastPrimitive.Root>
  );
}

const ToastContext = createContext<((options: ToastOptions) => void) | null>(null);

export type ToastProviderProps = Omit<
  ComponentProps<typeof ToastPrimitive.Provider>,
  "children"
> & {
  children: ReactNode;
};

/**
 * Pilha de avisos: um por aplicação, na raiz. Os avisos novos entram embaixo; cada um sai sozinho
 * depois da duração, pelo X, por Esc (com o foco nele) ou por swipe.
 */
export function ToastProvider({ children, ...provider }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const nextId = useRef(0);
  const toast = useCallback((options: ToastOptions) => {
    const id = nextId.current++;
    // Os fechados saem da lista no aviso seguinte: a animação de saída deles já terminou.
    setToasts((prev) => [...prev.filter((t) => t.open), { ...options, id, open: true }]);
  }, []);
  const close = (id: number) =>
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, open: false } : t)));
  return (
    <ToastPrimitive.Provider swipeDirection="right" {...provider}>
      <ToastContext value={toast}>{children}</ToastContext>
      {toasts.map((t) => (
        <ToastItem
          key={t.id}
          {...t}
          onOpenChange={(open) => {
            if (!open) close(t.id);
          }}
        />
      ))}
      <ToastPrimitive.Viewport className={toastStyles.viewport} />
    </ToastPrimitive.Provider>
  );
}

/** Função que mostra um aviso. Precisa de um ToastProvider acima. */
export function useToast() {
  const toast = use(ToastContext);
  if (!toast) throw new Error("useToast precisa de um ToastProvider acima na árvore.");
  return toast;
}

/** O aviso aberto, fixo na página (sem Radix nem tempo): para documentar a aparência. */
export function ToastSurface({
  className,
  ...options
}: Omit<ToastOptions, "duration"> & { className?: string }) {
  return (
    <div className={cn(toastStyles.root, "relative z-base", className)}>
      <ToastContent live={false} {...options} />
    </div>
  );
}
