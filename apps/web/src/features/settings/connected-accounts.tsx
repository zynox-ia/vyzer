/**
 * Connected accounts (Settings → Personal → Connected accounts; spec `github-integration.md`; Linear
 * ao vivo, 30/09): uma linha por conta (ícone, nome, ajuda e o botão à direita). Só o GitHub tem
 * função real nesta entrega — "Connect" leva ao OAuth, "Connected as @usuário" mostra o avatar e
 * "Disconnect" pede confirmação. Slack, Google Calendar e Notion aparecem como no Linear, mas com o
 * botão desabilitado: dependem de OAuth que o Zynox ainda não tem.
 *
 * `ConnectedAccountsView` é só a tela (estado e callbacks); a página ligada à API vem depois.
 */
import { Calendar, FileText, Hash, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, Button, Confirm } from "@zynox/design-system/components";
import { GithubIcon, Icon } from "@zynox/design-system/icons";
import { SettingsGroup } from "./settings-row";

export type GithubConnection =
  | { status: "disconnected" }
  | { status: "connected"; login: string; avatarUrl: string | null };

function AccountRow({
  icon,
  name,
  description,
  action,
}: {
  icon: ReactNode;
  name: string;
  description: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-default py-4 last:border-b-0">
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-md text-primary">{name}</span>
        <span className="text-body-sm text-secondary">{description}</span>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

const tile = (glyph: ReactNode) => (
  <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-hover text-secondary">
    {glyph}
  </span>
);
const iconTile = (icon: LucideIcon) => tile(<Icon icon={icon} size="sm" />);

/** Contas que ainda não têm OAuth no Zynox: a linha existe, o botão não. */
const UNAVAILABLE_ACCOUNTS: { name: string; description: string; icon: LucideIcon }[] = [
  {
    name: "Slack",
    description: "Sync your message attribution, and receive notifications in Slack",
    icon: Hash,
  },
  {
    name: "Google Calendar",
    description: "Sync your calendar out-of-office status to Zynox",
    icon: Calendar,
  },
  {
    name: "Notion",
    description: "Preview issues, projects, and views within Notion",
    icon: FileText,
  },
];

export function ConnectedAccountsView({
  github,
  onConnectGithub,
  onDisconnectGithub,
  busy = false,
  headingLevel = "h1",
}: {
  github: GithubConnection;
  onConnectGithub: () => void;
  onDisconnectGithub: () => void;
  /** Durante o redirecionamento do OAuth ou a desconexão: o botão fica desabilitado. */
  busy?: boolean;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const connected = github.status === "connected";

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 text-primary">Connected accounts</Heading>
      <p className="pb-6 text-body-md text-secondary">
        Connect your user accounts to sync attribution of your actions between apps
      </p>

      <SettingsGroup>
        {UNAVAILABLE_ACCOUNTS.map((account) => (
          <AccountRow
            key={account.name}
            icon={iconTile(account.icon)}
            name={account.name}
            description={account.description}
            action={
              <Button
                type="button"
                variant="secondary"
                disabled
                aria-label={`Connect ${account.name} (not available yet)`}
              >
                Connect
              </Button>
            }
          />
        ))}
        <AccountRow
          icon={
            connected ? (
              <Avatar
                name={github.login}
                src={github.avatarUrl ?? undefined}
                className="size-8 shrink-0"
              />
            ) : (
              tile(<GithubIcon size="sm" />)
            )
          }
          name={connected ? `GitHub · @${github.login}` : "GitHub"}
          description={
            connected
              ? `Connected as @${github.login}`
              : "Review code in Zynox and sync attribution of your git-related actions"
          }
          action={
            connected ? (
              <Confirm
                title="Disconnect GitHub?"
                description="Pull requests already linked to issues stay linked. You can connect your account again at any time."
                confirmLabel="Disconnect"
                onConfirm={onDisconnectGithub}
              >
                <Button type="button" variant="ghost" disabled={busy}>
                  Disconnect
                </Button>
              </Confirm>
            ) : (
              <Button type="button" variant="secondary" disabled={busy} onClick={onConnectGithub}>
                Connect
              </Button>
            )
          }
        />
      </SettingsGroup>
    </div>
  );
}
