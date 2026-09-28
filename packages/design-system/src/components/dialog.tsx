/**
 * Dialog (Figma 1:3241 e 1:3409, modal do New Project, como referência geral): janela modal com
 * fundo escurecido, título, corpo e rodapé de ações. Radix Dialog: o foco fica preso dentro,
 * Esc e clique no fundo fecham e o foco volta ao gatilho.
 *
 * Confirm: a mesma superfície sobre o Radix AlertDialog, para confirmar uma ação (destrutiva ou
 * não). O foco inicial vai para Cancel e o clique no fundo não fecha.
 *
 * DialogPanel é a base sem cabeçalho (fundo + superfície), usada também pelo Command Menu. Para
 * mostrar a janela aberta numa documentação, use DialogSurface.
 */
import { X } from "lucide-react";
import { AlertDialog as AlertDialogPrimitive, Dialog as DialogPrimitive } from "radix-ui";
import {
  useRef,
  type ComponentProps,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "../lib/cn";
import { Button, IconButton } from "./button";
import { focusFirst } from "./popover";

/**
 * Classes do Dialog, exportadas para montar a aparência fora do Radix (documentação).
 * - overlay: fundo escurecido que também centraliza e rola a janela (padrão "scrollable overlay"
 *   do Radix), com 16 px de folga até a borda da tela.
 * - content: raio de superfície (12), borda forte, fundo de card (bg-surface) e sombra lg, a
 *   maior elevação (§9). Entra com a escala de modal (240 ms) e sai junto com o fundo (140 ms).
 */
export const dialogStyles = {
  overlay:
    "fixed inset-0 z-modal flex overflow-y-auto bg-scrim p-4 data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out",
  content:
    "relative flex w-full flex-col rounded-surface border border-strong bg-surface text-primary shadow-lg outline-none data-[state=open]:animate-dialog-in data-[state=closed]:animate-scale-out",
  header: "flex flex-col gap-1 px-5 py-4",
  title: "type-heading-3 text-primary",
  description: "text-body-md text-secondary",
  body: "flex flex-col gap-4 px-5 pb-5",
  footer: "flex flex-wrap items-center justify-end gap-2 border-t border-default px-5 py-3",
  /** O X alinha o centro (26 px) com o da linha do título (16 + 10). */
  close: "absolute top-3 right-3",
};

export type DialogSize = "sm" | "md" | "lg";

/** Larguras máximas: 400, 560 e 720 px (grid de 8). */
const sizeClass: Record<DialogSize, string> = {
  sm: "max-w-100",
  md: "max-w-140",
  lg: "max-w-180",
};

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export type DialogPanelProps = ComponentProps<typeof DialogPrimitive.Content> & {
  /** Renderiza num portal no body (padrão). Sem portal, herda o tema do contêiner. */
  portal?: boolean;
  /** center: no meio da tela. top: usa o espaçamento 24 desde o topo (Command Menu). */
  placement?: "center" | "top";
};

/**
 * Fundo e superfície, sem cabeçalho. Dê o nome com um DialogPrimitive.Title dentro (pode ser
 * visualmente oculto). O foco inicial vai para o primeiro elemento focável, sem selecionar o
 * texto de um campo (a regra do Popover). Ao fechar, o foco volta para onde estava ao abrir,
 * mesmo sem DialogTrigger (janela aberta por atalho ou por código); o Radix só volta ao gatilho.
 */
export function DialogPanel({
  portal = true,
  placement = "center",
  onOpenAutoFocus,
  onCloseAutoFocus,
  className,
  ...rest
}: DialogPanelProps) {
  const returnTo = useRef<HTMLElement | null>(null);
  const content = (
    <DialogPrimitive.Overlay className={dialogStyles.overlay}>
      <DialogPrimitive.Content
        onOpenAutoFocus={(event) => {
          // O foco ainda está fora da janela neste ponto.
          const active = document.activeElement;
          returnTo.current =
            active instanceof HTMLElement && active !== document.body ? active : null;
          onOpenAutoFocus?.(event);
          if (!event.defaultPrevented) focusFirst(event);
        }}
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          const target = returnTo.current;
          if (event.defaultPrevented || !target?.isConnected) return;
          event.preventDefault();
          target.focus({ preventScroll: true });
        }}
        className={cn(
          dialogStyles.content,
          placement === "top" ? "mx-auto mt-24 mb-auto" : "m-auto",
          className,
        )}
        {...rest}
      />
    </DialogPrimitive.Overlay>
  );
  return portal ? <DialogPrimitive.Portal>{content}</DialogPrimitive.Portal> : content;
}

export type DialogContentProps = Omit<DialogPanelProps, "title" | "placement"> & {
  /** Título visível: também é o nome acessível da janela. */
  title: ReactNode;
  /** Texto de apoio sob o título; vira a descrição acessível. */
  description?: ReactNode;
  /** Largura máxima: sm 400, md 560 (padrão), lg 720 px. */
  size?: DialogSize;
};

