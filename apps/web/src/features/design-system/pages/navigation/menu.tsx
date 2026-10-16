import {
  Button,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@zynox/design-system/components";
import {
  ChevronDown,
  ChevronsDownUp,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Lightbulb,
  List,
  ListChecks,
  ListOrdered,
  Paperclip,
  Quote,
  Workflow,
} from "lucide-react";
import { ComponentPage } from "../../kit/component-page";
import { StaticMenu, type StaticMenuRow } from "../../kit/static-menu";

/** Conteúdo do menu "/" do editor (Figma 1:4653). */
function SlashItems() {
  return (
    <>
      <MenuItem icon={Heading1} shortcut={["Ctrl", "Alt", "1"]}>
        Heading 1
      </MenuItem>
      <MenuItem icon={Heading2} shortcut={["Ctrl", "Alt", "2"]}>
        Heading 2
      </MenuItem>
      <MenuItem icon={Heading3} shortcut={["Ctrl", "Alt", "3"]}>
        Heading 3
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={List} shortcut={["Ctrl", "⇧", "8"]}>
        Bulleted list
      </MenuItem>
      <MenuItem icon={ListOrdered} shortcut={["Ctrl", "⇧", "9"]}>
        Numbered list
      </MenuItem>
      <MenuItem icon={ListChecks} shortcut={["Ctrl", "⇧", "7"]}>
        Checklist
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={Image}>Insert media…</MenuItem>
      <MenuItem icon={Paperclip} shortcut={["Ctrl", "⇧", "U"]}>
        Attach files…
      </MenuItem>
      <MenuSeparator />
      <MenuItem icon={Code2} shortcut={["Ctrl", "⇧", "\\"]}>
        Code block
      </MenuItem>
      <MenuItem icon={Workflow}>Diagram</MenuItem>
      <MenuItem icon={ChevronsDownUp} shortcut={["Ctrl", "⇧", "6"]}>
        Collapsible section
      </MenuItem>
      <MenuItem icon={Quote} shortcut={["Alt", "⇧", "."]}>
        Blockquote
      </MenuItem>
      <MenuItem icon={Lightbulb}>Callout</MenuItem>
    </>
  );
}

const SLASH_ROWS: StaticMenuRow[] = [
  { kind: "item", icon: Heading1, label: "Heading 1", shortcut: ["Ctrl", "Alt", "1"] },
  { kind: "item", icon: Heading2, label: "Heading 2", shortcut: ["Ctrl", "Alt", "2"] },
  { kind: "item", icon: Heading3, label: "Heading 3", shortcut: ["Ctrl", "Alt", "3"] },
  { kind: "separator" },
  { kind: "item", icon: List, label: "Bulleted list", shortcut: ["Ctrl", "⇧", "8"] },
  { kind: "item", icon: ListOrdered, label: "Numbered list", shortcut: ["Ctrl", "⇧", "9"] },
  { kind: "item", icon: ListChecks, label: "Checklist", shortcut: ["Ctrl", "⇧", "7"] },
  { kind: "separator" },
  { kind: "item", icon: Image, label: "Insert media…" },
  { kind: "item", icon: Paperclip, label: "Attach files…", shortcut: ["Ctrl", "⇧", "U"] },
  { kind: "separator" },
  { kind: "item", icon: Code2, label: "Code block", shortcut: ["Ctrl", "⇧", "\\"] },
  { kind: "item", icon: Workflow, label: "Diagram" },
  {
    kind: "item",
    icon: ChevronsDownUp,
    label: "Collapsible section",
    shortcut: ["Ctrl", "⇧", "6"],
  },
  { kind: "item", icon: Quote, label: "Blockquote", shortcut: ["Alt", "⇧", "."] },
  { kind: "item", icon: Lightbulb, label: "Callout" },
];

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Menu",
        description:
          'Lista de ações num popover (Figma 1:4653, menu "/" do editor): ícone, rótulo, atalho, separadores entre grupos e destaque da linha ativa.',
        whenToUse: [
          'Ações sobre o item atual: menu de contexto, "More actions", menu "/" do editor',
          "Até ~15 ações; agrupe com separadores (≈ 4 a 7 por grupo)",
        ],
        whenNotToUse: [
          "Escolher um valor de formulário: use Select ou Combobox (Fase 3)",
          "Buscar entre muitas opções: use Command Menu (Fase 6)",
        ],
        playground: {
          preview: (
            <Menu>
              <MenuTrigger asChild>
                <Button trailingIcon={ChevronDown}>Insert block</Button>
              </MenuTrigger>
              <MenuContent>
                <MenuLabel>Blocks</MenuLabel>
                <SlashItems />
              </MenuContent>
            </Menu>
          ),
          controls: (
            <p className="text-body-sm text-secondary">
              Abra com clique, Enter ou Espaço; setas navegam; digite para pular; Esc fecha.
            </p>
          ),
        },
        showcase: (
          <StaticMenu
            label="Menu / aberto, com a primeira linha destacada"
            rows={SLASH_ROWS}
            highlighted={0}
          />
        ),
        states: null,
        statesNote:
          "Linha destacada (hover ou teclado): fundo bg-selected em raio 6. Item desabilitado: opacidade reduzida e sem destaque. Os exemplos abertos desta página são estáticos (mesmas classes, sem Radix); o comportamento real está no playground.",
        themes: (theme) => (
          <StaticMenu
            label={theme === "dark" ? "Menu no tema escuro" : "Menu no tema claro"}
            rows={SLASH_ROWS}
            highlighted={0}
          />
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Popover de raio 10, borda border-strong, fundo bg-popover, sombra md e 4 px de folga.
            Linhas de 36 px com slot de ícone de 20 px (ícone de 16 em text-secondary), gap de 8 px,
            rótulo de 13 px e atalho de 12 px/500 em text-secondary. Separador de 1 px de largura
            total.
          </p>
        ),
        keyboard: [
          "Enter, Espaço ou ↓ no gatilho abrem o menu.",
          "↑ ↓ navegam; Home/End vão ao início e ao fim; letras pulam para o item.",
          "Enter seleciona; Esc fecha e devolve o foco ao gatilho.",
        ],
        accessibility: [
          'Radix DropdownMenu: role="menu" e "menuitem", foco gerenciado.',
          "Atalhos em <kbd>, lidos junto com o rótulo.",
          "Destaque bg-selected: texto primário mantém ≥ 4,5:1 (Foundations → Colors).",
        ],
        content: [
          'Rótulos com verbo ou nome do bloco; reticências quando abrem outra etapa ("Attach files…").',
        ],
        dos: ["Agrupe por afinidade com separadores", "Mostre o atalho quando existir"],
        donts: ["Não coloque formulários dentro do menu"],
        usage: `import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@zynox/design-system/components";

<Menu>
  <MenuTrigger asChild><Button>Insert block</Button></MenuTrigger>
  <MenuContent>
    <MenuItem icon={Heading1} shortcut={["Ctrl", "Alt", "1"]} onSelect={…}>Heading 1</MenuItem>
    <MenuSeparator />
    <MenuItem icon={Paperclip}>Attach files…</MenuItem>
  </MenuContent>
</Menu>`,
        props: [
          { name: "MenuItem.icon", type: "LucideIcon", description: "Ícone no slot de 20 px." },
          { name: "MenuItem.shortcut", type: "string[]", description: "Teclas do atalho." },
          { name: "MenuItem.onSelect", type: "(event) => void", description: "Ação do item." },
          {
            name: "MenuContent.portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema do contêiner.",
          },
          {
            name: "MenuSeparator, MenuLabel, MenuGroup",
            type: "componentes",
            description: "Estrutura do menu.",
          },
        ],
        decisions: [
          {
            decision:
              "Abre sempre para baixo; sem espaço, rola por dentro (8 px de folga até a borda)",
            rule: "Pedido do responsável: o Radix virava o menu para cima quando faltava espaço",
          },
          {
            decision: "Popover de raio 10, borda forte, sombra md",
            rule: "Figma 1:4653 (r10, borda #3a3c3f, 3 camadas → 2 camadas §9)",
          },
          {
            decision: "Destaque de raio 6 com 4 px de folga",
            rule: "Figma 1:4654 (r6, inset 4); §5 10 − 4 = 6",
          },
          { decision: "Linhas de 36 px", rule: "Figma 34 → 36 (grid de 4, §1; h-command-item)" },
          {
            decision: "Slot de ícone de 20 px, gap 8, rótulo 13 px",
            rule: "Figma 1:4659 (w 20, gap 8, 13 Regular)",
          },
          {
            decision: "Atalho em 12 px/500 text-secondary",
            rule: "Figma 1:4666 (12 Medium #a0a1a4); §4 rebaixar",
          },
          {
            decision: "Separadores entre grupos de até 5 itens",
            rule: "§7 Hick e Miller: agrupar reduz o tempo de escolha",
          },
          { decision: "Entrada 180 ms com escala 0,97", rule: "§8 overlays 150–200 ms" },
        ],
      }}
    />
  );
}
