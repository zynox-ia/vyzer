/**
 * Chip / Tag (Figma 1:6914, 1:6948, 1:8881, 1:8888; chips de vista em 1:7524 e 1:5655, na tela
 * Projects 1:4813 e nas vistas de issues).
 */
import { Button, Chip, ProjectIcon, type ChipVariant } from "@zynox/design-system/components";
import { Icon, PriorityIcon } from "@zynox/design-system/icons";
import { Layers, OctagonMinus, Pencil } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { PROJECTS } from "../../kit/project-data";
import { StatesGrid } from "../../kit/states";

const plugga = PROJECTS[1]!;

/** Valores numa linha de issue e num cartão do board (Figma 1:6914, 1:6948, 1:8881). */
function ValueChips() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Chip icon={<ProjectIcon value={plugga.icon} />}>{plugga.label}</Chip>
      <Chip
        icon={<Icon icon={OctagonMinus} className="text-red" />}
        count={2}
        label="Blocked by 2 issues"
      />
      <Chip icon={<PriorityIcon priority="urgent" />} label="Urgent priority" />
      <Chip color="red">Bug</Chip>
      <Chip color="purple">Feature</Chip>
    </div>
  );
}

const VIEWS = [
  { value: "active", label: "Active" },
  { value: "backlog", label: "Backlog" },
  { value: "all", label: "All issues" },
];

/** Vistas salvas (Figma 1:7524): a atual em destaque e o rascunho "New view" no fim. */
function ViewChips({ initial = "all" }: { initial?: string }) {
  const [view, setView] = useState(initial);
  return (
    <div className="flex flex-wrap items-center gap-1">
      {VIEWS.map((v) => (
        <Chip
          key={v.value}
          variant="filled"
          active={view === v.value}
          onClick={() => setView(v.value)}
        >
          {v.label}
        </Chip>
      ))}
      <Chip
        variant="draft"
        icon={<Icon icon={Layers} className="text-secondary" />}
        trailing={<Icon icon={Pencil} />}
        onClick={() => {}}
      >
        New view
      </Chip>
    </div>
  );
}

