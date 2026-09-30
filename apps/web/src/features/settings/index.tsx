/** Rota de Settings: layout (nav + slot) com o conteúdo da seção ativa. */
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Outlet, useLocation } from "react-router";
import { ProjectIcon } from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { teamsQueryOptions } from "@/services/teams";
import { SettingsLayout } from "@/layouts/app-shell/settings-layout";
import { readLastShellPath } from "@/layouts/app-shell/lib/last-path";
import { SETTINGS_GROUPS } from "./nav-data";

/**
 * O grupo "Your teams" vem da API (spec 2.1): um link por Team, com o ícone e a cor dele, e
 * "Create a team" no fim. O grupo fixo de `nav-data.ts` só serve à documentação em /design-system.
 */
function useSettingsGroups() {
  const teams = useQuery(teamsQueryOptions());
  const fixed = SETTINGS_GROUPS.filter((group) => group.title !== "Your teams");
  return [
    ...fixed,
    {
      title: "Your teams",
      links: [
        ...(teams.data ?? []).map((team) => ({
          to: `/settings/teams/${team.slug}`,
          label: team.name,
          leading: <ProjectIcon value={team.icon} className="size-icon-sm" />,
        })),
        {
          to: "/settings/teams/new",
          label: "Create a team",
          leading: <Icon icon={Plus} size="sm" />,
        },
      ],
    },
  ];
}

export function SettingsRoute() {
  const { pathname } = useLocation();
  const groups = useSettingsGroups();
  // "Back to app" volta para onde a pessoa estava antes de entrar em Settings, como no Linear
  // (review de código, item 3); "/projects" é só o fallback quando não há nada guardado ainda.
  return (
    <SettingsLayout
      backTo={readLastShellPath("/projects")}
      groups={groups}
      contentWidth={
        pathname === "/settings/members" ||
        pathname === "/settings/teams" ||
        /^\/settings\/teams\/[^/]+\/members$/.test(pathname)
          ? "wide"
          : /^\/settings\/teams\/[^/]+$/.test(pathname) && pathname !== "/settings/teams/new"
            ? "medium"
            : "narrow"
      }
    >
      <Outlet />
    </SettingsLayout>
  );
}

export { PreferencesPage } from "./preferences";
export { MembersPage } from "./members";
export { TeamsPage } from "./teams";
export { TeamCreatePage } from "./team-create";
export { TeamSettingsLayout } from "./team-settings/layout";
export { TeamOverviewPage } from "./team-settings/overview";
export { TeamGeneralPage } from "./team-settings/general";
export { TeamMembersPage } from "./team-settings/members";
export { TeamPlaceholderPage, teamPlaceholderPages } from "./team-settings/placeholder";
