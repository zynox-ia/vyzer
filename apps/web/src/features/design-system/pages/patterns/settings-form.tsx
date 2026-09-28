/**
 * Formulário de Settings (spec Fase 10, item 1): seções com hairline, linha de rótulo e
 * controle, e Save no rodapé. Sem frame vivo no Figma (o nó antigo de Settings "General" foi
 * removido; o nó 33:20122 citado na revisão final só tem a navegação lateral, área de conteúdo
 * vazia — nada de campo para comparar). Segue a página real "Team → General" do Linear
 * (linear.app/zynox-dev/settings/teams/VYZ/general, conferida ao vivo em 28/09): nome e
 * identificador, descrição do time, estimativa de issue, criação por e-mail, fuso horário e
 * histórico detalhado — os mesmos campos, na mesma ordem.
 *
 * Depende da Fase 8 para a navegação lateral de Settings ao redor; esta página mostra só o
 * formulário, como todo item de /design-system (spec, "Dependências entre fases").
 */
import {
  Button,
  FormLabel,
  FormMessage,
  HelperText,
  Select,
  Switch,
  TextArea,
  TextInput,
  type ListOption,
} from "@vyzer/design-system/components";
import { useId, useState, type FormEvent, type ReactNode } from "react";
import { PatternPage } from "../../kit/pattern-page";
import { StatesGrid } from "../../kit/states";

/**
 * Linha rótulo-à-esquerda/controle-à-direita, montada direto (não com `Field orientation=
 * "horizontal"`): o grid do Field horizontal coloca o filho antes do rótulo — pensado para um
 * controle pequeno ao lado do texto (Checkbox, Switch, como em forms/switch.tsx), não para
 * "rótulo estreito à esquerda, controle largo à direita". Aqui a grade é montada com as mesmas
 * peças do Field (FormLabel, HelperText, FormMessage, já existentes), na ordem que este pattern
 * pede; sem prop nova em nenhum componente.
 */
