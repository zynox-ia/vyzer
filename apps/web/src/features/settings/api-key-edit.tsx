/**
 * Settings → Security & access → Edit API key (`/settings/security/api-keys/:keyId/edit`).
 * Referência: Linear ao vivo, `/zynox-dev/settings/account/security/api-keys/<id>/edit`, 29/09,
 * aberto pelo item "Edit API key" do menu da chave: o mesmo formulário do Create, com o nome e as
 * permissões atuais, título "Edit API key", link "Back" no topo e Cancel/Save. Team access entra
 * na API.4 (D6). O que o Linear faz depois de "Save" não foi observado (Save mudaria uma chave
 * real): volta para a página da chave com o toast "API key updated". Chave inexistente, revogada
 * ou de outro Member: `EmptyState`, como o detalhe.
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, EmptyState, Skeleton, useToast } from "@vyzer/design-system/components";
import { api } from "@/services/api";
import { apiKeysQueryOptions, updateApiKeyMutationOptions } from "@/services/api-keys";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import { ApiKeyForm } from "./api-key-form";
import { apiKeyPath, PageBackLink, SECURITY_PATH } from "./api-key-shared";

export function ApiKeyEditPage() {
  const { keyId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const keys = useQuery(apiKeysQueryOptions("mine"));
  const current = useQuery(currentWorkspaceQueryOptions());
  const apiKey = keys.data?.find((key) => key.id === keyId && key.revokedAt === null);

  const update = useMutation({
    ...updateApiKeyMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: api.apiKey.key() });
      toast({ title: "API key updated", variant: "success" });
      void navigate(apiKeyPath(keyId));
    },
    onError: () => {
      toast({
        title: "Could not update API key",
        description: "Nothing was changed. Check your connection and try again.",
        variant: "error",
      });
    },
  });

  const back = <PageBackLink to={apiKeyPath(keyId)} label="Back" />;

  if (keys.isPending || current.isPending) {
    return (
      <div className="flex flex-col">
        {back}
        <div aria-busy="true" className="flex flex-col gap-6">
          <span className="sr-only">Loading API key.</span>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-control-lg w-full" />
          <Skeleton className="h-control-lg w-full" />
        </div>
      </div>
    );
  }

  if (keys.isError || current.isError) {
    return (
      <div className="flex flex-col">
        {back}
        <Alert
          tone="danger"
          role="alert"
          title="Could not load the API key"
          action={
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                void keys.refetch();
                void current.refetch();
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

  if (!apiKey) {
    return (
      <div className="flex flex-col">
        <PageBackLink to={SECURITY_PATH} label="Back" />
        <EmptyState
          icon={KeyRound}
          title="API key not found"
          action={
            <Button type="button" onClick={() => void navigate(SECURITY_PATH)}>
              Back to Security settings
            </Button>
          }
        >
          It may have been revoked, or it belongs to someone else.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {back}
      <h1 className="type-heading-1 text-primary">Edit API key</h1>
      <p className="pb-6 text-body-md text-secondary">
        When using the API key all actions are attributed to you as an individual
      </p>
      <ApiKeyForm
        // A chave só entra no estado do formulário na montagem; trocar de chave remonta.
        key={apiKey.id}
        initial={apiKey}
        isAdmin={current.data.member.role === "admin"}
        submitLabel="Save"
        pending={update.isPending}
        onSubmit={(values) => update.mutate({ id: apiKey.id, ...values })}
        onCancel={() => void navigate(apiKeyPath(apiKey.id))}
      />
    </div>
  );
}
