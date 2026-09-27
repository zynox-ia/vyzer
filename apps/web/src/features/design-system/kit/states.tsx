/**
 * Estados de um componente lado a lado. Hover, foco e pressionado são reproduzidos de forma
 * estática com data-preview (variantes hovered:, pressed: e focus-ring do design system).
 */
import type { ReactNode } from "react";

export type StateCell = { label: string; node: ReactNode };

export function StatesGrid({ states }: { states: StateCell[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 rounded-container border border-default bg-panel p-6 tablet:grid-cols-3 desktop:grid-cols-4">
      {states.map((s) => (
        <li key={s.label} className="flex flex-col items-start gap-2">
          <span className="text-caption text-secondary">{s.label}</span>
          {s.node}
        </li>
      ))}
    </ul>
  );
}
