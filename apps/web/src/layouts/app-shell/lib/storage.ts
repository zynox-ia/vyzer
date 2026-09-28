/**
 * Leitura e escrita em localStorage para o estado do shell (largura e recolhimento da sidebar):
 * sempre em try/catch (pode faltar acesso — modo privado, storage cheio, SSR).
 */
export function readStored(key: string): string | undefined {
  try {
    return localStorage.getItem(key) ?? undefined;
  } catch {
    return undefined;
  }
}

export function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Sem persistência: o valor vale só para esta sessão.
  }
}
