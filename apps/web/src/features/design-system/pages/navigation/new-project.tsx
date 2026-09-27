/**
 * Tela "New Project" (Figma 1:2): a linha de propriedades ao vivo, cada uma abrindo o seu
 * seletor, e a galeria dos painéis abertos como no Figma (estáticos: não flutuam nem roubam foco).
 */
import {
  Combobox,
  ComboboxPanel,
  ColorDot,
  DatePicker,
  DatePickerPanel,
  IconPicker,
  IconPickerPanel,
  LabelPicker,
  LabelPickerPanel,
  Menu,
  MenuContent,
  MenuPanel,
  MenuSub,
  MenuSubContent,
  MenuSubTrigger,
  MenuTrigger,
  PopoverSurface,
  ProjectIcon,
  PropertyButton,
  type LabelColor,
  type ProjectIconValue,
} from "@vyzer/design-system/components";
import { formatDateValue, type DateValue } from "@vyzer/design-system/date";
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  CalendarDays,
  Link2,
  Tag,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { DocPage, DocSection, DocSubsection, Prose } from "../../kit/doc";
import {
  INITIAL_LABELS,
  LEADS,
  PRIORITIES,
  PROJECT_OPTIONS,
  PROJECT_STATUSES,
  type Priority,
  type ProjectStatus,
} from "../../kit/project-data";

const TODAY = new Date(2026, 8, 27);

function DateProperty({ label }: { label: string }) {
  const [value, setValue] = useState<DateValue>();
  return (
    <DatePicker label={label} value={value} onValueChange={setValue} today={TODAY}>
      <PropertyButton leading={<CalendarDays />} empty={!value}>
        {value ? formatDateValue(value) : label}
      </PropertyButton>
    </DatePicker>
  );
}

function DependencySearch({ label }: { label: string }) {
  const [value, setValue] = useState<string[]>([]);
  return (
    <ComboboxPanel
      multiple
      label={label}
      searchPlaceholder="Search projects…"
      value={value}
      onValueChange={setValue}
      options={PROJECT_OPTIONS}
    />
  );
}

function PropertyRow() {
  const [status, setStatus] = useState<ProjectStatus>("backlog");
  const [priority, setPriority] = useState<Priority>("none");
  const [lead, setLead] = useState("none");
  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [chosen, setChosen] = useState<string[]>([]);
  const [icon, setIcon] = useState<ProjectIconValue>({ kind: "icon", name: "Box", color: "grey" });

  const currentStatus = PROJECT_STATUSES.find((s) => s.value === status);
  const currentPriority = PRIORITIES.find((p) => p.value === priority);
  const currentLead = LEADS.find((l) => l.value === lead);
  const chosenLabels = labels.filter((l) => chosen.includes(l.value));
  const firstLabel = chosenLabels[0];

  const createLabel = (name: string, color: LabelColor) => {
    const id = `${name.toLowerCase().replaceAll(/\s+/g, "-")}-${labels.length}`;
    setLabels((prev) => [...prev, { value: id, label: name, color }]);
    return id;
  };

  return (
    <div className="flex flex-wrap gap-2">
      <IconPicker value={icon} onValueChange={setIcon}>
        <PropertyButton leading={<ProjectIcon value={icon} />}>Icon</PropertyButton>
      </IconPicker>
      <Combobox
        label="Status"
        value={status}
        onValueChange={setStatus}
        options={PROJECT_STATUSES}
        searchPlaceholder="Change project status…"
        width="sm"
      >
        <PropertyButton leading={currentStatus?.icon}>{currentStatus?.label}</PropertyButton>
      </Combobox>
      <Combobox
        label="Priority"
        value={priority}
        onValueChange={setPriority}
        options={PRIORITIES}
        searchPlaceholder="Change priority…"
        shortcut={["P", "P"]}
        numberFrom={0}
      >
        <PropertyButton leading={currentPriority?.icon} empty={priority === "none"}>
          {priority === "none" ? "Priority" : currentPriority?.label}
        </PropertyButton>
      </Combobox>
      <Combobox
        label="Lead"
        value={lead}
        onValueChange={setLead}
        options={LEADS}
        searchPlaceholder="Assign lead…"
        numberFrom={0}
      >
        <PropertyButton leading={<UserRound />} empty={lead === "none"}>
          {lead === "none" ? "Lead" : currentLead?.label}
        </PropertyButton>
      </Combobox>
      <DateProperty label="Start date" />
      <DateProperty label="Target date" />
      <LabelPicker labels={labels} value={chosen} onValueChange={setChosen} onCreate={createLabel}>
        <PropertyButton
          leading={firstLabel ? <ColorDot color={firstLabel.color} /> : <Tag />}
          empty={chosenLabels.length === 0}
        >
          {chosenLabels.length === 0
            ? "Labels"
            : chosenLabels.length === 1
              ? firstLabel?.label
              : `${chosenLabels.length} labels`}
        </PropertyButton>
      </LabelPicker>
      <Menu>
        <MenuTrigger asChild>
          <PropertyButton leading={<Link2 />} empty>
            Dependencies
          </PropertyButton>
        </MenuTrigger>
        <MenuContent variant="dropdown">
          <MenuSub>
            <MenuSubTrigger icon={ArrowLeftFromLine}>Blocked by…</MenuSubTrigger>
            <MenuSubContent panelLabel="Blocked by" className="w-64">
              <MenuPanel>
                <DependencySearch label="Blocked by" />
              </MenuPanel>
            </MenuSubContent>
          </MenuSub>
          <MenuSub>
            <MenuSubTrigger icon={ArrowRightFromLine}>Blocking…</MenuSubTrigger>
            <MenuSubContent panelLabel="Blocking" className="w-64">
              <MenuPanel>
                <DependencySearch label="Blocking" />
              </MenuPanel>
            </MenuSubContent>
          </MenuSub>
        </MenuContent>
      </Menu>
    </div>
  );
}