function usePlayground() {
  const [variant, setVariant] = useState<ChipVariant>("outline");
  const [lead, setLead] = useState<"icon" | "color" | "none">("icon");
  const [count, setCount] = useState<"no" | "yes">("no");
  const [removable, setRemovable] = useState<"no" | "yes">("no");
  const [removed, setRemoved] = useState(false);
  const [active, setActive] = useState(true);

  const common = {
    variant,
    icon: lead === "icon" ? <ProjectIcon value={plugga.icon} /> : undefined,
    color: lead === "color" ? ("green" as const) : undefined,
    count: count === "yes" ? 3 : undefined,
  };
  let preview;
  if (removed) {
    preview = (
      <Button variant="ghost" onClick={() => setRemoved(false)}>
        Restore chip
      </Button>
    );
  } else if (variant === "outline" && removable === "yes") {
    preview = (
      <Chip {...common} onRemove={() => setRemoved(true)}>
        Plugga OS
      </Chip>
    );
  } else if (variant === "outline") {
    preview = <Chip {...common}>Plugga OS</Chip>;
  } else {
    preview = (
      <Chip {...common} active={variant === "filled" && active} onClick={() => setActive(!active)}>
        {variant === "draft" ? "New view" : "All issues"}
      </Chip>
    );
  }

  return {
    preview,
    controls: (
      <>
        <Field label="variant">
          <Segmented
            label="variant"
            value={variant}
            onChange={setVariant}
            options={[
              { value: "outline", label: "outline" },
              { value: "filled", label: "filled" },
              { value: "draft", label: "draft" },
            ]}
          />
        </Field>
        <Field label="antes do rótulo">
          <Segmented
            label="antes do rótulo"
            value={lead}
            onChange={setLead}
            options={[
              { value: "icon", label: "icon" },
              { value: "color", label: "color" },
              { value: "none", label: "nada" },
            ]}
          />
        </Field>
        <Field label="count">
          <Segmented
            label="count"
            value={count}
            onChange={setCount}
            options={[
              { value: "no", label: "não" },
              { value: "yes", label: "sim" },
            ]}
          />
        </Field>
        <Field label="removível (outline)">
          <Segmented
            label="removível (outline)"
            value={removable}
            onChange={setRemovable}
            options={[
              { value: "no", label: "não" },
              { value: "yes", label: "sim" },
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
        title: "Chip",
        description:
          'Rótulo compacto de um valor (projeto, label, relação) ou de uma vista salva (Figma 1:6914, 1:6948, 1:8881, 1:8888 e os chips de vista de 1:4813). Pílula de 24 px sem fundo para valores; de 28 px em relevo para vistas; tracejada para a vista ainda sem nome ("New view").',
        whenToUse: [
          "Mostrar o valor de uma propriedade numa linha ou cartão: projeto, label, relação com contagem",
          'Vistas salvas no topo de uma lista ("All issues", "Active"), com a atual em destaque',
          "Valores removíveis numa seleção (labels escolhidas)",
        ],
        whenNotToUse: [
          "Estado (Done, At risk): use Badge",
          "Abrir o seletor de uma propriedade: use Property Button",
          "Ligar e desligar opções: use Toggle Group",
        ],
        playground,
        showcase: (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-caption text-secondary">
                outline · valor (24 px): projeto, relação com contagem, prioridade só com ícone e
                labels
              </span>
              <ValueChips />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-caption text-secondary">
                filled · vistas (28 px), com o rascunho draft no fim
              </span>
              <ViewChips />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-caption text-secondary">outline · removível</span>
              <div className="flex flex-wrap gap-2">
                <Chip color="red" onRemove={() => {}}>
                  Bug
                </Chip>
                <Chip color="purple" onRemove={() => {}}>
                  Feature
                </Chip>
              </div>
            </div>
          </div>
        ),
        states: (
          <StatesGrid
            states={[
              {
                label: "só leitura",
                node: <Chip icon={<ProjectIcon value={plugga.icon} />}>Plugga OS</Chip>,
              },
              {
                label: "clicável",
                node: (
                  <Chip icon={<ProjectIcon value={plugga.icon} />} onClick={() => {}}>
                    Plugga OS
                  </Chip>
                ),
              },
              {
                label: "hover",
                node: (
                  <Chip
                    icon={<ProjectIcon value={plugga.icon} />}
                    onClick={() => {}}
                    data-preview="hover"
                  >
                    Plugga OS
                  </Chip>
                ),
              },
              {
                label: "focus-visible",
                node: (
                  <Chip
                    icon={<ProjectIcon value={plugga.icon} />}
                    onClick={() => {}}
                    data-preview="focus"
                  >
                    Plugga OS
                  </Chip>
                ),
              },
              {
                label: "vista inativa",
                node: (
                  <Chip variant="filled" active={false} onClick={() => {}}>
                    Backlog
                  </Chip>
                ),
              },
              {
                label: "vista inativa + hover",
                node: (
                  <Chip variant="filled" active={false} onClick={() => {}} data-preview="hover">
                    Backlog
                  </Chip>
                ),
              },
              {
                label: "vista ativa",
                node: (
                  <Chip variant="filled" active onClick={() => {}}>
                    All issues
                  </Chip>
                ),
              },
              {
                label: "rascunho",
                node: (
                  <Chip
                    variant="draft"
                    icon={<Icon icon={Layers} className="text-secondary" />}
                    trailing={<Icon icon={Pencil} />}
                    onClick={() => {}}
                  >
                    New view
                  </Chip>
                ),
              },
              {
                label: "com contagem",
                node: (
                  <Chip
                    icon={<Icon icon={OctagonMinus} className="text-red" />}
                    count={2}
                    label="Blocked by 2 issues"
                  />
                ),
              },
              {
                label: "removível",
                node: (
                  <Chip color="cyan" onRemove={() => {}}>
                    Improvement
                  </Chip>
                ),
              },
              {
                label: "disabled",
                node: (
                  <Chip variant="filled" active={false} disabled onClick={() => {}}>
                    Backlog
                  </Chip>
                ),
              },
            ]}
          />
        ),
        themes: () => (
          <div className="flex flex-col gap-4">
            <ValueChips />
            <ViewChips />
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            outline: pílula de 24 px sem fundo, com o anel de relevo (shadow-raised), 8 px nas
            laterais, ícone ou bolinha de cor de 14 px, 6 px até o rótulo de 12 px Regular em
            text-secondary; a contagem vem depois, em algarismos tabulares. Só com ícone, vira um
            quadrado de 24 px. filled: pílula de 28 px, fundo de controle forte e relevo, 10 px nas
            laterais, 12 px/500; a vista ativa ganha a camada de pressionado e texto primário.
            draft: borda tracejada border-strong, ícone, rótulo em text-placeholder e o lápis no
            fim. Removível: botão de 16 px com X de 12 px no fim. Trunca a 200 px.
          </p>
        ),
        keyboard: [
          "Chip só de leitura não recebe foco.",
          "Chip clicável é um botão (ou o link que ele envolve): Tab foca; Enter ou Espaço ativa.",
          "Removível: Tab foca o botão de remover; Enter, Espaço, Backspace ou Delete removem.",
        ],
        accessibility: [
          'Chip só de ícone ou de contagem recebe um label ("Urgent priority", "Blocked by 2 issues"), lido no lugar do conteúdo visual.',
          'O botão de remover tem nome ("Remove Bug").',
          "Vista ativa como botão: aria-pressed. Como link (asChild com NavLink): aria-current, posto pelo próprio link.",
          "Texto em text-secondary (≥ 4,5:1); o rascunho usa text-placeholder, que também chega a 4,5:1.",
        ],
        content: [
          "Rótulo curto: o nome do valor ou da vista, sem verbo.",
          'Rascunho com nome provisório ("New view") até a vista ser salva.',
        ],
        dos: [
          "Use outline para valores e filled para vistas",
          "Dê um label ao chip sem texto visível",
        ],
        donts: [
          "Não use chip para estado: use Badge",
          "Não misture chips clicáveis e só de leitura no mesmo grupo",
        ],
        usage: `import { Chip } from "@zynox/design-system/components";

<Chip icon={<ProjectIcon value={project.icon} />}>Plugga OS</Chip>
<Chip icon={<Icon icon={OctagonMinus} className="text-red" />} count={2} label="Blocked by 2 issues" />
<Chip color="red" onRemove={() => removeLabel("bug")}>Bug</Chip>

// Vistas: link com a aparência do chip
<Chip variant="filled" active={isCurrent} asChild>
  <NavLink to="?view=active">Active</NavLink>
</Chip>
<Chip variant="draft" icon={<Icon icon={Layers} />} trailing={<Icon icon={Pencil} />} onClick={nameView}>
  New view
</Chip>`,
        props: [
          {
            name: "variant",
            type: '"outline" | "filled" | "draft"',
            default: '"outline"',
            description: "Valor, vista salva ou vista sem nome.",
          },
          {
            name: "size",
            type: '"sm" | "md"',
            default: "sm (outline), md (demais)",
            description: "24 ou 28 px.",
          },
          { name: "icon", type: "ReactNode", description: "Ícone de 14 px antes do rótulo." },
          {
            name: "color",
            type: "LabelColor | HexColor",
            description: "Bolinha de cor (label), no lugar do ícone.",
          },
          { name: "count", type: "number", description: "Contagem depois do rótulo." },
          { name: "trailing", type: "ReactNode", description: "Conteúdo no fim (lápis)." },
          {
            name: "label",
            type: "string",
            description: "Nome para leitores de tela; obrigatório sem texto visível.",
          },
          {
            name: "onClick",
            type: "(event) => void",
            description: "Torna o chip um botão.",
          },
          {
            name: "asChild",
            type: "boolean",
            description: "Aplica a aparência ao filho (link de vista).",
          },
          {
            name: "active",
            type: "boolean",
            description: "Vista atual (filled): pressionado e texto primário.",
          },
          {
            name: "onRemove",
            type: "() => void",
            description: "Mostra o botão de remover (não combina com onClick).",
          },
          {
            name: "removeLabel",
            type: "string",
            default: '"Remove " + rótulo',
            description: "Nome do botão de remover.",
          },
        ],
        decisions: [
          {
            decision: "Valor: pílula de 24 px, 8 px nas laterais, ícone de 14 e 6 px até o texto",
            rule: "Figma 1:6914 e 1:8888 (h 24, r 48, px 8, ícone 14, pl 6)",
          },
          {
            decision: "Contorno do valor pelo anel de relevo (shadow-raised), sem fundo próprio",
            rule: "Figma: #28282b sobre #121213 e #2f3033 sobre #1a1a1b são o anel branco de 9% achatado; ADR-0013 (relevo em chips)",
          },
          {
            decision: "Rótulo de valor em 12 px Regular, text-secondary",
            rule: "Figma 1:6920 (12 Regular #959597)",
          },
          {
            decision: "Chip só de ícone com 24 × 24 px (Figma: 25 × 24)",
            rule: "Figma 1:8881; grid de 4 (skill §1)",
          },
          {
            decision: "Contagem depois do ícone, 6 px, algarismos tabulares",
            rule: "Figma 1:6948 (pl 6); números alinhados em listas",
          },
          {
            decision:
              "Vista: pílula de 28 px, 10 px nas laterais, 12 px/500, fundo de controle forte e relevo",
            rule: "Figma 1:7525 (h 28, px 10, 12 Medium, #1c1c1d + anel 9% e contato)",
          },
          {
            decision: "Vista ativa com a camada de pressionado e texto primário",
            rule: "Figma 1:5063 (#29292b, branco); mesmo padrão dos chips ligados do Toggle Group (18:871)",
          },
          {
            decision:
              "Rascunho com borda tracejada border-strong e rótulo em text-placeholder (Figma: terciário #565759)",
            rule: "Figma 1:7537 (borda tracejada #363a43); terciário não chega a 4,5:1 no claro, placeholder chega",
          },
          {
            decision: "Hover só no fundo (bg-hover); foco pela linha de 1 px de campo",
            rule: "ADR-0013 (hover do Linear, foco de campo)",
          },
          { decision: "Trunca o rótulo a 200 px", rule: "Figma 1:7525 (max-w 200)" },
          {
            decision: "Botão de remover de 16 px com X de 12 px (sem desenho no Figma)",
            rule: "§6 e WCAG 2.5.8: alvo de 16 px com folga que garante o círculo de 24 px; ícone xs da escala",
          },
        ],
      }}
    />
  );
}
