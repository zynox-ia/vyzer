/**
 * Field: label acima, controle, texto de ajuda e mensagem de erro (skill §14). O Field gera os
 * ids e os controles internos leem o contexto: label ligado ao controle, aria-describedby
 * apontando para ajuda e erro, aria-invalid quando há erro. O erro substitui a ajuda.
 */
import { CircleAlert } from "lucide-react";
import { Label as RadixLabel } from "radix-ui";
import { createContext, use, useId, type HTMLAttributes, type ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";

type FieldContextValue = {
  id: string;
  labelId: string;
  descriptionId: string;
  errorId: string;
  hasDescription: boolean;
  invalid: boolean;
  disabled: boolean;
  required: boolean;
};

const FieldContext = createContext<FieldContextValue | null>(null);

/** Props de acessibilidade que um controle recebe do Field ao redor (ou nada, fora dele). */
export function useFieldControl(props: {
  id?: string;
  invalid?: boolean;
  disabled?: boolean;
  required?: boolean;
  "aria-describedby"?: string;
}) {
  const field = use(FieldContext);
  const invalid = props.invalid ?? field?.invalid ?? false;
  const describedBy =
    [
      props["aria-describedby"],
      field?.invalid ? field.errorId : field?.hasDescription ? field.descriptionId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;
  return {
    id: props.id ?? field?.id,
    disabled: props.disabled ?? field?.disabled,
    required: props.required ?? field?.required,
    invalid,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };
}

/** Id do rótulo do Field ao redor: para grupos (RadioGroup) que não são alvo de htmlFor. */
export function useFieldLabelId(): string | undefined {
  return use(FieldContext)?.labelId;
}

export type FieldProps = {
  /** Rótulo visível, sempre acima do controle. */
  label: ReactNode;
  /** Texto de ajuda abaixo do controle. */
  description?: ReactNode;
  /** Mensagem de erro: diz o que aconteceu e como corrigir. Substitui a ajuda. */
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  /** Id do controle; gerado quando omitido. */
  id?: string;
  /** Controles de marcar (checkbox, switch) ficam ao lado do rótulo, não abaixo. */
  orientation?: "vertical" | "horizontal";
  className?: string;
  children: ReactNode;
};

export function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  id,
  orientation = "vertical",
  className,
  children,
}: FieldProps) {
  const auto = useId();
  const controlId = id ?? `field-${auto}`;
  const value: FieldContextValue = {
    id: controlId,
    labelId: `${controlId}-label`,
    descriptionId: `${controlId}-description`,
    errorId: `${controlId}-error`,
    hasDescription: description !== undefined,
    invalid: Boolean(error),
    disabled,
    required,
  };
  const help = error ? (
    <FormMessage id={value.errorId}>{error}</FormMessage>
  ) : description ? (
    <HelperText id={value.descriptionId}>{description}</HelperText>
  ) : null;

  return (
    <FieldContext value={value}>
      {orientation === "horizontal" ? (
        // Grade de 2 colunas: a ajuda alinha com o texto do rótulo, qualquer que seja o controle.
        <div className={cn("grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1", className)}>
          {children}
          <FormLabel id={value.labelId} htmlFor={controlId} required={required} disabled={disabled}>
            {label}
          </FormLabel>
          <div aria-live="polite" className="col-start-2">
            {help}
          </div>
        </div>
      ) : (
        <div className={cn("flex flex-col gap-1.5", className)}>
          <FormLabel id={value.labelId} htmlFor={controlId} required={required} disabled={disabled}>
            {label}
          </FormLabel>
          {children}
          {/* Região viva: o erro que aparece após o envio é anunciado. */}
          <div aria-live="polite">{help}</div>
        </div>
      )}
    </FieldContext>
  );
}

export type FormLabelProps = RadixLabel.LabelProps & { required?: boolean; disabled?: boolean };

/** Rótulo de controle (Radix Label). Obrigatório marcado com asterisco e texto acessível. */
export function FormLabel({ required, disabled, className, children, ...rest }: FormLabelProps) {
  return (
    <RadixLabel.Root
      className={cn(
        "text-label-md text-primary select-none",
        disabled && "opacity-disabled",
        className,
      )}
      {...rest}
    >
      {children}
      {required && (
        <span className="text-secondary">
          <span aria-hidden> *</span>
          <span className="sr-only"> (required)</span>
        </span>
      )}
    </RadixLabel.Root>
  );
}

export function HelperText({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-body-sm text-secondary", className)} {...rest} />;
}

/** Mensagem de erro com ícone (a cor nunca é o único indicador, §3). */
export function FormMessage({
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("inline-flex items-start gap-1 text-body-sm text-danger-strong", className)}
      {...rest}
    >
      <Icon icon={CircleAlert} size="xs" className="mt-0.5" />
      <span>{children}</span>
    </p>
  );
}
