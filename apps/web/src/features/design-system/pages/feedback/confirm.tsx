/**
 * Confirm (Radix AlertDialog): a superfície do Dialog para confirmar uma ação. A janela aberta da
 * página é estática (DialogSurface com o mesmo rodapé); a real está no playground.
 */
import { Button, Confirm, DialogFooter, DialogSurface } from "@vyzer/design-system/components";
import { Archive, Trash2 } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

type Variant = "danger" | "primary";

const COPY: Record<Variant, { title: string; description: string; confirm: string }> = {
  danger: {
    title: "Delete issue?",
    description: "VYZ-34 and its sub-issues will be deleted. This can't be undone.",
    confirm: "Delete",
  },
  primary: {
    title: "Archive project?",
    description: "The project leaves the sidebar. You can restore it from the archive.",
    confirm: "Archive",
  },
};

function LiveConfirm({ variant }: { variant: Variant }) {
  const [last, setLast] = useState<string>();
  const copy = COPY[variant];
  return (
    <div className="flex flex-col items-center gap-3">
      <Confirm
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.confirm}
        variant={variant}
        onConfirm={() => setLast(copy.confirm)}
      >
        <Button icon={variant === "danger" ? Trash2 : Archive}>
          {copy.title.replace("?", "")}
        </Button>
      </Confirm>
      <p aria-live="polite" className="text-body-sm text-secondary">
        {last ? `Confirmado: ${last}` : "Nada confirmado ainda."}
      </p>
    </div>
  );
}

function Static({ variant = "danger" }: { variant?: Variant }) {
  const copy = COPY[variant];
  return (
    <DialogSurface title={copy.title} description={copy.description} size="sm" closable={false}>
      <DialogFooter>
        <Button>Cancel</Button>
        <Button variant={variant}>{copy.confirm}</Button>
      </DialogFooter>
    </DialogSurface>
  );
}

function usePlayground() {
  const [variant, setVariant] = useState<Variant>("danger");
  return {
    preview: <LiveConfirm variant={variant} />,
    controls: (
      <>
        <Field label="variant">
          <Segmented
            label="variant"
            value={variant}
            onChange={setVariant}
            options={[
              { value: "danger", label: "danger" },
              { value: "primary", label: "primary" },
            ]}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          Abra: o foco começa em Cancel. Esc cancela; o clique no fundo não fecha.
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
        title: "Confirm",
        description:
          "Pergunta antes de uma ação que pesa: excluir, arquivar, descartar. A superfície do Dialog sobre o Radix AlertDialog, com Cancel e a ação no rodapé.",
        whenToUse: [
          "Ações destrutivas ou difíceis de desfazer (excluir, remover acesso)",
          "Ações com efeito amplo que valem uma segunda olhada (arquivar um projeto)",
        ],
        whenNotToUse: [
          "Ações que dá para desfazer: faça direto e mostre um Toast com Undo",
          "Coletar dados: use Dialog",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-4">
            <Static variant="danger" />
            <Static variant="primary" />
          </div>
        ),
        states: null,
        statesNote:
          "Fechado ou aberto; os botões têm os próprios estados. A janela aberta desta página é estática (mesmas classes, sem Radix); o comportamento real está no playground.",
        themes: () => <Static />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            A janela sm do Dialog (400 px), sem o X: título de 16/500, descrição de 13 px em
            text-secondary e o rodapé sob a hairline com Cancel (secundário) e a ação (danger ou
            primary) à direita.
          </p>
        ),
        keyboard: [
          "Ao abrir, o foco vai para Cancel: Enter por engano não confirma.",
          "Tab alterna entre Cancel e a ação; Esc cancela e devolve o foco ao gatilho.",
        ],
        accessibility: [
          'Radix AlertDialog: role="alertdialog", com o título como nome e a descrição como aria-describedby.',
          "O clique no fundo não fecha: a decisão é explícita.",
          "A ação danger usa texto -strong sobre o vermelho a 15% (≥ 4,5:1).",
        ],
        content: [
          'Título em pergunta com o verbo ("Delete issue?").',
          "Descrição diz o que acontece e se dá para desfazer.",
          'O botão repete o verbo ("Delete"), nunca "OK" ou "Yes".',
        ],
        dos: ["Diga as consequências", "Prefira Undo quando a ação puder ser desfeita"],
        donts: ["Não confirme ações triviais", "Não use danger em ação que não destrói nada"],
        usage: `import { Confirm } from "@vyzer/design-system/components";

<Confirm
  title="Delete issue?"
  description="VYZ-34 and its sub-issues will be deleted. This can't be undone."
  confirmLabel="Delete"
  onConfirm={deleteIssue}
>
  <Button icon={Trash2}>Delete issue</Button>
</Confirm>`,
        props: [
          { name: "title", type: "ReactNode", description: "Pergunta curta; nome acessível." },
          { name: "description", type: "ReactNode", description: "Consequências da ação." },
          { name: "confirmLabel", type: "string", description: "Verbo da ação." },
          {
            name: "cancelLabel",
            type: "string",
            default: '"Cancel"',
            description: "Rótulo do Cancel.",
          },
          {
            name: "variant",
            type: '"danger" | "primary"',
            default: '"danger"',
            description: "Aparência do botão da ação.",
          },
          {
            name: "onConfirm",
            type: "() => void",
            description: "Chamado ao confirmar; a janela fecha.",
          },
          {
            name: "children",
            type: "ReactElement",
            description: "Gatilho; omita e use open e onOpenChange para abrir por código.",
          },
          {
            name: "open, defaultOpen, onOpenChange, portal",
            type: "Radix",
            description: "Controle da janela; sem portal, herda o tema do contêiner.",
          },
        ],
        decisions: [
          {
            decision: "Foco inicial em Cancel; o fundo não fecha",
            rule: "Comportamento do Radix AlertDialog (spec da Fase 4)",
          },
          {
            decision: "Superfície e rodapé do Dialog, largura sm, sem o X",
            rule: "Reuso do Dialog; Cancel já fecha, o X seria redundante",
          },
          {
            decision: "Ação destrutiva no Button danger",
            rule: "Variante existente do Button (vermelho a 15% com texto -strong)",
          },
        ],
      }}
    />
  );
}
