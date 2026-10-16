/**
 * Toast (Figma 31:19913, o aviso de exclusão do Linear). A mesma peça cobre o resultado de uma
 * ação e as notificações do sistema; os casos da página são estáticos (ToastSurface), os reais
 * saem do playground.
 */
import {
  Button,
  ToastProvider,
  ToastSurface,
  useToast,
  type ToastOptions,
} from "@zynox/design-system/components";
import { StatusIcon } from "@zynox/design-system/icons";
import { Bell, Link2, Mail } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

type Scenario = "deleted" | "archived" | "mention" | "email" | "offline" | "error" | "copied";

const noop = () => {};

/** Um caso por situação usual: o que o produto mostra e com que peças. */
const SCENARIOS: Record<Scenario, Omit<ToastOptions, "duration">> = {
  deleted: {
    title: "Deleted",
    variant: "success",
    subject: { label: "VYZ-3", icon: <StatusIcon type="started" /> },
    description: "You can restore deleted issues from the archive.",
    action: { label: "View recently deleted", onClick: noop },
  },
  archived: {
    title: "Archived",
    subject: { label: "VYZ-12", icon: <StatusIcon type="completed" /> },
    onUndo: noop,
  },
  mention: {
    title: "Ana Souza mentioned you",
    avatar: { name: "Ana Souza" },
    description: "“Can you check the empty state before we ship?” on VYZ-41",
    action: { label: "Open in Inbox", onClick: noop },
  },
  email: {
    title: "New email from Marcos Lima",
    icon: Mail,
    description: "Contract renewal: signed copy attached",
    action: { label: "Open", onClick: noop },
  },
  offline: {
    title: "You're offline",
    variant: "warning",
    description: "Changes are saved on this device and sync when you reconnect.",
  },
  error: {
    title: "Couldn't save changes",
    variant: "error",
    description: "Check your connection and try again.",
    action: { label: "Retry", onClick: noop },
  },
  copied: { title: "Copied to clipboard", icon: Link2 },
};

const SCENARIO_OPTIONS: { value: Scenario; label: string }[] = [
  { value: "deleted", label: "exclusão" },
  { value: "archived", label: "undo" },
  { value: "mention", label: "inbox" },
  { value: "email", label: "e-mail" },
  { value: "offline", label: "offline" },
  { value: "error", label: "erro" },
  { value: "copied", label: "copiado" },
];

function ShowToast({ scenario }: { scenario: Scenario }) {
  const toast = useToast();
  const [last, setLast] = useState<string>();
  const { action, onUndo, ...rest } = SCENARIOS[scenario];
  return (
    <div className="flex flex-col items-center gap-3">
      <Button
        icon={Bell}
        onClick={() =>
          toast({
            ...rest,
            action: action && { ...action, onClick: () => setLast(action.label) },
            onUndo: onUndo && (() => setLast("Undo")),
          })
        }
      >
        Show toast
      </Button>
      <p aria-live="polite" className="text-body-sm text-secondary">
        {last ? `Última ação: ${last}` : "Nenhuma ação ainda."}
      </p>
    </div>
  );
}

function Static({ only }: { only?: Scenario[] }) {
  const list = only ?? SCENARIO_OPTIONS.map((o) => o.value);
  return (
    <div className="flex w-full max-w-92 flex-col gap-2">
      {list.map((s) => (
        <ToastSurface key={s} {...SCENARIOS[s]} />
      ))}
    </div>
  );
}

