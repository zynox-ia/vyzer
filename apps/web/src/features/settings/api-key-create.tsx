/**
 * Settings → Security & access → Create API key (spec `settings-security-api-usage.md`, API.2).
 * Referência: Linear ao vivo, `/zynox-dev/settings/account/security/api-keys/new`, 29/09: página
 * (não diálogo) com "Security settings" no topo, título, subtítulo, **Key name**, **Permissions**
 * (Full access ou Only select permissions… com os cinco checkboxes) e Cancel/Create.
 *
 * Fora desta etapa (D6): **Team access**, que só existe quando houver a tabela de Team ligada às
 * chaves (API.4). O token aparece uma única vez, num Dialog que só fecha por "Done" ou pelo X:
 * clicar fora ou Esc não o descarta por acidente. O formato do que aparece depois de "Create"
 * no Linear não foi observado (D12): segue o padrão do setor (token + Copy).
 *
 * Um Member comum não pede Full access nem Admin (a API recusa): essas opções ficam
 * desabilitadas para não convidar a uma ação que falha. Com a política do Workspace em "Only
 * admins", um Member comum vê o motivo no lugar do formulário.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Alert,
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  Skeleton,
  TextInput,
  useToast,
} from "@vyzer/design-system/components";
import { api } from "@/services/api";
import { createApiKeyMutationOptions } from "@/services/api-keys";
import { currentWorkspaceQueryOptions } from "@/services/workspace";
import { ApiKeyForm } from "./api-key-form";
import { SECURITY_PATH, SecuritySettingsBackLink } from "./api-key-shared";

function TokenDialog({ token, onDone }: { token: string; onDone: () => void }) {
  const toast = useToast();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      toast({ title: "Copied", variant: "success" });
    } catch {
      toast({
        title: "Could not copy the key",
        description: "Select the key and copy it manually.",
        variant: "error",
      });
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onDone()}>
      <DialogContent
        title="Your API key"
        description="Copy it now and keep it somewhere safe. It won't be shown again."
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogBody>
          <TextInput
            aria-label="API key"
            readOnly
            value={token}
            onFocus={(event) => event.currentTarget.select()}
          />
        </DialogBody>
        <DialogFooter>
          <Button type="button" onClick={() => void copy()}>
            Copy
          </Button>
          <Button type="button" variant="primary" onClick={onDone}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ApiKeyCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const current = useQuery(currentWorkspaceQueryOptions());
  const [token, setToken] = useState<string | null>(null);

  const create = useMutation({
    ...createApiKeyMutationOptions(),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: api.apiKey.key() });
      setToken(result.token);
    },
    onError: () => {
      toast({
        title: "Could not create API key",
        description: "Nothing was created. Check your connection and try again.",
        variant: "error",
      });
    },
  });

  const leave = () => void navigate(SECURITY_PATH);

  const header = (
    <>
      <SecuritySettingsBackLink />
      <h1 className="type-heading-1 text-primary">Create API key</h1>
      <p className="pb-6 text-body-md text-secondary">
        When using the API key all actions are attributed to you as an individual
      </p>
    </>
  );

  if (current.isPending) {
    return (
      <div className="flex flex-col">
        {header}
        <div aria-busy="true" className="flex flex-col gap-6">
          <span className="sr-only">Loading.</span>
          <Skeleton className="h-control-lg w-full" />
          <Skeleton className="h-control-lg w-full" />
        </div>
      </div>
    );
  }

  if (current.isError) {
    return (
      <div className="flex flex-col">
        {header}
        <Alert
          tone="danger"
          role="alert"
          title="Could not load your settings"
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

  if (current.data.workspace.apiKeyPolicy === "admins" && !isAdmin) {
    return (
      <div className="flex flex-col">
        {header}
        <Alert tone="info" title="Only admins can create API keys">
          Your workspace admins turned API key creation off for members.
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {header}
      <ApiKeyForm
        isAdmin={isAdmin}
        submitLabel="Create"
        pending={create.isPending}
        onSubmit={(values) => create.mutate(values)}
        onCancel={leave}
      />
      {token && <TokenDialog token={token} onDone={leave} />}
    </div>
  );
}
