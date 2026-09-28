/**
 * Roving tabindex (WAI-ARIA APG): o grupo tem um só alvo de Tab, o item ativo, e as setas movem
 * o foco entre os itens. Os itens nascem com tabIndex -1; depois de cada render o hook deixa um
 * (e só um) com 0 e segue o item que recebe foco, por clique ou pelas setas.
 */
import { useLayoutEffect, useRef, type FocusEvent } from "react";

/** Atributo que marca a raiz do grupo (itens de grupos aninhados ficam de fora). */
const ROOT = "data-roving-group";

/** Próxima posição para as teclas de navegação vertical; undefined para as demais. */
export function nextIndex(key: string, index: number, length: number): number | undefined {
  switch (key) {
    case "ArrowDown":
      return Math.min(index + 1, length - 1);
    case "ArrowUp":
      return Math.max(index - 1, 0);
    case "Home":
      return 0;
    case "End":
      return length - 1;
    default:
      return undefined;
  }
}

export function useRovingFocus<T extends HTMLElement>(selector: string) {
  const ref = useRef<T>(null);

  const items = () => {
    const root = ref.current;
    if (!root) return [];
    return [...root.querySelectorAll<HTMLElement>(selector)].filter(
      (el) => el.parentElement?.closest(`[${ROOT}]`) === root,
    );
  };

  // Sem lista de dependências: roda depois de cada render, quando itens entram ou saem.
  useLayoutEffect(() => {
    const list = items();
    const active = list.find((el) => el.tabIndex === 0) ?? list[0];
    for (const el of list) el.tabIndex = el === active ? 0 : -1;
  });

  const onFocus = (event: FocusEvent) => {
    const item = (event.target as HTMLElement).closest<HTMLElement>(selector);
    const list = items();
    if (!item || !list.includes(item)) return;
    for (const el of list) el.tabIndex = el === item ? 0 : -1;
  };

  /** Item focado a partir de um evento de teclado dentro do grupo (ignora controles internos). */
  const itemFrom = (target: EventTarget) => {
    const el = target as HTMLElement;
    return items().includes(el) ? el : undefined;
  };

  return { ref, onFocus, items, itemFrom, rootProps: { [ROOT]: "" } };
}
