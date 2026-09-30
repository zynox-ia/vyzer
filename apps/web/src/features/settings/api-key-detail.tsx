/**
 * Settings → Security & access → uma chave pessoal (`/settings/security/api-keys/:keyId`).
 * Não estava na spec: o Linear ao vivo leva a linha da chave a uma página só de leitura (29/09,
 * `/api-keys/<id>`), com o nome da chave como título, "Created <data>", **Key name**,
 * **Permissions**, **Team access** e um menu "Open menu" (revogar). Team access fica de fora até
 * a API.4 (D6). Chave inexistente ou de outro Member: `EmptyState`, como Project não encontrado.
 */
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, EmptyState, Skeleton } from "@vyzer/design-system/components";
import { apiKeysQueryOptions } from "@/services/api-keys";
import {
  ApiKeyMenu,
  formatFullDate,
  formatPermissions,
  SECURITY_PATH,
  SecuritySettingsBackLink,
} from "./api-key-shared";

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-label-md text-primary">{label}</dt>
      <dd className="text-body-md text-secondary">{value}</dd>
    </div>
  );
}

export function ApiKeyDetailPage() {
  const { keyId } = useParams();
  const navigate = useNavigate();
  const keys = useQuery(apiKeysQueryOptions("mine"));
  const apiKey = keys.data?.find((key) => key.id === keyId);

  if (keys.isPending) {
    return (
      <div className="flex flex-col">
        <SecuritySettingsBackLink />
        <div aria-busy="true" className="flex flex-col gap-4">
          <span className="sr-only">Loading API key.</span>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="w-32" />
          <Skeleton className="w-64" />
        </div>
      </div>
    );
  }

  if (keys.isError) {
    return (
      <div className="flex flex-col">
        <SecuritySettingsBackLink />
        <Alert
          tone="danger"
          role="alert"
          title="Could not load the API key"
          action={
            <Button type="button" variant="secondary" onClick={() => void keys.refetch()}>
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
        <SecuritySettingsBackLink />
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
      <SecuritySettingsBackLink />
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <h1 className="type-heading-1 truncate text-primary">{apiKey.name}</h1>
          <p className="text-body-md text-secondary">Created {formatFullDate(apiKey.createdAt)}</p>
        </div>
        {apiKey.revokedAt === null && (
          <ApiKeyMenu apiKey={apiKey} onRevoked={() => void navigate(SECURITY_PATH)} />
        )}
      </div>
      <dl className="flex flex-col gap-6 pt-6">
        <ReadOnlyField label="Key name" value={apiKey.name} />
        <ReadOnlyField label="Permissions" value={formatPermissions(apiKey.permissions)} />
        {apiKey.revokedAt !== null && (
          <ReadOnlyField label="Status" value={`Revoked ${formatFullDate(apiKey.revokedAt)}`} />
        )}
      </dl>
    </div>
  );
}
