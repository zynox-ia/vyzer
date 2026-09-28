import { Button, TextInput, type ButtonVariant } from "@vyzer/design-system/components";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";
import { StatesGrid } from "../../kit/states";

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];

function usePlayground() {
  const [variant, setVariant] = useState<ButtonVariant>("primary");
  const [icon, setIcon] = useState<"none" | "leading" | "trailing">("leading");
  const [state, setState] = useState<"default" | "loading" | "disabled">("default");
  const [label, setLabel] = useState("Create issue");
  return {
    preview: (
      <Button
        variant={variant}
        icon={icon === "leading" ? Plus : undefined}
        trailingIcon={icon === "trailing" ? ChevronDown : undefined}
        loading={state === "loading"}
        disabled={state === "disabled"}
      >
        {label}
      </Button>
    ),
    controls: (
      <>
        <Field label="variant">
          <Segmented
            label="variant"
            value={variant}
            onChange={setVariant}
            options={VARIANTS.map((v) => ({ value: v, label: v }))}
          />
        </Field>
        <Field label="ícone">
          <Segmented
            label="ícone"
            value={icon}
            onChange={setIcon}
            options={[
              { value: "none", label: "nenhum" },
              { value: "leading", label: "icon" },
              { value: "trailing", label: "trailingIcon" },
            ]}
          />
        </Field>
        <Field label="estado">
          <Segmented
            label="estado"
            value={state}
            onChange={setState}
            options={[
              { value: "default", label: "default" },
              { value: "loading", label: "loading" },
              { value: "disabled", label: "disabled" },
            ]}
          />
        </Field>
        <Field label="rótulo">
          <TextInput
            aria-label="Rótulo do botão"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
        </Field>
      </>
    ),
  };
}

function States({ variant }: { variant: ButtonVariant }) {
  return (
    <StatesGrid
      states={[
        { label: "default", node: <Button variant={variant}>Save changes</Button> },
        {
          label: "hover",
          node: (
            <Button variant={variant} data-preview="hover">
              Save changes
            </Button>
          ),
        },
        {
          label: "focus-visible",
          node: (
            <Button variant={variant} data-preview="focus">
              Save changes
            </Button>
          ),
        },
        {
          label: "pressed",
          node: (
            <Button variant={variant} data-preview="hover active">
              Save changes
            </Button>
          ),
        },
        {
          label: "loading",
          node: (
            <Button variant={variant} loading>
              Save changes
            </Button>
          ),
        },
        {
          label: "disabled",
          node: (
            <Button variant={variant} disabled>
              Save changes
            </Button>
          ),
        },
      ]}
    />
  );
}

