/**
 * Settings → Personal → Security & access (spec `settings-security-api-usage.md`, API.2).
 * Só a seção **Personal API keys** existe: Sessions, Passkeys, Commit signing key e Authorized
 * applications dependem de autenticação/OAuth (ADR-0015) e não aparecem, nem como cabeçalho
 * vazio. Referência: Linear ao vivo, `/zynox-dev/settings/account/security`, 29/09 — título da
 * seção, texto de apoio e um cartão com o cabeçalho ("N API keys" + "New API key") e as linhas
 * (ícone, nome e "Created · Last used · permissões"; a linha inteira abre a chave).
 */
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Alert, Button, Skeleton } from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";
import { Icon } from "@zynox/design-system/icons";
import { apiKeysQueryOptions } from "@/services/api-keys";
import {
  ApiKeyMenu,
  apiKeyPath,
  formatPermissions,
  formatShortDate,
  NEW_API_KEY_PATH,
  type ApiKey,
} from "./api-key-shared";

function Dot() {
  return (
    <span aria-hidden="true" className="text-tertiary">
      ·
    </span>
  );
}

function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
  return (
    <li className="group relative flex items-center gap-3 border-b border-subtle px-4 py-4 last:rounded-b-container last:border-b-0 hovered:bg-hover">
      <Icon icon={KeyRound} size="sm" className="shrink-0 text-secondary" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* O link cobre a linha inteira (::after); o menu fica acima dele. */}
        <Link
          to={apiKeyPath(apiKey.id)}
          className="truncate text-label-md text-primary no-underline focus-ring after:absolute after:inset-0 after:content-['']"
        >
          {apiKey.name}
        </Link>
        <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-caption text-secondary">
          <span>Created {formatShortDate(apiKey.createdAt)}</span>
          <Dot />
          <span>
            {apiKey.lastUsedAt ? `Last used ${formatShortDate(apiKey.lastUsedAt)}` : "Never used"}
          </span>
          <Dot />
          <span>{formatPermissions(apiKey.permissions)}</span>
        </p>
      </div>
      <ApiKeyMenu
        apiKey={apiKey}
        className="relative z-base opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100"
      />
    </li>
  );
}

function ApiKeysSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col">
      <span className="sr-only">Loading API keys.</span>
      <div className="flex items-center gap-3 px-4 py-4">
        <Skeleton className="size-4" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="w-32" />
          <Skeleton className="w-64" />
        </div>
      </div>
    </div>
  );
}

function PersonalApiKeys() {
  const navigate = useNavigate();
  const keys = useQuery(apiKeysQueryOptions("mine"));
  // Chave revogada sai da lista pessoal; o histórico completo fica em Settings → API.
  const active = (keys.data ?? []).filter((key) => key.revokedAt === null);

  return (
    <section className="flex flex-col gap-1">
      <h2 className="type-heading-3 text-primary">Personal API keys</h2>
      <p className="pb-3 text-body-md text-secondary">
        Use API keys to connect your own integrations and tools to Zynox
      </p>
      <div className="flex flex-col rounded-container border border-subtle">
        <header
          className={cn(
            "flex items-center justify-between gap-4 px-4 py-4",
            keys.isSuccess && active.length > 0 && "border-b border-subtle",
          )}
        >
          {keys.isPending ? (
            <Skeleton className="w-20" />
          ) : keys.isError ? (
            <span className="text-body-md text-secondary">Could not load API keys</span>
          ) : active.length === 0 ? (
            <span className="text-body-md text-secondary">No API keys</span>
          ) : (
            <h3 className="text-label-md text-primary">
              {active.length} API {active.length === 1 ? "key" : "keys"}
            </h3>
          )}
          <Button type="button" onClick={() => void navigate(NEW_API_KEY_PATH)}>
            New API key
          </Button>
        </header>
        {keys.isPending && <ApiKeysSkeleton />}
        {keys.isError && (
          <div className="px-4 py-4">
            <Alert
              tone="danger"
              role="alert"
              title="Could not load API keys"
              action={
                <Button type="button" variant="secondary" onClick={() => void keys.refetch()}>
                  Retry
                </Button>
              }
            >
              Check your connection and try again.
            </Alert>
          </div>
        )}
        {keys.isSuccess && active.length > 0 && (
          <ul aria-label="Personal API keys">
            {active.map((key) => (
              <ApiKeyRow key={key.id} apiKey={key} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function SecurityAccessPage() {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="type-heading-1 pb-4 text-primary">Security & access</h1>
      <PersonalApiKeys />
    </div>
  );
}