function StatusPanel() {
  const [value, setValue] = useState<ProjectStatus>("backlog");
  return (
    <PopoverSurface className="w-56">
      <ComboboxPanel
        label="Status"
        value={value}
        onValueChange={setValue}
        options={PROJECT_STATUSES}
        searchPlaceholder="Change project status…"
      />
    </PopoverSurface>
  );
}

function PriorityPanel() {
  const [value, setValue] = useState<Priority>("none");
  return (
    <PopoverSurface className="w-72">
      <ComboboxPanel
        label="Priority"
        value={value}
        onValueChange={setValue}
        options={PRIORITIES}
        searchPlaceholder="Change priority…"
        shortcut={["P", "P"]}
        numberFrom={0}
      />
    </PopoverSurface>
  );
}

function LeadPanel() {
  const [value, setValue] = useState("none");
  return (
    <PopoverSurface className="w-72">
      <ComboboxPanel
        label="Lead"
        value={value}
        onValueChange={setValue}
        options={LEADS}
        searchPlaceholder="Assign lead…"
        numberFrom={0}
      />
    </PopoverSurface>
  );
}

function StartDatePanel() {
  const [value, setValue] = useState<DateValue>();
  return (
    <PopoverSurface className="rounded-control">
      <DatePickerPanel label="Start date" value={value} onValueChange={setValue} today={TODAY} />
    </PopoverSurface>
  );
}

function LabelsPanel() {
  const [labels, setLabels] = useState(INITIAL_LABELS);
  const [value, setValue] = useState<string[]>(["bug"]);
  return (
    <PopoverSurface className="w-72">
      <LabelPickerPanel
        labels={labels}
        value={value}
        onValueChange={setValue}
        onCreate={(name, color) => {
          const id = `${name}-${labels.length}`;
          setLabels((prev) => [...prev, { value: id, label: name, color }]);
          return id;
        }}
      />
    </PopoverSurface>
  );
}

function IconPanel() {
  const [value, setValue] = useState<ProjectIconValue>({
    kind: "icon",
    name: "Rocket",
    color: "orange",
  });
  return (
    <PopoverSurface className="rounded-control">
      <IconPickerPanel value={value} onValueChange={setValue} />
    </PopoverSurface>
  );
}

function Gallery({ title, children }: { title: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="text-caption text-secondary">{title}</figcaption>
      {children}
    </figure>
  );
}

export function Page() {
  return (
    <DocPage
      title="New Project"
      description="A linha de propriedades do New Project (Figma 1:2) montada só com componentes do design system: cada chip abre o seu seletor."
    >
      <DocSection
        title="Ao vivo"
        description="Clique em cada propriedade; tudo é teclável e fecha com Esc."
      >
        <div className="flex flex-col gap-4 rounded-container border border-subtle bg-panel p-6">
          <PropertyRow />
        </div>
      </DocSection>

      <DocSection
        title="Painéis"
        description="Cada seletor aberto, como no Figma. São os mesmos painéis, fixos na página."
      >
        <div className="flex flex-wrap items-start gap-8">
          <Gallery title="Status">
            <StatusPanel />
          </Gallery>
          <Gallery title="Priority">
            <PriorityPanel />
          </Gallery>
          <Gallery title="Lead">
            <LeadPanel />
          </Gallery>
          <Gallery title="Start date">
            <StartDatePanel />
          </Gallery>
          <Gallery title="Labels">
            <LabelsPanel />
          </Gallery>
          <Gallery title="Add dependency (submenu)">
            <PopoverSurface className="w-64">
              <DependencySearch label="Blocked by" />
            </PopoverSurface>
          </Gallery>
          <Gallery title="Icon">
            <IconPanel />
          </Gallery>
        </div>
      </DocSection>

      <DocSection title="Componentes usados">
        <DocSubsection title="Onde cada um está documentado">
          <Prose>
            <p>
              Property Button (Components); Combobox (Forms: status, priority, lead); Date Picker,
              Label Picker, Submenu, Icon Picker e Tabs (Navigation).
            </p>
            <p>
              Milestones (Figma 1:3176) é um padrão de edição, não um menu: fica proposto para a
              Fase 10 (Patterns).
            </p>
          </Prose>
        </DocSubsection>
      </DocSection>
    </DocPage>
  );
}
