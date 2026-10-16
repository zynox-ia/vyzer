/**
 * Peças compartilhadas das telas de chave pessoal de API (spec `settings-security-api-usage.md`,
 * API.2): rótulos de permissão, datas, link de volta e o menu "Open menu" com "Revoke API key".
 * Referência: Linear ao vivo, `/zynox-dev/settings/account/security` e `/api-keys/...`, 29/09.
 */
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Ellipsis, Pencil, Trash2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import type { ApiClient, ApiKeyPermission } from "@zynox/contract";
import {
  Confirm,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuTrigger,
  useToast,
} from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import { api } from "@/services/api";
import { revokeApiKeyMutationOptions } from "@/services/api-keys";

export type ApiKey = Awaited<ReturnType<ApiClient["apiKey"]["list"]>>[number];

/** Rota base das telas de chave; `/settings/security` é o Personal "Security & access". */
export const SECURITY_PATH = "/settings/security";
export const NEW_API_KEY_PATH = `${SECURITY_PATH}/api-keys/new`;
export const apiKeyPath = (id: string) => `${SECURITY_PATH}/api-keys/${id}`;
export const apiKeyEditPath = (id: string) => `${apiKeyPath(id)}/edit`;
/** Settings → Administration → API e a tabela de chaves emitidas. */
export const API_SETTINGS_PATH = "/settings/api";
export const ISSUED_KEYS_PATH = `${API_SETTINGS_PATH}/keys`;

/** As cinco permissões do formulário do Linear, com o texto de cada uma. */
export const PERMISSION_OPTIONS: {
  value: ApiKeyPermission;
  label: string;
  description: string;
}[] = [
  { value: "read", label: "Read", description: "Read all workspace data available to you" },
  {
    value: "write",
    label: "Write",
    description: "Read and write all workspace data available to you",
  },
  { value: "issues:create", label: "Create issues", description: "Create and update issues" },
  { value: "comments:create", label: "Create comments", description: "Create issue comments" },
  { value: "admin", label: "Admin", description: "Access admin-only API features" },
];

/** Permissões que só um Admin pode pedir (a API recusa as outras para Member comum). */
export const ADMIN_ONLY_PERMISSIONS: ApiKeyPermission[] = ["admin"];

export function formatPermissions(permissions: ApiKey["permissions"]) {
  if (permissions === "full") return "Full access";
  const labels = new Map(PERMISSION_OPTIONS.map((option) => [option.value, option.label]));
  return permissions.map((permission) => labels.get(permission) ?? permission).join(", ");
}

const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});
const fullDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

export const formatShortDate = (iso: string) => shortDate.format(new Date(iso));
export const formatFullDate = (iso: string) => fullDate.format(new Date(iso));

/** Link de volta no topo das telas de chave, como o Linear (link com seta). */
export function PageBackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="mb-6 flex h-control-md w-fit items-center gap-1.5 rounded-control pr-2 pl-1.5 text-label-md text-secondary no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary"
    >
      <Icon icon={ArrowLeft} size="sm" />
      {label}
    </Link>
  );
}

/** "Security settings" no topo de Create e do detalhe. */
export function SecuritySettingsBackLink() {
  return <PageBackLink to={SECURITY_PATH} label="Security settings" />;
}

/**
 * Menu "Open menu" com "Edit API key" e "Revoke API key" (Confirm danger), os dois itens do
 * Linear ao vivo. `onRevoked` deixa a tela decidir para
 * onde ir depois (a lista só recarrega; o detalhe volta para a lista).
 */
export function ApiKeyMenu({
  apiKey,
  className,
  onRevoked,
  edit = true,
}: {
  apiKey: ApiKey;
  className?: string;
  onRevoked?: () => void;
  /** "Edit API key" só nas telas pessoais; a tabela de Settings → API tem só "Revoke API key". */
  edit?: boolean;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const toast = useToast();
  const [confirming, setConfirming] = useState(false);
  // O Radix devolve o foco ao gatilho ao fechar o menu, tirando-o do Confirm que acabou de abrir.
  const openingConfirm = useRef(false);

  const revoke = useMutation({
    ...revokeApiKeyMutationOptions(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: api.apiKey.key() });
      toast({ title: "API key revoked", variant: "success" });
      onRevoked?.();
    },
    onError: () => {
      toast({
        title: "Could not revoke API key",
        description: "Nothing was changed. Check your connection and try again.",
        variant: "error",
      });
    },
  });

  return (
    <>
      <Menu>
        <MenuTrigger asChild>
          <IconButton
            icon={Ellipsis}
            label="Open menu"
            variant="ghost"
            className={className}
            disabled={revoke.isPending}
          />
        </MenuTrigger>
        <MenuContent
          variant="dropdown"
          align="end"
          onCloseAutoFocus={(event) => {
            if (openingConfirm.current) {
              event.preventDefault();
              openingConfirm.current = false;
            }
          }}
        >
          {edit && (
            <MenuItem icon={Pencil} onSelect={() => void navigate(apiKeyEditPath(apiKey.id))}>
              Edit API key
            </MenuItem>
          )}
          <MenuItem
            icon={Trash2}
            onSelect={() => {
              openingConfirm.current = true;
              setConfirming(true);
            }}
          >
            Revoke API key
          </MenuItem>
        </MenuContent>
      </Menu>
      <Confirm
        open={confirming}
        onOpenChange={setConfirming}
        title="Revoke API key?"
        description={`Anything using "${apiKey.name}" stops working immediately. This cannot be undone.`}
        confirmLabel="Revoke API key"
        onConfirm={() => revoke.mutate({ id: apiKey.id })}
      />
    </>
  );
}
