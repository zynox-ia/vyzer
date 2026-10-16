/**
 * Preferences (Figma 33:20615; spec `preferences-persistence.md`): todas as escolhas são
 * preferências reais por Member, lidas e gravadas pela API (`memberPreferences.get/update`) e com o
 * mesmo padrão otimista + rollback + aviso do Customize sidebar. `PreferencesView` é só a tela
 * (valores e `onChange`); `PreferencesPage` a liga à API, e a documentação do design system usa a
 * `PreferencesView` com estado local, sem chamar a API.
 *
 * Efeitos: tema, cursores de ponteiro e links sublinhados são aplicados no app inteiro por
 * `useApplyMemberPreferences` (na rota do produto). Sem efeito por enquanto, só persistidos:
 * "Font size" da interface (não há escala de fonte da interface no design system), "Disable animated
 * images & emoji" (o Zynox ainda não renderiza emoji nem GIF animado) e "Open in desktop app" (não
 * existe app desktop). O auto-assign é aplicado pelo back-end a partir do valor guardado.
 */
import { ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible } from "radix-ui";
import { useState } from "react";
import {
  Alert,
  Button,
  Select,
  Skeleton,
  Switch,
  TextInput,
} from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import type { MemberPreferenceValues } from "@/services/member-preferences";
import { CodeSample } from "./code-sample";
import { CODE_THEME_OPTIONS } from "./code-themes";
import { CustomizeSidebarDialog } from "./customize-sidebar";
import { SettingsGroup, SettingsRow } from "./settings-row";
import { useMemberPreferences } from "./use-member-preferences";

/** Valores de fábrica, iguais aos do banco (spec): a documentação parte deles. */
export const DEFAULT_PREFERENCE_VALUES: MemberPreferenceValues = {
  defaultHomeView: "agent",
  displayNameFormat: "full",
  firstDayOfWeek: "sunday",
  convertEmoticons: true,
  sendCommentsOn: "enter",
  interfaceFontSize: "default",
  usePointerCursors: false,
  underlineLinks: false,
  disableAnimatedImages: false,
  interfaceTheme: "system",
  codeTheme: "linear-dark",
  codeFontSize: "default",
  codeLineHeight: "regular",
  codeFontFamily: "",
  openInDesktopApp: false,
  autoAssignToSelf: false,
  autoAssignOnMoveToStarted: false,
};

/** Telas iniciais do Linear ("Linear Agent (default)" aqui é o Agent do Zynox). */
const HOME_VIEWS = [
  { value: "agent", label: "Agent (default)" },
  { value: "inbox", label: "Inbox" },
  { value: "my-issues", label: "My issues" },
  { value: "reviews", label: "Reviews" },
  { value: "all-issues", label: "All issues" },
  { value: "active-issues", label: "Active issues" },
  { value: "current-cycle", label: "Current cycle" },
  { value: "projects", label: "Projects" },
] as const;

/** Tamanhos do Linear (Smaller … Larger); Default é o 12 px do texto de código. */
const FONT_SIZES = [
  { value: "smaller", label: "Smaller", px: 10 },
  { value: "small", label: "Small", px: 11 },
  { value: "default", label: "Default", px: 12 },
  { value: "large", label: "Large", px: 13 },
  { value: "larger", label: "Larger", px: 14 },
] as const;
const LINE_HEIGHTS = [
  { value: "compact", label: "Compact", ratio: 1.15 },
  { value: "regular", label: "Regular", ratio: 1.35 },
  { value: "relaxed", label: "Relaxed", ratio: 1.6 },
] as const;

type Change = (patch: Partial<MemberPreferenceValues>) => void;

