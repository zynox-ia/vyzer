import { PropertyButton } from "@vyzer/design-system/components";
import { PriorityIcon, StatusIcon } from "@vyzer/design-system/icons";
import { CalendarDays, UserRound } from "lucide-react";
import { ComponentPage } from "../../kit/component-page";
import { StatesGrid } from "../../kit/states";

function Properties() {
  return (
    <div className="flex flex-wrap gap-2">
      <PropertyButton leading={<StatusIcon type="backlog" />}>Backlog</PropertyButton>
      <PropertyButton leading={<PriorityIcon priority="none" />} empty>
        Priority
      </PropertyButton>
      <PropertyButton leading={<UserRound />} empty>
        Lead
      </PropertyButton>
      <PropertyButton leading={<CalendarDays />} empty>
        Target date
      </PropertyButton>
    </div>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Property Button",
        description:
          "Chip de propriedade (Figma 1:3289): mostra o valor de uma propriedade de issue ou projeto e abre o seletor dela. Pílula de 24 px em relevo.",
        whenToUse: [
          "Linha de propriedades de um modal ou detalhe: status, priority, lead, target date",
          'Como gatilho do Select (trigger="chip") ou do Combobox',
        ],
        whenNotToUse: ["Ação com verbo (Post update): use Button"],
        playground: {
          preview: <Properties />,
          controls: (
            <p className="text-body-sm text-secondary">
              Sem valor, o rótulo fica em text-secondary (empty). Veja em uso no Combobox.
            </p>
          ),
        },
        showcase: <Properties />,
        states: (
          <StatesGrid
            states={[
              {
                label: "default",
                node: (
                  <PropertyButton leading={<StatusIcon type="started" />}>
                    In Progress
                  </PropertyButton>
                ),
              },
              {
                label: "hover",
                node: (
                  <PropertyButton leading={<StatusIcon type="started" />} data-preview="hover">
                    In Progress
                  </PropertyButton>
                ),
              },
              {
                label: "focus-visible",
                node: (
                  <PropertyButton leading={<StatusIcon type="started" />} data-preview="focus">
                    In Progress
                  </PropertyButton>
                ),
              },
              {
                label: "vazio",
                node: (
                  <PropertyButton leading={<UserRound />} empty>
                    Lead
                  </PropertyButton>
                ),
              },
              {
                label: "disabled",
                node: (
                  <PropertyButton leading={<StatusIcon type="started" />} disabled>
                    In Progress
                  </PropertyButton>
                ),
              },
            ]}
          />
        ),
        themes: () => <Properties />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Pílula de 24 px, fundo de controle forte, relevo (shadow-raised), 6 px à esquerda e 8 px
            à direita, ícone de 14 px, gap de 4 px e rótulo de 12 px Regular; trunca a 160 px.
          </p>
        ),
        keyboard: ["Tab foca; Enter ou Espaço abre o seletor."],
        accessibility: [
          'Botão nativo; o nome acessível é o valor atual (ex.: "Backlog").',
          "Dentro de um seletor, o Radix adiciona aria-expanded e aria-haspopup.",
        ],
        content: ["Mostra o valor; sem valor, o nome da propriedade (Priority, Lead)."],
        dos: ["Mantenha a ordem das propriedades igual em toda tela"],
        donts: ["Não use para ações que não abrem um seletor"],
        usage: `import { PropertyButton } from "@vyzer/design-system/components";

<PropertyButton leading={<StatusIcon type="backlog" />}>Backlog</PropertyButton>
<PropertyButton leading={<UserRound />} empty>Lead</PropertyButton>`,
        props: [
          { name: "leading", type: "ReactNode", description: "Ícone do valor (14 px)." },
          {
            name: "empty",
            type: "boolean",
            default: "false",
            description: "Sem valor: rótulo secundário.",
          },
          { name: "…", type: "ButtonHTMLAttributes", description: "Atributos do <button>." },
        ],
        decisions: [
          {
            decision: "Pílula de 24 px em relevo",
            rule: "Figma 1:3289 (h 24, r9999, anel 9% + contato)",
          },
          {
            decision: "Padding 6 / 8 px, ícone 14, gap 4",
            rule: "Figma pl 6, pr 8, ícone 14 com pr 4",
          },
          { decision: "Rótulo 12 px Regular", rule: "Figma 1:3297 (12 Regular #e4e5e7)" },
          {
            decision: "Mesmo hover do Button (1 px + brilho)",
            rule: "§11 similaridade: mesma função, mesma aparência",
          },
        ],
      }}
    />
  );
}
