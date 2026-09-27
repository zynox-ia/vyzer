/**
 * Junta classes e resolve conflitos do Tailwind conhecendo os tokens do Vyzer.
 * Sem esta configuração, o tailwind-merge confundiria `text-body-sm` (tamanho) com
 * `text-primary` (cor) e descartaria um dos dois.
 */
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Nomes de cor usados em bg-*, text-*, border-*, outline-*, fill-* e stroke-*. */
const colors = [
  "app",
  "sidebar",
  "panel",
  "surface",
  "subtle",
  "popover",
  "control",
  "input",
  "control-strong",
  "hover",
  "pressed",
  "selected",
  "inverse",
  "inverse-hover",
  "inverse-pressed",
  "scrim",
  "checked",
  "on-checked",
  "accent",
  "primary",
  "secondary",
  "tertiary",
  "default",
  "strong",
  "control",
  "placeholder",
  ...["success", "info", "warning", "danger", "accent", "neutral"].map((s) => `${s}-subtle`),
  ...["success", "info", "warning", "danger"].flatMap((s) => [s, `${s}-strong`]),
  ...["green", "blue", "amber", "red", "purple", "pink", "cyan", "orange", "lime", "indigo"],
  ...Array.from({ length: 10 }, (_, i) => `chart-${i + 1}`),
];

const textSizes = [
  "metric",
  "display",
  "title",
  "heading-1",
  "heading-2",
  "heading-3",
  "body-lg",
  "body-md",
  "body-sm",
  "label-md",
  "label-sm",
  "caption",
  "overline",
  "code",
  "kbd",
];

const spacing = [
  ...["xs", "sm", "md", "lg", "xl"].flatMap((s) => [`control-${s}`, `icon-${s}`]),
  "row",
  "menu-item",
  "nav-item",
  "field",
  "command-item",
  "cell-x",
  "gutter",
];

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: colors,
      text: textSizes,
      font: ["sans", "mono"],
      "font-weight": ["light", "normal", "medium"],
      tracking: ["id", "caps"],
      spacing,
      radius: [
        "none",
        "xs",
        "sm",
        "md",
        "lg",
        "xl",
        "full",
        "inline",
        "control",
        "container",
        "surface",
      ],
      shadow: ["sm", "md", "lg", "focus"],
      blur: ["sm", "md", "lg"],
      breakpoint: ["tablet", "desktop", "wide"],
      container: ["prose", "content", "wide"],
      ease: ["standard", "enter", "exit"],
      animate: [
        "fade-in",
        "fade-out",
        "scale-in",
        "scale-out",
        "slide-up",
        "slide-down",
        "dialog-in",
        "dialog-out",
        "spin",
        "pulse",
      ],
    },
    classGroups: {
      z: [{ z: ["base", "dropdown", "sticky", "overlay", "modal", "toast", "tooltip"] }],
      opacity: [{ opacity: ["disabled", "muted", "subtle", "inactive", "soft"] }],
      // "focus" só existe como cor de borda e de outline (não é cor de texto, fundo ou sombra).
      "border-color": [{ border: ["focus"] }],
      "outline-color": [{ outline: ["focus"] }],
      duration: [{ duration: ["fast", "normal", "slow"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
