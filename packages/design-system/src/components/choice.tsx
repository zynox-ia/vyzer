/**
 * Controles de marcar: Checkbox, RadioGroup e Switch (Radix).
 * Checkbox 16 px (raio 3 → 4, glifo de 12 px), toggle 26 × 16 com botão redondo — ajustado a
 * partir do Figma (14 px / 22 × 14) para ficar mais perto do tamanho real do Linear ao vivo
 * (30 × 20), sem chegar lá (pedido do responsável, 30/09). Controle ativo usa a cor do texto
 * primário, não o acento (ADR-0013). Área de clique ampliada para 24 px (§6).
 */
import { Check, Minus } from "lucide-react";
import {
  Checkbox as RadixCheckbox,
  RadioGroup as RadixRadio,
  Switch as RadixSwitch,
} from "radix-ui";
import { useId, type ComponentProps, type ReactNode } from "react";
import { Icon } from "../icons/Icon";
import { cn } from "../lib/cn";
import { useFieldControl, useFieldLabelId } from "./field";

/** Alvo de 24 px ao redor de um controle de 14 px: 5 px de área invisível por lado. */
const hitArea = "relative before:absolute before:-inset-1.25 before:content-['']";

const control =
  "shrink-0 border border-control bg-input transition-colors focus-ring hovered:border-control-hover disabled:cursor-not-allowed disabled:opacity-disabled aria-invalid:border-danger";

export type CheckboxProps = Omit<ComponentProps<typeof RadixCheckbox.Root>, "children"> & {
  invalid?: boolean;
};

export function Checkbox({ className, invalid, ...rest }: CheckboxProps) {
  const { invalid: _i, ...a11y } = useFieldControl({ ...rest, invalid });
  return (
    <RadixCheckbox.Root
      className={cn(
        control,
        hitArea,
        "group inline-flex size-4 items-center justify-center rounded-inline text-on-checked data-[state=checked]:border-checked data-[state=checked]:bg-checked data-[state=indeterminate]:border-checked data-[state=indeterminate]:bg-checked",
        className,
      )}
      {...rest}
      {...a11y}
    >
      {/* Glifo de 12 px dentro do quadrado de 16 (mesma folga de 2 px do Figma 1:5417) */}
      <RadixCheckbox.Indicator className="flex items-center justify-center">
        <Icon icon={Check} className="size-3 group-data-[state=indeterminate]:hidden" />
        <Icon icon={Minus} className="hidden size-3 group-data-[state=indeterminate]:block" />
      </RadixCheckbox.Indicator>
    </RadixCheckbox.Root>
  );
}

export type RadioGroupProps = ComponentProps<typeof RadixRadio.Root> & { invalid?: boolean };

/** Grupo de opções exclusivas. Setas movem e selecionam; Tab entra e sai do grupo. */
export function RadioGroup({ className, invalid, ...rest }: RadioGroupProps) {
  const { invalid: isInvalid, ...a11y } = useFieldControl({ ...rest, invalid });
  const labelledBy = useFieldLabelId();
  return (
    <RadixRadio.Root
      aria-labelledby={labelledBy}
      className={cn(
        "flex flex-col gap-2",
        // Erro do Field pinta a borda de todas as opções.
        isInvalid && "[&_[role=radio]]:border-danger",
        className,
      )}
      {...rest}
      {...a11y}
    />
  );
}

export type RadioProps = Omit<ComponentProps<typeof RadixRadio.Item>, "children"> & {
  label: ReactNode;
};

/** Opção com rótulo ao lado; o rótulo inteiro é clicável. */
export function Radio({ label, id, className, ...rest }: RadioProps) {
  const auto = useId();
  const itemId = id ?? `radio-${auto}`;
  return (
    <span className="inline-flex items-center gap-2">
      <RadixRadio.Item
        id={itemId}
        className={cn(
          control,
          hitArea,
          "peer inline-flex size-3.5 items-center justify-center rounded-full data-[state=checked]:border-checked",
          className,
        )}
        {...rest}
      >
        <RadixRadio.Indicator className="block size-1.5 rounded-full bg-checked" />
      </RadixRadio.Item>
      <label
        htmlFor={itemId}
        className="text-body-md text-primary select-none peer-disabled:opacity-disabled"
      >
        {label}
      </label>
    </span>
  );
}

export type SwitchProps = Omit<ComponentProps<typeof RadixSwitch.Root>, "children"> & {
  invalid?: boolean;
};

/** Liga/desliga com efeito imediato (26 × 16, botão de 12 px — entre o Figma e o Linear ao vivo). */
export function Switch({ className, invalid, ...rest }: SwitchProps) {
  const { invalid: _i, ...a11y } = useFieldControl({ ...rest, invalid });
  return (
    <RadixSwitch.Root
      className={cn(
        "relative inline-flex h-4 w-6.5 shrink-0 items-center rounded-full bg-track p-0.5 transition-colors focus-ring hovered:data-[state=unchecked]:bg-track-hover before:absolute before:-inset-x-0.5 before:-inset-y-1.25 before:content-[''] disabled:cursor-not-allowed disabled:opacity-disabled data-[state=checked]:bg-checked",
        className,
      )}
      {...rest}
      {...a11y}
    >
      <RadixSwitch.Thumb className="block size-3 rounded-full bg-panel transition-transform duration-fast data-[state=checked]:translate-x-2.5" />
    </RadixSwitch.Root>
  );
}
