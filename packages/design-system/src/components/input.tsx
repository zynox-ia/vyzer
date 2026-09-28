/**
 * Campos de texto: TextInput, TextArea, InputGroup, SearchInput e PasswordInput.
 * Figma 13:2010: raio 8, fundo de campo, borda de 1 px (#2f3033), texto 13 px Regular, padding
 * de 12 px à esquerda e 8 px à direita do botão interno. Alturas da escala compartilhada com
 * Button (§6), só lg e xl: o padding aprovado não cabe em 24 e 28 px. Hover e foco sem acento: a borda fica 10% mais clara (pedido do responsável).
 */
import { Eye, EyeOff, Search, X, type LucideIcon } from "lucide-react";
import {
  useRef,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type Ref,
  type TextareaHTMLAttributes,
} from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { IconButton } from "./button";
import { useFieldControl } from "./field";

export type InputSize = "lg" | "xl";

const heightClass: Record<InputSize, string> = {
  lg: "h-control-lg",
  xl: "h-control-xl",
};

/** Caixa do campo: borda de campo (Figma 13:2010), erro em danger, desabilitado e somente leitura. */
const box =
  "rounded-control border border-field outline-field bg-input text-body-md text-primary transition-colors hovered:border-field-hover has-[[data-preview~=hover]]:border-field-hover aria-invalid:border-field-danger has-[[aria-invalid=true]]:border-field-danger has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-disabled";

const field =
  "min-w-0 flex-1 bg-transparent text-primary outline-none placeholder:text-placeholder disabled:cursor-not-allowed read-only:text-secondary";

type BaseInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  size?: InputSize;
  /** Marca o campo como inválido (dentro de um Field, vem do erro). */
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

export type TextInputProps = BaseInputProps & {
  /** Ícone à esquerda (ex.: busca). */
  icon?: LucideIcon;
  /** Conteúdo à direita (ex.: botão, atalho). */
  trailing?: ReactNode;
};

/** Campo de uma linha. Com ícone ou conteúdo à direita, vira um InputGroup. */
export function TextInput({
  size = "lg",
  icon,
  trailing,
  invalid,
  className,
  ...rest
}: TextInputProps) {
  const control = useFieldControl({ ...rest, invalid });
  const { invalid: _invalid, ...a11y } = control;
  return (
    <InputGroup size={size} className={className} invalid={control.invalid}>
      {icon && (
        <InputGroupAddon>
          <Icon icon={icon} />
        </InputGroupAddon>
      )}
      <input className={cn(field, "h-full px-3")} {...rest} {...a11y} />
      {trailing && <InputGroupAddon className="pr-2 pl-0">{trailing}</InputGroupAddon>}
    </InputGroup>
  );
}

export type InputGroupProps = {
  size?: InputSize;
  invalid?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Contêiner que carrega a borda, o foco e o erro de um campo com complementos (ícone, prefixo,
 * botão). O input interno não tem borda própria.
 */
export function InputGroup({ size = "lg", invalid, className, children }: InputGroupProps) {
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        box,
        "flex items-center focus-field-within data-invalid:border-field-danger",
        heightClass[size],
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Complemento de um InputGroup: ícone, prefixo de texto ou botão. */
export function InputGroupAddon({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn("flex shrink-0 items-center pl-3 text-secondary [&+input]:pl-1.5", className)}
    >
      {children}
    </span>
  );
}

export type InputGroupInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size"> & {
  invalid?: boolean;
  ref?: Ref<HTMLInputElement>;
};

/** Input sem borda para dentro de um InputGroup; recebe rótulo, ajuda e erro do Field. */
export function InputGroupInput({ invalid, className, ...rest }: InputGroupInputProps) {
  const { invalid: _i, ...a11y } = useFieldControl({ ...rest, invalid });
  return <input className={cn(field, "h-full px-3", className)} {...rest} {...a11y} />;
}

export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
  /**
   * default: campo com borda. plain: sem borda nem fundo, texto 16 px, para dentro de um
   * contêiner que já é o campo (Composer, Figma 1:6383); o contêiner mostra o foco
   * (focus-ring-within).
   */
  variant?: "default" | "plain";
  ref?: Ref<HTMLTextAreaElement>;
};

/** Texto longo. Cresce na vertical; linha de 20 px como o corpo (§2). */
export function TextArea({
  invalid,
  variant = "default",
  rows = 3,
  className,
  ...rest
}: TextAreaProps) {
  const { invalid: isInvalid, ...a11y } = useFieldControl({ ...rest, invalid });
  return (
    <textarea
      rows={rows}
      className={cn(
        field,
        variant === "default"
          ? cn(box, "block w-full resize-y px-3 py-1.5 focus-field disabled:opacity-disabled")
          : "block w-full resize-none bg-transparent px-4 py-1 text-body-lg disabled:opacity-disabled",
        variant === "default" && isInvalid && "border-field-danger",
        className,
      )}
      {...rest}
      {...a11y}
    />
  );
}

/** Muda o valor como se a pessoa tivesse digitado, para o onChange do React disparar. */
function setNativeValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export type SearchInputProps = Omit<TextInputProps, "icon" | "trailing" | "type"> & {
  /** Chamado ao limpar pelo botão ou com Esc (o onChange também recebe o valor vazio). */
  onClear?: () => void;
};

/** Busca: ícone de lupa, botão de limpar quando há texto, Esc limpa. */
export function SearchInput({
  onClear,
  onKeyDown,
  value,
  defaultValue,
  onChange,
  ref,
  className,
  size = "lg",
  ...rest
}: SearchInputProps) {
  const inner = useRef<HTMLInputElement>(null);
  const controlled = value !== undefined;
  const [text, setText] = useState(String(defaultValue ?? ""));
  const current = controlled ? String(value) : text;
  const setRef = (el: HTMLInputElement | null) => {
    inner.current = el;
    if (typeof ref === "function") ref(el);
    else if (ref) ref.current = el;
  };
  const clear = () => {
    if (inner.current) setNativeValue(inner.current, "");
    onClear?.();
    inner.current?.focus();
  };
  return (
    <TextInput
      {...rest}
      ref={setRef}
      size={size}
      type="search"
      icon={Search}
      value={current}
      onChange={(e) => {
        if (!controlled) setText(e.target.value);
        onChange?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && current) {
          e.preventDefault();
          clear();
        }
        onKeyDown?.(e);
      }}
      trailing={
        current ? <IconButton icon={X} label="Clear search" size="sm" onClick={clear} /> : undefined
      }
      className={cn("[&_input::-webkit-search-cancel-button]:appearance-none", className)}
    />
  );
}

export type PasswordInputProps = Omit<TextInputProps, "type" | "trailing">;

/** Senha com botão de mostrar/ocultar (aria-pressed indica o estado). */
export function PasswordInput({ size = "lg", ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  return (
    <TextInput
      autoComplete="current-password"
      {...props}
      size={size}
      type={visible ? "text" : "password"}
      trailing={
        <IconButton
          icon={visible ? EyeOff : Eye}
          label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          size="sm"
          onClick={() => setVisible((v) => !v)}
        />
      }
    />
  );
}
