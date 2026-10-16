/**
 * Preferência de tema (ADR-0013): escuro (padrão), claro ou seguir o sistema, como no Linear.
 * Guardada em localStorage por enquanto; depois vai para as preferências do usuário no banco.
 * O script em index.html do app aplica a mesma regra antes da primeira pintura.
 * Seguro fora do navegador: nada toca em `window` até alguém usar o módulo.
 */
import { useSyncExternalStore } from "react";

export type ThemePreference = "dark" | "light" | "system";

const STORAGE_KEY = "zynox-theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

const listeners = new Set<() => void>();
const hasWindow = typeof window !== "undefined";

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "system" || value === "dark") return value;
  } catch {
    // Sem acesso ao localStorage (ou fora do navegador): fica o padrão.
  }
  return "dark";
}

let preference: ThemePreference | undefined;

function current(): ThemePreference {
  preference ??= hasWindow ? readPreference() : "dark";
  return preference;
}

function resolve(pref: ThemePreference): "dark" | "light" {
  if (pref === "system") {
    return hasWindow && window.matchMedia(LIGHT_QUERY).matches ? "light" : "dark";
  }
  return pref;
}

function apply() {
  if (!hasWindow) return;
  const theme = resolve(current());
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function onSystemChange() {
  if (current() === "system") apply();
}

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
  // O sistema só é observado enquanto alguém usa a preferência.
  if (listeners.size === 0 && hasWindow) {
    window.matchMedia(LIGHT_QUERY).addEventListener("change", onSystemChange);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && hasWindow) {
      window.matchMedia(LIGHT_QUERY).removeEventListener("change", onSystemChange);
    }
  };
}

export function useThemePreference(): ThemePreference {
  return useSyncExternalStore(subscribe, current, () => "dark");
}
