/**
 * Notifications (Settings → Personal → Notifications; spec `notifications-settings.md`, Figma
 * 33:21702, textos do Linear ao vivo): três seções — Inbox, Push notifications (uma linha por canal,
 * cada uma leva à sua subpágina) e Updates from Zynox. `NotificationsView` é só a tela (valores e
 * `onChange`); a página ligada à API vem depois.
 *
 * Efeito real hoje: só Priority inbox e os tipos de prioridade que o Zynox gera. O resto é
 * persistido sem efeito (sem app desktop/mobile, sem envio de e-mail, sem Slack): ver a spec.
 */
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Switch } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import {
  PUSH_CHANNELS,
  countEnabled,
  summarizeChannel,
  type ChannelMatrix,
  type NotificationChannelKey,
} from "./notifications-model";
import { SettingsGroup, SettingsRow } from "./settings-row";

/** Flags de nível Member (o que não é a matriz canal × tipo). */
export type NotificationFlags = {
  priorityInbox: boolean;
  showChangelogInSidebar: boolean;
  changelogNewsletter: boolean;
  marketingAndOnboarding: boolean;
  inviteAccepted: boolean;
  privacyAndLegalUpdates: boolean;
  dataProcessingAgreement: boolean;
};

export const SETTINGS_NOTIFICATIONS_PATH = "/settings/notifications";

/** Linha que leva a outra página: rótulo e ajuda à esquerda, valor e seta à direita. */
function LinkRow({
  to,
  label,
  description,
  value,
  icon,
}: {
  to: string;
  label: string;
  description?: string;
  value?: string;
  icon?: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="-mx-4 flex items-center gap-3 border-b border-default px-4 py-4 no-underline last:border-b-0 focus-ring hovered:bg-hover"
    >
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-label-md text-primary">{label}</span>
        {description && <span className="text-body-sm text-secondary">{description}</span>}
      </div>
      {value && <span className="shrink-0 text-body-sm text-secondary">{value}</span>}
      <Icon icon={ChevronRight} size="sm" className="shrink-0 text-secondary" />
    </Link>
  );
}

export function NotificationsView({
  flags,
  channels,
  onFlag,
  headingLevel = "h1",
}: {
  flags: NotificationFlags;
  /** A matriz de cada canal (tipo → ligado): serve ao resumo e à contagem de prioridade. */
  channels: Record<NotificationChannelKey, ChannelMatrix>;
  onFlag: (patch: Partial<NotificationFlags>) => void;
  headingLevel?: "h1" | "h2";
}) {
  const Heading = headingLevel;
  const flag = (key: keyof NotificationFlags, label: string, description: string) => (
    <SettingsRow label={label} description={description}>
      {(id) => (
        <Switch
          id={id}
          checked={flags[key]}
          onCheckedChange={(checked) => onFlag({ [key]: checked })}
        />
      )}
    </SettingsRow>
  );

  return (
    <div className="flex flex-col gap-1">
      <Heading className="type-heading-1 pb-6 text-primary">Notifications</Heading>

      <SettingsGroup
        title="Inbox"
        description="Manage how notifications are organized in your inbox"
      >
        {flag(
          "priorityInbox",
          "Priority inbox",
          "Separate important notifications from the rest of your inbox",
        )}
        <LinkRow
          to={`${SETTINGS_NOTIFICATIONS_PATH}/priority`}
          label="Priority notifications"
          description="Choose which notifications are treated as priority"
          value={`${countEnabled(channels.priority)} types`}
        />
      </SettingsGroup>

      <SettingsGroup
        title="Push notifications"
        description="Choose which notifications are pushed to your devices. All notifications will still appear in your inbox."
      >
        {PUSH_CHANNELS.map((channel) => (
          <LinkRow
            key={channel.key}
            to={`${SETTINGS_NOTIFICATIONS_PATH}/${channel.key}`}
            label={channel.title}
            description={summarizeChannel(channels[channel.key])}
            icon={
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-hover text-secondary">
                <Icon icon={channel.icon} size="sm" />
              </span>
            }
          />
        ))}
      </SettingsGroup>

      <SettingsGroup
        title="Updates from Zynox"
        description="Subscribe to product announcements and important changes from the Zynox team"
      >
        {flag(
          "showChangelogInSidebar",
          "Show updates in sidebar",
          "Highlight new features and improvements in the app sidebar",
        )}
        {flag(
          "changelogNewsletter",
          "Changelog newsletter",
          "Receive an email twice a month highlighting new features and improvements",
        )}
      </SettingsGroup>

      <SettingsGroup title="Marketing">
        {flag(
          "marketingAndOnboarding",
          "Marketing and onboarding",
          "Occasional updates to help you get the most out of Zynox",
        )}
      </SettingsGroup>

      <SettingsGroup title="Other updates">
        {flag("inviteAccepted", "Invite accepted", "Email when invitees accept an invite")}
        {flag(
          "privacyAndLegalUpdates",
          "Privacy and legal updates",
          "Email when privacy policies or terms of service change",
        )}
        {flag(
          "dataProcessingAgreement",
          "Data processing agreement (DPA)",
          "Email when our DPA changes",
        )}
      </SettingsGroup>
    </div>
  );
}
