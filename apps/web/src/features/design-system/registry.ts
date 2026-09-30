/**
 * Mapa da área /design-system: seções da barra superior e itens da sidebar. Uma URL por item:
 * /design-system/<seção>/<item>. Cada página é carregada sob demanda.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from "react";

export type DocItem = {
  slug: string;
  title: string;
  Page: LazyExoticComponent<ComponentType>;
};

export type DocSection = {
  slug: string;
  title: string;
  /** Fase em que os primeiros itens chegam (seções ainda vazias). */
  plannedIn?: string;
  items: DocItem[];
};

function page(load: () => Promise<{ Page: ComponentType }>) {
  return lazy(async () => ({ default: (await load()).Page }));
}

export const sections: DocSection[] = [
  {
    slug: "foundations",
    title: "Foundations",
    items: [
      { slug: "colors", title: "Colors", Page: page(() => import("./pages/foundations/colors")) },
      {
        slug: "typography",
        title: "Typography",
        Page: page(() => import("./pages/foundations/typography")),
      },
      {
        slug: "spacing",
        title: "Spacing",
        Page: page(() => import("./pages/foundations/spacing")),
      },
      { slug: "sizing", title: "Sizing", Page: page(() => import("./pages/foundations/sizing")) },
      { slug: "radius", title: "Radius", Page: page(() => import("./pages/foundations/radius")) },
      {
        slug: "shadows",
        title: "Shadows",
        Page: page(() => import("./pages/foundations/shadows")),
      },
      { slug: "motion", title: "Motion", Page: page(() => import("./pages/foundations/motion")) },
      {
        slug: "z-index",
        title: "Z-index",
        Page: page(() => import("./pages/foundations/z-index")),
      },
      { slug: "grid", title: "Grid", Page: page(() => import("./pages/foundations/grid")) },
      { slug: "icons", title: "Icons", Page: page(() => import("./pages/foundations/icons")) },
    ],
  },
  {
    slug: "visual-assets",
    title: "Visual assets",
    items: [
      {
        slug: "status-icon",
        title: "Status icon",
        Page: page(() => import("./pages/visual-assets/status-icon")),
      },
      {
        slug: "project-status-icon",
        title: "Project status icon",
        Page: page(() => import("./pages/visual-assets/project-status-icon")),
      },
      {
        slug: "priority-icon",
        title: "Priority icon",
        Page: page(() => import("./pages/visual-assets/priority-icon")),
      },
    ],
  },
  {
    slug: "components",
    title: "Components",
    items: [
      { slug: "avatar", title: "Avatar", Page: page(() => import("./pages/components/avatar")) },
      { slug: "button", title: "Button", Page: page(() => import("./pages/components/button")) },
      {
        slug: "icon-button",
        title: "Icon Button",
        Page: page(() => import("./pages/components/icon-button")),
      },
      {
        slug: "property-button",
        title: "Property Button",
        Page: page(() => import("./pages/components/property-button")),
      },
      { slug: "badge", title: "Badge", Page: page(() => import("./pages/components/badge")) },
      { slug: "chip", title: "Chip", Page: page(() => import("./pages/components/chip")) },
      { slug: "kbd", title: "Kbd", Page: page(() => import("./pages/components/kbd")) },
      {
        slug: "tooltip",
        title: "Tooltip",
        Page: page(() => import("./pages/components/tooltip")),
      },
    ],
  },
  {
    slug: "forms",
    title: "Forms",
    items: [
      { slug: "field", title: "Field", Page: page(() => import("./pages/forms/field")) },
      {
        slug: "text-input",
        title: "Text Input",
        Page: page(() => import("./pages/forms/text-input")),
      },
      {
        slug: "text-area",
        title: "Text Area",
        Page: page(() => import("./pages/forms/text-area")),
      },
      { slug: "select", title: "Select", Page: page(() => import("./pages/forms/select")) },
      { slug: "combobox", title: "Combobox", Page: page(() => import("./pages/forms/combobox")) },
      {
        slug: "search-input",
        title: "Search Input",
        Page: page(() => import("./pages/forms/search-input")),
      },
      {
        slug: "password-input",
        title: "Password Input",
        Page: page(() => import("./pages/forms/password-input")),
      },
      {
        slug: "input-group",
        title: "Input Group",
        Page: page(() => import("./pages/forms/input-group")),
      },
      { slug: "checkbox", title: "Checkbox", Page: page(() => import("./pages/forms/checkbox")) },
      { slug: "radio", title: "Radio", Page: page(() => import("./pages/forms/radio")) },
      { slug: "switch", title: "Switch", Page: page(() => import("./pages/forms/switch")) },
      {
        slug: "segmented-control",
        title: "Segmented Control",
        Page: page(() => import("./pages/forms/segmented-control")),
      },
      {
        slug: "toggle-group",
        title: "Toggle Group",
        Page: page(() => import("./pages/forms/toggle-group")),
      },
      { slug: "composer", title: "Composer", Page: page(() => import("./pages/forms/composer")) },
      {
        slug: "creation-composer",
        title: "Creation Composer",
        Page: page(() => import("./pages/forms/creation-composer")),
      },
    ],
  },
  {
    slug: "navigation",
    title: "Navigation",
    items: [
      {
        slug: "new-project",
        title: "New Project",
        Page: page(() => import("./pages/navigation/new-project")),
      },
      { slug: "menu", title: "Menu", Page: page(() => import("./pages/navigation/menu")) },
      {
        slug: "submenu",
        title: "Submenu",
        Page: page(() => import("./pages/navigation/submenu")),
      },
      {
        slug: "context-menu",
        title: "Context Menu",
        Page: page(() => import("./pages/navigation/context-menu")),
      },
      {
        slug: "popover",
        title: "Popover",
        Page: page(() => import("./pages/navigation/popover")),
      },
      {
        slug: "date-picker",
        title: "Date Picker",
        Page: page(() => import("./pages/navigation/date-picker")),
      },
      {
        slug: "label-picker",
        title: "Label Picker",
        Page: page(() => import("./pages/navigation/label-picker")),
      },
      {
        slug: "icon-picker",
        title: "Icon Picker",
        Page: page(() => import("./pages/navigation/icon-picker")),
      },
      { slug: "tabs", title: "Tabs", Page: page(() => import("./pages/navigation/tabs")) },
      {
        slug: "filter-menu",
        title: "Filter Menu",
        Page: page(() => import("./pages/navigation/filter-menu")),
      },
      {
        slug: "display-options",
        title: "Display Options",
        Page: page(() => import("./pages/navigation/display-options")),
      },
      {
        slug: "filter-breakdown",
        title: "Filter Breakdown",
        Page: page(() => import("./pages/navigation/filter-breakdown")),
      },
      {
        slug: "command-menu",
        title: "Command Menu",
        Page: page(() => import("./pages/navigation/command-menu")),
      },
    ],
  },
  {
    slug: "feedback",
    title: "Feedback",
    items: [
      { slug: "dialog", title: "Dialog", Page: page(() => import("./pages/feedback/dialog")) },
      { slug: "confirm", title: "Confirm", Page: page(() => import("./pages/feedback/confirm")) },
      { slug: "toast", title: "Toast", Page: page(() => import("./pages/feedback/toast")) },
      { slug: "alert", title: "Alert", Page: page(() => import("./pages/feedback/alert")) },
      {
        slug: "progress",
        title: "Progress",
        Page: page(() => import("./pages/feedback/progress")),
      },
      { slug: "spinner", title: "Spinner", Page: page(() => import("./pages/feedback/spinner")) },
      {
        slug: "skeleton",
        title: "Skeleton",
        Page: page(() => import("./pages/feedback/skeleton")),
      },
      {
        slug: "empty-state",
        title: "Empty state",
        Page: page(() => import("./pages/feedback/empty-state")),
      },
    ],
  },
  {
    slug: "data-display",
    title: "Data Display",
    items: [
      {
        slug: "list-row",
        title: "List Row",
        Page: page(() => import("./pages/data-display/list-row")),
      },
      {
        slug: "notification-row",
        title: "Notification Row",
        Page: page(() => import("./pages/data-display/notification-row")),
      },
      {
        slug: "group-header",
        title: "Group Header",
        Page: page(() => import("./pages/data-display/group-header")),
      },
      { slug: "table", title: "Table", Page: page(() => import("./pages/data-display/table")) },
      { slug: "board", title: "Board", Page: page(() => import("./pages/data-display/board")) },
      { slug: "tree", title: "Tree", Page: page(() => import("./pages/data-display/tree")) },
      {
        slug: "avatar-group",
        title: "Avatar Group",
        Page: page(() => import("./pages/data-display/avatar-group")),
      },
      {
        slug: "counter",
        title: "Counter",
        Page: page(() => import("./pages/data-display/counter")),
      },
      {
        slug: "hover-card",
        title: "Hover Card",
        Page: page(() => import("./pages/data-display/hover-card")),
      },
      {
        slug: "activity",
        title: "Activity",
        Page: page(() => import("./pages/data-display/activity")),
      },
    ],
  },
  {
    slug: "ai",
    title: "AI",
    items: [
      {
        slug: "suggestions",
        title: "Sugestões",
        Page: page(() => import("./pages/ai/suggestions")),
      },
      { slug: "composer", title: "Composer", Page: page(() => import("./pages/ai/composer")) },
      { slug: "messages", title: "Mensagens", Page: page(() => import("./pages/ai/messages")) },
      {
        slug: "conversation",
        title: "Cabeçalho, painel e histórico",
        Page: page(() => import("./pages/ai/conversation")),
      },
      {
        slug: "personalization",
        title: "Agent personalization",
        Page: page(() => import("./pages/ai/personalization")),
      },
      {
        slug: "activity",
        title: "Sessão na Activity",
        Page: page(() => import("./pages/ai/activity")),
      },
    ],
  },
  {
    slug: "app-shell",
    title: "App Shell",
    items: [
      { slug: "sidebar", title: "Sidebar", Page: page(() => import("./pages/app-shell/sidebar")) },
      { slug: "top-bar", title: "Top bar", Page: page(() => import("./pages/app-shell/top-bar")) },
      {
        slug: "right-panel",
        title: "Painel de detalhes",
        Page: page(() => import("./pages/app-shell/right-panel")),
      },
      {
        slug: "settings",
        title: "Settings",
        Page: page(() => import("./pages/app-shell/settings")),
      },
    ],
  },
  {
    slug: "data-visualization",
    title: "Data Visualization",
    items: [
      {
        slug: "categorical-palette",
        title: "Categorical palette",
        Page: page(() => import("./pages/data-visualization/categorical-palette")),
      },
      {
        slug: "burn-up-chart",
        title: "Burn Up Chart",
        Page: page(() => import("./pages/data-visualization/burn-up-chart")),
      },
      {
        slug: "sparkline",
        title: "Sparkline",
        Page: page(() => import("./pages/data-visualization/sparkline")),
      },
      {
        slug: "stacked-bar-chart",
        title: "Stacked Bar Chart",
        Page: page(() => import("./pages/data-visualization/stacked-bar-chart")),
      },
      {
        slug: "line-chart",
        title: "Line Chart",
        Page: page(() => import("./pages/data-visualization/line-chart")),
      },
      {
        slug: "chart-tooltip",
        title: "Chart Tooltip",
        Page: page(() => import("./pages/data-visualization/chart-tooltip")),
      },
    ],
  },
  {
    slug: "patterns",
    title: "Patterns",
    items: [
      {
        slug: "settings-form",
        title: "Settings Form",
        Page: page(() => import("./pages/patterns/settings-form")),
      },
      {
        slug: "inline-editing",
        title: "Inline Editing",
        Page: page(() => import("./pages/patterns/inline-editing")),
      },
      {
        slug: "issue-detail",
        title: "Issue Detail",
        Page: page(() => import("./pages/patterns/issue-detail")),
      },
      {
        slug: "milestones",
        title: "Milestones",
        Page: page(() => import("./pages/patterns/milestones")),
      },
      {
        slug: "milestone-detail",
        title: "Milestone Detail",
        Page: page(() => import("./pages/patterns/milestone-detail")),
      },
      {
        slug: "bulk-selection",
        title: "Bulk Selection",
        Page: page(() => import("./pages/patterns/bulk-selection")),
      },
      {
        slug: "project-update",
        title: "Project Update",
        Page: page(() => import("./pages/patterns/project-update")),
      },
      {
        slug: "activity-comments",
        title: "Activity & Comments",
        Page: page(() => import("./pages/patterns/activity-comments")),
      },
    ],
  },
  {
    slug: "qa",
    title: "QA",
    items: [
      { slug: "overview", title: "Overview", Page: page(() => import("./pages/qa/overview")) },
    ],
  },
];

/** Todas as URLs de página (usado pelos testes de acessibilidade). */
export const allPaths = sections.flatMap((s) =>
  s.items.map((i) => `/design-system/${s.slug}/${i.slug}`),
);
