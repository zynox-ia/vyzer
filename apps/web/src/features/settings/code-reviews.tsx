/**
 * Code & reviews (Settings → Personal → Code & reviews; spec `github-integration.md`; Linear ao vivo,
 * 30/09). Só os campos com efeito ou que persistem: Enable code reviews (real: liga a vinculação de
 * PRs), Auto-convert draft pull requests e Merge strategy (só persistidos, sem efeito hoje). Code
 * theme, Notifications, Signed commits e External tools ficam de fora (spec, "Fora de escopo").
 *
 * É configuração da Workspace inteira: só Admin edita (a API devolve FORBIDDEN para os outros), então
 * sem `canEdit` os controles ficam desabilitados, como em Workspace settings.
 *
 * `CodeReviewsView` é só a tela (valores e `onChange`); a página ligada à API vem depois.
 */
import { Select, Switch } from "@zynox/design-system/components";
import { SettingsGroup, SettingsRow } from "./settings-row";

export type MergeStrategy = "merge" | "squash" | "rebase";

export type CodeReviewsValues = {
  enabled: boolean;
  autoConvertDraftPullRequests: boolean;
  mergeStrategy: MergeStrategy;
};

const MERGE_STRATEGIES: { value: MergeStrategy; label: string }[] = [
  { value: "merge", label: "Create a merge commit" },
  { value: "squash", label: "Squash and merge" },
  { value: "rebase", label: "Rebase and merge" },
];

export function CodeReviewsView({
  values,
  onChange,
  canEdit = true,
  headingLevel = "h1",
}: {
  values: CodeReviewsValues;
  onChange: (patch: Partial<CodeReviewsValues>) => void;
  /** Só Admin edita; para os demais Members os controles ficam desabilitados. */
  canEdit?: boolean;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 text-primary">Code & reviews</Heading>
      <p className="pb-6 text-body-md text-secondary">
        Review GitHub pull requests linked to your issues in Zynox
      </p>

      <SettingsGroup>
        <SettingsRow
          label="Enable code reviews"
          description="Link GitHub pull requests to issues and show them on the issue"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.enabled}
              disabled={!canEdit}
              onCheckedChange={(enabled) => onChange({ enabled })}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Auto-convert draft pull requests"
          description="Automatically mark your drafts as ready upon approval or requesting a review"
        >
          {(id) => (
            <Switch
              id={id}
              checked={values.autoConvertDraftPullRequests}
              disabled={!canEdit}
              onCheckedChange={(autoConvertDraftPullRequests) =>
                onChange({ autoConvertDraftPullRequests })
              }
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Merge strategy"
          description="Choose the default merge strategy for pull requests. Repository configuration can affect available strategies"
        >
          {(id) => (
            <Select
              id={id}
              value={values.mergeStrategy}
              disabled={!canEdit}
              onValueChange={(mergeStrategy) => onChange({ mergeStrategy })}
              options={MERGE_STRATEGIES}
            />
          )}
        </SettingsRow>
      </SettingsGroup>
    </div>
  );
}
