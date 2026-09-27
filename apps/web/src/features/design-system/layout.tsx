/**
 * Moldura da área /design-system: toolbar fixa (tema e variante de foco), barra de seções
 * e sidebar com os itens da seção ativa. A variante de foco fica na URL (?focus=a).
 */
import {
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from "@vyzer/design-system/theme";
import { useEffect } from "react";
import { NavLink, Outlet, useLocation, useSearchParams } from "react-router";
import { Segmented } from "./kit/controls";
import { sections } from "./registry";

type FocusVariant = "a" | "b";

function useFocusVariant(): [FocusVariant, (v: FocusVariant) => void] {
  const [params, setParams] = useSearchParams();
  const value: FocusVariant = params.get("focus") === "a" ? "a" : "b";
  const set = (v: FocusVariant) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (v === "b") next.delete("focus");
        else next.set("focus", v);
        return next;
      },
      { replace: true },
    );
  // B é o padrão do produto; A existe só para comparação nesta área.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.focus = value;
    return () => {
      delete root.dataset.focus;
    };
  }, [value]);
  return [value, set];
}

const navItem =
  "inline-flex h-nav-item items-center rounded-control px-2 text-label-md whitespace-nowrap text-secondary no-underline transition-colors hover:bg-hover hover:text-primary aria-[current=page]:bg-selected aria-[current=page]:text-primary";

export function DesignSystemLayout() {
  const { pathname, search } = useLocation();
  const theme = useThemePreference();
  const [focus, setFocus] = useFocusVariant();
  const activeSlug = pathname.split("/")[2] ?? "foundations";
  const active = sections.find((s) => s.slug === activeSlug);

  return (
    <div className="flex min-h-dvh flex-col bg-app text-primary">
      <header className="sticky top-0 z-sticky flex flex-col border-b border-default bg-sidebar">
        <div className="flex flex-wrap items-center gap-4 px-4 py-2">
          <p className="text-label-md text-primary">Vyzer Design System</p>
          <div className="ml-auto flex flex-wrap items-center gap-4">
            <Segmented<ThemePreference>
              label="Tema"
              value={theme}
              onChange={setThemePreference}
              options={[
                { value: "dark", label: "Escuro" },
                { value: "light", label: "Claro" },
                { value: "system", label: "Sistema" },
              ]}
            />
            <Segmented<FocusVariant>
              label="Variante de foco"
              value={focus}
              onChange={setFocus}
              options={[
                { value: "b", label: "Foco B" },
                { value: "a", label: "Foco A" },
              ]}
            />
          </div>
        </div>
        <nav aria-label="Seções" className="flex gap-1 overflow-x-auto px-4 pb-2">
          {sections.map((s) => (
            <NavLink
              key={s.slug}
              to={{ pathname: `/design-system/${s.slug}`, search }}
              aria-current={s.slug === activeSlug ? "page" : undefined}
              className={navItem}
            >
              {s.title}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="flex flex-1 flex-col tablet:flex-row">
        {active && active.items.length > 0 && (
          <nav
            aria-label={active.title}
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-default bg-sidebar p-2 tablet:w-56 tablet:flex-col tablet:border-r tablet:border-b-0 tablet:p-3"
          >
            {active.items.map((i) => (
              <NavLink
                key={i.slug}
                to={{ pathname: `/design-system/${active.slug}/${i.slug}`, search }}
                className={navItem}
              >
                {i.title}
              </NavLink>
            ))}
          </nav>
        )}
        <main className="min-w-0 flex-1 px-4 py-8 tablet:px-8">
          <div className="mx-auto max-w-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
