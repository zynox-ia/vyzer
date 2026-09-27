/**
 * Kbd (Figma 1:941): tecla de atalho em caixa com borda de 1 px e raio 4, texto de 12 px.
 * KbdSequence junta teclas em sequência ("P then P") ou combinação ("Ctrl + K").
 */
import { Fragment, type HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Kbd({ className, ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-inline border border-default px-1 font-mono text-kbd text-secondary",
        className,
      )}
      {...rest}
    />
  );
}

export type KbdSequenceProps = {
  keys: string[];
  /** then: teclas em sequência (G, depois I). plus: pressionadas juntas (Ctrl + K). */
  mode?: "then" | "plus";
  className?: string;
};

export function KbdSequence({ keys, mode = "then", className }: KbdSequenceProps) {
  const joiner = mode === "then" ? "then" : "+";
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {keys.map((k, i) => (
        // As teclas podem se repetir ("P then P"): a posição faz parte da chave.
        // oxlint-disable-next-line react/no-array-index-key
        <Fragment key={`${k}-${i}`}>
          {i > 0 && <span className="text-caption text-secondary">{joiner}</span>}
          <Kbd>{k}</Kbd>
        </Fragment>
      ))}
    </span>
  );
}
