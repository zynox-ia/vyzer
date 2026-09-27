/**
 * Campos de texto: TextInput, TextArea, InputGroup, SearchInput e PasswordInput.
 * Figma: raio 8, fundo de campo, texto 13 px Regular, padding 6–8 px (busca 28 × r8).
 * Alturas da escala compartilhada com Button (§6). Foco B sobre a borda (ADR-0013).
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

export type InputSize = "sm" | "md" | "lg" | "xl";

const heightClass: Record<InputSize, string> = {
  sm: "h-control-sm",
  md: "h-control-md",
  lg: "h-control-lg",
  xl: "h-control-xl",
};

/** Caixa do campo: borda de controle (3:1), erro em danger, desabilitado e somente leitura. */
const box =
  "rounded-control border border-control bg-input text-body-md text-primary transition-colors hovered:border-control-hover has-[[data-preview~=hover]]:border-control-hover aria-invalid:border-danger has-[[aria-invalid=true]]:border-danger has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-disabled";

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
  size = "md",
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
      <input className={cn(field, "h-full px-2")} {...rest} {...a11y} />
      {trailing && <InputGroupAddon className="pr-1">{trailing}</InputGroupAddon>}
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
export function InputGroup({ size = "md", invalid, className, children }: InputGroupProps) {
  return (
    <div
      data-invalid={invalid || undefined}
      className={cn(
        box,
        "flex items-center focus-ring-within data-invalid:border-danger",
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
      className={cn("flex shrink-0 items-center pl-2 text-secondary [&+input]:pl-1.5", className)}
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
  return <input className={cn(field, "h-full px-2", className)} {...rest} {...a11y} />;
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
          ? cn(box, "block w-full resize-y px-2 py-1.5 focus-ring disabled:opacity-disabled")
          : "block w-full resize-none bg-transparent px-4 py-1 text-body-lg disabled:opacity-disabled",
        variant === "default" && isInvalid && "border-danger",
        className,
      )}
      {...rest}
      {...a11y}
    />
  );
}

/** Botão interno cabe no campo: 20 px nos campos de 24 px, 24 px nos demais. */
const innerButton: Record<InputSize, "xs" | "sm"> = { sm: "xs", md: "sm", lg: "sm", xl: "sm" };

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
  size = "md",
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
        current ? (
          <IconButton icon={X} label="Clear search" size={innerButton[size]} onClick={clear} />
        ) : undefined
      }
      className={cn("[&_input::-webkit-search-cancel-button]:appearance-none", className)}
    />
  );
}

export type PasswordInputProps = Omit<TextInputProps, "type" | "trailing">;

/** Senha com botão de mostrar/ocultar (aria-pressed indica o estado). */
export function PasswordInput({ size = "md", ...props }: PasswordInputProps) {
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
          size={innerButton[size]}
          onClick={() => setVisible((v) => !v)}
        />
      }
    />
  );
}
