/**
 * Context Menu: sem desenho no Figma; segue o Linear (menu de clique direito de uma issue) com as
 * peças e o visual do Menu, família dropdown. O menu aberto da página é estático (StaticMenu).
 */
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuTrigger,
  MenuItem,
  MenuSeparator,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
} from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import {
  Archive,
  ChevronRight,
  CircleDashed,
  Copy,
  FileText,
  Hash,
  Link2,
  SignalHigh,
  SquarePen,
  Tag,
  Trash2,
  Type,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { StaticMenu, type StaticMenuRow } from "../../kit/static-menu";

const COPY_ITEMS = [
  { label: "Copy ID", icon: Hash, shortcut: ["Ctrl", "."] },
  { label: "Copy title", icon: Type },
  { label: "Copy as Markdown", icon: FileText },
];

/** Linha de issue focável: clique direito, Shift+F10 ou a tecla de menu abrem o menu. */
function IssueRow() {
  const [last, setLast] = useState<string>();
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {/* A linha é focável (botão que abre a issue): o menu também abre pelo teclado. */}
          <button
            type="button"
            onClick={() => setLast("Open issue")}
            className="flex h-row w-full items-center gap-3 rounded-control border border-default bg-surface px-3 text-left text-body-md text-primary transition-[background-image] duration-fast ease-standard focus-ring hovered:[background-image:linear-gradient(var(--bg-hover),var(--bg-hover))]"
          >
            <span className="font-mono text-code text-secondary">VYZ-31</span>
            <span className="min-w-0 flex-1 truncate">Phase 3: selection and menus</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <MenuItem icon={CircleDashed} shortcut={["S"]} onSelect={() => setLast("Status")}>
            Change status…
          </MenuItem>
          <MenuItem icon={UserRound} shortcut={["A"]} onSelect={() => setLast("Assign")}>
            Assign to…
          </MenuItem>
          <MenuItem icon={SignalHigh} shortcut={["P"]} onSelect={() => setLast("Priority")}>
            Change priority…
          </MenuItem>
          <MenuItem icon={Tag} shortcut={["L"]} onSelect={() => setLast("Labels")}>
            Add labels…
          </MenuItem>
          <MenuSeparator />
          <MenuItem icon={SquarePen} shortcut={["E"]} onSelect={() => setLast("Rename")}>
            Rename…
          </MenuItem>
          <MenuItem icon={Link2} shortcut={["Ctrl", "L"]} onSelect={() => setLast("Copy link")}>
            Copy link
          </MenuItem>
          <MenuSub>
            <MenuSubTrigger icon={Copy}>Copy</MenuSubTrigger>
            <MenuSubContent>
              {COPY_ITEMS.map((c) => (
                <MenuItem
                  key={c.label}
                  icon={c.icon}
                  shortcut={c.shortcut}
                  onSelect={() => setLast(c.label)}
                >
                  {c.label}
                </MenuItem>
              ))}
            </MenuSubContent>
          </MenuSub>
          <MenuSeparator />
          <MenuItem icon={Archive} disabled>
            Archive
          </MenuItem>
          <MenuItem icon={Trash2} shortcut={["Ctrl", "⌫"]} onSelect={() => setLast("Delete")}>
            Delete…
          </MenuItem>
        </ContextMenuContent>
      </ContextMenu>
      <p aria-live="polite" className="text-body-sm text-secondary">
        {last ? `Última ação: ${last}` : "Nenhuma ação ainda."}
      </p>
    </div>
  );
}

const ROWS: StaticMenuRow[] = [
  { kind: "item", icon: CircleDashed, label: "Change status…", shortcut: ["S"] },
  { kind: "item", icon: UserRound, label: "Assign to…", shortcut: ["A"] },
  { kind: "item", icon: SignalHigh, label: "Change priority…", shortcut: ["P"] },
  { kind: "item", icon: Tag, label: "Add labels…", shortcut: ["L"] },
  { kind: "separator" },
  { kind: "item", icon: SquarePen, label: "Rename…", shortcut: ["E"] },
  { kind: "item", icon: Link2, label: "Copy link", shortcut: ["Ctrl", "L"] },
  { kind: "item", icon: Copy, label: "Copy", submenu: true },
  { kind: "separator" },
  { kind: "item", icon: Archive, label: "Archive" },
  { kind: "item", icon: Trash2, label: "Delete…", shortcut: ["Ctrl", "⌫"] },
];

const chevron = (row: StaticMenuRow) =>
  row.kind === "item" && row.submenu ? (
    <Icon icon={ChevronRight} size="xs" className="text-secondary" />
  ) : null;

