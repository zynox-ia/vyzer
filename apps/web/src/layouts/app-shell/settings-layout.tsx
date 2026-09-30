/**
 * Layout de Settings (Figma 33:20122, nav + 33:20615, slot de conteúdo): link "Back to app" e
 * busca no topo da coluna de navegação, nav lateral por seções, slot de conteúdo à direita no
 * mesmo template de página do resto do app. Fora do escopo: conteúdo de cada página além de
 * Preferences, e a regra de visibilidade por Role (Admin/Your teams) — o container modela as
 * duas, sem decidir quem as vê.
 */
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink } from "react-router";
import { SearchInput } from "@vyzer/design-system/components";
import { Icon, type IconProps } from "@vyzer/design-system/icons";
import { cn } from "@vyzer/design-system/cn";

export type SettingsLink = {
  to: string;
  label: string;
  /** Ícone lucide; ignorado quando `leading` existe (ex.: o ícone colorido de um Team). */
  icon?: IconProps["icon"];
  leading?: ReactNode;
};
export type SettingsGroup = { title: string; links: SettingsLink[] };

const navItem =
  "flex h-nav-item items-center gap-1.5 rounded-control px-2.5 text-label-md text-secondary no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary aria-[current=page]:bg-selected aria-[current=page]:text-primary";

export function SettingsNavGroups({ groups }: { groups: SettingsGroup[] }) {
  return (
    <>
      {groups.map((group) => (
        <div key={group.title} className="flex flex-col pt-4 first:pt-0">
          <p className="px-2.5 pb-1.5 text-label-md text-secondary">{group.title}</p>
          <ul className="flex flex-col gap-px">
            {group.links.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={navItem}>
                  {link.leading ?? (link.icon && <Icon icon={link.icon} size="sm" />)}
                  <span className="min-w-0 flex-1 truncate">{link.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}

export function SettingsLayout({
  backTo,
  groups,
  label = "Settings",
  /**
   * O slot de conteúdo é o `main` da tela (review de código, item 5) — exceto na documentação
   * (`/design-system/app-shell/settings`), onde a própria página de docs já é o `main` (mais de
   * uma moldura de exemplo por página não pode ter mais de um `main` nem `main` aninhado).
   */
  landmark = true,
  contentWidth = "narrow",
  children,
}: {
  backTo: string;
  groups: SettingsGroup[];
  /** Nome acessível do `nav` (padrão "Settings"; útil quando há mais de um na página). */
  label?: string;
  landmark?: boolean;
  /** Wider slot for Settings tables; narrow pages keep the 640 px form column. */
  contentWidth?: "narrow" | "medium" | "wide";
  children: ReactNode;
}) {
  const Content = landmark ? "main" : "div";
  return (
    <div className="flex h-dvh bg-app text-primary">
      <nav aria-label={label} className="flex w-61 shrink-0 flex-col border-r border-default">
        <div className="flex h-13 shrink-0 items-center px-4">
          <NavLink
            to={backTo}
            className="flex h-control-md items-center gap-1.5 rounded-full pr-3 pl-2 text-label-md text-secondary no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary"
          >
            <Icon icon={ArrowLeft} size="sm" />
            Back to app
          </NavLink>
        </div>
        <div className="px-4 pb-2">
          <SearchInput aria-label="Search settings" placeholder="Search…" className="w-full" />
        </div>
        <div className={cn("min-h-0 flex-1 overflow-y-auto px-4 pt-2 pb-4")}>
          <SettingsNavGroups groups={groups} />
        </div>
      </nav>
      <Content className="min-w-0 flex-1 overflow-y-auto p-2">
        {/* Cartão único cobrindo toda a área de conteúdo, como o Linear ao vivo (o Figma 33:20615
            não mostra esse cartão externo — divergência registrada em .figma/01-design-tokens.md,
            decisão do responsável de seguir o Linear aqui). */}
        <div className="relative min-h-full rounded-container border border-default bg-sidebar">
          <div
            className={cn(
              "mx-auto flex flex-col px-10 py-8",
              contentWidth === "wide"
                ? "max-w-content"
                : contentWidth === "medium"
                  ? "max-w-180"
                  : "max-w-160",
            )}
          >
            {children}
          </div>
        </div>
      </Content>
    </div>
  );
}