export function Page() {
  const playground = usePlayground();
  return (
    <ComponentPage
      doc={{
        title: "Button",
        description:
          "Dispara uma ação. Pílula, como no Figma. O primário é chapado (#f0eee6 no escuro, grafite no claro) e o hover segue o Linear: só o fundo muda, sem subir nem brilhar.",
        whenToUse: [
          "Ações de formulário e de diálogo (Create issue, Save changes, Cancel)",
          "Ações de cabeçalho de página (New project)",
        ],
        whenNotToUse: [
          "Navegação para outra página: use link (ou Button com asChild envolvendo o link)",
          "Ação só com ícone: use Icon Button",
          "Filtros e propriedades de issue: use os chips e menus da Fase 3",
        ],
        playground,
        showcase: (
          <DocTable
            caption="Variantes (tamanho único: 28 px)"
            columns={["Variante", "Só rótulo", "Com ícone", "Com ícone à direita"]}
            rows={VARIANTS.map((v) => [
              <Code key="v">{v}</Code>,
              <Button key="l" variant={v}>
                Save changes
              </Button>,
              <Button key="i" variant={v} icon={Plus}>
                New project
              </Button>,
              <Button key="t" variant={v} trailingIcon={ChevronDown}>
                Status
              </Button>,
            ])}
          />
        ),
        states: (
          <div className="flex flex-col gap-4">
            {VARIANTS.map((v) => (
              <div key={v} className="flex flex-col gap-2">
                <Code>{v}</Code>
                <States variant={v} />
              </div>
            ))}
          </div>
        ),
        themes: () => (
          <div className="flex flex-wrap gap-2">
            {VARIANTS.map((v) => (
              <Button key={v} variant={v}>
                {v === "danger" ? "Delete team" : v === "primary" ? "Create issue" : "Cancel"}
              </Button>
            ))}
            <Button variant="primary" data-preview="focus">
              Focused
            </Button>
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Contêiner em pílula com borda de 1 px (transparente, exceto no secundário, que reserva o
            tamanho como no Figma), ícone opcional à esquerda ou à direita e rótulo. No carregamento
            o spinner ocupa o lugar do ícone e a largura não muda. Tamanho único: 28 px de altura,
            12 px de padding (10 px do lado do ícone), rótulo de 12 px/500 e ícone de 16 px.
          </p>
        ),
        keyboard: ["Tab foca; Enter e Espaço acionam.", "Desabilitado sai da ordem de Tab."],
        accessibility: [
          'É um <button type="button"> por padrão; em formulário, passe type="submit".',
          'Carregando: aria-busy="true" e cliques ignorados; o rótulo continua lido.',
          "Foco por teclado com a espessura dos campos (1 px, sem halo) na cor de foco do sistema. Por dentro da borda; no primário, por fora (offset +1 px), porque o acento sobre o fundo claro do botão no escuro dá 2,96:1.",
          "Rótulo e fundo: primário ≥ 4,5:1 (text-inverse sobre bg-primary-button e o hover, medido em Foundations → Colors); danger usa o texto -strong sobre a cor a 15% (≥ 4,5:1).",
        ],
        content: [
          'Verbo + objeto, sentence case, sem ponto final: "Create issue", "Save changes".',
          "Uma ação primária por contexto.",
        ],
        dos: ["Um primário por tela ou diálogo", "Danger só para ações destrutivas e confirmadas"],
        donts: ["Não use dois primários lado a lado", 'Não troque o rótulo por "OK" ou "Submit"'],
        usage: `import { Button } from "@vyzer/design-system/components";
import { Plus } from "lucide-react";

<Button variant="primary" icon={Plus}>Create issue</Button>
<Button variant="ghost">Cancel</Button>
<Button asChild variant="secondary"><a href="/projects">Open projects</a></Button>`,
        props: [
          {
            name: "variant",
            type: '"primary" | "secondary" | "ghost" | "danger"',
            default: '"secondary"',
            description: "Peso visual.",
          },
          { name: "icon", type: "LucideIcon", description: "Ícone à esquerda." },
          { name: "trailingIcon", type: "LucideIcon", description: "Ícone à direita (ex.: menu)." },
          {
            name: "loading",
            type: "boolean",
            default: "false",
            description: "Spinner e cliques bloqueados, mesma largura.",
          },
          {
            name: "asChild",
            type: "boolean",
            default: "false",
            description: "Aplica o visual no filho (link).",
          },
          { name: "…", type: "ButtonHTMLAttributes", description: "Demais atributos do <button>." },
        ],
        decisions: [
          { decision: "Pílula (rounded-full)", rule: "Figma: botões em 9999 (1:12645, 1:3200)" },
          {
            decision: "Tamanho único: 28 px (h-control-md), sem variação",
            rule: 'Pedido do responsável; Figma 28 nos botões de formulário ("Save changes")',
          },
          {
            decision: "Rótulo 12 px/500",
            rule: "Figma 12 Medium nos botões de 24–28",
          },
          {
            decision: "Padding 12 px; lado do ícone 10 px",
            rule: "Figma 0/10 + 2 px a pedido do responsável, como nas pílulas; §1 horizontal ≥ vertical",
          },
          { decision: "Gap ícone–texto 4–6 px", rule: "§10 0,4–0,6 × o tamanho do texto" },
          { decision: "Hover 4% e pressionado 10% como camadas", rule: "§12 estados translúcidos" },
          { decision: "Primário invertido, sem acento", rule: "ADR-0011; §3 orçamento de ênfase" },
          {
            decision: "Primário chapado: #f0eee6 (warm-100) no escuro, grafite (warm-950) no claro",
            rule: "Pedido do responsável (sem degradê); no claro o creme some no fundo #faf9f5 (1,06:1)",
          },
          {
            decision: "Rótulo ≥ 4,5:1 contra o fundo e o hover do primário",
            rule: "§3 texto normal (medido em Foundations → Colors, text-inverse)",
          },
          {
            decision:
              "Hover como no Linear: só o fundo muda (camada bg-hover; no primário, bg-primary-button-hover), sem subir nem brilhar",
            rule: "Pedido do responsável (padrão do Linear, §7 Jakob); 120 ms de cor (§8)",
          },
          {
            decision:
              "Foco com a espessura dos campos (1 px, sem halo) na cor de acento (focus-line); por fora no primário",
            rule: "Pedido do responsável; §12 foco ≥ 3:1 (por dentro, no primário, mediu 2,96:1)",
          },
          { decision: "Transição de cor 120 ms", rule: "§8 micro-interações 100–150 ms" },
        ],
      }}
    />
  );
}
