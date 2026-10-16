/**
 * Command Menu (⌘K): família do menu "/" (Figma 1:4653), com cmdk dentro do Dialog, e o catálogo
 * inteiro do ⌘K do Linear (kit/command-catalog, Figma 38:2). Os menus abertos da página são
 * estáticos (StaticCommandMenu, mesmas classes sem cmdk); o real está no playground. Os dois saem
 * dos mesmos dados.
 */
import {
  Button,
  CommandGroup,
  CommandItem,
  CommandMenu,
  CommandSeparator,
  KbdSequence,
} from "@zynox/design-system/components";
import { useCommandState } from "cmdk";
import { Search } from "lucide-react";
import { Fragment, useState } from "react";
import {
  EntryLabel,
  FOCUS_CHIP,
  FOCUS_ISSUE,
  PAGES,
  catalogSize,
  deepEntries,
  entryValue,
  issueEntries,
  rootSections,
  type CommandContext,
  type CommandEntry,
  type CommandSection,
} from "../../kit/command-catalog";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { StaticCommandMenu, type StaticCommandRow } from "../../kit/static-command-menu";

const CONTEXTS = [
  { value: "view", label: "My issues" },
  { value: "issue", label: `${FOCUS_ISSUE.id} aberta` },
] satisfies { value: CommandContext; label: string }[];

/**
 * Valor de busca de cada linha, único na lista (o cmdk seleciona pelo valor): um rótulo repetido
 * ("Copy title as link" da issue e do time, "Labels" de Issues e de Projects) leva o grupo.
 */
function sectionValues(sections: CommandSection[]) {
  const seen = new Set<string>();
  return sections.map((s) =>
    s.items.map((entry) => {
      let value = entryValue(entry);
      if (seen.has(value) && s.heading) value = `${value} ${s.heading}`;
      seen.add(value);
      return value;
    }),
  );
}

/** Numa página que marca o valor atual, todas as linhas dizem se estão marcadas. */
const marks = (sections: CommandSection[]) => sections.some((s) => s.items.some((i) => i.checked));

/** Valores das páginas de valor na busca da página inicial ("Change status › Done"). */
function DeepItems({
  entry,
  onSelect,
}: {
  entry: CommandEntry;
  onSelect: (entry: CommandEntry, trail: string[], path: string) => void;
}) {
  const searching = useCommandState((state) => state.search !== "");
  if (!searching) return null;
  return deepEntries([{ items: [entry] }]).map(({ entry: deep, trail, path }) => (
    <CommandItem
      key={entryValue(deep, path)}
      value={entryValue(deep, path)}
      icon={deep.icon}
      shortcut={deep.shortcut}
      shortcutMode={deep.shortcutMode}
      onSelect={() => onSelect(deep, trail, path)}
    >
      <EntryLabel entry={deep} path={path} />
    </CommandItem>
  ));
}

