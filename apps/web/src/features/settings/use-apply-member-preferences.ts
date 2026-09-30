/**
 * Aplica no app inteiro as preferências do Member que têm efeito visual: tema (a API é a fonte da
 * verdade; o `localStorage` do design system fica só como cache para a primeira pintura, lida pelo
 * script do `index.html`), cursores de ponteiro e links sublinhados (atributos no elemento raiz, que
 * `index.css` responde). Usado pela rota do produto e pela de Settings; sem a preferência carregada
 * nada muda.
 */
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { setThemePreference } from "@vyzer/design-system/theme";
import { memberPreferencesQueryOptions } from "@/services/member-preferences";

export function useApplyMemberPreferences() {
  const { data } = useQuery(memberPreferencesQueryOptions());
  const theme = data?.interfaceTheme;
  const pointerCursors = data?.usePointerCursors;
  const underlineLinks = data?.underlineLinks;

  useEffect(() => {
    if (theme) setThemePreference(theme);
  }, [theme]);

  useEffect(() => {
    if (pointerCursors === undefined) return;
    document.documentElement.toggleAttribute("data-pointer-cursors", pointerCursors);
  }, [pointerCursors]);

  useEffect(() => {
    if (underlineLinks === undefined) return;
    document.documentElement.toggleAttribute("data-underline-links", underlineLinks);
  }, [underlineLinks]);
}
