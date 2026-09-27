import {
  IconButton,
  type ButtonVariant,
  type IconButtonSize,
} from "@vyzer/design-system/components";
import { Ellipsis, ListFilter, Plus, Search, SlidersHorizontal, SquarePen } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";
import { Field, Segmented } from "../../kit/controls";
import { Code, DocTable } from "../../kit/doc";
import { StatesGrid } from "../../kit/states";

const VARIANTS: ButtonVariant[] = ["ghost", "secondary", "primary", "danger"];
const SIZES: IconButtonSize[] = ["sm", "md", "lg"];
const SIZE_PX: Record<IconButtonSize, number> = { xs: 20, sm: 24, md: 28, lg: 32 };

function usePlayground() {
  const [variant, setVariant] = useState<ButtonVariant>("secondary");
  const [size, setSize] = useState<IconButtonSize>("md");
  const [disabled, setDisabled] = useState<"no" | "yes">("no");
  return {
    preview: (
      <IconButton
        icon={SquarePen}
        label="Create new issue"
        variant={variant}
        size={size}
        disabled={disabled === "yes"}
      />
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
        <Field label="size">
          <Segmented
            label="size"
            value={size}
            onChange={setSize}
            options={SIZES.map((s) => ({ value: s, label: s }))}
          />
        </Field>
        <Field label="disabled">
          <Segmented
            label="disabled"
            value={disabled}
            onChange={setDisabled}
            options={[
              { value: "no", label: "false" },
              { value: "yes", label: "true" },
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
        title: "Icon Button",
        description:
          "Ação representada só por um ícone, em botão redondo. Comum em barras de ferramentas (busca, nova issue, filtro, opções de exibição).",
        whenToUse: [
          "Ações frequentes e reconhecíveis pelo ícone: Search, Create new issue, Filter, More",
          "Dentro de campos (limpar busca, mostrar senha)",
        ],
        whenNotToUse: [
          "Ação principal de um formulário: use Button com rótulo",
          "Ícone ambíguo sem tooltip: prefira Button com texto",
        ],
        playground,
        showcase: (
          <DocTable
            caption="Variantes por tamanho"
            columns={["Variante", ...SIZES.map((s) => `${s} · ${SIZE_PX[s]}`)]}
            rows={VARIANTS.map((v) => [
              <Code key="v">{v}</Code>,
              ...SIZES.map((s) => (
                <IconButton key={s} icon={Plus} label="Add" variant={v} size={s} />
              )),
            ])}
          />
        ),
        states: (
          <StatesGrid
            states={[
              { label: "default", node: <IconButton icon={Search} label="Search" /> },
              {
                label: "hover",
                node: <IconButton icon={Search} label="Search" data-preview="hover" />,
              },
              {
                label: "focus-visible",
                node: <IconButton icon={Search} label="Search" data-preview="focus" />,
              },
              {
                label: "pressed",
                node: <IconButton icon={Search} label="Search" data-preview="hover active" />,
              },
              { label: "disabled", node: <IconButton icon={Search} label="Search" disabled /> },
            ]}
          />
        ),
        themes: () => (
          <div className="flex gap-1">
            <IconButton icon={Search} label="Search" />
            <IconButton icon={SquarePen} label="Create new issue" variant="secondary" />
            <IconButton icon={ListFilter} label="Filter" variant="secondary" />
            <IconButton icon={SlidersHorizontal} label="Display options" variant="secondary" />
            <IconButton icon={Ellipsis} label="More actions" />
          </div>
        ),
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Círculo do tamanho do controle com ícone de 16 px no centro. Ghost usa o ícone em
            text-secondary e passa a text-primary no hover.
          </p>
        ),
        keyboard: ["Tab foca; Enter e Espaço acionam."],
        accessibility: [
          <>
            <Code>label</Code> é obrigatório e vira o nome acessível (aria-label).
          </>,
          "Alvo mínimo de 24 px mesmo no tamanho sm.",
          "Ícone ghost em text-secondary: ≥ 3:1 em todas as superfícies (Foundations → Colors).",
        ],
        content: ['O label descreve a ação, não o ícone: "Create new issue", não "Pencil".'],
        dos: ["Use o mesmo ícone para a mesma ação em todo o produto"],
        donts: ["Não use para ações destrutivas sem confirmação"],
        usage: `import { IconButton } from "@vyzer/design-system/components";
import { SquarePen } from "lucide-react";

<IconButton icon={SquarePen} label="Create new issue" variant="secondary" />`,
        props: [
          { name: "icon", type: "LucideIcon", description: "Ícone (16 px)." },
          { name: "label", type: "string", description: "Nome acessível, obrigatório." },
          {
            name: "variant",
            type: "ButtonVariant",
            default: '"ghost"',
            description: "Mesmas variantes do Button.",
          },
          {
            name: "size",
            type: '"xs" | "sm" | "md" | "lg"',
            default: '"md"',
            description: "20 · 24 · 28 · 32 px (xs só dentro de campos de 24 px).",
          },
        ],
        decisions: [
          {
            decision: "Redondo, 28 px, ícone de 16 px",
            rule: "Figma: botões redondos de 28 px (1:6778, 1:5074)",
          },
          {
            decision: "Tamanhos 24 · 28 · 32 iguais aos do Button",
            rule: "§6 alturas iguais entre equivalentes",
          },
          {
            decision: "Ghost em text-secondary, hover em text-primary",
            rule: "§4 rebaixar é mais eficaz que destacar",
          },
          { decision: "label obrigatório", rule: "§12 e WCAG 4.1.2 (nome acessível)" },
        ],
      }}
    />
  );
}