/** Issues que batem com a busca, no fim da lista (o "Quick results" do Linear). */
function QuickResults({ onSelect }: { onSelect: (label: string) => void }) {
  const search = useCommandState((state) => state.search);
  if (!search) return null;
  return (
    <CommandGroup heading={`Quick results for "${search}"`}>
      {issueEntries().map((entry) => (
        <CommandItem
          key={entry.prefix}
          value={entryValue(entry)}
          icon={entry.icon}
          onSelect={() => onSelect(`${entry.prefix} ${entry.label}`)}
        >
          <EntryLabel entry={entry} />
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

function LiveCommandMenu({ context }: { context: CommandContext }) {
  const [open, setOpen] = useState(false);
  const [stack, setStack] = useState<string[]>([]);
  const [last, setLast] = useState<string>();
  const key = stack.at(-1);
  const page = key ? PAGES[key] : undefined;
  const sections = page ? page.sections : rootSections(context);
  const values = sectionValues(sections);
  const checkable = marks(sections);
  const onOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setStack([]);
  };
  const run = (text: string) => {
    setLast(text);
    onOpenChange(false);
  };
  const titles = (keys: string[]) => keys.map((k) => PAGES[k]!.title);
  const select = (entry: CommandEntry, trail = stack) => {
    if (entry.page) {
      const next = entry.page;
      setStack([...trail, next]);
      return;
    }
    run(trail.length ? `${titles(trail).join(" › ")}: ${entry.label}` : entry.label);
  };
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2">
        <Button icon={Search} onClick={() => setOpen(true)}>
          Command menu
        </Button>
        <KbdSequence keys={["Ctrl", "K"]} mode="plus" />
      </div>
      <CommandMenu
        open={open}
        onOpenChange={onOpenChange}
        // Com a issue aberta, o primeiro chip é ela; Backspace só volta as páginas.
        pages={[...(context === "issue" ? [FOCUS_CHIP] : []), ...titles(stack)]}
        onBack={() => setStack((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))}
        placeholder={page?.placeholder}
        emptyText={page?.empty}
      >
        {sections.map((section, i) => (
          <Fragment key={section.heading ?? i}>
            {i > 0 && <CommandSeparator />}
            <CommandGroup heading={section.heading}>
              {section.items.map((entry, j) => (
                <Fragment key={values[i]![j]}>
                  <CommandItem
                    value={values[i]![j]}
                    icon={entry.icon}
                    shortcut={entry.shortcut}
                    shortcutMode={entry.shortcutMode}
                    keywords={entry.keywords}
                    aria-checked={checkable ? Boolean(entry.checked) : undefined}
                    onSelect={() => select(entry)}
                  >
                    <EntryLabel entry={entry} />
                  </CommandItem>
                  {!page && entry.page && (
                    <DeepItems
                      entry={entry}
                      onSelect={(deep, trail, path) =>
                        deep.page ? select(deep, trail) : run(`${path}: ${deep.label}`)
                      }
                    />
                  )}
                </Fragment>
              ))}
            </CommandGroup>
          </Fragment>
        ))}
        {!page && <QuickResults onSelect={(label) => run(`Open issue: ${label}`)} />}
      </CommandMenu>
      <p aria-live="polite" className="text-body-sm text-secondary">
        {last ? `Última ação: ${last}` : "Nenhuma ação ainda."}
      </p>
    </div>
  );
}

/** Os mesmos grupos em linhas estáticas: rótulo, itens e separador entre grupos. */
function toRows(sections: CommandSection[]): StaticCommandRow[] {
  return sections.flatMap((g, i) => [
    ...(i > 0 ? [{ kind: "separator" } as const] : []),
    ...(g.heading ? [{ kind: "label", label: g.heading } as const] : []),
    ...g.items.map(
      (item) =>
        ({
          kind: "item",
          label: <EntryLabel entry={item} />,
          icon: item.icon,
          shortcut: item.shortcut,
          shortcutMode: item.shortcutMode,
        }) as const,
    ),
  ]);
}

const firstItem = (rows: StaticCommandRow[]) => rows.findIndex((r) => r.kind === "item");

function StaticRoot({ label, context }: { label: string; context: CommandContext }) {
  const rows = toRows(rootSections(context));
  return (
    <StaticCommandMenu
      label={label}
      rows={rows}
      highlighted={firstItem(rows)}
      pages={context === "issue" ? [FOCUS_CHIP] : []}
      scroll
    />
  );
}

function Showcase() {
  const { root, pages } = catalogSize();
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
        <StaticRoot label="Página inicial numa lista (My issues)" context="view" />
        <StaticRoot label={`Página inicial com ${FOCUS_ISSUE.id} aberta`} context="issue" />
      </div>
      <p className="max-w-prose text-body-sm text-secondary">
        A página inicial nos dois contextos, com a lista de 400 px rolando como no menu real: role
        cada uma para ver tudo. O catálogo tem {root} comandos na página inicial e {pages} páginas,
        todos navegáveis no playground.
      </p>
    </div>
  );
}

function StatesExamples() {
  const status = PAGES.status!;
  const statusRows = toRows(status.sections);
  const theme = PAGES.theme!;
  const dark = theme.sections[0]!.items.find((i) => i.label === "Dark")!;
  return (
    <div className="grid grid-cols-1 gap-4 desktop:grid-cols-2">
      <StaticCommandMenu
        label="Command menu na página Change status, com o valor atual marcado"
        rows={statusRows}
        highlighted={firstItem(statusRows)}
        pages={[FOCUS_CHIP, status.title]}
        placeholder={status.placeholder}
      />
      <StaticCommandMenu
        label="Command menu buscando dark na página inicial"
        search="dark"
        rows={[
          { kind: "label", label: "Settings" },
          { kind: "item", label: "Change interface theme…", icon: rootIcon("theme") },
          {
            kind: "item",
            label: <EntryLabel entry={dark} path={theme.title} />,
            icon: dark.icon,
          },
        ]}
        highlighted={1}
      />
      <StaticCommandMenu
        label="Command menu numa página sem itens"
        rows={[]}
        pages={[PAGES["open-document"]!.title]}
        placeholder={PAGES["open-document"]!.placeholder}
        emptyText={PAGES["open-document"]!.empty}
      />
      <StaticCommandMenu label="Command menu carregando resultados" rows={[]} loading />
    </div>
  );
}

/** Ícone do item da página inicial que abre uma página. */
function rootIcon(page: string) {
  return rootSections("view")
    .flatMap((s) => s.items)
    .find((i) => i.page === page)?.icon;
}

export function Page() {
  const [context, setContext] = useState<CommandContext>("view");
  return (
    <ComponentPage
      doc={{
        title: "Command Menu",
        description:
          'Busca global de ações e navegação (⌘K / Ctrl+K), numa janela modal. Da família do menu "/" (Figma 1:4653): as mesmas linhas, rótulos e separadores, com busca no topo, atalhos em Kbd e páginas para escolher um valor. O catálogo é o do Linear (Figma 38:2), com "Zynox" no lugar do nome do produto.',
        whenToUse: [
          "Acesso rápido a qualquer ação ou lugar pelo teclado",
          "Ações sobre o item atual (status, prioridade) sem abrir menus",
        ],
        whenNotToUse: [
          "Ações de um item só, abertas por um botão: use Menu",
          "Escolher um valor num formulário: use Combobox",
          "Filtrar uma lista na tela: use Search Input ou Filter Menu",
        ],
        playground: {
          preview: <LiveCommandMenu context={context} />,
          controls: (
            <>
              <Field label="Contexto">
                <Segmented
                  label="Contexto"
                  value={context}
                  options={CONTEXTS}
                  onChange={setContext}
                />
              </Field>
              <p className="max-w-prose text-body-sm text-secondary">
                O catálogo inteiro do Linear. Ctrl+K (⌘K no Mac) abre e fecha de qualquer ponto da
                página. Digite para filtrar: a busca também acha os valores das páginas
                (&quot;Change status › Done&quot;) e issues. ↑ ↓ navegam, Enter executa; os itens
                com reticências abrem uma página, e Backspace com a busca vazia volta. Esc fecha.
              </p>
            </>
          ),
        },
        showcase: <Showcase />,
        states: <StatesExamples />,
        themes: (theme) => (
          <StaticRoot
            label={theme === "dark" ? "Command menu no tema escuro" : "Command menu no tema claro"}
            context="view"
          />
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Janela de até 640 px centralizada na tela, sobre bg-scrim, com a superfície do menu
            &quot;/&quot; (raio 10, borda border-strong, bg-surface, sombra md). Busca de 48 px com
            texto de 16 px e, acima dela, a trilha em chips: a issue aberta (ID · título) e as
            páginas abertas; hairline border-default. Lista de até 400 px com as linhas do menu
            &quot;/&quot;: 36 px, slot de ícone de 20, rótulo de 13 px, atalho em Kbd à direita e
            destaque bg-selected de raio 6. Nas páginas, prefixo e detalhe em text-secondary (ID da
            issue, chave do time) e o valor atual marcado com um check de 16 px em text-secondary.
            Rótulos de grupo de 12/500 e separadores de largura total.
          </p>
        ),
        keyboard: [
          "Ctrl+K ou ⌘K abrem e fecham; o foco vai para a busca.",
          "Digitar filtra; ↑ ↓ navegam (dão a volta no fim); Enter executa.",
          "Na página inicial, a busca também acha os valores das páginas de valor e issues.",
          "Backspace com a busca vazia volta uma página; o chip da issue aberta fica.",
          "Esc fecha e devolve o foco para onde estava.",
        ],
        accessibility: [
          'Dialog modal com nome ("Command menu"); a busca é um combobox que controla a lista (cmdk).',
          "A linha destacada é anunciada por aria-activedescendant; o foco fica na busca.",
          "Atalhos em <kbd>, lidos junto com o rótulo.",
          "O valor atual de uma página leva aria-checked; o check é decorativo.",
          "Sem resultados, a lista diz isso em texto.",
        ],
        content: [
          'Rótulos com verbo ("Create new issue…", "Go to inbox"); reticências quando pedem mais uma escolha (página ou janela).',
          "Grupos e ordem do Linear; com uma issue aberta, os comandos dela vêm primeiro, sem rótulo (o chip faz esse papel).",
          '"Linear" vira "Zynox" onde é o nome do produto ("Ask Zynox", "Zynox status").',
        ],
        dos: [
          "Mostre o atalho de cada ação quando existir",
          "Use páginas para escolher valores e marque o valor atual",
        ],
        donts: [
          "Não ponha formulários no menu",
          "Não tenha dois menus com o atalho ligado na mesma tela",
        ],
        usage: `import {
  CommandGroup, CommandItem, CommandMenu, CommandSeparator,
} from "@zynox/design-system/components";

<CommandMenu
  open={open}
  onOpenChange={setOpen}
  // Issue aberta primeiro, depois as páginas
  pages={[issueChip, ...pages.map((p) => PAGE_LABEL[p])]}
  onBack={() => setPages((prev) => prev.slice(0, -1))}
>
  {page === "status" ? (
    <CommandGroup>…</CommandGroup>
  ) : (
    <CommandGroup>
      <CommandItem icon={CircleDashed} shortcut={["S"]} onSelect={() => openPage("status")}>
        Change status…
      </CommandItem>
    </CommandGroup>
  )}
</CommandMenu>`,
        props: [
          {
            name: "open, onOpenChange",
            type: "boolean, (open) => void",
            description: "Estado da janela (controlado).",
          },
          {
            name: "hotkey",
            type: "boolean",
            default: "true",
            description: "Ctrl/⌘+K abre e fecha de qualquer ponto da página.",
          },
          {
            name: "pages",
            type: "string[]",
            description:
              "Trilha em chips: a issue aberta, se houver, e as páginas abertas; cada mudança limpa a busca.",
          },
          {
            name: "onBack",
            type: "() => void",
            description: "Volta uma página (Backspace com a busca vazia).",
          },
          {
            name: "placeholder",
            type: "string",
            default: '"Type a command or search…"',
            description: "Texto da busca vazia.",
          },
          {
            name: "loading",
            type: "boolean",
            description: "Linha de carregamento no topo da lista.",
          },
          {
            name: "emptyText",
            type: "string",
            default: '"No results"',
            description: "Texto da lista sem resultados (ex.: página sem itens).",
          },
          {
            name: "CommandItem",
            type: "icon, shortcut, shortcutMode, keywords, value, onSelect",
            description:
              "Linha: ícone lucide ou pronto (StatusIcon, Avatar), atalho em Kbd, sinônimos; conteúdo livre com value explícito.",
          },
          {
            name: "CommandGroup, CommandSeparator",
            type: "componentes",
            description: "Grupo com rótulo (heading) e divisória.",
          },
          {
            name: "CommandPanel",
            type: "componente",
            description: "O conteúdo sem a janela, para embutir numa tela.",
          },
          {
            name: "commandMenuStyles, CommandItemContent",
            type: "classes, componente",
            description: "A aparência sem o cmdk, para menus estáticos (documentação).",
          },
        ],
        decisions: [
          {
            decision: 'Linhas, rótulos e separadores do menu "/"; superfície dele sobre o Dialog',
            rule: "Família do menu 1:4653; sombra md de command menu (Foundations → Shadows)",
          },
          {
            decision: "Janela a 15% do topo, não centralizada",
            rule: "A busca fica parada enquanto a lista muda de altura",
          },
          {
            decision: 'Atalhos em Kbd, não em texto como no menu "/"',
            rule: "Spec da Fase 6; o mesmo KbdSequence do Tooltip e do Combobox",
          },
          {
            decision: "Páginas controladas pelo consumidor; o menu só mostra a trilha e volta",
            rule: "Padrão de páginas do cmdk; os itens de cada página são do produto",
          },
          {
            decision: "Catálogo inteiro do ⌘K do Linear, num kit à parte (command-catalog)",
            rule: "Lido no Linear (lista e issue aberta), conferido com o Figma 38:2 e a documentação",
          },
          {
            decision: "Issue aberta como primeiro chip da trilha; Backspace não o tira",
            rule: 'Linear: "ID ⋅ título" acima da busca, fixo',
          },
          {
            decision:
              "Valores das páginas e issues na busca da página inicial, montados só enquanto há busca",
            rule: "Linear (busca profunda e Quick results); na documentação, com o estado da busca do cmdk, sem mudar o componente",
          },
          {
            decision: "Valor atual marcado com check e aria-checked",
            rule: "Linear (a página de tema marca o tema atual)",
          },
          {
            decision: 'Sem "Ask Linear / Tab" no cabeçalho nem números 1–9 nas páginas',
            rule: "IA fica para a Fase 7; os números pediriam uma prop nova só para isso",
          },
          {
            decision:
              'Ctrl/⌘+K abre e fecha de qualquer ponto, com o foco num campo de texto ou com outro diálogo aberto (ex.: o New issue do "C")',
            rule: "Comportamento atual (sem mudança na Fase 8): o navegador da Traycer não conseguiu confirmar isso ao vivo no Linear nesta sessão (o dispatch sintético de tecla não chega ao listener real do Linear, e o Playwright recusa `press` fora de um campo editável) — mantido como já estava, sem alterar o CommandMenu do design system",
          },
        ],
      }}
    />
  );
}
