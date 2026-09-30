/**
 * Os nove itens da sidebar que a pessoa pode personalizar (Preferences → Customize sidebar, spec
 * `customize-sidebar-preferences.md`) e a regra que transforma as preferências guardadas na API em
 * ordem e visibilidade. Puro: serve à sidebar real e à janela de Customize, e sem preferências
 * (carregando, documentação) vale o padrão do Linear.
 */
export type SidebarItemKey =
  | "inbox"
  | "reviews"
  | "my-issues"
  | "agent"
  | "drafts"
  | "projects"
  | "views"
  | "members"
  | "teams";
export type SidebarVisibility = "always" | "when-badged" | "hidden";
export type SidebarGroupKey = "personal" | "workspace";

export const SIDEBAR_GROUPS: { key: SidebarGroupKey; items: SidebarItemKey[] }[] = [
  { key: "personal", items: ["inbox", "reviews", "my-issues", "agent", "drafts"] },
  { key: "workspace", items: ["projects", "views", "members", "teams"] },
];

export const SIDEBAR_DEFAULT_VISIBILITY: Record<SidebarItemKey, SidebarVisibility> = {
  inbox: "always",
  reviews: "always",
  "my-issues": "always",
  agent: "always",
  drafts: "when-badged",
  projects: "always",
  views: "always",
  members: "hidden",
  teams: "hidden",
};

/** O que a API devolve em `sidebarPreferences.get` (só o que a sidebar usa). */
export type SidebarPreferencesData = {
  badgeStyle: "count" | "dot";
  items: { key: SidebarItemKey; visibility: SidebarVisibility; sortOrder: number }[];
};

export type ResolvedSidebar = {
  badgeStyle: "count" | "dot";
  order: Record<SidebarGroupKey, SidebarItemKey[]>;
  visibility: Record<SidebarItemKey, SidebarVisibility>;
};

export function resolveSidebar(data?: SidebarPreferencesData): ResolvedSidebar {
  const visibility = { ...SIDEBAR_DEFAULT_VISIBILITY };
  const sortOrder = new Map<SidebarItemKey, number>();
  for (const item of data?.items ?? []) {
    visibility[item.key] = item.visibility;
    sortOrder.set(item.key, item.sortOrder);
  }
  const ordered = (group: SidebarGroupKey) => {
    const keys = SIDEBAR_GROUPS.find((g) => g.key === group)!.items;
    // Empate ou item sem ordem guardada: fica na ordem padrão.
    return [...keys].sort(
      (a, b) =>
        (sortOrder.get(a) ?? keys.indexOf(a)) - (sortOrder.get(b) ?? keys.indexOf(b)) ||
        keys.indexOf(a) - keys.indexOf(b),
    );
  };
  return {
    badgeStyle: data?.badgeStyle ?? "count",
    order: { personal: ordered("personal"), workspace: ordered("workspace") },
    visibility,
  };
}

/** Se o item aparece: "always", ou "when-badged" só com contador (badge) maior que zero. */
export function isSidebarItemShown(visibility: SidebarVisibility, badge: number) {
  return visibility === "always" || (visibility === "when-badged" && badge > 0);
}
