/**
 * Settings → Administration → Customer requests (`/settings/customer-requests`, spec
 * `documents-customer-requests.md`, etapa C1; Linear ao vivo, `/zynox-dev/settings/customer-requests`,
 * 29/09, sem frame no Figma). Copia o Linear linha a linha: o switch "Enable Customer requests"
 * liga o recurso; enquanto estiver desligado, todo o resto fica desabilitado, como o Linear mostra
 * (`fieldset disabled`).
 *
 * Salva sozinho, como as outras páginas de Settings: cada mudança grava na hora e mostra o toast
 * "Saved" com Undo. Desligar pede confirmação ("Disable customer requests for entire
 * workspace?"). Leitura aberta a qualquer Member; edição só por Admin (E7).
 *
 * As quatro linhas de E4 (Excluded domains, Generic domains, data source e Enable manual edits)
 * gravam no banco e nada as lê ainda. "Manage customers" e "Customer attributes data source"
 * seguem o Linear: a primeira só leva à lista quando ela existir (C2), o segundo só mostra
 * "None" (no Linear é exigência de plano Business); divergências em `.figma/`.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Alert,
  Button,
  Combobox,
  Confirm,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  ProjectIcon,
  Select,
  Skeleton,
  Switch,
  useToast,
  type ListOption,
} from "@zynox/design-system/components";
import type { ApiClient } from "@zynox/contract";
import { teamsQueryOptions } from "@/services/teams";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import {
  addCustomerDomainRuleMutationOptions,
  createCustomerStatusMutationOptions,
  createCustomerTierMutationOptions,
  customerDomainRulesQueryOptions,
  customerSettingsQueryOptions,
  customerStatusesQueryOptions,
  customerTiersQueryOptions,
  deleteCustomerStatusMutationOptions,
  deleteCustomerTierMutationOptions,
  removeCustomerDomainRuleMutationOptions,
  reorderCustomerStatusesMutationOptions,
  reorderCustomerTiersMutationOptions,
  updateCustomerSettingsMutationOptions,
  updateCustomerStatusMutationOptions,
  updateCustomerTierMutationOptions,
} from "@/services/customer-settings";
import { CustomerDomainList, CustomerLabelList } from "./customer-lists";
import { GENERIC_DOMAINS } from "./generic-domains";
import { SettingsGroup, SettingsRow } from "./settings-row";

type SettingsPatch = Parameters<ApiClient["customerSettings"]["update"]>[0];

const NO_TEAM = "none";
const REVENUE_OPTIONS: ListOption<"annual" | "monthly">[] = [
  { value: "annual", label: "Annual" },
  { value: "monthly", label: "Monthly" },
];

/** "USD ($)": o rótulo do Linear, montado do código ISO 4217 pelo próprio navegador. */
function currencyLabel(code: string) {
  const symbol = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
    currencyDisplay: "narrowSymbol",
  })
    .formatToParts(0)
    .find((part) => part.type === "currency")?.value;
  return `${code} (${symbol ?? code})`;
}

let currencyOptions: ListOption[] | undefined;
function getCurrencyOptions(): ListOption[] {
  currencyOptions ??= Intl.supportedValuesOf("currency").map((code) => ({
    value: code,
    label: currencyLabel(code),
    keywords: [code],
  }));
  return currencyOptions;
}

function Heading() {
  return (
    <div className="flex flex-col gap-2 pb-4">
      <h1 className="type-heading-1 text-primary">Customer requests</h1>
      <p className="text-body-md text-secondary">
        Associate customers with projects and issues to align development efforts with real user
        needs. Manage and track customer requests across your entire organization.
      </p>
    </div>
  );
}

function CustomerRequestsSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-6">
      <span className="sr-only">Loading customer request settings.</span>
      {[2, 1, 2].map((rows, group) => (
        <div key={group} className="flex flex-col rounded-container border border-subtle px-4">
          {Array.from({ length: rows }, (_, row) => (
            <div
              key={row}
              className="flex items-center justify-between gap-4 border-b border-subtle py-4 last:border-b-0"
            >
              <Skeleton className="w-40" />
              <Skeleton shape="block" className="h-control-md w-24" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function GenericDomainsLink() {
  return (
    <Dialog>
      <span>
        Domains and emails that are not associated with a specific customer. Common providers like
        Gmail, Outlook, etc. are already included.{" "}
        <DialogTrigger asChild>
          <button
            type="button"
            className="text-secondary underline hovered:text-primary focus-ring"
          >
            List of generic domains
          </button>
        </DialogTrigger>
      </span>
      <DialogContent
        size="sm"
        title="Generic domains"
        description="These providers are always treated as generic."
      >
        <DialogBody>
          <ul className="flex flex-col gap-1 text-body-md text-primary">
            {GENERIC_DOMAINS.map((domain) => (
              <li key={domain}>{domain}</li>
            ))}
          </ul>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CustomerRequestsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const workspace = useQuery(currentWorkspaceQueryOptions());
  const settings = useQuery(customerSettingsQueryOptions());
  const teams = useQuery(teamsQueryOptions());
  const statuses = useQuery(customerStatusesQueryOptions());
  const tiers = useQuery(customerTiersQueryOptions());
  const excluded = useQuery(customerDomainRulesQueryOptions("excluded"));
  const generic = useQuery(customerDomainRulesQueryOptions("generic"));
  const [confirmingDisable, setConfirmingDisable] = useState(false);

  const invalidate = (key: readonly unknown[]) => queryClient.invalidateQueries({ queryKey: key });
  const updateSettings = useMutation({
    ...updateCustomerSettingsMutationOptions(),
    onSuccess: () => invalidate(customerSettingsQueryOptions().queryKey),
    onError: () =>
      toast({
        title: "Could not save customer request settings",
        description: "Check your connection and try again.",
        variant: "error",
      }),
  });
  const statusKey = customerStatusesQueryOptions().queryKey;
  const tierKey = customerTiersQueryOptions().queryKey;
  const refresh = (key: readonly unknown[]) => ({ onSuccess: () => invalidate(key) });
  const createStatus = useMutation({
    ...createCustomerStatusMutationOptions(),
    ...refresh(statusKey),
  });
  const updateStatus = useMutation({
    ...updateCustomerStatusMutationOptions(),
    ...refresh(statusKey),
  });
  const deleteStatus = useMutation({
    ...deleteCustomerStatusMutationOptions(),
    ...refresh(statusKey),
  });
  const reorderStatuses = useMutation({
    ...reorderCustomerStatusesMutationOptions(),
    ...refresh(statusKey),
  });
  const createTier = useMutation({ ...createCustomerTierMutationOptions(), ...refresh(tierKey) });
  const updateTier = useMutation({ ...updateCustomerTierMutationOptions(), ...refresh(tierKey) });
  const deleteTier = useMutation({ ...deleteCustomerTierMutationOptions(), ...refresh(tierKey) });
  const reorderTiers = useMutation({
    ...reorderCustomerTiersMutationOptions(),
    ...refresh(tierKey),
  });
  const addRule = useMutation(addCustomerDomainRuleMutationOptions());
  const removeRule = useMutation(removeCustomerDomainRuleMutationOptions());
  const rulesKey = (kind: "excluded" | "generic") => customerDomainRulesQueryOptions(kind).queryKey;

  const loading =
    workspace.isPending ||
    settings.isPending ||
    teams.isPending ||
    statuses.isPending ||
    tiers.isPending ||
    excluded.isPending ||
    generic.isPending;
  const failed =
    workspace.isError ||
    settings.isError ||
    teams.isError ||
    statuses.isError ||
    tiers.isError ||
    excluded.isError ||
    generic.isError;

  if (loading && !failed) {
    return (
      <div className="flex flex-col gap-1">
        <Heading />
        <CustomerRequestsSkeleton />
      </div>
    );
  }
  if (failed || !workspace.data || !settings.data || !statuses.data || !tiers.data) {
    return (
      <div className="flex flex-col gap-1">
        <Heading />
        <Alert
          tone="danger"
          role="alert"
          title="Could not load customer request settings"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                for (const query of [
                  workspace,
                  settings,
                  teams,
                  statuses,
                  tiers,
                  excluded,
                  generic,
                ]) {
                  if (query.isError) void query.refetch();
                }
              }}
            >
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  const canEdit = workspace.data.member.role === "admin";
  // O valor otimista vale só enquanto a gravação está em voo; depois a query refeita assume.
  const current = {
    ...settings.data,
    ...(updateSettings.isPending ? updateSettings.variables : {}),
  };
  const enabled = current.enabled;
  const controlsOff = !enabled || !canEdit;

  const save = (patch: SettingsPatch) => {
    const previous: SettingsPatch = {};
    for (const key of Object.keys(patch) as (keyof SettingsPatch)[]) {
      (previous as Record<string, unknown>)[key] = settings.data[key];
    }
    updateSettings.mutate(patch, {
      onSuccess: () =>
        toast({
          title: "Saved",
          variant: "success",
          onUndo: () => updateSettings.mutate(previous),
        }),
    });
  };

  const teamOptions: ListOption[] = [
    { value: NO_TEAM, label: "No default team" },
    ...(teams.data ?? []).map((team) => ({
      value: team.id,
      label: team.name,
      icon: <ProjectIcon value={team.icon} className="size-icon-sm" />,
    })),
  ];

  const rules = (kind: "excluded" | "generic") => (kind === "excluded" ? excluded : generic).data;

  return (
    <div className="flex flex-col gap-4">
      <Heading />

      <SettingsGroup>
        <SettingsRow
          label="Enable Customer requests"
          description="Workspace-wide access to create and view customer requests"
        >
          {(id) => (
            <Switch
              id={id}
              checked={enabled}
              disabled={!canEdit}
              onCheckedChange={(next) =>
                next ? save({ enabled: true }) : setConfirmingDisable(true)
              }
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Manage customers"
          description="Manage your list of customers and their requests"
        >
          {() => (
            <Button type="button" variant="ghost" disabled>
              No customers
            </Button>
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Issue routing"
        description="When a new issue is created from a customer page, it will be routed to the default team’s triage or backlog. This centralizes customer requests for ease of management and prioritization."
      >
        <SettingsRow label="Default team for customer requests">
          {(id) => (
            <Select
              id={id}
              trigger="button"
              value={current.defaultTeamId ?? NO_TEAM}
              disabled={controlsOff}
              options={teamOptions}
              onValueChange={(next) => {
                const defaultTeamId = next === NO_TEAM ? null : next;
                if (defaultTeamId !== settings.data.defaultTeamId) save({ defaultTeamId });
              }}
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      <CustomerLabelList
        noun="status"
        title="Customer statuses"
        description="Define statuses for segmenting customers"
        items={statuses.data}
        canEdit={!controlsOff}
        actions={{
          create: (input) => createStatus.mutateAsync(input),
          update: (input) => updateStatus.mutateAsync(input),
          remove: (id) => deleteStatus.mutateAsync({ id }),
          reorder: (ids) => reorderStatuses.mutateAsync({ ids }),
        }}
      />
      <CustomerLabelList
        noun="tier"
        title="Customer tiers"
        description="Define tiers for segmenting customers"
        items={tiers.data}
        canEdit={!controlsOff}
        actions={{
          create: (input) => createTier.mutateAsync(input),
          update: (input) => updateTier.mutateAsync(input),
          remove: (id) => deleteTier.mutateAsync({ id }),
          reorder: (ids) => reorderTiers.mutateAsync({ ids }),
        }}
      />

      <SettingsGroup title="Display options">
        <SettingsRow
          label="Revenue formatting"
          description="Data imports must be in annual figures, but can be displayed as monthly or annual"
        >
          {(id) => (
            <Select
              id={id}
              trigger="button"
              value={current.revenuePeriod}
              disabled={controlsOff}
              options={REVENUE_OPTIONS}
              onValueChange={(revenuePeriod) => {
                if (revenuePeriod !== settings.data.revenuePeriod) save({ revenuePeriod });
              }}
            />
          )}
        </SettingsRow>
        <SettingsRow
          label="Revenue currency"
          description="The currency used when displaying customer revenue"
        >
          {(id) => (
            <Combobox
              label="Revenue currency"
              value={current.revenueCurrency}
              options={getCurrencyOptions()}
              searchPlaceholder="Search currencies…"
              width="md"
              onValueChange={(revenueCurrency) => {
                if (revenueCurrency !== settings.data.revenueCurrency) save({ revenueCurrency });
              }}
            >
              <Button
                id={id}
                type="button"
                variant="secondary"
                disabled={controlsOff}
                trailingIcon={ChevronDown}
              >
                {currencyLabel(current.revenueCurrency)}
              </Button>
            </Combobox>
          )}
        </SettingsRow>
      </SettingsGroup>

      <SettingsGroup
        title="Customer attributes data source"
        description="Sync customer attributes from an external data source"
      >
        <SettingsRow label="External data source">
          {() => <span className="text-body-md text-secondary">None</span>}
        </SettingsRow>
        <SettingsRow
          label="Enable manual edits"
          description="Attributes can be edited in the Zynox UI"
        >
          {(id) => (
            <Switch
              id={id}
              checked={current.manualEditsEnabled}
              disabled={controlsOff}
              onCheckedChange={(manualEditsEnabled) => save({ manualEditsEnabled })}
            />
          )}
        </SettingsRow>
      </SettingsGroup>

      <CustomerDomainList
        title="Excluded domains and emails"
        description="Domains and emails that should never create customer requests"
        emptyText="No excluded domains and emails"
        countNoun="excluded domains and emails"
        addTitle="Add excluded domain or email"
        rules={rules("excluded") ?? []}
        canEdit={!controlsOff}
        onAdd={async (value) => {
          await addRule.mutateAsync({ kind: "excluded", value });
          await invalidate(rulesKey("excluded"));
        }}
        onRemove={async (id) => {
          await removeRule.mutateAsync({ id });
          await invalidate(rulesKey("excluded"));
        }}
      />
      <CustomerDomainList
        title="Generic domains and emails"
        description={<GenericDomainsLink />}
        emptyText="No custom generic domains and emails"
        countNoun="custom generic domains and emails"
        addTitle="Add generic domain or email"
        rules={rules("generic") ?? []}
        canEdit={!controlsOff}
        onAdd={async (value) => {
          await addRule.mutateAsync({ kind: "generic", value });
          await invalidate(rulesKey("generic"));
        }}
        onRemove={async (id) => {
          await removeRule.mutateAsync({ id });
          await invalidate(rulesKey("generic"));
        }}
      />

      <Confirm
        open={confirmingDisable}
        onOpenChange={setConfirmingDisable}
        variant="primary"
        title="Disable customer requests for entire workspace?"
        description="Customers and customer requests are hidden everywhere until you enable them again."
        confirmLabel="Disable"
        onConfirm={() => save({ enabled: false })}
      />
    </div>
  );
}
