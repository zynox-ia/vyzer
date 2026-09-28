/**
 * Agent personalization (Figma 27:7372, spec item 7): Guidance (Field + TextArea), Skills e MCP
 * connectors — linhas vazias com botão (SettingsEmptyRow, composição nova: mesmo espírito do
 * EmptyState da Fase 4, layout de linha). Reaproveita SettingsGroup/SettingsRow da Preferences.
 */
import { useState } from "react";
import { Plug, Plus, SquareCode } from "lucide-react";
import {
  Button,
  Field,
  IconButton,
  SettingsEmptyRow,
  TextArea,
} from "@vyzer/design-system/components";
import { SettingsGroup, SettingsRow } from "@/features/settings/settings-row";
import { MCP_CONNECTORS, SKILLS } from "./data";

export function AgentPersonalizationPage({
  headingLevel = "h1",
}: {
  /** "h1" na rota real. "h2" na documentação de /design-system, onde o H1 já é o da página. */
  headingLevel?: "h1" | "h2";
}) {
  const [guidance, setGuidance] = useState("");
  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 pb-6 text-primary">Agent personalization</Heading>

      <SettingsGroup title="Guidance">
        <div className="py-4">
          <Field
            label="Guidance"
            description="Context the agent uses in every chat — coding conventions, tone, what to avoid."
          >
            <TextArea
              value={guidance}
              onChange={(event) => setGuidance(event.target.value)}
              autoGrow
              rows={3}
              placeholder="e.g. Always use semantic tokens, never hardcode colors…"
            />
          </Field>
        </div>
      </SettingsGroup>

      <SettingsGroup title="Skills">
        <div className="py-4">
          {SKILLS.length === 0 ? (
            <SettingsEmptyRow
              icon={SquareCode}
              title="No skills created"
              description="Skills give the agent step-by-step instructions for a repeatable task."
              action={<IconButton icon={Plus} label="Create skill" variant="ghost" size="sm" />}
            />
          ) : (
            <SettingsRow label="Skills">{() => <span>{SKILLS.length}</span>}</SettingsRow>
          )}
        </div>
      </SettingsGroup>

      <SettingsGroup title="MCP connectors">
        <div className="py-4">
          {MCP_CONNECTORS.length === 0 ? (
            <SettingsEmptyRow
              icon={Plug}
              title="No connectors added"
              description="Connect an MCP server to give the agent access to more tools and data."
              action={<Button variant="secondary">Add connector</Button>}
            />
          ) : (
            <SettingsRow label="Connectors">
              {() => <span>{MCP_CONNECTORS.length}</span>}
            </SettingsRow>
          )}
        </div>
      </SettingsGroup>
    </div>
  );
}
