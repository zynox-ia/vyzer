/**
 * Top bar de página (Figma 1:5931, header): breadcrumbs + estrela de favorito + menu "…" numa
 * linha, abas de view na linha de baixo, ações à direita (filtro, display options, notificações,
 * fechar painel). Sem componente de Breadcrumb no design system: composição nova a partir dos
 * tokens de texto e do IconButton (spec, item 2).
 */
import { ChevronRight, Star } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import {
  IconButton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { cn } from "@vyzer/design-system/cn";

export type Crumb = { label: string; to?: string; icon?: ReactNode };

export function Breadcrumbs({ items, label = "Breadcrumb" }: { items: Crumb[]; label?: string }) {
  return (
    <nav aria-label={label} className="flex min-w-0 items-center">
      <ol className="flex min-w-0 items-center gap-1">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          const content = (
            <span className="flex items-center gap-1.5 truncate">
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
          );
          return (
            <Fragment key={item.label}>
              {i > 0 && (
                <Icon
                  icon={ChevronRight}
                  size="xs"
                  // text-secondary: medido ao vivo no Linear (breadcrumb do time, lch 61,8 —
                  // o "tertiary" dele, que corresponde ao nosso secondary; ver
                  // .figma/01-design-tokens.md, mapa de níveis de texto).
                  className="shrink-0 text-secondary"
                  aria-hidden
                />
              )}
              <li className="min-w-0">
                {item.to && !last ? (
                  <Link
                    to={item.to}
                    className="flex h-6 items-center truncate rounded-inline px-1 text-label-md text-secondary no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary"
                  >
                    {content}
                  </Link>
                ) : (
                  <span
                    aria-current={last ? "page" : undefined}
                    className="flex h-6 items-center truncate rounded-inline px-1 text-label-md text-primary"
                  >
                    {content}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export function TopBar({
  breadcrumbs,
  breadcrumbLabel,
  favorite,
  onFavoriteChange,
  breadcrumbActions,
  tabs,
  actions,
  className,
}: {
  breadcrumbs: Crumb[];
  /** Nome acessível do `nav` do breadcrumb (padrão "Breadcrumb"; útil quando há mais de um na página). */
  breadcrumbLabel?: string;
  favorite?: boolean;
  onFavoriteChange?: (next: boolean) => void;
  /** Menu "…" e ações da linha do breadcrumb. */
  breadcrumbActions?: ReactNode;
  /** TabsList com as abas de view (Overview/Activity/Issues…). */
  tabs?: ReactNode;
  /** Filtro, display options, notificações, fechar painel. */
  actions?: ReactNode;
  className?: string;
}) {
  // A hairline fica entre as duas linhas (Figma 1:5932, só na linha do breadcrumb), não na base
  // do cabeçalho inteiro — confirmado ao vivo no Linear (borda sob "Projects › Mv School", não
  // sob as abas). Sem segunda linha (telas sem abas), não há hairline nenhuma.
  const hasSecondRow = Boolean(tabs ?? actions);
  return (
    <header className={cn("flex flex-col", className)}>
      <div
        className={cn(
          "flex h-11 items-center gap-1 px-2",
          hasSecondRow && "border-b border-default",
        )}
      >
        <Breadcrumbs items={breadcrumbs} label={breadcrumbLabel} />
        {onFavoriteChange && (
          <IconButton
            icon={Star}
            label={favorite ? "Remove from favorites" : "Add to favorites"}
            variant="ghost"
            className={cn(favorite && "text-warning")}
            onClick={() => onFavoriteChange(!favorite)}
          />
        )}
        <div className="ml-auto flex items-center gap-1">{breadcrumbActions}</div>
      </div>
      {hasSecondRow && (
        <div className="flex h-11 items-center gap-1 px-2">
          {tabs}
          <div className="ml-auto flex items-center gap-1">{actions}</div>
        </div>
      )}
    </header>
  );
}

export type ViewTab = { value: string; label: string };

/**
 * Abas de view em pílulas (Figma 1:5988): reaproveita o Tabs do design system. O conteúdo de
 * cada view é renderizado à parte, fora da top bar (`main`), não como TabsContent; aqui só o
 * `TabsContent` vazio e sempre montado (forceMount) existe para o `aria-controls` de cada
 * TabsTrigger apontar a um elemento de verdade. Oculto só nas abas inativas (o `hidden` que o
 * Radix já põe sozinho com forceMount) — a ativa fica sem `hidden`, vazia mas presente, sem
 * conteúdo duplicado nem `display:none` fixo.
 */
export function PageTabs({
  value,
  onValueChange,
  tabs,
}: {
  value: string;
  onValueChange: (value: string) => void;
  tabs: ViewTab[];
}) {
  return (
    <Tabs value={value} onValueChange={onValueChange}>
      <TabsList variant="pills" aria-label="Views" className="border-b-0 px-0">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} forceMount />
      ))}
    </Tabs>
  );
}
