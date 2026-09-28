/**
 * Filter Menu (Figma 18:353, "Add Filter…" da vista Zynox › Active issues). Exemplos abertos são
 * estáticos (mesmas classes do menu, sem Radix): menu do Radix aberto na página rouba o foco.
 */
import {
  Button,
  ComboboxPanel,
  FilterMenu,
  FilterSearch,
  PopoverSurface,
  dropdownMenuStyles,
  type FilterCategory,
  type FilterValue,
  type ListOption,
} from "@vyzer/design-system/components";
import { cn } from "@vyzer/design-system/cn";
import { Icon } from "@vyzer/design-system/icons";
import { ChevronRight, ListFilter } from "lucide-react";
import { Fragment, useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { DocSubsection } from "../../kit/doc";
import {
  FILTER_SECTIONS,
  PROJECT_STATUS_OPTIONS,
  describeFilters,
  findCategory,
} from "../../kit/filter-data";

function LiveFilterMenu() {
  const [value, setValue] = useState<FilterValue>({ status: ["in-progress"] });
  const [action, setAction] = useState<string>();
  const active = describeFilters(value);
  const actionLabel = action ? findCategory(action)?.label : undefined;
  return (
    <div className="flex flex-col items-center gap-3">
      <FilterMenu
        sections={FILTER_SECTIONS}
        value={value}
        onValueChange={setValue}
        onAction={setAction}
        shortcut={["F"]}
      >
        <Button icon={ListFilter}>Filter</Button>
      </FilterMenu>
      <p aria-live="polite" className="text-body-sm text-secondary">
        {active.length > 0 ? active.join(" · ") : "No filters"}
        {actionLabel && ` · Last action: ${actionLabel}`}
      </p>
    </div>
  );
}

/** O menu aberto como no Figma, fixo na página. A busca filtra as categorias. */
function StaticFilterMenu({ highlighted }: { highlighted?: string }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const sections = FILTER_SECTIONS.map((s) =>
    s.filter((c) => c.label.toLowerCase().includes(q)),
  ).filter((s) => s.length > 0);
  const s = dropdownMenuStyles;
  return (
    <figure
      aria-label="Add Filter aberto (Figma 18:353)"
      className={cn(s.content, "relative flex w-59 flex-col p-0")}
    >
      <FilterSearch
        value={query}
        onValueChange={setQuery}
        placeholder="Add Filter…"
        shortcut={["F"]}
      />
      {sections.length === 0 ? (
        <p className="px-3.5 py-2.5 text-body-sm text-secondary">No results</p>
      ) : (
        <div className="p-1.5">
          {sections.map((section, i) => (
            <Fragment key={section[0]?.value}>
              {i > 0 && <div className={cn(s.separator, "border-default")} />}
              {section.map((c) => (
                <div key={c.value} className={cn(s.item, c.value === highlighted && "bg-selected")}>
                  <span className={s.iconSlot}>
                    <Icon icon={c.icon} />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{c.label}</span>
                  {(c.options || c.children) && (
                    <Icon icon={ChevronRight} size="xs" className="text-secondary" />
                  )}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      )}
    </figure>
  );
}

/** Submenu com busca e multisseleção, aberto e fixo (mesmo painel do submenu real). */
function StaticSearchSubmenu({
  category,
  initial = [],
}: {
  category: FilterCategory;
  initial?: string[];
}) {
  const [value, setValue] = useState(initial);
  return (
    <PopoverSurface className="w-max max-w-125 min-w-52">
      <ComboboxPanel
        multiple
        label={category.label}
        searchPlaceholder={category.searchPlaceholder ?? "Filter…"}
        options={category.options ?? []}
        value={value}
        onValueChange={setValue}
      />
    </PopoverSurface>
  );
}

/** Submenu simples (subcategorias, sem busca), aberto e fixo, com a primeira linha destacada. */
function StaticPlainSubmenu({ category }: { category: FilterCategory }) {
  const s = dropdownMenuStyles;
  return (
    <figure aria-label={`Submenu ${category.label}`} className={cn(s.content, "relative w-max")}>
      {category.children?.map((c, i) => (
        <div key={c.value} className={cn(s.item, i === 0 && "bg-selected")}>
          <span className={s.iconSlot}>
            <Icon icon={c.icon} />
          </span>
          <span className="min-w-0 flex-1 truncate">{c.label}</span>
          {(c.options || c.children) && (
            <Icon icon={ChevronRight} size="xs" className="text-secondary" />
          )}
        </div>
      ))}
    </figure>
  );
}

/** Menu e submenu de Status abertos lado a lado, estáticos. */
function StaticWithSubmenu() {
  const status = findCategory("status");
  return (
    <div className="flex flex-wrap items-start gap-1">
      <StaticFilterMenu highlighted="status" />
      {status && <StaticSearchSubmenu category={status} initial={["in-progress"]} />}
    </div>
  );
}

/** Os submenus do Figma 22:2039, na mesma ordem. */
const SUBMENUS = [
  "project-status",
  "project-properties",
  "dates",
  "relations",
  "creator",
  "agent-session",
  "agent",
  "status-type",
];

function SubmenuGallery() {
  return (
    <div className="flex flex-wrap items-start gap-6">
      {SUBMENUS.map((value) => {
        const category = findCategory(value);
        if (!category) return null;
        return (
          <figure key={value} className="flex flex-col gap-2">
            <figcaption className="text-caption text-secondary">{category.label}</figcaption>
            {category.children ? (
              <StaticPlainSubmenu category={category} />
            ) : (
              <StaticSearchSubmenu category={category} />
            )}
          </figure>
        );
      })}
    </div>
  );
}

/** Status de projeto e de issue lado a lado: ícones diferentes para coisas diferentes. */
function StatusComparison() {
  const issue = findCategory("status")?.options ?? [];
  const rows = (options: ListOption[]) =>
    options.map((o) => (
      <li key={o.value} className="flex h-8 items-center gap-2 text-body-md text-primary">
        <span className="flex size-4 items-center justify-center">{o.icon}</span>
        {o.label}
      </li>
    ));
  return (
    <div className="grid max-w-prose grid-cols-1 gap-6 tablet:grid-cols-2">
      <div className="flex flex-col gap-2">
        <h4 className="text-label-md text-primary">Status de projeto</h4>
        <p className="text-body-sm text-secondary">
          ProjectStatusIcon: hexágono na cor do status, com preenchimento interno pelo andamento
          (Figma 22:1239).
        </p>
        <ul>{rows(PROJECT_STATUS_OPTIONS)}</ul>
      </div>
      <div className="flex flex-col gap-2">
        <h4 className="text-label-md text-primary">Status de issue</h4>
        <p className="text-body-sm text-secondary">
          StatusIcon: anel ou círculo de 14 px com setor ou marca (Figma 6:1543).
        </p>
        <ul>{rows(issue)}</ul>
      </div>
    </div>
  );
}

function Showcase() {
  return (
    <div className="flex flex-col gap-10">
      <StaticWithSubmenu />
      <DocSubsection title="Submenus (Figma 22:2039)">
        <SubmenuGallery />
      </DocSubsection>
      <DocSubsection title="Status de projeto × status de issue">
        <StatusComparison />
      </DocSubsection>
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Filter Menu",
        description:
          'Menu "Add Filter…" de uma vista (Figma 18:353): busca no topo, categorias de filtro em grupos e, em cada categoria com valores, um submenu com busca e multisseleção.',
        whenToUse: [
          "Adicionar filtros a uma lista ou vista (issues, projetos)",
          "Muitas categorias de filtro, com valores próprios em cada uma",
        ],
        whenNotToUse: [
          "Escolher um único valor de uma propriedade: use Combobox",
          "Opções de exibição (agrupamento, ordenação): use Display Options",
        ],
        playground: {
          preview: <LiveFilterMenu />,
          controls: (
            <p className="text-body-sm text-secondary">
              Abra e digite para filtrar as categorias; ↓ leva à lista, → ou Enter abrem o submenu,
              Enter marca um valor. Letras digitadas na lista voltam para a busca.
            </p>
          ),
        },
        showcase: <Showcase />,
        states: null,
        statesNote:
          'Linha destacada (hover, teclado ou submenu aberto): bg-selected. Categoria com valores ou subcategorias mostra o chevron e abre o submenu; sem nenhum dos dois, é uma ação. Valor marcado: checkbox cheio. Busca sem resultado: "No results". Os exemplos abertos são estáticos; o comportamento real está no playground.',
        themes: () => <StaticFilterMenu highlighted="status" />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Família dropdown do Menu: 236 px, raio 12, borda forte e sombra md. Busca de 36 px com
            14 px à esquerda, 12 px à direita e o Kbd do atalho; hairline border-default embaixo.
            Lista com 6 px de folga, linhas de 32 px com ícone de 16 e 8 px até o rótulo de 13 px;
            chevron de 12 px nas categorias com submenu; separadores de largura total entre os
            grupos. Dois tipos de submenu (Figma 22:2039), na largura do conteúdo com no mínimo 208
            px: com valores, o painel do Combobox em multisseleção (busca &quot;Filter…&quot; sem
            atalho, checkbox de 14, ícone de 16, etiqueta como &quot;Agent&quot; colada ao nome e
            contagem como &quot;14 issues&quot; à direita); com subcategorias, um menu simples sem
            busca (Project properties, Dates, Relations), que abre mais um nível.
          </p>
        ),
        keyboard: [
          "Ao abrir, o foco vai para a busca; digitar filtra as categorias.",
          "↓ na busca vai à primeira linha; ↑ na primeira linha volta à busca.",
          "Enter na busca escolhe a primeira categoria visível (abre o submenu ou executa a ação).",
          "→ ou Enter numa categoria abrem o submenu com o foco na busca dele; ← ou Esc voltam.",
          "Letras digitadas com o foco na lista vão para a busca. Esc fecha o menu.",
        ],
        accessibility: [
          'Com a busca, o conteúdo é role="dialog" com nome; as categorias ficam num role="menu" (Radix DropdownMenu: foco, setas e submenus).',
          'A busca tem nome ("Add Filter") e aria-controls apontando para a lista.',
          'Submenus com busca viram role="dialog" (MenuSubContent panelLabel); valores com aria-selected no cmdk.',
          "O atalho F é só mostrado; quem registra a tecla é a tela.",
        ],
        content: [
          'Categorias com substantivos curtos ("Status", "Assignee"); ações sem reticências.',
          'Placeholder da busca no formato do Linear ("Add Filter…").',
        ],
        dos: ["Agrupe categorias parecidas entre separadores", "Mantenha a ordem estável"],
        donts: [
          "Não passe de dois níveis de submenu (categoria → subcategoria → valores)",
          "Não esconda filtros frequentes sem busca",
          "Não use o ícone de status de issue para status de projeto",
        ],
        usage: `import { FilterMenu, type FilterValue } from "@vyzer/design-system/components";

const [filters, setFilters] = useState<FilterValue>({});

<FilterMenu
  sections={[
    [{ value: "ai-filter", label: "AI filter", icon: Sparkles }],
    [{ value: "status", label: "Status", icon: CircleDashed, options: statuses }],
  ]}
  value={filters}
  onValueChange={setFilters}
  onAction={(category) => …}
  shortcut={["F"]}
>
  <Button icon={ListFilter}>Filter</Button>
</FilterMenu>`,
        props: [
          {
            name: "sections",
            type: "FilterCategory[][]",
            description:
              "Grupos de categorias { value, label, icon, options?, children?, searchPlaceholder? }; separador entre grupos.",
          },
          {
            name: "FilterCategory.options",
            type: "ListOption[]",
            description:
              "Valores do submenu com busca; cada um com icon, tag (etiqueta) e hint (contagem).",
          },
          {
            name: "FilterCategory.children",
            type: "FilterCategory[]",
            description: "Subcategorias: submenu simples, sem busca, que pode abrir outro nível.",
          },
          {
            name: "value / onValueChange",
            type: "Record<string, string[]>",
            description: "Valores escolhidos por categoria.",
          },
          {
            name: "onAction",
            type: "(category: string) => void",
            description: "Categoria sem valores escolhida (AI filter, Auto-closed).",
          },
          {
            name: "searchPlaceholder",
            type: "string",
            default: '"Add Filter…"',
            description: "Placeholder e nome da busca.",
          },
          { name: "shortcut", type: "string[]", description: 'Atalho mostrado na busca (["F"]).' },
          {
            name: "open / onOpenChange",
            type: "boolean",
            description: "Controle opcional da abertura.",
          },
          {
            name: "portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema.",
          },
        ],
        decisions: [
          {
            decision: "236 px, raio 12, borda border-strong, sombra md (família dropdown)",
            rule: "Figma 18:353 (w 236, r12, #323336); sombra de 3 camadas → 2 (skill §9)",
          },
          {
            decision: "Busca de 36 px, pl 14, pr 12, Kbd do atalho à direita",
            rule: "Figma 18:354–18:360; o mesmo cabeçalho do Combobox",
          },
          {
            decision: "Hairline da busca e separadores em border-default",
            rule: "Figma 18:354, 18:386 (#292a2d); border-subtle some sobre bg-popover no escuro",
          },
          {
            decision: "Linhas de 32 px, ícone de 16, gap 8, rótulo de 13 px",
            rule: "Figma 18:373 (topo 14 = 6 de folga + 8 do centro da linha de 32)",
          },
          {
            decision: "Chevron de 12 px em text-secondary no lugar do ▶ de 6 px em cinza terciário",
            rule: "Mesmo indicador do Submenu (Figma 1:1255); terciário não chega a 4,5:1 no claro",
          },
          {
            decision: "Ícones do Figma trocados pelos equivalentes do lucide, traço 2 px",
            rule: "ADR-0013 (biblioteca única de ícones)",
          },
          {
            decision: "Submenu com busca e multisseleção (ComboboxPanel)",
            rule: "Reuso do padrão Submenu (MenuSubContent panelLabel + MenuPanel)",
          },
          {
            decision: "Busca no topo filtra categorias; letras na lista voltam para a busca",
            rule: "§7 Hick (lista longa pede busca) e Jakob (comportamento do Linear)",
          },
          {
            decision: "Abre sempre para baixo, com rolagem interna",
            rule: "Pedido do responsável (mesma regra do Menu)",
          },
          {
            decision:
              "Submenus na largura do conteúdo, com no mínimo 208 px (Figma: 204 por dentro)",
            rule: "Figma 22:2039 (min-w 204, larguras de 185 a 217); grid de 4 (skill §1)",
          },
          {
            decision: 'Busca dos submenus "Filter…", sem atalho, com hairline border-default',
            rule: "Figma 22:1219 (36 px, pl 14, pr 12, #292a2d)",
          },
          {
            decision: "Submenu simples para subcategorias (Project properties, Dates, Relations)",
            rule: "Figma 22:1322, 22:1439, 22:1580 (sem busca, linhas de 32 com chevron)",
          },
          {
            decision:
              'Etiqueta "Agent" colada ao nome; contagem "14 issues" à direita em text-secondary',
            rule: "Figma 22:1752 (h 16, r6, px 6, 12/500) e 22:1249 (12 px); terciário não chega a 4,5:1 no claro",
          },
          {
            decision: "Status de projeto com ProjectStatusIcon, diferente do StatusIcon de issue",
            rule: "Figma 22:1239 (hexágono na cor do status) × 22:1954 (círculos de 14 px); pedido do responsável: mostrar o hexágono",
          },
          {
            decision: "Tipos de status (issue e projeto) em cinza neutro",
            rule: "Figma 22:1933 (todos em #9c9d9f → tone neutral)",
          },
          {
            decision:
              "Pessoas e agentes com Avatar de 16 px (ícone de pessoa enquanto não há foto)",
            rule: "Figma 22:1729, 22:1745 (avatar redondo de 16); fotos e logos ficam para quando houver URL",
          },
        ],
      }}
    />
  );
}