/**
 * Janela com cabeçalho (título, descrição e o X de fechar) e o conteúdo livre embaixo: use
 * DialogBody e DialogFooter (dentro de um form, se houver campos). O X fica por último no
 * DOM: o foco inicial vai para o primeiro campo, não para ele.
 */
export function DialogContent({
  title,
  description,
  size = "md",
  className,
  children,
  ...rest
}: DialogContentProps) {
  return (
    <DialogPanel
      // Sem descrição, o Radix avisa no console se aria-describedby não for desligado.
      {...(description ? {} : { "aria-describedby": undefined })}
      className={cn(sizeClass[size], className)}
      {...rest}
    >
      <div className={cn(dialogStyles.header, "pr-12")}>
        <DialogPrimitive.Title className={dialogStyles.title}>{title}</DialogPrimitive.Title>
        {description && (
          <DialogPrimitive.Description className={dialogStyles.description}>
            {description}
          </DialogPrimitive.Description>
        )}
      </div>
      {children}
      <DialogPrimitive.Close asChild>
        <IconButton icon={X} label="Close" className={dialogStyles.close} />
      </DialogPrimitive.Close>
    </DialogPanel>
  );
}

/** Corpo da janela: 20 px nas laterais, 16 entre blocos. */
export function DialogBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(dialogStyles.body, className)} {...rest} />;
}

/**
 * Rodapé de ações sob uma hairline (Figma 1:3405): Cancel e a ação principal à direita, nessa
 * ordem. Um controle à esquerda (ex.: "Create more") leva mr-auto.
 */
export function DialogFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn(dialogStyles.footer, className)} {...rest} />;
}

/**
 * A janela aberta, fixa na página (sem Radix, fundo nem foco preso): para documentar a aparência
 * do Dialog e, sem o X (closable={false}), do Confirm. O X é só visual.
 */
export function DialogSurface({
  title,
  description,
  size = "md",
  closable = true,
  className,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  size?: DialogSize;
  closable?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div className={cn(dialogStyles.content, sizeClass[size], className)}>
      <div className={cn(dialogStyles.header, closable && "pr-12")}>
        <p className={dialogStyles.title}>{title}</p>
        {description && <p className={dialogStyles.description}>{description}</p>}
      </div>
      {children}
      {closable && <IconButton icon={X} label="Close" className={dialogStyles.close} />}
    </div>
  );
}

export type ConfirmProps = Pick<
  ComponentProps<typeof AlertDialogPrimitive.Root>,
  "open" | "defaultOpen" | "onOpenChange"
> & {
  /** Gatilho (um Button). Omita quando a janela é controlada por open. */
  children?: ReactElement;
  /** Pergunta curta (ex.: "Delete issue?"). */
  title: ReactNode;
  /** O que acontece, em uma ou duas frases. */
  description?: ReactNode;
  /** Verbo da ação (ex.: "Delete"). */
  confirmLabel: string;
  cancelLabel?: string;
  /** danger (padrão): ação destrutiva. primary: confirmação comum. */
  variant?: "danger" | "primary";
  /** Chamado ao confirmar; a janela fecha em seguida. */
  onConfirm: () => void;
  portal?: boolean;
};

/**
 * Confirmação (Radix AlertDialog): título, descrição e o rodapé com Cancel e a ação. O foco
 * inicial vai para Cancel (o Radix faz isso); Esc cancela; o clique no fundo não fecha.
 */
export function Confirm({
  children,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  portal = true,
  ...root
}: ConfirmProps) {
  const content = (
    <AlertDialogPrimitive.Overlay className={dialogStyles.overlay}>
      <AlertDialogPrimitive.Content
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(dialogStyles.content, sizeClass.sm, "m-auto")}
      >
        <div className={dialogStyles.header}>
          <AlertDialogPrimitive.Title className={dialogStyles.title}>
            {title}
          </AlertDialogPrimitive.Title>
          {description && (
            <AlertDialogPrimitive.Description className={dialogStyles.description}>
              {description}
            </AlertDialogPrimitive.Description>
          )}
        </div>
        <div className={dialogStyles.footer}>
          <AlertDialogPrimitive.Cancel asChild>
            <Button>{cancelLabel}</Button>
          </AlertDialogPrimitive.Cancel>
          <AlertDialogPrimitive.Action asChild>
            <Button variant={variant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogPrimitive.Action>
        </div>
      </AlertDialogPrimitive.Content>
    </AlertDialogPrimitive.Overlay>
  );
  return (
    <AlertDialogPrimitive.Root {...root}>
      {children && <AlertDialogPrimitive.Trigger asChild>{children}</AlertDialogPrimitive.Trigger>}
      {portal ? <AlertDialogPrimitive.Portal>{content}</AlertDialogPrimitive.Portal> : content}
    </AlertDialogPrimitive.Root>
  );
}
