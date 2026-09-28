/**
 * Estados de um componente lado a lado. Hover, foco e pressionado são reproduzidos de forma
 * estática com data-preview (variantes hovered:, pressed: e focus-ring do design system).
 */
import type { ReactNode } from "react";

export type StateCell = { label: string; node: ReactNode };

export function StatesGrid({ states }: { states: StateCell[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 rounded-container border border-subtle bg-panel p-6 tablet:grid-cols-3 desktop:grid-cols-4">
      {states.map((s) => (
        <li key={s.label} className="flex flex-col items-start gap-2">
          <span className="text-caption text-secondary">{s.label}</span>
          {s.node}
        </li>
      ))}
    </ul>
  );
}

/** Estados empilhados em largura total, para peças largas (linhas de lista e de tabela). */
export function StatesStack({ states }: { states: StateCell[] }) {
  return (
    <ul className="flex flex-col gap-4 rounded-container border border-subtle bg-panel p-6">
      {states.map((s) => (
        <li key={s.label} className="flex flex-col gap-1.5">
          <span className="text-caption text-secondary">{s.label}</span>
          {s.node}
        </li>
      ))}
    </ul>
  );
}
