/**
 * Preferência de tema (ADR-0011): escuro (padrão), claro ou seguir o sistema, como no Linear.
 * Guardada em localStorage por enquanto; depois vai para as preferências do usuário no banco.
 * O script em index.html aplica a mesma regra antes da primeira pintura.
 */
import { useSyncExternalStore } from "react";

export type ThemePreference = "dark" | "light" | "system";

const STORAGE_KEY = "vyzer-theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

const listeners = new Set<() => void>();

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "system" || value === "dark") return value;
  } catch {
    // Sem acesso ao localStorage: fica o padrão.
  }
  return "dark";
}

let preference = readPreference();

function resolve(pref: ThemePreference): "dark" | "light" {
  if (pref === "system") return window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
  return pref;
}

function apply() {
  const theme = resolve(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

window.matchMedia(LIGHT_QUERY).addEventListener("change", () => {
  if (preference === "system") apply();
});

export function setThemePreference(next: ThemePreference) {
  preference = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // Sem persistência: a escolha vale até recarregar.
  }
  apply();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, () => preference);
}
