/**
 * Subpágina de um canal de Notifications (`/settings/notifications/{priority,desktop,mobile,email,
 * slack}`; spec `notifications-settings.md`, textos do Linear ao vivo): o mesmo componente para os
 * cinco, com a lista dos 14 tipos em "General notifications" e "Feature notifications".
 *
 * - Desktop, Mobile e Slack: a lista inteira fica desabilitada, com o motivo (não existe app nativo
 *   nem integração com o Slack no Zynox), como o Linear mostra sem o app/integração.
 * - Email: editável e persistido, mas sem envio real (não há infra de e-mail).
 * - Priority: a lista de tipos tratados como prioridade.
 */
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Checkbox, Select, Switch } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";
import {
  NOTIFICATION_TYPES,
  type ChannelMatrix,
  type NotificationChannelKey,
  type NotificationTypeKey,
} from "./notifications-model";
import { SETTINGS_NOTIFICATIONS_PATH } from "./notifications";
import { SettingsGroup, SettingsRow } from "./settings-row";

/** "‹ Notifications" no canto do painel (Linear): reaproveitado no carregamento e no erro também. */
export function NotificationsBackLink() {
  return (
    <nav aria-label="Breadcrumb" className="absolute top-3 left-4">
      <Link
        to={SETTINGS_NOTIFICATIONS_PATH}
        className="flex h-control-md items-center gap-1.5 rounded-full pr-3 pl-2 text-label-md text-secondary no-underline transition-colors select-none focus-ring hovered:bg-hover hovered:text-primary"
      >
        <Icon icon={ChevronLeft} size="sm" />
        Notifications
      </Link>
    </nav>
  );
}

export type EmailSettings = {
  emailEnabled: boolean;
  emailFormat: "digest" | "immediate";
  emailDigestDelayLowPriority: boolean;
  emailDigestUrgentImmediate: boolean;
};

type ChannelCopy = { title: string; description?: string; notice?: ReactNode };

const COPY: Record<NotificationChannelKey, ChannelCopy> = {
  priority: {
    title: "Priority notifications",
    description: "Choose which notifications are treated as priority",
  },
  desktop: {
    title: "Desktop",
    description: "Applies across all your desktop devices with notifications enabled",
    notice: "Desktop notifications require the Zynox desktop app",
  },
  mobile: {
    title: "Mobile",
    description: "Applies across all your mobile devices with notifications enabled",
    notice: "Mobile notifications require the Zynox mobile app",
  },
  email: { title: "Email" },
  slack: { title: "Slack" },
};

/** Canais sem infraestrutura no Zynox: a página toda fica desabilitada. */
const UNAVAILABLE: NotificationChannelKey[] = ["desktop", "mobile", "slack"];

export function NotificationChannelView({
  channel,
  matrix,
  onToggleType,
  email,
  emailSettings,
  onEmailSettings,
  priorityInbox = false,
  headingLevel = "h1",
}: {
  channel: NotificationChannelKey;
  matrix: ChannelMatrix;
  onToggleType: (type: NotificationTypeKey, enabled: boolean) => void;
  /** Endereço do Member, mostrado na linha "Enable email notifications". */
  email?: string;
  emailSettings?: EmailSettings;
  onEmailSettings?: (patch: Partial<EmailSettings>) => void;
  /** Só com a Priority inbox ligada "Only deliver priority notifications" é editável. */
  priorityInbox?: boolean;
  headingLevel?: "h1" | "h2";
}) {
  const copy = COPY[channel];
  const unavailable = UNAVAILABLE.includes(channel);
  const Heading = headingLevel;

  const typeGroup = (group: "general" | "feature", title: string) => (
    <SettingsGroup title={title}>
      {NOTIFICATION_TYPES.filter((type) => type.group === group).map((type) => (
        <SettingsRow key={type.key} label={type.label} description={type.description}>
          {(id) => (
            <Checkbox
              id={id}
              checked={matrix[type.key]}
              disabled={unavailable}
              onCheckedChange={(checked) => onToggleType(type.key, checked === true)}
            />
          )}
        </SettingsRow>
      ))}
    </SettingsGroup>
  );

  return (
    <div className="flex flex-col gap-1 pt-8">
      <NotificationsBackLink />
      <div className="flex flex-col gap-1 pb-6">
        <Heading className="type-heading-1 text-primary">{copy.title}</Heading>
        {copy.description && <p className="text-body-md text-secondary">{copy.description}</p>}
      </div>

      {copy.notice && (
        <SettingsGroup>
          <div className="py-4 text-label-md text-primary">{copy.notice}</div>
        </SettingsGroup>
      )}

      {channel === "slack" && (
        <SettingsGroup>
          <div className="flex items-center justify-between gap-4 py-4">
            <span className="text-label-md text-primary">Personal Slack account not connected</span>
            <Link
              to="/settings/connected-accounts"
              className="rounded-control text-label-md text-secondary no-underline focus-ring hovered:text-primary"
            >
              Connected accounts
            </Link>
          </div>
        </SettingsGroup>
      )}

      {channel === "email" && emailSettings && onEmailSettings && (
        <>
          <SettingsGroup>
            <SettingsRow
              label="Enable email notifications"
              description={email ? `Email notifications to ${email}` : undefined}
            >
              {(id) => (
                <Switch
                  id={id}
                  checked={emailSettings.emailEnabled}
                  onCheckedChange={(emailEnabled) => onEmailSettings({ emailEnabled })}
                />
              )}
            </SettingsRow>
            <SettingsRow
              label="Only deliver priority notifications"
              description={
                <>
                  Uses your{" "}
                  <Link
                    to={`${SETTINGS_NOTIFICATIONS_PATH}/priority`}
                    className="text-secondary underline focus-ring hovered:text-primary"
                  >
                    priority notification settings→
                  </Link>
                </>
              }
            >
              {(id) => <Switch id={id} checked={false} disabled={!priorityInbox} />}
            </SettingsRow>
            <SettingsRow
              label="Notification format"
              description="Choose whether to group email notifications"
            >
              {(id) => (
                <Select
                  id={id}
                  value={emailSettings.emailFormat}
                  onValueChange={(emailFormat) => onEmailSettings({ emailFormat })}
                  options={[
                    { value: "digest", label: "Digest" },
                    { value: "immediate", label: "Immediate" },
                  ]}
                />
              )}
            </SettingsRow>
          </SettingsGroup>
          <SettingsGroup title="Email digest settings">
            <SettingsRow
              label="Delay low priority emails outside of work hours until next work day"
              description="Delay low priority emails outside of work hours until the next work day"
            >
              {(id) => (
                <Switch
                  id={id}
                  checked={emailSettings.emailDigestDelayLowPriority}
                  onCheckedChange={(emailDigestDelayLowPriority) =>
                    onEmailSettings({ emailDigestDelayLowPriority })
                  }
                />
              )}
            </SettingsRow>
            <SettingsRow
              label="Immediately notify if an assigned issue is urgent or breaches SLA"
              description="Immediately notify when an assigned issue is urgent or breaches its SLA"
            >
              {(id) => (
                <Switch
                  id={id}
                  checked={emailSettings.emailDigestUrgentImmediate}
                  onCheckedChange={(emailDigestUrgentImmediate) =>
                    onEmailSettings({ emailDigestUrgentImmediate })
                  }
                />
              )}
            </SettingsRow>
          </SettingsGroup>
        </>
      )}

      {typeGroup("general", "General notifications")}
      {typeGroup("feature", "Feature notifications")}
    </div>
  );
}