function usePlayground() {
  const [scenario, setScenario] = useState<Scenario>("deleted");
  return {
    preview: (
      <ToastProvider>
        <ShowToast scenario={scenario} />
      </ToastProvider>
    ),
    controls: (
      <>
        <Field label="situação">
          <Segmented
            label="situação"
            value={scenario}
            onChange={setScenario}
            options={SCENARIO_OPTIONS}
          />
        </Field>
        <p className="self-end text-body-sm text-secondary">
          O aviso some em 5 s; o hover e o foco pausam. F8 leva até ele; Esc ou swipe fecham.
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
        title: "Toast",
        description:
          "Aviso curto e temporário no canto inferior direito: o resultado de uma ação (com Undo, se couber) ou uma notificação do sistema, como uma menção no Inbox ou um e-mail novo.",
        whenToUse: [
          "Confirmar que uma ação terminou (excluído, arquivado, copiado)",
          "Oferecer Undo logo depois de uma ação reversível",
          "Notificar algo que chegou enquanto a pessoa trabalha (menção, e-mail, item no Inbox)",
          "Mudanças de estado do sistema (offline, erro em segundo plano)",
        ],
        whenNotToUse: [
          "Erros de formulário: use a mensagem do Field",
          "Avisos que precisam ficar na tela: use Alert",
          "Decisões antes da ação: use Confirm",
        ],
        playground,
        showcase: <Static />,
        states: null,
        statesNote:
          "Entrando (sobe 4 px), na tela, pausado (hover ou foco), arrastando (segue o swipe) e saindo (fade). Ações em texto: hover e pressionado só no fundo; foco pela linha de campo. Os avisos desta página são estáticos (ToastSurface); os reais saem do playground.",
        themes: () => <Static only={["deleted", "mention", "error"]} />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Superfície dos popovers (raio 12, borda border-strong, bg-popover, sombra md) com 12 px
            de respiro. À esquerda, um de três: ícone de status (success, info, warning, error, nas
            cores st-*), ícone próprio em text-secondary (ex.: Mail) ou o avatar de quem originou.
            Na linha do título (13/500): o objeto (ícone e ID) e o X de 24 px, sem aumentar a linha.
            Abaixo, o detalhe (13/400 com entrelinha de 18, text-secondary) e as ações em texto: a
            principal em text-primary, o Undo em text-secondary. Pilha de até 400 px, a 16 px do
            canto, com 8 px entre avisos.
          </p>
        ),
        keyboard: [
          "F8 leva o foco à área dos avisos; Tab percorre as ações e o X.",
          "Esc com o foco no aviso fecha; o foco no aviso pausa o tempo.",
        ],
        accessibility: [
          "Radix Toast: o título (com o objeto) e o detalhe são anunciados ao aparecer; error e warning interrompem (assertive), os demais esperam (polite).",
          'O ícone de status tem nome ("Success", "Error"...), lido antes do título; o avatar é anunciado pelo nome.',
          "Cada ação tem altText: como fazer o mesmo sem o botão, já que o aviso some.",
          "Hover e foco pausam o tempo (WCAG 2.2.1).",
        ],
        content: [
          'Resultado de ação: verbo no passado e o objeto ("Deleted" + VYZ-3).',
          'Notificação: quem e o quê ("Ana Souza mentioned you"); o detalhe traz a prévia.',
          "Detalhe só quando diz o que fazer ou mostra o item.",
          'Ações curtas, com verbo ("View recently deleted", "Open", "Retry", "Undo").',
        ],
        dos: [
          "Um ToastProvider na raiz da aplicação",
          "Ofereça Undo em ações reversíveis",
          "Mostre quem originou a notificação com o avatar",
        ],
        donts: [
          "Não ponha informação essencial só no toast",
          "Não empilhe avisos em sequência para a mesma ação",
          "Não use botão em pílula como ação: as ações são em texto",
        ],
        usage: `import { ToastProvider, useToast } from "@zynox/design-system/components";

// Raiz da aplicação
<ToastProvider>
  <App />
</ToastProvider>

const toast = useToast();

// Resultado de uma ação
toast({
  title: "Deleted",
  variant: "success",
  subject: { label: "VYZ-3", icon: <StatusIcon type="started" /> },
  description: "You can restore deleted issues from the archive.",
  action: { label: "View recently deleted", onClick: openArchive },
});
toast({ title: "Archived", subject: { label: "VYZ-12" }, onUndo: restore });

// Notificação
toast({
  title: "Ana Souza mentioned you",
  avatar: { name: "Ana Souza", src: ana.avatarUrl },
  description: comment.preview,
  action: { label: "Open in Inbox", onClick: openInbox },
});`,
        props: [
          { name: "title", type: "string", description: "Frase curta, sem ponto final." },
          {
            name: "subject",
            type: "{ label, icon? }",
            description: "O objeto ao lado do título (ex.: status e ID da issue).",
          },
          {
            name: "description",
            type: "ReactNode",
            description: "O que fazer, ou a prévia do item.",
          },
          {
            name: "variant",
            type: '"default" | "success" | "info" | "warning" | "error"',
            default: '"default"',
            description: "Ícone e cor de status.",
          },
          {
            name: "icon",
            type: "LucideIcon",
            description: "Ícone próprio no lugar do de status (ex.: Mail).",
          },
          {
            name: "avatar",
            type: "{ name, src? }",
            description: "Quem originou: vai no lugar do ícone.",
          },
          {
            name: "action",
            type: "{ label, onClick, altText? }",
            description: "Ação em texto; altText padrão é o rótulo.",
          },
          { name: "onUndo", type: "() => void", description: "Mostra o Undo." },
          {
            name: "duration",
            type: "number",
            default: "5000",
            description: "Tempo na tela em ms (padrão do Radix).",
          },
          {
            name: "ToastProvider",
            type: "componente",
            description: "Pilha e área dos avisos; um por aplicação.",
          },
          {
            name: "ToastSurface",
            type: "componente",
            description: "O aviso fixo na página (documentação).",
          },
        ],
        decisions: [
          {
            decision: "Ações em texto abaixo do detalhe; ao lado do X, nada",
            rule: "Figma 31:19913 (o botão em pílula pesava demais)",
          },
          {
            decision: "Ação principal em text-primary, não no azul do Figma",
            rule: "Sem token de link; terracota só na sidebar e nos contadores",
          },
          {
            decision: "Avatar ou ícone próprio no lugar do status, para notificações",
            rule: "Reuso do Avatar e do Icon do design system",
          },
          {
            decision: "Entra subindo 4 px (180 ms) e sai com fade; 5 s, pausado no hover e no foco",
            rule: "Tokens de movimento de overlay; WCAG 2.2.1",
          },
        ],
      }}
    />
  );
}