function Static({ label }: { label: string }) {
  return (
    <StaticMenu label={label} rows={ROWS} highlighted={1} variant="dropdown" trailing={chevron} />
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Context Menu",
        description:
          "Ações sobre um item, abertas pelo clique direito ou pelo teclado (Shift+F10, tecla de menu). Sem desenho no Figma: segue o Linear com as peças e o visual do Menu, família dropdown.",
        whenToUse: [
          "Atalho para as ações de uma linha, cartão ou item de lista",
          "Ações que também existem em outro lugar visível (menu More, barra de ações)",
        ],
        whenNotToUse: [
          "A única forma de chegar a uma ação: o clique direito é pouco descoberto",
          "Escolher um valor de formulário: use Select ou Combobox",
          "Menu aberto por um botão: use Menu",
        ],
        playground: {
          preview: <IssueRow />,
          controls: (
            <p className="text-body-sm text-secondary">
              Clique com o botão direito na linha, ou foque com Tab e pressione Shift+F10 (ou a
              tecla de menu). Setas navegam, → abre o submenu, ← fecha, Esc fecha.
            </p>
          ),
        },
        showcase: <Static label="Context Menu aberto, com a segunda linha destacada" />,
        states: null,
        statesNote:
          "Fechado ou aberto. Linha destacada (hover ou teclado): fundo bg-selected em raio 8. Item desabilitado: opacidade reduzida e sem destaque. Submenu aberto: o item que o abre fica destacado. O exemplo aberto desta página é estático (mesmas classes, sem Radix); o comportamento real está no playground.",
        themes: (theme) => (
          <Static
            label={theme === "dark" ? "Context Menu no tema escuro" : "Context Menu no tema claro"}
          />
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            As peças do Menu na família dropdown: popover de raio 12, borda border-strong, fundo
            bg-popover, sombra md e 6 px de folga; linhas de 32 px com destaque de raio 8, slot de
            ícone de 16 px, rótulo de 13 px e atalho de 12 px/500 à direita; separador de largura
            total. Abre no ponto do clique (ou junto do item focado, pelo teclado), para baixo e à
            direita; perto das bordas vira para a esquerda ou sobe só o necessário.
          </p>
        ),
        keyboard: [
          "Shift+F10 ou a tecla de menu no item focado abrem o menu junto dele.",
          "↑ ↓ navegam; Home/End vão ao início e ao fim; letras pulam para o item.",
          "→ ou Enter abrem o submenu; ← fecha; Enter seleciona; Esc fecha.",
        ],
        accessibility: [
          'Radix ContextMenu: role="menu" e "menuitem", foco gerenciado; o alvo precisa ser focável para abrir pelo teclado.',
          "Atalhos em <kbd>, lidos junto com o rótulo.",
          "Ofereça as mesmas ações num lugar visível: o clique direito não é descoberto por todos.",
        ],
        content: [
          'Rótulos com verbo; reticências quando abrem outra etapa ("Assign to…").',
          "Ações destrutivas no último grupo.",
        ],
        dos: ["Use as mesmas ações e a mesma ordem do menu More do item", "Agrupe com separadores"],
        donts: [
          "Não esconda ações só no clique direito",
          "Não substitua o menu nativo em campos de texto",
        ],
        usage: `import {
  ContextMenu, ContextMenuContent, ContextMenuTrigger,
  MenuItem, MenuSeparator, MenuSub, MenuSubContent, MenuSubTrigger,
} from "@zynox/design-system/components";

<ContextMenu>
  <ContextMenuTrigger asChild><IssueRow tabIndex={0} … /></ContextMenuTrigger>
  <ContextMenuContent>
    <MenuItem icon={UserRound} shortcut={["A"]} onSelect={…}>Assign to…</MenuItem>
    <MenuSub>
      <MenuSubTrigger icon={Copy}>Copy</MenuSubTrigger>
      <MenuSubContent>…</MenuSubContent>
    </MenuSub>
    <MenuSeparator />
    <MenuItem icon={Trash2} onSelect={…}>Delete…</MenuItem>
  </ContextMenuContent>
</ContextMenu>`,
        props: [
          {
            name: "ContextMenuTrigger",
            type: "Radix (asChild)",
            description: "O alvo do clique direito; passe um elemento focável.",
          },
          {
            name: "ContextMenuContent.variant",
            type: '"dropdown" | "command"',
            default: '"dropdown"',
            description: "Família do visual (a mesma do Menu).",
          },
          {
            name: "ContextMenuContent.portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema do contêiner.",
          },
          {
            name: "MenuItem, MenuSeparator, MenuLabel, MenuGroup, MenuSub…",
            type: "componentes",
            description: "As mesmas peças do Menu (Navigation → Menu e Submenu).",
          },
        ],
        decisions: [
          {
            decision: "Sem desenho no Figma: segue o Linear (menu de ações da issue)",
            rule: "Regra da spec de fundação: sem nó, segue o Linear com os tokens existentes (.figma/01-design-tokens.md, Sem design)",
          },
          {
            decision:
              "Mesmas peças do Menu, sem cópia: cada peça usa o primitivo da família aberta",
            rule: "Spec da Fase 3 (Context Menu reusa o Menu); §11 similaridade: mesma função, mesma aparência",
          },
          {
            decision: "Família dropdown: raio 12, linhas de 32 px, destaque de raio 8",
            rule: "Figma 1:1256 e 1:904 (menus de propriedade), os menus de ação do Linear",
          },
          {
            decision:
              "Abre no ponto do clique, para baixo; perto da borda direita vira para a esquerda e perto da de baixo sobe só o necessário, com 8 px de folga",
            rule: "Pedido do responsável (menus abrem para baixo); sem a virada, o menu sairia da tela num clique perto da borda",
          },
          {
            decision: "Abre também por Shift+F10 e pela tecla de menu",
            rule: "WCAG 2.1.1 (tudo operável pelo teclado); comportamento nativo do navegador",
          },
          { decision: "Entrada 180 ms com escala 0,97", rule: "§8 overlays 150–200 ms" },
        ],
      }}
    />
  );
}
