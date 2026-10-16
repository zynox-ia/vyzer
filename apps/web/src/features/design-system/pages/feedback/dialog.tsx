/**
 * Dialog (Figma 1:3241 e 1:3409 como referência geral). A janela aberta da página é estática
 * (DialogSurface); a real está no playground.
 */
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogSurface,
  DialogTrigger,
  Field as FormField,
  TextInput,
  type DialogSize,
} from "@zynox/design-system/components";
import { Check, Pencil } from "lucide-react";
import { useState, type FormEvent } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

/** Corpo e rodapé dentro de um form: Enter no campo salva. */
function RenameForm({ name, onSave }: { name: string; onSave?: (name: string) => void }) {
  const [draft, setDraft] = useState(name);
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSave?.(draft.trim() || name);
  };
  return (
    <form onSubmit={submit}>
      <DialogBody>
        <FormField label="Project name">
          <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} />
        </FormField>
      </DialogBody>
      <DialogFooter>
        {onSave ? (
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
        ) : (
          <Button>Cancel</Button>
        )}
        <Button variant="primary" type="submit" icon={Check}>
          Save
        </Button>
      </DialogFooter>
    </form>
  );
}

const TITLE = "Rename project";
const DESCRIPTION = "The new name shows up everywhere the project is listed.";

function LiveDialog({ size }: { size: DialogSize }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Zynox Design System");
  return (
    <div className="flex flex-col items-center gap-3">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button icon={Pencil}>{TITLE}</Button>
        </DialogTrigger>
        <DialogContent title={TITLE} description={DESCRIPTION} size={size}>
          <RenameForm
            name={name}
            onSave={(next) => {
              setName(next);
              setOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
      <p aria-live="polite" className="text-body-sm text-secondary">
        Projeto: {name}
      </p>
    </div>
  );
}

function Static({ size = "md" }: { size?: DialogSize }) {
  return (
    <DialogSurface title={TITLE} description={DESCRIPTION} size={size}>
      <RenameForm name="Zynox Design System" />
    </DialogSurface>
  );
}

function usePlayground() {
  const [size, setSize] = useState<DialogSize>("md");
  return {
    preview: <LiveDialog size={size} />,
    controls: (
      <>
        <Field label="size">
          <Segmented
            label="size"
            value={size}
            onChange={setSize}
            options={[
              { value: "sm", label: "sm" },
              { value: "md", label: "md" },
              { value: "lg", label: "lg" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          Abra, edite e salve; Esc, o X ou um clique no fundo fecham e devolvem o foco ao botão.
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
        title: "Dialog",
        description:
          "Janela modal com fundo escurecido, título, corpo e rodapé de ações, para uma tarefa curta que precisa de atenção antes de voltar à tela.",
        whenToUse: [
          "Uma tarefa focada que não cabe no lugar (renomear, configurar, criar)",
          "Conteúdo que precisa de toda a atenção até terminar ou cancelar",
        ],
        whenNotToUse: [
          "Confirmar uma ação: use Confirm",
          "Editar um valor no lugar: use Popover",
          "Avisar que algo aconteceu: use Toast",
          "Fluxos longos ou com várias etapas: use uma página",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-4">
            <Static size="sm" />
            <Static size="md" />
          </div>
        ),
        states: null,
        statesNote:
          "Fechado ou aberto. Os campos e botões de dentro têm os próprios estados. A janela aberta desta página é estática (DialogSurface); o comportamento real está no playground.",
        themes: () => <Static />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Fundo bg-scrim sobre a tela. Janela de raio 12 (rounded-surface), borda border-strong,
            fundo bg-surface e sombra lg, com 400, 560 ou 720 px de largura máxima e 16 px de folga
            até a borda da tela. Cabeçalho com título de 16/500 e descrição de 13 px em
            text-secondary, 20 px nas laterais; o X de 28 px no canto. Corpo livre com 20 px nas
            laterais. Rodapé sob uma hairline border-default, com Cancel e a ação principal à
            direita.
          </p>
        ),
        keyboard: [
          "Enter ou Espaço no gatilho abrem; o foco vai para o primeiro campo (cursor no fim, sem selecionar o texto).",
          "Tab e Shift+Tab circulam só dentro da janela; o X é o último da ordem.",
          "Esc fecha e devolve o foco ao gatilho; num form, Enter no campo envia.",
        ],
        accessibility: [
          'Radix Dialog: role="dialog" e aria-modal, com o título como nome e a descrição como aria-describedby.',
          "O resto da página fica inerte e sem rolagem enquanto a janela está aberta.",
          'O X tem nome ("Close"); texto e campos seguem os próprios componentes.',
        ],
        content: [
          'Título com verbo e objeto ("Rename project"); descrição só quando ajuda a decidir.',
          "Ação principal com o mesmo verbo do título; Cancel sempre presente.",
        ],
        dos: ["Uma tarefa por janela", "Ponha campos e rodapé dentro de um form"],
        donts: ["Não abra uma janela sobre outra", "Não use para avisos sem ação (use Toast)"],
        usage: `import {
  Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger,
} from "@zynox/design-system/components";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger asChild><Button icon={Pencil}>Rename project</Button></DialogTrigger>
  <DialogContent title="Rename project" description="…" size="md">
    <form onSubmit={save}>
      <DialogBody>…</DialogBody>
      <DialogFooter>
        <DialogClose asChild><Button>Cancel</Button></DialogClose>
        <Button variant="primary" type="submit">Save</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`,
        props: [
          {
            name: "DialogContent.title",
            type: "ReactNode",
            description: "Título visível e nome acessível.",
          },
          {
            name: "DialogContent.description",
            type: "ReactNode",
            description: "Texto sob o título (aria-describedby).",
          },
          {
            name: "DialogContent.size",
            type: '"sm" | "md" | "lg"',
            default: '"md"',
            description: "Largura máxima: 400, 560 ou 720 px.",
          },
          {
            name: "DialogContent.portal",
            type: "boolean",
            default: "true",
            description: "Sem portal, herda o tema do contêiner.",
          },
          {
            name: "DialogBody, DialogFooter",
            type: "componentes",
            description: "Corpo com 20 px nas laterais; rodapé de ações sob a hairline.",
          },
          {
            name: "Dialog, DialogTrigger, DialogClose",
            type: "Radix",
            description: "Raiz (open, onOpenChange), gatilho e botão de fechar.",
          },
          {
            name: "DialogSurface",
            type: "componente",
            description: "A janela aberta, fixa na página (documentação).",
          },
        ],
        decisions: [
          {
            decision: "Raio 12, bg-surface, borda forte e sombra lg sobre bg-scrim",
            rule: "Tokens de modal (Foundations → Radius, Colors e Shadows); raio 21 do Figma já descartado",
          },
          {
            decision: "Entra com a escala de modal (240 ms) e sai em 140 ms, junto com o fundo",
            rule: "§8 modais 200–300 ms, saída ≈ 75%",
          },
          {
            decision: "O X por último no DOM: o foco inicial vai para o primeiro campo",
            rule: "Mesma regra de foco do Popover (cursor no fim, sem selecionar)",
          },
          {
            decision: "Cancel secundário e a ação primária à direita, sob hairline",
            rule: "Rodapé do Figma 1:3405; Button de tamanho único",
          },
        ],
      }}
    />
  );
}
