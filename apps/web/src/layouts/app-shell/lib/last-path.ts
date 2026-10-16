/**
 * Última tela do shell principal visitada (sessionStorage, try/catch): Settings usa isso para
 * "Back to app" voltar para onde a pessoa estava, como no Linear (review de código, item 3) —
 * não sempre para `/projects`, que é só o fallback quando não há nada guardado ainda.
 */
const KEY = "zynox:shell:last-path";

export function writeLastShellPath(path: string) {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Sem persistência: "Back to app" cai no fallback.
  }
}

export function readLastShellPath(fallback: string): string {
  try {
    return sessionStorage.getItem(KEY) || fallback;
  } catch {
    return fallback;
  }
}
