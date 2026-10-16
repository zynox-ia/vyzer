/**
 * Seleção em massa com barra de ações flutuante (spec Fase 10, item 4). A seleção nas linhas já
 * existe (IssueList/IssueRow, Fase 5: selected/onSelectedChange, aria-selected, Space marca, Esc
 * limpa); esta página soma a SelectionBar (Figma 1:5613, peça nova aprovada desta fase — a
 * seleção em si não é nova, faltava só a barra) quando ≥ 1 linha está marcada.
 */
import {
  IssueList,
  IssueRow,
  MenuItem,
  MenuSeparator,
  SelectionBar,
} from "@zynox/design-system/components";
import { Archive, CircleDashed, SignalHigh, Trash2 } from "lucide-react";
import { useState } from "react";
import { PatternPage } from "../../kit/pattern-page";
import { ISSUES, rowProps } from "../../kit/issue-data";
import { StatesStack } from "../../kit/states";

const SAMPLE = ISSUES.slice(0, 6);

/** Ações de exemplo do menu "Actions" (spec: mudar status, prioridade, arquivar, deletar). */
function BulkActions({ onAction }: { onAction: (label: string) => void }) {
  return (
    <>
      <MenuItem icon={CircleDashed} onSelect={() => onAction("Change status…")}>
        Change status…
      </MenuItem>
      <MenuItem icon={SignalHigh} onSelect={() => onAction("Change priority…")}>
        Change priority…
      </MenuItem>
      <MenuItem icon={Archive} onSelect={() => onAction("Archive")}>
        Archive
      </MenuItem>
      <MenuSeparator />
      {/* Aparência destrutiva: só o texto muda de cor (text-danger-strong); o slot de ícone do
          Menu já é text-secondary por padrão (menuStyles.iconSlot) em todo o sistema — sem prop
          nova no MenuItem, mesma composição usada em qualquer outro item. */}
      <MenuItem icon={Trash2} className="text-danger-strong" onSelect={() => onAction("Delete")}>
        Delete
      </MenuItem>
    </>
  );
}

/**
 * Lista com seleção múltipla e a barra flutuante. A SelectionBar não tem posição própria
 * (fixed/absolute): o wrapper relative + absolute bottom-4 inset-x-0 é responsabilidade da
 * página, como documentado no componente.
 */
