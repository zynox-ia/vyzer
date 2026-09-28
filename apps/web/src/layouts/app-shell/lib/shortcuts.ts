/**
 * Atalhos globais do shell ("[", "]", "C", Ctrl/⌘+I) ficam fora de campos de texto, menus e
 * diálogos abertos: o mesmo teste usado pelo Command Menu (Ctrl/⌘+K) para não competir com
 * digitação. `⌘K` (Command Menu) e clique/Enter em botões continuam funcionando normalmente.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable ||
    target.closest('[role="dialog"], [role="menu"], [role="listbox"]') !== null
  );
}
