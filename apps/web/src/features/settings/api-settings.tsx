/**
 * Settings → Administration → API (spec `settings-security-api-usage.md`, API.3). Referência:
 * Linear ao vivo, `/zynox-dev/settings/api`, 29/09. Só a seção **API keys** existe: OAuth
 * applications e Webhooks dependem de auth e de Issues (D9, D10) e não aparecem. A seção tem
 * duas linhas em um cartão: **API key creation** (Select All members / Only admins, salva ao
 * escolher, como o autosave de Workspace) e **Issued keys** (link para a tabela, com a contagem).
 * Só Admin muda a política; a API devolve FORBIDDEN de qualquer forma.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router";
import type { ApiKeyPolicy } from "@vyzer/contract";
import {
  Alert,
  Button,
  FormLabel,
  HelperText,
  Select,
  Skeleton,
  useToast,
  type ListOption,
} from "@vyzer/design-system/components";
import { Icon } from "@vyzer/design-system/icons";
import { apiKeysQueryOptions } from "@/services/api-keys";
import { currentWorkspaceQueryOptions, updateWorkspaceMutationOptions } from "@/services/workspace";
import { ISSUED_KEYS_PATH, SECURITY_PATH } from "./api-key-shared";

const POLICY_OPTIONS: ListOption[] = [
  { value: "all_members", label: "All members" },
  { value: "admins", label: "Only admins" },
];

function ApiKeyCreationRow({ policy, canEdit }: { policy: ApiKeyPolicy; canEdit: boolean }) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const update = useMutation({
    ...updateWorkspaceMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: currentWorkspaceQueryOptions().queryKey });
    },
    onError: () => {
      toast({
        title: "Could not save API key creation",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
  });

  const change = (next: ApiKeyPolicy) => {
    if (next === policy) return;
    update.mutate(
      { apiKeyPolicy: next },
      {
        onSuccess: () =>
          toast({
            title: "Saved",
            variant: "success",
            onUndo: () => update.mutate({ apiKeyPolicy: policy }),
          }),
      },
    );
  };

  return (
    <div className="flex items-center gap-4 border-b border-subtle px-4 py-4">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <FormLabel htmlFor="api-key-creation">API key creation</FormLabel>
        <HelperText>Choose which members can create personal API keys</HelperText>
      </div>
      <Select
        id="api-key-creation"
        trigger="button"
        value={policy}
        disabled={!canEdit || update.isPending}
        onValueChange={(next) => change(next as ApiKeyPolicy)}
        options={POLICY_OPTIONS}
      />
    </div>
  );
}

function IssuedKeysRow({ canSeeWorkspace }: { canSeeWorkspace: boolean }) {
  const keys = useQuery(apiKeysQueryOptions(canSeeWorkspace ? "workspace" : "mine"));
  const count = keys.data?.filter((key) => key.revokedAt === null).length;

  return (
    <Link
      to={ISSUED_KEYS_PATH}
      className="flex items-center gap-4 px-4 py-4 no-underline focus-ring hovered:bg-hover last:rounded-b-container"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-md text-primary">Issued keys</span>
        <span className="text-caption text-secondary">View and manage issued API keys</span>
      </div>
      {keys.isPending ? (
        <Skeleton className="w-16" />
      ) : keys.isError ? (
        <span className="text-caption text-secondary">Unavailable</span>
      ) : (
        <span className="text-caption text-secondary">
          {count} API {count === 1 ? "key" : "keys"}
        </span>
      )}
      <Icon icon={ChevronRight} size="sm" className="text-secondary" />
    </Link>
  );
}

export function ApiSettingsPage() {
  const current = useQuery(currentWorkspaceQueryOptions());

  if (current.isPending) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-4 text-primary">API</h1>
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading API settings.</span>
          <Skeleton className="h-control-lg w-full" />
          <Skeleton className="h-control-lg w-full" />
        </div>
      </div>
    );
  }

  if (current.isError) {
    return (
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-1 pb-4 text-primary">API</h1>
        <Alert
          tone="danger"
          role="alert"
          title="Could not load API settings"
          action={
            <Button type="button" variant="secondary" onClick={() => void current.refetch()}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      </div>
    );
  }

  const isAdmin = current.data.member.role === "admin";

  return (
    <div className="flex flex-col gap-1">
      <h1 className="type-heading-1 text-primary">API</h1>
      <p className="pb-6 text-body-md text-secondary">
        Use API keys to connect integrations and tools to Vyzer
      </p>
      <section className="flex flex-col gap-1">
        <h2 className="type-heading-3 text-primary">API keys</h2>
        <p className="pb-3 text-body-md text-secondary">
          Control whether workspace members can create personal API keys. View your own keys in{" "}
          <Link
            to={SECURITY_PATH}
            className="text-primary underline focus-ring hovered:text-secondary"
          >
            Security & access
          </Link>{" "}
          settings.
        </p>
        <div className="flex flex-col rounded-container border border-subtle">
          <ApiKeyCreationRow policy={current.data.workspace.apiKeyPolicy} canEdit={isAdmin} />
          <IssuedKeysRow canSeeWorkspace={isAdmin} />
        </div>
      </section>
    </div>
  );
}