function BulkSelectionExample({ defaultSelected = [] }: { defaultSelected?: string[] }) {
  const [selected, setSelected] = useState<string[]>(defaultSelected);
  const [lastAction, setLastAction] = useState<string>();

  const onAction = (label: string) => {
    setLastAction(`${label} · ${selected.length} ${selected.length === 1 ? "issue" : "issues"}`);
  };

  return (
    <div className="flex w-full max-w-content flex-col gap-3">
      <div className="relative pb-16">
        <IssueList label="Issues" selected={selected} onSelectedChange={setSelected}>
          {SAMPLE.map((issue) => (
            <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
          ))}
        </IssueList>
        {selected.length > 0 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <SelectionBar count={selected.length} onClear={() => setSelected([])}>
              <BulkActions onAction={onAction} />
            </SelectionBar>
          </div>
        )}
      </div>
      <p aria-live="polite" className="min-h-4 text-body-sm text-secondary">
        {lastAction ?? (selected.length === 0 ? "Marque uma ou mais linhas para ver a barra." : "")}
      </p>
    </div>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <StatesStack
        states={[
          {
            label: "0 selecionados · a barra não é renderizada",
            node: (
              <IssueList label="Issues" selected={[]} onSelectedChange={() => {}}>
                {SAMPLE.slice(0, 2).map((issue) => (
                  <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
                ))}
              </IssueList>
            ),
          },
          {
            label: "1 selecionado",
            node: (
              <div className="flex flex-col gap-3">
                <IssueList label="Issues" selected={[SAMPLE[0]!.id]} onSelectedChange={() => {}}>
                  {SAMPLE.slice(0, 2).map((issue) => (
                    <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
                  ))}
                </IssueList>
                <div className="flex justify-center">
                  <SelectionBar count={1} onClear={() => {}}>
                    <BulkActions onAction={() => {}} />
                  </SelectionBar>
                </div>
              </div>
            ),
          },
          {
            label: "vários selecionados",
            node: (
              <div className="flex flex-col gap-3">
                <IssueList
                  label="Issues"
                  selected={SAMPLE.slice(0, 3).map((i) => i.id)}
                  onSelectedChange={() => {}}
                >
                  {SAMPLE.slice(0, 3).map((issue) => (
                    <IssueRow key={issue.id} value={issue.id} {...rowProps(issue)} />
                  ))}
                </IssueList>
                <div className="flex justify-center">
                  <SelectionBar count={3} onClear={() => {}}>
                    <BulkActions onAction={() => {}} />
                  </SelectionBar>
                </div>
              </div>
            ),
          },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        A barra só existe com ≥ 1 linha marcada; não é um estado &quot;vazio&quot; da barra em si
        (spec Fase 10, §Estados) — por isso o primeiro exemplo acima mostra a lista sozinha, sem uma
        barra vazia por baixo.
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Bulk Selection",
        description:
          "Barra de ações flutuante sobre uma lista com seleção em massa (Figma 1:5613). A seleção nas linhas já existe (IssueList/IssueRow, Fase 5); esta página soma a SelectionBar — peça nova desta fase, aprovada por ter frame próprio no Figma e ser reutilizável entre Issues, Projects e a Fase 5 em geral.",
        live: <BulkSelectionExample />,
        liveDescription:
          "Marque uma ou mais linhas (Espaço, ou Ctrl/⌘/Shift + clique) para abrir a barra; Esc limpa a seleção e fecha a barra; “Actions” abre o menu por Enter ou clique e fecha com Esc sem perder a seleção.",
        states: <States />,
        themes: (theme) => (
          <BulkSelectionExample key={theme} defaultSelected={[SAMPLE[0]!.id, SAMPLE[1]!.id]} />
        ),
        composition: [
          <>
            <code className="font-mono text-code">SelectionBar</code> (peça nova, Fase 10): pílula
            flutuante composta só com <code className="font-mono text-code">Button</code>,{" "}
            <code className="font-mono text-code">IconButton</code> e{" "}
            <code className="font-mono text-code">Menu</code>, tokens já existentes (
            <code className="font-mono text-code">bg-surface</code>,{" "}
            <code className="font-mono text-code">shadow-raised</code>,{" "}
            <code className="font-mono text-code">rounded-full</code>,{" "}
            <code className="font-mono text-code">z-sticky</code>).
          </>,
          <>
            <code className="font-mono text-code">IssueList</code>/
            <code className="font-mono text-code">IssueRow</code> (Fase 5): seleção múltipla já
            existente (Espaço marca, Ctrl/⌘/Shift + clique marcam, Esc limpa), reaproveitada sem
            alteração.
          </>,
          <>
            Posicionamento: a barra não vem fixa nem absoluta por dentro do componente — a página
            envolve a lista num <code className="font-mono text-code">relative</code> e posiciona a
            barra com <code className="font-mono text-code">absolute inset-x-0 bottom-4</code>{" "}
            (documentado no próprio <code className="font-mono text-code">selection-bar.tsx</code>
            ).
          </>,
          <>
            Menu &quot;Actions&quot;: <code className="font-mono text-code">MenuItem</code>/
            <code className="font-mono text-code">MenuSeparator</code> (Fase 3) com ações de exemplo
            (mudar status, mudar prioridade, arquivar, separador, deletar).
          </>,
        ],
        decisions: [
          {
            decision: "A barra só renderiza com selected.length > 0",
            rule: 'Spec Fase 10, §Estados: "não é um estado vazio da própria barra"',
          },
          {
            decision:
              "Esc limpa a seleção (já implementado no IssueList); ao chegar a zero, a barra some pela própria condição de render",
            rule: "Spec Fase 10, §Comportamento (item 4)",
          },
          {
            decision:
              "Wrapper relative + absolute inset-x-0 bottom-4 flex justify-center, com padding-bottom reservado na lista",
            rule: "SelectionBar não tem posição própria; a página é responsável (selection-bar.tsx, comentário do componente)",
          },
          {
            decision:
              "Delete com aparência destrutiva: className text-danger-strong só no texto do item (o ícone segue text-secondary, como qualquer MenuItem do sistema)",
            rule: "Spec Fase 10, item 4 (“Delete como item destrutivo”); sem prop nova no MenuItem",
          },
        ],
      }}
    />
  );
}
