import {
  DatePicker,
  DatePickerPanel,
  PopoverSurface,
  PropertyButton,
} from "@vyzer/design-system/components";
import { formatDateValue, type DateGranularity, type DateValue } from "@vyzer/design-system/date";
import { CalendarDays } from "lucide-react";
import { useState } from "react";
import { ComponentPage } from "../../kit/component-page";

/** Hoje fixo: a documentação e as capturas não mudam com o dia. */
const TODAY = new Date(2026, 8, 27);

const GRANULARITIES: { value: DateGranularity; title: string; example?: DateValue }[] = [
  { value: "day", title: "Day", example: { kind: "day", year: 2026, month: 10, day: 5 } },
  { value: "month", title: "Month", example: { kind: "month", year: 2027, month: 5 } },
  { value: "quarter", title: "Quarter", example: { kind: "quarter", year: 2026, quarter: 4 } },
  { value: "half", title: "Half-year", example: { kind: "half", year: 2027, half: 1 } },
  { value: "year", title: "Year", example: { kind: "year", year: 2027 } },
];

function LiveDatePicker({ label }: { label: string }) {
  const [value, setValue] = useState<DateValue>();
  return (
    <DatePicker label={label} value={value} onValueChange={setValue} today={TODAY}>
      <PropertyButton leading={<CalendarDays />} empty={!value}>
        {value ? formatDateValue(value) : label}
      </PropertyButton>
    </DatePicker>
  );
}

/** Painel aberto e fixo na página: interativo, sem flutuar nem roubar foco. */
function StaticPanel({
  granularity,
  example,
}: {
  granularity: DateGranularity;
  example?: DateValue;
}) {
  const [value, setValue] = useState(example);
  return (
    <PopoverSurface className="rounded-control">
      <DatePickerPanel
        label="Start date"
        value={value}
        onValueChange={setValue}
        defaultGranularity={granularity}
        today={TODAY}
      />
    </PopoverSurface>
  );
}

export function Page() {
  return (
    <ComponentPage
      doc={{
        title: "Date Picker",
        description:
          'Escolha de data com granularidade (Figma 1:3, "Start date"): campo que entende texto ("May 2027", "Q4", "20/05/2027"), pílulas Day, Month, Quarter, Half-year e Year e o corpo de cada uma.',
        whenToUse: [
          "Datas de planejamento: start date, target date, due date de issue e de milestone",
          "Quando a precisão varia: um mês, um trimestre ou um ano também são respostas válidas",
        ],
        whenNotToUse: [
          "Data e hora exatas (lembretes): use um campo de data e hora dedicado",
          "Intervalos com início e fim no mesmo controle",
        ],
        playground: {
          preview: (
            <div className="flex flex-wrap gap-2">
              <LiveDatePicker label="Start date" />
              <LiveDatePicker label="Target date" />
            </div>
          ),
          controls: (
            <p className="text-body-sm text-secondary">
              Abra, digite &quot;Q4&quot; ou &quot;20/05/2027&quot; e aperte Enter, ou escolha na
              grade. As setas andam pelos dias; Page Up e Page Down trocam de mês.
            </p>
          ),
        },
        showcase: (
          <div className="flex flex-wrap items-start gap-8">
            {GRANULARITIES.map((g) => (
              <figure key={g.value} className="flex flex-col gap-2">
                <figcaption className="text-caption text-secondary">{g.title}</figcaption>
                <StaticPanel granularity={g.value} example={g.example} />
              </figure>
            ))}
          </div>
        ),
        states: null,
        statesNote:
          "Hoje: círculo com borda e fundo control-strong, peso 500. Escolhido: fundo inverse. Fins de semana: colunas em bg-hover. Texto que não vira data: campo inválido (borda de erro) até a próxima tecla. Mês, trimestre e semestre: pílulas por ano, a escolhida em bg-inverse.",
        themes: () => <StaticPanel granularity="day" example={GRANULARITIES[0]?.example} />,
        anatomy: (
          <p className="max-w-prose text-body-md text-secondary">
            Popover de raio 8 e 304 px. Rótulo de 12 px, campo lg e pílulas de granularidade a 16 px
            das bordas, hairline e o corpo. Dia: cabeçalho com o mês e as setas, linha de dias da
            semana com hairline de largura total, células de 34 px com círculos de 26 px.
          </p>
        ),
        keyboard: [
          "Enter no campo lê o texto e escolhe a data.",
          "Na grade: ← → ↑ ↓ andam por dias e semanas; Page Up/Page Down trocam de mês.",
          "Só um dia recebe Tab (roving tabindex); Enter ou Espaço escolhe.",
          "Esc fecha o popover e devolve o foco ao gatilho.",
        ],
        accessibility: [
          'A grade de dias é role="grid" com o nome do mês; cada dia diz a data completa.',
          "As pílulas de granularidade são um radiogroup (Segmented Control).",
          "Hoje e escolhido não dependem só de cor: borda e peso marcam hoje; contraste invertido marca o escolhido.",
        ],
        content: [
          'Rótulo com o nome da propriedade ("Start date", "Target date").',
          "Placeholder com exemplos reais de texto aceito.",
          'Valor no gatilho: "Oct 5, 2026", "May 2027", "Q4 2026", "H1 2027", "2027".',
        ],
        dos: ["Aceite a precisão que a pessoa tem: um trimestre é uma resposta válida"],
        donts: ["Não force o dia exato quando o planejamento é por mês ou trimestre"],
        usage: `import { DatePicker, PropertyButton } from "@vyzer/design-system/components";
import { formatDateValue } from "@vyzer/design-system/date";

<DatePicker label="Start date" value={start} onValueChange={setStart}>
  <PropertyButton leading={<CalendarDays />} empty={!start}>
    {start ? formatDateValue(start) : "Start date"}
  </PropertyButton>
</DatePicker>`,
        props: [
          { name: "label", type: "string", description: 'Rótulo no topo ("Start date").' },
          {
            name: "value",
            type: "DateValue",
            description: "day | month | quarter | half | year, com os campos de cada um.",
          },
          { name: "onValueChange", type: "(value: DateValue) => void", description: "Escolha." },
          {
            name: "defaultGranularity",
            type: "DateGranularity",
            description: 'Aba inicial; padrão: a do valor ou "day".',
          },
          { name: "today", type: "Date", default: "new Date()", description: "Data de hoje." },
          {
            name: "years",
            type: "number",
            default: "3",
            description: "Anos mostrados nas grades de mês, trimestre e semestre.",
          },
          { name: "children", type: "ReactElement", description: "Gatilho (Property Button)." },
        ],
        decisions: [
          { decision: "Popover de raio 8, 304 px", rule: "Figma 1:3 (r8, w 300 → 304, grid de 4)" },
          {
            decision: "Anos um por linha, pílulas de 24 px com passo de 36 px (12 px entre elas)",
            rule: "Figma 1:874–1:901 (linhas de 36 px); §11 similaridade entre as granularidades",
          },
          {
            decision: "Granularidade em pílulas separadas",
            rule: "Figma 1:3; Segmented Control variant pills",
          },
          {
            decision: "Fins de semana em bg-hover com cantos arredondados no topo e na base",
            rule: "Figma 1:3 (colunas Su e Sa sombreadas)",
          },
          {
            decision: "Hoje com borda e fundo control-strong; escolhido em inverse",
            rule: "Figma 1:3; §6 estado não depende só de cor",
          },
          {
            decision: "Formato de digitação dd/mm/yyyy",
            rule: 'Figma placeholder "20/05/2027"',
          },
        ],
      }}
    />
  );
}
