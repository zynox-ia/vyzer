/**
 * Popover (superfície do Figma 1:935). O painel aberto da página é estático (PopoverSurface); o
 * popover real está no playground.
 */
import {
  Button,
  Field as FormField,
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverSurface,
  PopoverTrigger,
  TextInput,
} from "@zynox/design-system/components";
import { Check, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

/** Conteúdo livre: formulário curto para renomear a vista. */
function RenameForm({ name, onSave }: { name: string; onSave?: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave?.(draft.trim() || name);
  };
  return (
    <form className="flex flex-col gap-3 p-4" onSubmit={submit}>
      <FormField label="View name">
        <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} />
      </FormField>
      {/* Cancel à esquerda e a ação principal à direita (pedido do responsável). */}
      <div className="flex items-center justify-between gap-1">
        {onSave ? (
          <PopoverClose asChild>
            <Button>Cancel</Button>
          </PopoverClose>
        ) : (
          <Button>Cancel</Button>
        )}
        <Button variant="primary" type="submit" icon={Check}>
          Save
        </Button>
      </div>
    </form>
  );
}

function LivePopover({ align }: { align: "start" | "end" }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Active issues");
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button icon={Pencil}>{name}</Button>
      </PopoverTrigger>
      <PopoverContent label="Rename view" align={align} className="w-72">
        <RenameForm
          name={name}
          onSave={(next) => {
            setName(next);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

function StaticPanel() {
  return (
    <PopoverSurface className="w-72">
      <RenameForm name="Active issues" />
    </PopoverSurface>
  );
}

function usePlayground() {
  const [align, setAlign] = useState<"start" | "end">("start");
  return {
    preview: <LivePopover align={align} />,
    controls: (
      <>
        <Field label="align">
          <Segmented
            label="align"
            value={align}
            onChange={setAlign}
            options={[
              { value: "start", label: "start" },
              { value: "end", label: "end" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          Abra, edite e salve; Esc ou clique fora fecham e devolvem o foco ao botão.
        </p>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Popover",
        description:
          "Conteúdo livre preso a um gatilho: um formulário curto, um resumo, uma confirmação leve. A superfície é a dos dropdowns (Figma 1:935): raio 12, borda forte, sombra md.",
        whenToUse: [
          "Editar um valor no lugar, sem sair da tela (renomear uma vista)",
          "Mostrar detalhes sob demanda com ações",
        ],
        whenNotToUse: [
          "Escolher um valor numa lista: use Select ou Combobox",
          "Lista de ações: use Menu",
          "Só nomear um controle: use Tooltip",
          "Tarefas longas ou que bloqueiam a tela: use Dialog (Fase 4)",
        ],
        playground,
        showcase: <StaticPanel />,
        states: null,
        statesNote:
          "Fechado ou aberto. Abre para baixo do gatilho, alinhado ao início (ou ao fim); sem espaço, rola por dentro com 8 px de folga até a borda da janela. O exemplo aberto desta página é estático (PopoverSurface); o comportamento real está no playground.",
        themes: () => <StaticPanel />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Superfície de raio 12, borda border-strong, fundo bg-popover e sombra md, a 4 px do
            gatilho. O conteúdo define o próprio respiro: 16 px nas laterais, como as seções do
            Display Options. A largura vem do conteúdo (aqui, 288 px).
          </p>
        ),
        keyboard: [
          "Enter ou Espaço no gatilho abrem; o foco vai para o primeiro elemento focável. Num campo de texto, o cursor fica no fim, sem selecionar o texto.",
          "Tab percorre o conteúdo; Esc fecha e devolve o foco ao gatilho.",
          "Clique fora também fecha.",
        ],
        accessibility: [
          'Radix Popover: role="dialog" com nome (label ou aria-labelledby); o gatilho recebe aria-expanded e aria-controls.',
          "Foco preso ao conteúdo enquanto aberto só se modal={true}; o padrão deixa sair com Tab e fecha.",
          "Texto e campos seguem os próprios componentes (contraste medido em Foundations → Colors).",
        ],
        content: [
          "Um objetivo por popover; título ou rótulo do campo diz o que se edita.",
          "Ações com verbo: Cancel à esquerda; a principal à direita, com ícone (Save).",
        ],
        dos: [
          "Nomeie o popover (label)",
          "Mantenha curto: se precisar rolar, talvez seja um Dialog",
        ],
        donts: [
          "Não empilhe popover sobre popover",
          "Não use para listas de opções (use Select ou Combobox)",
        ],
        usage: `import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@zynox/design-system/components";

<Popover>
  <PopoverTrigger asChild><Button icon={Pencil}>Active issues</Button></PopoverTrigger>
  <PopoverContent label="Rename view" className="w-72">
    <form className="flex flex-col gap-3 p-4">…</form>
  </PopoverContent>
</Popover>`,
        props: [
          {
            name: "PopoverContent.label",
            type: "string",
            description: "Nome acessível do popover.",
          },
          {
            name: "PopoverContent.align",
            type: '"start" | "center" | "end"',
            default: '"start"',
            description: "Alinhamento com o gatilho; abre sempre para baixo.",
          },
          {
            name: "PopoverContent.portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema do contêiner.",
          },
          {
            name: "Popover, PopoverTrigger, PopoverClose, PopoverAnchor",
            type: "Radix",
            description: "Raiz, gatilho, botão de fechar e âncora alternativa.",
          },
          {
            name: "PopoverSurface",
            type: "componente",
            description: "O popover aberto, fixo na página (documentação ou tela).",
          },
        ],
        decisions: [
          {
            decision: "Superfície popoverSurface: raio 12, borda border-strong, bg-popover",
            rule: "Figma 1:935 (r12, #323336, #212122); a mesma do Select e do Combobox",
          },
          {
            decision: "Sombra md (2 camadas) no lugar das 3 do Figma",
            rule: "Skill §9 (contato + ambiente); divergência já registrada",
          },
          {
            decision:
              "Abre sempre para baixo, com rolagem interna e 8 px de folga até a borda da janela",
            rule: "Pedido do responsável (mesma regra do Menu e do Display Options)",
          },
          { decision: "4 px entre gatilho e popover", rule: "Mesmo afastamento do Menu (§1)" },
          {
            decision:
              "Ao abrir, o foco vai para o primeiro campo sem selecionar o texto; o cursor fica no fim",
            rule: "Pedido do responsável (o Radix selecionava o texto do campo)",
          },
          {
            decision:
              "Rodapé do exemplo: Cancel secundário com relevo à esquerda, Save primário com ícone Check à direita, os dois de 28 px (o anel de relevo do Cancel fica por fora)",
            rule: "Pedido do responsável, como o rodapé do Display Options; Button de tamanho único e relevo no secundário (ADR-0013)",
          },
          {
            decision: "Sem padding próprio: o conteúdo define o respiro (16 px no exemplo)",
            rule: "Seções encostam na borda (hairlines de largura total, Figma 18:725); 16 px como no Display Options",
          },
          { decision: "Entrada 180 ms com escala 0,97", rule: "§8 overlays 150–200 ms" },
        ],
      }}
    />
  );
}