export function PreferencesView({
  values,
  onChange,
  headingLevel = "h1",
}: {
  values: MemberPreferenceValues;
  onChange: Change;
  /**
   * "h1" na rota real (única página, `/settings/preferences`). "h2" na documentação de
   * `/design-system/app-shell/settings`, onde o título já é o H1 da própria página de doc.
   */
  headingLevel?: "h1" | "h2";
}) {
  const [fontOpen, setFontOpen] = useState(false);
  // A família da fonte grava ao sair do campo ou com Enter, não a cada tecla.
  const [familyDraft, setFamilyDraft] = useState<string>();
  const family = familyDraft ?? values.codeFontFamily;
  const commitFamily = () => {
    if (familyDraft !== undefined && familyDraft.trim() !== values.codeFontFamily) {
      onChange({ codeFontFamily: familyDraft.trim() });
    }
    setFamilyDraft(undefined);
  };

  const fontPx = FONT_SIZES.find((o) => o.value === values.codeFontSize)?.px ?? 12;
  const lineRatio = LINE_HEIGHTS.find((o) => o.value === values.codeLineHeight)?.ratio ?? 1.35;
  const lineLabel = LINE_HEIGHTS.find((o) => o.value === values.codeLineHeight)?.label;

  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 pb-6 text-primary">Preferences</Heading>

      <SettingsGroup title="General">
        <SettingsRow
          label="Default home view"
          description="Select which view to display when launching Zynox"
        >
          {(id) => (
            <Select
              id={id}
              value={values.defaultHomeView}
              onValueChange={(defaultHomeView) => onChange({ defaultHomeView })}
              options={[...HOME_VIEWS]}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Display names"
          description="Select how names are displayed in the Zynox interface"
        >
          {(id) => (
            <Select
              id={id}
              value={values.displayNameFormat}
              onValueChange={(displayNameFormat) => onChange({ displayNameFormat })}
              options={[
                { value: "full", label: "Full name" },
                { value: "first", label: "First name" },
              ]}
            />
          )}
        </SettingsRow>
        <SettingsRow label="First day of the week" description="Used for date pickers">
          {(id) => (
            <Select
              id={id}
              value={values.firstDayOfWeek}
              onValueChange={(firstDayOfWeek) => onChange({ firstDayOfWeek })}
              options={[
                { value: "sunday", label: "Sunday" },
                { value: "monday", label: "Monday" },
              ]}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Convert text emoticons into emojis"
          description="Strings like :) will be converted to 🙂"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.convertEmoticons}
              onCheckedChange={(convertEmoticons) => onChange({ convertEmoticons })}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Send comments on…"
          description="Choose which key press is used to submit comments"
        >
          {(id) => (
            <Select
              id={id}
              value={values.sendCommentsOn}
              onValueChange={(sendCommentsOn) => onChange({ sendCommentsOn })}
              options={[
                { value: "enter", label: "Enter" },
                { value: "mod-enter", label: "⌘/Ctrl + Enter" },
              ]}
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Interface and theme">
        <SettingsRow
          label="App sidebar"
          description="Customize sidebar item visibility, ordering, and badge style"
        >
          {() => (
            <CustomizeSidebarDialog>
              <Button variant="ghost" type="button">
                Customize
              </Button>
            </CustomizeSidebarDialog>
          )}
        </SettingsRow>
        <SettingsRow label="Font size" description="Adjust the size of text across the app">
          {(id) => (
            <Select
              id={id}
              value={values.interfaceFontSize}
              onValueChange={(interfaceFontSize) => onChange({ interfaceFontSize })}
              options={[
                { value: "small", label: "Small" },
                { value: "default", label: "Default" },
                { value: "large", label: "Large" },
              ]}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Use pointer cursors"
          description="Change the cursor to a pointer when hovering over any interactive elements"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.usePointerCursors}
              onCheckedChange={(usePointerCursors) => onChange({ usePointerCursors })}
            />
          )}
        </SettingsRow>
        <SettingsRow label="Underline links" description="Always underline links in text content">
          {(id) => (
            <Switch
              id={id}
              checked={values.underlineLinks}
              onCheckedChange={(underlineLinks) => onChange({ underlineLinks })}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Disable animated images & emoji"
          description="When enabled, GIFs and animated emojis will be static by default and animate only on hover"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.disableAnimatedImages}
              onCheckedChange={(disableAnimatedImages) => onChange({ disableAnimatedImages })}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Interface theme"
          description="Select or customize your interface color scheme"
        >
          {(id) => (
            <Select
              id={id}
              value={values.interfaceTheme}
              onValueChange={(interfaceTheme) => onChange({ interfaceTheme })}
              options={[
                { value: "system", label: "System preference" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Code theme"
          description="Matches your interface theme unless overridden"
        >
          {(id) => (
            <Select
              id={id}
              value={values.codeTheme}
              onValueChange={(codeTheme) =>
                onChange({ codeTheme: codeTheme as MemberPreferenceValues["codeTheme"] })
              }
              options={CODE_THEME_OPTIONS}
            />
          )}
        </SettingsRow>
        <Collapsible.Root open={fontOpen} onOpenChange={setFontOpen}>
          <Collapsible.Trigger className="flex w-full items-center justify-between gap-4 rounded-control py-4 text-left focus-ring">
            <span className="text-label-md text-primary">Font</span>
            <span className="flex items-center gap-1 text-body-sm text-secondary">
              {fontPx}px, {lineLabel},{" "}
              {values.codeFontFamily === "" ? "Default" : values.codeFontFamily}
              <Icon icon={fontOpen ? ChevronUp : ChevronDown} size="sm" />
            </span>
          </Collapsible.Trigger>
          <Collapsible.Content>
            <div className="flex flex-col border-t border-default">
              <SettingsRow label="Font size">
                {(id) => (
                  <Select
                    id={id}
                    value={values.codeFontSize}
                    onValueChange={(codeFontSize) => onChange({ codeFontSize })}
                    options={[...FONT_SIZES]}
                  />
                )}
              </SettingsRow>
              <SettingsRow label="Line height">
                {(id) => (
                  <Select
                    id={id}
                    value={values.codeLineHeight}
                    onValueChange={(codeLineHeight) => onChange({ codeLineHeight })}
                    options={[...LINE_HEIGHTS]}
                  />
                )}
              </SettingsRow>
              <SettingsRow label="Custom font family">
                {(id) => (
                  <TextInput
                    id={id}
                    value={family}
                    placeholder="Font family name"
                    autoComplete="off"
                    onChange={(event) => setFamilyDraft(event.target.value)}
                    onBlur={commitFamily}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") event.currentTarget.blur();
                    }}
                    className="w-64"
                  />
                )}
              </SettingsRow>
            </div>
          </Collapsible.Content>
          <div className="pb-4">
            <CodeSample
              theme={values.codeTheme}
              fontSize={fontPx}
              lineHeight={lineRatio}
              fontFamily={values.codeFontFamily.trim() || undefined}
            />
          </div>
        </Collapsible.Root>
      </SettingsGroup>

      <SettingsGroup title="Desktop application">
        <SettingsRow
          label="Open in desktop app"
          description="Automatically open links in desktop app when possible"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.openInDesktopApp}
              onCheckedChange={(openInDesktopApp) => onChange({ openInDesktopApp })}
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Automations and workflows">
        <SettingsRow
          label="Auto-assign to self"
          description="When creating new issues, always assign them to yourself by default"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.autoAssignToSelf}
              onCheckedChange={(autoAssignToSelf) => onChange({ autoAssignToSelf })}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="On move to started status, assign to yourself"
          description="When you move an unassigned issue to started, it will be automatically assigned to you"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.autoAssignOnMoveToStarted}
              onCheckedChange={(autoAssignOnMoveToStarted) =>
                onChange({ autoAssignOnMoveToStarted })
              }
            />
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}

/** A rota `/settings/preferences`: a tela ligada à API, com carregamento e erro. */
export function PreferencesPage() {
  const { preferences, isPending, isError, refetch, update } = useMemberPreferences();

  if (isPending) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Preferences</h1>
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading preferences.</span>
          {[0, 1, 2, 3, 4, 5].map((row) => (
            <Skeleton key={row} shape="block" className="h-control-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !preferences) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-6 text-primary">Preferences</h1>
        <Alert
          tone="danger"
          role="alert"
          title="Could not load preferences"
          action={
            <Button type="button" variant="secondary" onClick={refetch}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  return <PreferencesView values={preferences} onChange={update} />;
}
