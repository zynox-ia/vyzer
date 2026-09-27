import type { ReactNode } from "react";
import { cn } from "../lib/cn";

export type ThemeName = "dark" | "light";

/**
 * Moldura com um tema fixo, independente do toolbar: usada para mostrar claro e escuro
 * lado a lado (QA, Colors). O conteúdo herda os tokens do `data-theme` do contêiner.
 */
export function ThemeFrame({
  theme,
  children,
  className,
}: {
  theme: ThemeName;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      data-theme={theme}
      aria-label={theme === "dark" ? "Tema escuro" : "Tema claro"}
      className={cn(
        "flex flex-col gap-4 rounded-container border border-default bg-app p-5 text-primary",
        className,
      )}
    >
      <p className="text-overline text-secondary uppercase">
        {theme === "dark" ? "Escuro" : "Claro"}
      </p>
      {children}
    </section>
  );
}

/** Claro e escuro lado a lado; empilha no mobile. */
export function ThemePair({ children }: { children: (theme: ThemeName) => ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
      <ThemeFrame theme="dark">{children("dark")}</ThemeFrame>
      <ThemeFrame theme="light">{children("light")}</ThemeFrame>
    </div>
  );
}
