/** Rota de Settings: layout (nav + slot) com o conteúdo da seção ativa. */
import { Outlet, useLocation } from "react-router";
import { SettingsLayout } from "@/layouts/app-shell/settings-layout";
import { readLastShellPath } from "@/layouts/app-shell/lib/last-path";
import { SETTINGS_GROUPS } from "./nav-data";

/** Páginas com tabela larga (72 rem) em vez da coluna de 640 px. */
const WIDE_PATHS = ["/settings/members", "/settings/api/keys"];

export function SettingsRoute() {
  const { pathname } = useLocation();
  // "Back to app" volta para onde a pessoa estava antes de entrar em Settings, como no Linear
  // (review de código, item 3); "/projects" é só o fallback quando não há nada guardado ainda.
  return (
    <SettingsLayout
      backTo={readLastShellPath("/projects")}
      groups={SETTINGS_GROUPS}
      contentWidth={WIDE_PATHS.includes(pathname) ? "wide" : "narrow"}
    >
      <Outlet />
    </SettingsLayout>
  );
}

export { PreferencesPage } from "./preferences";
export { MembersPage } from "./members";
