/** Rota de Settings: layout (nav + slot) com o conteúdo da seção ativa. */
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Outlet, useLocation } from "react-router";
import { ProjectIcon } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { teamsQueryOptions } from "@/services/teams";
import { SettingsLayout } from "@/layouts/app-shell/settings-layout";
import { readLastShellPath } from "@/layouts/app-shell/lib/last-path";
import { useApplyMemberPreferences } from "./use-apply-member-preferences";
import { SETTINGS_GROUPS } from "./nav-data";

/** Páginas com tabela larga (72 rem) em vez da coluna de 640 px, além das que casam por padrão abaixo. */
const WIDE_PATHS = ["/settings/members", "/settings/teams", "/settings/api/keys"];

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
  useApplyMemberPreferences();
  const groups = useSettingsGroups();
  // "Back to app" volta para onde a pessoa estava antes de entrar em Settings, como no Linear
  // (review de código, item 3); "/projects" é só o fallback quando não há nada guardado ainda.
  return (
    <SettingsLayout
      backTo={readLastShellPath("/projects")}
      groups={groups}
      contentWidth={
        WIDE_PATHS.includes(pathname) || /^\/settings\/teams\/[^/]+\/members$/.test(pathname)
          ? "wide"
          : (/^\/settings\/teams\/[^/]+$/.test(pathname) && pathname !== "/settings/teams/new") ||
              pathname === "/settings/preferences" ||
              pathname === "/settings/profile" ||
              pathname === "/settings/code-reviews" ||
              pathname.startsWith("/settings/notifications")
            ? "medium"
            : "narrow"
      }
    >
      <Outlet />
    </SettingsLayout>
  );
}

export { PreferencesPage } from "./preferences";
export { ProfilePage } from "./profile-page";
export { CodeReviewsPage } from "./code-reviews-page";
export { NotificationChannelPage, NotificationsPage } from "./notifications-page";
export { MembersPage } from "./members";
export { TeamsPage } from "./teams";
export { TeamCreatePage } from "./team-create";
export { TeamSettingsLayout } from "./team-settings/layout";
export { TeamOverviewPage } from "./team-settings/overview";
export { TeamGeneralPage } from "./team-settings/general";
export { TeamMembersPage } from "./team-settings/members";
export { TeamStatusesPage } from "./team-statuses";
export { TeamPlaceholderPage, teamPlaceholderPages } from "./team-settings/placeholder";