function Row({
  label,
  description,
  error,
  children,
}: {
  label: string;
  description?: string;
  error?: string;
  children: (id: string) => ReactNode;
}) {
  const id = useId();
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-6 gap-y-1">
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <div className="flex min-w-0">{children(id)}</div>
      {(description || error) && (
        <div aria-live="polite" className="col-start-2">
          {error ? <FormMessage>{error}</FormMessage> : <HelperText>{description}</HelperText>}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 border-t border-default pt-6 first:border-t-0 first:pt-0">
      <h3 className="type-heading-3 text-primary">{title}</h3>
      <div className="flex flex-col gap-5">{children}</div>
    </section>
  );
}

const ESTIMATION_OPTIONS: ListOption[] = [
  { value: "none", label: "Not in use" },
  { value: "exponential", label: "Exponential (1, 2, 4, 8)" },
  { value: "fibonacci", label: "Fibonacci (1, 2, 3, 5, 8)" },
  { value: "linear", label: "Linear (1–10)" },
  { value: "tshirt", label: "T-shirt sizes (XS–XL)" },
];

const TIMEZONE_OPTIONS: ListOption[] = [
  { value: "gmt-3", label: "GMT-3:00 – Brasilia Time" },
  { value: "gmt+0", label: "GMT+0:00 – London" },
  { value: "gmt-8", label: "GMT-8:00 – Pacific Time" },
];

type Values = {
  name: string;
  identifier: string;
  description: string;
  estimation: string;
  issueEmail: boolean;
  timezone: string;
  detailedHistory: boolean;
};

const INITIAL: Values = {
  name: "Vyzer",
  identifier: "VYZ",
  description: "",
  estimation: "none",
  issueEmail: true,
  timezone: "gmt-3",
  detailedHistory: false,
};

/** Save fica desabilitado sem alterações (padrão dos outros formulários do sistema). */
function SettingsForm() {
  const [saved, setSaved] = useState(INITIAL);
  const [values, setValues] = useState(INITIAL);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  const set =
    <K extends keyof Values>(key: K) =>
    (v: Values[K]) =>
      setValues((prev) => ({ ...prev, [key]: v }));

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!dirty) return;
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(values);
    }, 700);
  };

  return (
    // Enter num campo de texto não deve submeter a seção inteira: sem isso, o navegador trata o
    // Enter no TextInput como o clique implícito no primeiro submit do form (o botão Save).
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <form
      onSubmit={onSubmit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
          e.preventDefault();
        }
      }}
      className="flex w-full max-w-content flex-col gap-6"
    >
      {/* Name e Identifier ficam sem cabeçalho de seção: o Linear real (settings/teams/VYZ/general)
          não tem um "General" antes deles — "Description" é o primeiro <h3> da página. */}
      <div className="flex flex-col gap-5">
        <Row label="Name">
          {(id) => (
            <TextInput
              id={id}
              value={values.name}
              onChange={(e) => set("name")(e.target.value)}
              className="w-full"
            />
          )}
        </Row>
        <Row label="Identifier" description="Used in issue IDs">
          {(id) => (
            <TextInput
              id={id}
              value={values.identifier}
              onChange={(e) => set("identifier")(e.target.value)}
              className="w-full"
            />
          )}
        </Row>
      </div>
      <Section title="Description">
        <Row label="Team description" description="A short summary shown on the team page">
          {(id) => (
            <TextArea
              id={id}
              value={values.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="e.g. Builds and maintains core platform infrastructure"
              rows={2}
              className="w-full"
            />
          )}
        </Row>
      </Section>
      <Section title="Estimates">
        <Row
          label="Issue estimation"
          description="Used to estimate issue complexity and plan cycle capacity."
        >
          {(id) => (
            <Select
              trigger="field"
              id={id}
              options={ESTIMATION_OPTIONS}
              value={values.estimation}
              onValueChange={set("estimation")}
            />
          )}
        </Row>
      </Section>
      <Section title="Create issues by email">
        <Row
          label="Enable issue creation by email"
          description="Use a team-specific email address to create and collaborate on issues via email."
        >
          {(id) => (
            <Switch id={id} checked={values.issueEmail} onCheckedChange={set("issueEmail")} />
          )}
        </Row>
      </Section>
      <Section title="Timezone">
        <Row label="Timezone" description="Used for team schedules, dates, and cycle start times">
          {(id) => (
            <Select
              trigger="field"
              id={id}
              options={TIMEZONE_OPTIONS}
              value={values.timezone}
              onValueChange={set("timezone")}
            />
          )}
        </Row>
      </Section>
      <Section title="Other">
        <Row
          label="Enable detailed issue history"
          description="Each change to an issue receives and persists a distinct history entry."
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.detailedHistory}
              onCheckedChange={set("detailedHistory")}
            />
          )}
        </Row>
      </Section>
      <div className="flex justify-end border-t border-default pt-6">
        <Button type="submit" variant="primary" disabled={!dirty || saving} loading={saving}>
          Save
        </Button>
      </div>
    </form>
  );
}

function States() {
  return (
    <div className="flex flex-col gap-6">
      <StatesGrid
        states={[
          {
            label: "padrão",
            node: <Row label="Name">{(id) => <TextInput id={id} defaultValue="Vyzer" />}</Row>,
          },
          {
            label: "foco",
            node: (
              <Row label="Name">
                {(id) => <TextInput id={id} defaultValue="Vyzer" data-preview="focus" />}
              </Row>
            ),
          },
          {
            label: "desabilitado",
            node: (
              <Row label="Name">{(id) => <TextInput id={id} defaultValue="Vyzer" disabled />}</Row>
            ),
          },
          {
            label: "erro",
            node: (
              <Row label="Identifier" error="This identifier is already taken.">
                {(id) => <TextInput id={id} defaultValue="VYZ" />}
              </Row>
            ),
          },
          {
            label: "Save · sem alterações",
            node: (
              <Button variant="primary" disabled>
                Save
              </Button>
            ),
          },
          {
            label: "Save · carregando",
            node: (
              <Button variant="primary" loading>
                Save
              </Button>
            ),
          },
        ]}
      />
      <p className="max-w-prose text-body-sm text-secondary">
        Vazio não se aplica a este pattern: o formulário sempre mostra os campos da seção. Erro por
        campo usa <code className="font-mono text-code">FormMessage</code> (ver a linha
        &quot;erro&quot; acima), a mesma peça do Field.
      </p>
    </div>
  );
}

