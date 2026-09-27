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
      { slug: "button", title: "Button", Page: page(() => import("./pages/components/button")) },
      {
        slug: "icon-button",
        title: "Icon Button",
        Page: page(() => import("./pages/components/icon-button")),
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
      { slug: "composer", title: "Composer", Page: page(() => import("./pages/forms/composer")) },
    ],
  },
  {
    slug: "navigation",
    title: "Navigation",
    items: [{ slug: "menu", title: "Menu", Page: page(() => import("./pages/navigation/menu")) }],
  },
  { slug: "feedback", title: "Feedback", plannedIn: "Fase 4 (Feedback)", items: [] },
  {
    slug: "data-display",
    title: "Data Display",
    plannedIn: "Fase 5 (Identidade e navegação)",
    items: [],
  },
  { slug: "ai", title: "AI", plannedIn: "Fase 7 (AI)", items: [] },
  { slug: "app-shell", title: "App Shell", plannedIn: "Fase 8 (App Shell)", items: [] },
  {
    slug: "data-visualization",
    title: "Data Visualization",
    plannedIn: "Fase 9 (Data Visualization)",
    items: [],
  },
  { slug: "patterns", title: "Patterns", plannedIn: "Fase 10 (Patterns)", items: [] },
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
