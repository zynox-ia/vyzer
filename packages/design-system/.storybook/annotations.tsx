import type { Decorator, Preview } from "@storybook/react-vite";
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events";
import { addons } from "storybook/preview-api";
import "./storybook.css";
import "./preview.css";

export type ThemeGlobal = "dark" | "light" | "system";

export function resolveTheme(theme: ThemeGlobal): "dark" | "light" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }
  return theme;
}

export type Globals = Record<string, unknown>;

/*
 * Anotações compartilhadas entre o Storybook e os testes (vitest.setup.ts).
 * A moldura do autodocs fica em preview.tsx, fora dos testes.
 */

/** Aplica tema, raio, foco e densidade no <html>, como o app faz com o data-theme. */
function applyModes(globals: Globals) {
  const root = document.documentElement;
  const theme = resolveTheme((globals.theme as ThemeGlobal | undefined) ?? "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  root.dataset.radius = String(globals.radius ?? "0");
  root.dataset.focus = String(globals.focus ?? "b");
  root.dataset.density = String(globals.density ?? "comfortable");
}

// Páginas só de docs (MDX sem story) não passam pelo decorator: acompanham o toolbar pelo canal.
export const channel = addons.getChannel();
let lastGlobals: Globals = {};
const remember = ({ globals }: { globals: Globals }) => {
  lastGlobals = globals;
  applyModes(globals);
};
channel.on(SET_GLOBALS, remember);
channel.on(GLOBALS_UPDATED, remember);
// "Sistema" acompanha a troca de tema do sistema operacional.
window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => {
  if (lastGlobals.theme === "system") applyModes(lastGlobals);
});

const withVyzerModes: Decorator = (Story, context) => {
  lastGlobals = context.globals;
  applyModes(context.globals);
  return <Story />;
};

const annotations: Preview = {
  decorators: [withVyzerModes],
  initialGlobals: {
    theme: "dark",
    radius: "0",
    focus: "b",
    density: "comfortable",
  },
  globalTypes: {
    theme: {
      description: "Tema",
      toolbar: {
        title: "Tema",
        icon: "contrast",
        dynamicTitle: true,
        items: [
          { value: "dark", title: "Tema: escuro", icon: "moon" },
          { value: "light", title: "Tema: claro", icon: "sun" },
          { value: "system", title: "Tema: sistema", icon: "browser" },
        ],
      },
    },
    radius: {
      description: "Escala de raio",
      toolbar: {
        title: "Raio",
        icon: "circlehollow",
        dynamicTitle: true,
        items: [
          { value: "0", title: "Raio: reto (0)" },
          { value: "soft", title: "Raio: suave" },
          { value: "rounded", title: "Raio: arredondado" },
        ],
      },
    },
    focus: {
      description: "Variante do indicador de foco",
      toolbar: {
        title: "Foco",
        icon: "eye",
        dynamicTitle: true,
        items: [
          { value: "b", title: "Foco: B (padrão)" },
          { value: "a", title: "Foco: A (comparação)" },
        ],
      },
    },
    density: {
      description: "Densidade",
      toolbar: {
        title: "Densidade",
        icon: "component",
        dynamicTitle: true,
        items: [
          { value: "comfortable", title: "Densidade: confortável" },
          { value: "compact", title: "Densidade: compacta" },
        ],
      },
    },
  },
  parameters: {
    layout: "padded",
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "error" },
    backgrounds: {
      options: {
        app: { name: "App", value: "var(--bg-app)" },
        panel: { name: "Painel", value: "var(--bg-panel)" },
        surface: { name: "Superfície", value: "var(--bg-surface)" },
      },
    },
    viewport: {
      options: {
        mobile: { name: "Mobile (375)", styles: { width: "375px", height: "812px" } },
        tablet: { name: "Tablet (768)", styles: { width: "768px", height: "1024px" } },
        desktop: { name: "Desktop (1280)", styles: { width: "1280px", height: "800px" } },
        wide: { name: "Wide (1600)", styles: { width: "1600px", height: "900px" } },
      },
    },
    options: {
      storySort: {
        order: [
          "Foundations",
          [
            "Introduction",
            "Colors",
            "Typography",
            "Spacing",
            "Radius",
            "Shadows",
            "Motion",
            "Icons",
          ],
          "Components",
          "Forms",
          "Navigation",
          "Data Display",
          "Feedback",
          "AI",
          "App Shell",
          "Data Visualization",
          "Patterns",
          "QA",
        ],
      },
    },
  },
};

export default annotations;
