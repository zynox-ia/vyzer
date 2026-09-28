import { use } from "react";
import { AppShellContext, type AppShellContextValue } from "./context";

/** Estado do shell (sidebar, painel direito, Command Menu, criação de issue). Só dentro do AppShell. */
export function useAppShell(): AppShellContextValue {
  const ctx = use(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used inside AppShell");
  return ctx;
}
