/**
 * Alert inline: sem desenho no Figma; tons de status (st-*) com as medidas do Toast.
 */
import { Alert, Button, type AlertTone } from "@vyzer/design-system/components";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";

const COPY: Record<AlertTone, { title: string; text: string }> = {
  info: {
    title: "Cycles start on Monday",
    text: "Issues added after the start move to the next cycle.",
  },
  success: { title: "Integration connected", text: "New commits now link to their issues." },
  warning: {
    title: "Your trial ends in 3 days",
    text: "Add a payment method to keep your projects.",
  },
  danger: { title: "Sync failed", text: "The last 2 changes weren't saved. Try again." },
};

const TONES: AlertTone[] = ["info", "success", "warning", "danger"];

function Showcase() {
  return (
    <div className="flex w-full max-w-140 flex-col gap-2">
      {TONES.map((tone) => (
        <Alert key={tone} tone={tone} title={COPY[tone].title}>
          {COPY[tone].text}
        </Alert>
      ))}
      <Alert tone="danger" title="Sync failed" action={<Button>Retry</Button>} onDismiss={() => {}}>
        {COPY.danger.text}
      </Alert>
      <Alert tone="info">Only admins can change workspace settings.</Alert>
    </div>
  );
}

function usePlayground() {
  const [tone, setTone] = useState<AlertTone>("warning");
  const [dismissible, setDismissible] = useState<"on" | "off">("on");
  const [visible, setVisible] = useState(true);
  return {
    preview: visible ? (
      <Alert
        tone={tone}
        title={COPY[tone].title}
        onDismiss={dismissible === "on" ? () => setVisible(false) : undefined}
        className="max-w-140"
      >
        {COPY[tone].text}
      </Alert>
    ) : (
      <Button onClick={() => setVisible(true)}>Show alert again</Button>
    ),
    controls: (
      <>
        <Field label="tone">
          <Segmented
            label="tone"
            value={tone}
            onChange={setTone}
            options={TONES.map((t) => ({ value: t, label: t }))}
          />
        </Field>
        <Field label="onDismiss">
          <Segmented
            label="onDismiss"
            value={dismissible}
            onChange={setDismissible}
            options={[
              { value: "on", label: "com X" },
              { value: "off", label: "sem X" },
            ]}
          />
        </Field>
      </>
    ),
  };
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Alert",
        description:
          "Aviso inline que fica na tela até a situação mudar: info, sucesso, aviso ou erro, com ícone e texto sobre a cor de status a 15%. Sem desenho no Figma.",
        whenToUse: [
          "Condição que afeta a página ou o formulário inteiro (sincronização, permissão, plano)",
          "Resultado que precisa continuar visível (integração conectada)",
        ],
        whenNotToUse: [
          "Confirmar uma ação que acabou: use Toast",
          "Erro de um campo: use a mensagem do Field",
          "Status de um item (issue, projeto): use Badge ou os ícones de status",
        ],
        playground,
        showcase: <Showcase />,
        states: null,
        statesNote:
          "Estático. O X de dispensar e o botão de ação têm os estados do Icon Button e do Button (hover no fundo, linha de foco).",
        themes: () => <Showcase />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Fundo bg-*-subtle (status a 15%), raio de contêiner (10 px), sem borda nem sombra. Ícone
            de 16 px na cor de status, título de 13/500 em text-primary e texto de 13 px em
            text-secondary; ação e X de 28 px à direita. 44 px numa linha.
          </p>
        ),
        keyboard: ["O alerta não recebe foco; Tab passa pela ação e pelo X, quando existem."],
        accessibility: [
          'O ícone tem o nome do tom ("Warning", "Error"), lido antes do título: a cor não é o único sinal.',
          'Sem role por padrão. Um erro que aparece depois de uma ação leva role="alert"; um aviso que muda sozinho, role="status".',
          "Texto primário e secundário sobre o fundo a 15% (≥ 4,5:1 nos dois temas).",
        ],
        content: [
          "Título diz o que aconteceu; o texto, o que fazer.",
          'Ação com um verbo ("Retry", "Upgrade").',
        ],
        dos: ["Um alerta por assunto, perto do que ele afeta"],
        donts: ["Não use warning ou danger para informação neutra", "Não empilhe vários alertas"],
        usage: `import { Alert } from "@vyzer/design-system/components";

<Alert tone="warning" title="Your trial ends in 3 days">
  Add a payment method to keep your projects.
</Alert>

<Alert tone="danger" title="Sync failed" role="alert" action={<Button>Retry</Button>} onDismiss={hide}>
  The last 2 changes weren't saved.
</Alert>`,
        props: [
          {
            name: "tone",
            type: '"info" | "success" | "warning" | "danger"',
            default: '"info"',
            description: "Cor, ícone e nome do tom.",
          },
          { name: "title", type: "ReactNode", description: "Resumo em uma frase." },
          { name: "children", type: "ReactNode", description: "Detalhe e o que fazer." },
          { name: "action", type: "ReactNode", description: "Botão à direita." },
          { name: "onDismiss", type: "() => void", description: "Mostra o X de dispensar." },
          {
            name: "role",
            type: '"alert" | "status"',
            description: "Para avisos que aparecem depois do carregamento.",
          },
        ],
        decisions: [
          {
            decision: "Sem desenho no Figma: fundo de status a 15%, sem borda nem sombra",
            rule: "Mesmos fundos do Badge (bg-*-subtle); sombra só em overlays",
          },
          {
            decision: "Ícones do Health Badge (CircleCheck, TriangleAlert, CircleAlert) e Info",
            rule: "Mesmo significado, mesmo ícone (§11)",
          },
          {
            decision: "44 px numa linha, botões de 28 px",
            rule: "h-row e Button de tamanho único",
          },
        ],
      }}
    />
  );
}
