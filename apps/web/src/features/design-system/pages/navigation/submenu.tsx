import {
  ComboboxPanel,
  Menu,
  MenuContent,
  MenuPanel,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  PopoverSurface,
  PropertyButton,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { ArrowLeftFromLine, ArrowRightFromLine, ChevronRight, Link2 } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { PROJECT_OPTIONS } from "../../kit/project-data";
import { StaticMenu, type StaticMenuRow } from "../../kit/static-menu";

const ROWS: StaticMenuRow[] = [
  { kind: "item", icon: ArrowLeftFromLine, label: "Blocked by…", submenu: true },
  { kind: "item", icon: ArrowRightFromLine, label: "Blocking…", submenu: true },
];

const chevron = (row: StaticMenuRow) =>
  row.kind === "item" && row.submenu ? (
    <Icon icon={ChevronRight} size="xs" className="text-secondary" />
  ) : null;

function ProjectSearch({ label }: { label: string }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ComboboxPanel
      multiple
      label={label}
      searchPlaceholder="Search projects…"
      value={value}
      onValueChange={setValue}
      options={PROJECT_OPTIONS}
    />
  );
}

function DependencyMenu() {
  return (
    <Menu>
      <MenuTrigger asChild>
        <PropertyButton leading={<Link2 />} empty>
          Dependencies
        </PropertyButton>
      </MenuTrigger>
      <MenuContent variant="dropdown">
        <MenuSub>
          <MenuSubTrigger icon={ArrowLeftFromLine}>Blocked by…</MenuSubTrigger>
          <MenuSubContent panelLabel="Blocked by" className="w-64">
            <MenuPanel>
              <ProjectSearch label="Blocked by" />
            </MenuPanel>
          </MenuSubContent>
        </MenuSub>
        <MenuSub>
          <MenuSubTrigger icon={ArrowRightFromLine}>Blocking…</MenuSubTrigger>
          <MenuSubContent panelLabel="Blocking" className="w-64">
            <MenuPanel>
              <ProjectSearch label="Blocking" />
            </MenuPanel>
          </MenuSubContent>
        </MenuSub>
      </MenuContent>
    </Menu>
  );
}

/** Menu e submenu abertos lado a lado, estáticos (como no Figma). */
function StaticDependency() {
  return (
    <div className="flex items-start gap-1">
      <StaticMenu
        variant="dropdown"
        label="Add dependency, com Blocked by destacado"
        rows={ROWS}
        highlighted={0}
        trailing={chevron}
      />
      <PopoverSurface className="w-64">
        <ProjectSearch label="Blocked by" />
      </PopoverSurface>
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Submenu",
        description:
          'Menu com itens que abrem um segundo nível (Figma 1:1255, "Add dependency"): "Blocked by…" e "Blocking…" levam a uma busca de projetos com multisseleção.',
        whenToUse: [
          "Uma ação que precisa de um alvo: relacionar, mover para, atribuir a",
          "Agrupar ações parecidas sem alongar o menu principal",
        ],
        whenNotToUse: [
          "Mais de um nível de submenu: quebre em outra etapa",
          "Escolher um valor direto: use Combobox",
        ],
        playground: {
          preview: <DependencyMenu />,
          controls: (
            <p className="text-body-sm text-secondary">
              Abra, passe o mouse ou aperte → em &quot;Blocked by…&quot;; digite para filtrar e
              marque com Enter. ← ou Esc voltam ao menu.
            </p>
          ),
        },
        showcase: <StaticDependency />,
        states: null,
        statesNote:
          "Item com submenu aberto: fica em bg-selected enquanto o submenu estiver aberto. Chevron à direita indica o segundo nível. Os exemplos abertos são estáticos; o comportamento real está no playground.",
        themes: () => <StaticDependency />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Família dropdown do Menu: raio 12, 6 px de folga, linhas de 32 px com destaque de raio
            8, ícone de 16 e chevron de 12 à direita. O submenu abre ao lado, com 4 px de distância,
            e hospeda o painel de busca do Combobox (MenuPanel).
          </p>
        ),
        keyboard: [
          "→ ou Enter no item abrem o submenu com o foco na busca.",
          "Dentro da busca: digitar filtra, ↑ ↓ navegam, Enter marca.",
          "← (com a busca vazia) ou Esc voltam ao menu principal.",
        ],
        accessibility: [
          'Radix DropdownMenu: o item tem aria-haspopup="menu" e aria-expanded.',
          "MenuPanel isola as teclas da busca do typeahead do menu.",
        ],
        content: ['Itens que pedem um alvo terminam em reticências ("Blocked by…").'],
        dos: ["Use um nível só"],
        donts: ["Não esconda ações frequentes num submenu"],
        usage: `import { Menu, MenuContent, MenuPanel, MenuSub, MenuSubContent, MenuSubTrigger, ComboboxPanel } from "@vyzer/design-system/components";

<MenuContent variant="dropdown">
  <MenuSub>
    <MenuSubTrigger icon={ArrowLeftFromLine}>Blocked by…</MenuSubTrigger>
    <MenuSubContent panelLabel="Blocked by">
      <MenuPanel>
        <ComboboxPanel multiple label="Blocked by" options={projects} value={v} onValueChange={setV} />
      </MenuPanel>
    </MenuSubContent>
  </MenuSub>
</MenuContent>`,
        props: [
          {
            name: "MenuContent.variant",
            type: '"command" | "dropdown"',
            default: '"command"',
            description: "dropdown: menus de propriedade (raio 12, linhas de 32).",
          },
          { name: "MenuSubTrigger.icon", type: "LucideIcon", description: "Ícone do item." },
          {
            name: "MenuSubContent.portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema.",
          },
          {
            name: "MenuSubContent.panelLabel",
            type: "string",
            description: 'Nome do submenu que hospeda uma busca (vira role="dialog").',
          },
          {
            name: "MenuPanel",
            type: "componente",
            description: "Hospeda um painel com busca dentro do submenu.",
          },
        ],
        decisions: [
          {
            decision: "Família dropdown: raio 12, linhas de 32, destaque r8",
            rule: "Figma 1:1255; mesma família dos menus de propriedade (1:904)",
          },
          {
            decision: "Chevron à direita para o segundo nível",
            rule: "Figma 1:1255; §7 Jakob (convenção de submenu)",
          },
          {
            decision: "Busca de projetos com multisseleção no submenu",
            rule: "Figma 1:1255 (Blocked by… → lista de projetos)",
          },
        ],
      }}
    />
  );
}