export function Page() {
  return (
    <PatternPage
      doc={{
        title: "Settings Form",
        description:
          "Formulário de configurações (Linear settings/teams/VYZ/general, sem frame no Figma): seções com título e hairline, cada linha com rótulo à esquerda e controle à direita, e Save no rodapé. Mesmos campos, na mesma ordem, do Team → General real do Linear.",
        live: <SettingsForm />,
        liveDescription:
          "Altere um campo: Save habilita. Enter num campo de texto não envia a seção inteira (só o botão Save envia).",
        states: <States />,
        themes: (theme) => <SettingsForm key={theme} />,
        composition: [
          <>
            Seção: título <code className="font-mono text-code">type-heading-3</code> e hairline{" "}
            <code className="font-mono text-code">border-default</code> entre seções — mesma quebra
            do Linear (Name/Identifier sem cabeçalho, depois Description, Estimates, Create issues
            by email, Timezone, Other).
          </>,
          <>
            Linha: grade de duas colunas (<code className="font-mono text-code">auto 1fr</code>)
            montada com <code className="font-mono text-code">FormLabel</code>/
            <code className="font-mono text-code">HelperText</code>/
            <code className="font-mono text-code">FormMessage</code> — as mesmas peças do{" "}
            <code className="font-mono text-code">Field</code>, sem depender da orientação
            horizontal dele (que coloca o controle antes do rótulo, pensada para Checkbox/Switch
            pequenos, não para um controle largo à direita de um rótulo estreito).
          </>,
          <>
            Controles conforme o campo: <code className="font-mono text-code">TextInput</code>,{" "}
            <code className="font-mono text-code">TextArea</code>,{" "}
            <code className="font-mono text-code">Select trigger=&quot;field&quot;</code>,{" "}
            <code className="font-mono text-code">Switch</code>.
          </>,
          <>
            Rodapé: <code className="font-mono text-code">Button</code> primary &quot;Save&quot;,
            desabilitado sem alterações pendentes e com o estado{" "}
            <code className="font-mono text-code">loading</code> já existente ao salvar.
          </>,
        ],
        decisions: [
          {
            decision:
              "Sem frame vivo (Settings General foi removido do Figma; o nó 33:20122 citado na revisão final só tem a navegação lateral, sem conteúdo de campo)",
            rule: "Spec Fase 10: segue o Linear (settings/teams/VYZ/general, conferido ao vivo)",
          },
          {
            decision:
              "Mesmos campos e mesma ordem do Team → General real: Name/Identifier, Description, Estimates, Create issues by email, Timezone, Other",
            rule: "Linear (Team → General), conferido ao vivo em 28/09 e na revisão final",
          },
          {
            decision: 'Name e Identifier sem cabeçalho de seção (sem "General")',
            rule: 'Linear real: "Description" é o primeiro <h3> da página, não "General" — corrigido na revisão de fidelidade de 28/09',
          },
          {
            decision:
              'Linha com rótulo à esquerda e controle à direita montada com as peças do Field (FormLabel/HelperText/FormMessage), não com Field orientation="horizontal"',
            rule: "Field horizontal renderiza o controle antes do rótulo no grid (auto 1fr): correto para Checkbox/Switch (forms/checkbox.tsx, forms/switch.tsx), errado para um controle largo — nota de implementação, não pede aprovação",
          },
          {
            decision: "Save desabilitado sem alterações; Enter no campo não envia a seção",
            rule: "Padrão dos formulários do sistema (spec Fase 10, §Comportamento)",
          },
          {
            decision: "Vazio não se aplica; erro por campo usa FormMessage",
            rule: "Spec Fase 10, §Estados",
          },
        ],
      }}
    />
  );
}
