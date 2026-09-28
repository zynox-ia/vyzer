/**
 * Preferences (Figma 33:20615): único exemplo de conteúdo de Settings nesta fase — reaproveita
 * Select, Switch e Field, já existentes (spec, "Escopo de Settings"). As demais páginas ficam
 * fora do escopo.
 */
import { useState } from "react";
import { Button, Select, Switch } from "@vyzer/design-system/components";
import { setThemePreference, useThemePreference } from "@vyzer/design-system/theme";
import { SettingsGroup, SettingsRow } from "./settings-row";

const SAMPLE_CODE = `async function fetchUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  return res.json();
}`;

export function PreferencesPage({
  headingLevel = "h1",
}: {
  /**
   * "h1" na rota real (única página, `/settings/preferences`). "h2" na documentação de
   * `/design-system/app-shell/settings`, onde o título já é o H1 da própria página de doc.
   */
  headingLevel?: "h1" | "h2";
}) {
  const [emoticons, setEmoticons] = useState(true);
  const [pointerCursor, setPointerCursor] = useState(false);
  const [underlineLinks, setUnderlineLinks] = useState(false);
  const [disableAnimated, setDisableAnimated] = useState(false);
  const [codeTheme, setCodeTheme] = useState("match");
  const [desktopApp, setDesktopApp] = useState(false);
  const [autoAssign, setAutoAssign] = useState(false);
  const [autoAssignOnMove, setAutoAssignOnMove] = useState(false);
  const theme = useThemePreference();

  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 pb-6 text-primary">Preferences</Heading>

      <SettingsGroup title="General">
        <SettingsRow
          label="Default home view"
          description="Select which view to display when launching Vyzer"
        >
          {(id) => (
            <Select
              id={id}
              trigger="button"
              defaultValue="agent"
              options={[
                { value: "agent", label: "Agent (default)" },
                { value: "inbox", label: "Inbox" },
                { value: "my-issues", label: "My issues" },
              ]}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Display names"
          description="Select how names are displayed in the Vyzer interface"
        >
          {(id) => (
            <Select
              id={id}
              trigger="button"
              defaultValue="full"
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
              trigger="button"
              defaultValue="sunday"
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
          {(id) => <Switch id={id} checked={emoticons} onCheckedChange={setEmoticons} />}
        </SettingsRow>
        <SettingsRow
          label="Send comments on…"
          description="Choose which key press is used to submit comments"
        >
          {(id) => (
            <Select
              id={id}
              trigger="button"
              defaultValue="enter"
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
            <Button variant="ghost" type="button">
              Customize
            </Button>
          )}
        </SettingsRow>
        <SettingsRow label="Font size" description="Adjust the size of text across the app">
          {(id) => (
            <Select
              id={id}
              trigger="button"
              defaultValue="default"
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
          {(id) => <Switch id={id} checked={pointerCursor} onCheckedChange={setPointerCursor} />}
        </SettingsRow>
        <SettingsRow label="Underline links" description="Always underline links in text content">
          {(id) => <Switch id={id} checked={underlineLinks} onCheckedChange={setUnderlineLinks} />}
        </SettingsRow>
        <SettingsRow
          label="Disable animated images & emoji"
          description="When enabled, GIFs and animated emojis will be static by default and animate only on hover"
        >
          {(id) => (
            <Switch id={id} checked={disableAnimated} onCheckedChange={setDisableAnimated} />
          )}
        </SettingsRow>
        <SettingsRow
          label="Interface theme"
          description="Select or customize your interface color scheme"
        >
          {(id) => (
            <Select
              id={id}
              trigger="button"
              value={theme}
              onValueChange={setThemePreference}
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
              trigger="button"
              value={codeTheme}
              onValueChange={setCodeTheme}
              options={[
                { value: "match", label: "Match interface theme" },
                { value: "vyzer-dark", label: "Vyzer Dark" },
                { value: "vyzer-light", label: "Vyzer Light" },
              ]}
            />
          )}
        </SettingsRow>
        <div className="flex flex-col gap-2 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <p className="text-label-md text-primary">Font</p>
              <p className="text-body-sm text-secondary">12px, Regular, Default</p>
            </div>
            <Select
              aria-label="Code sample language"
              trigger="button"
              defaultValue="typescript"
              options={[{ value: "typescript", label: "TypeScript" }]}
            />
          </div>
          <pre
            aria-label="Code sample"
            // Rola na horizontal: recebe foco para rolar pelo teclado (o mesmo padrão de
            // kit/doc.tsx CodeBlock).
            // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="overflow-x-auto rounded-container border border-subtle bg-subtle p-4 text-code text-primary"
          >
            <code>{SAMPLE_CODE}</code>
          </pre>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Desktop application">
        <SettingsRow
          label="Open in desktop app"
          description="Automatically open links in desktop app when possible"
        >
          {(id) => <Switch id={id} checked={desktopApp} onCheckedChange={setDesktopApp} />}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup title="Automations and workflows">
        <SettingsRow
          label="Auto-assign to self"
          description="When creating new issues, always assign them to yourself by default"
        >
          {(id) => <Switch id={id} checked={autoAssign} onCheckedChange={setAutoAssign} />}
        </SettingsRow>
        <SettingsRow
          label="On move to started status, assign to yourself"
          description="When you move an unassigned issue to started, it will be automatically assigned to you"
        >
          {(id) => (
            <Switch id={id} checked={autoAssignOnMove} onCheckedChange={setAutoAssignOnMove} />
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
