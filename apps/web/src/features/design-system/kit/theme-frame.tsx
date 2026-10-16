import { cn } from "@zynox/design-system/cn";
import type { ReactNode } from "react";

export type ThemeName = "dark" | "light";

export const THEMES: ThemeName[] = ["dark", "light"];

export const themeLabel: Record<ThemeName, string> = { dark: "Escuro", light: "Claro" };

/**
 * Moldura com um tema fixo, independente da toolbar: mostra claro e escuro lado a lado.
 * O conteúdo herda os tokens do `data-theme` do contêiner.
 */
export function ThemeFrame({
  theme,
  label,
  children,
  className,
  selection,
}: {
  theme: ThemeName;
  label?: string;
  children: ReactNode;
  className?: string;
  selection?: "beige" | "neutral";
}) {
  const title = label ?? themeLabel[theme];
  return (
    <figure
      data-theme={theme}
      data-selection={selection}
      className={cn(
        "flex min-w-0 flex-col gap-4 rounded-container border border-subtle bg-app p-5 text-primary",
        className,
      )}
    >
      <figcaption className="type-overline text-secondary">{title}</figcaption>
      {children}
    </figure>
  );
}

/** Escuro e claro lado a lado; empilha em telas estreitas. */
export function ThemePair({ children }: { children: (theme: ThemeName) => ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
      {THEMES.map((t) => (
        <ThemeFrame key={t} theme={t}>
          {children(t)}
        </ThemeFrame>
      ))}
    </div>
  );
}
