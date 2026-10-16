/** Schema do banco. Entidades adicionadas por fatias de domínio; ver ADR-0005. */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

export type ApiKeyPermission = "read" | "write" | "issues:create" | "comments:create" | "admin";
export type ApiKeyPermissions = "full" | ApiKeyPermission[];
export type ApiKeyPolicy = "all_members" | "admins";

/** Structural shape shared with ProjectIconValue in the design system and API contract. */
type WorkspaceIconValue =
  | {
      kind: "icon";
      name: string;
      color:
        | "grey"
        | "slate"
        | "purple"
        | "cyan"
        | "green"
        | "amber"
        | "orange"
        | "pink"
        | "red"
        | `#${string}`;
    }
  | { kind: "emoji"; emoji: string };

export const workspace = pgTable(
  "workspace",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(1),
    logoUrl: text("logo_url"),
    icon: jsonb("icon")
      .$type<WorkspaceIconValue>()
      .notNull()
      .default({ kind: "icon", name: "Zap", color: "red" }),
    apiKeyPolicy: text("api_key_policy").$type<ApiKeyPolicy>().notNull().default("all_members"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "workspace_api_key_policy_check",
      sql`${table.apiKeyPolicy} IN ('all_members', 'admins')`,
    ),
  ],
);

/**
 * Better Auth owns authentication identity. Workspace membership stays in Zynox's
 * domain model below, so one authenticated user may belong to more than one
 * Workspace without duplicating credentials.
 */
export const authUser = pgTable(
  "auth_user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("auth_user_email_unique").on(table.email)],
);

export const authSession = pgTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    activeWorkspaceId: uuid("active_workspace_id").references(() => workspace.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    uniqueIndex("auth_session_token_unique").on(table.token),
    index("auth_session_user_active_workspace_index").on(table.userId, table.activeWorkspaceId),
  ],
);

export const authAccount = pgTable(
  "auth_account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => authUser.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("auth_account_provider_account_unique").on(table.providerId, table.accountId),
    index("auth_account_user_index").on(table.userId),
  ],
);

export const authVerification = pgTable(
  "auth_verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("auth_verification_identifier_index").on(table.identifier)],
);

export const member = pgTable(
  "member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    authUserId: text("auth_user_id").references(() => authUser.id, { onDelete: "set null" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    title: text("title"),
    username: text("username"),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("member_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("member_workspace_email_unique").on(table.workspaceId, table.email),
    uniqueIndex("member_workspace_username_unique").on(table.workspaceId, table.username),
    index("member_auth_user_workspace_index").on(table.authUserId, table.workspaceId),
  ],
);

/** Immutable audit trail for cross-cutting security-sensitive operations. */
export const auditEvent = pgTable(
  "audit_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id").references(() => workspace.id, { onDelete: "set null" }),
    actorMemberId: uuid("actor_member_id").references(() => member.id, { onDelete: "set null" }),
    operationId: uuid("operation_id"),
    type: text("type").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("audit_event_workspace_created_index").on(table.workspaceId, table.createdAt),
    index("audit_event_actor_created_index").on(table.actorMemberId, table.createdAt),
  ],
);

/**
 * Capability record consumed by Desktop exactly once. Device registration and
 * the launcher itself are intentionally delivered by the Desktop tickets.
 */
export const desktopIntent = pgTable(
  "desktop_intent",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    deviceId: text("device_id").notNull(),
    toolId: text("tool_id").notNull(),
    issueId: uuid("issue_id").references(() => issue.id, { onDelete: "set null" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("desktop_intent_token_hash_unique").on(table.tokenHash),
    index("desktop_intent_member_device_expiry_index").on(
      table.workspaceId,
      table.memberId,
      table.deviceId,
      table.expiresAt,
    ),
  ],
);

export const sidebarBadgeStyle = pgEnum("sidebar_badge_style", ["count", "dot"]);
export type SidebarBadgeStyle = (typeof sidebarBadgeStyle.enumValues)[number];

export const sidebarItemKey = pgEnum("sidebar_item_key", [
  "inbox",
  "reviews",
  "my-issues",
  "agent",
  "drafts",
  "projects",
  "views",
  "members",
  "teams",
]);
export type SidebarItemKey = (typeof sidebarItemKey.enumValues)[number];

export const sidebarItemVisibility = pgEnum("sidebar_item_visibility", [
  "always",
  "when-badged",
  "hidden",
]);
export type SidebarItemVisibility = (typeof sidebarItemVisibility.enumValues)[number];

export const memberDefaultHomeView = pgEnum("member_default_home_view", [
  "agent",
  "inbox",
  "my-issues",
  "reviews",
  "all-issues",
  "active-issues",
  "current-cycle",
  "projects",
]);
export type MemberDefaultHomeView = (typeof memberDefaultHomeView.enumValues)[number];

export const memberDisplayNameFormat = pgEnum("member_display_name_format", ["full", "first"]);
export type MemberDisplayNameFormat = (typeof memberDisplayNameFormat.enumValues)[number];

export const memberFirstDayOfWeek = pgEnum("member_first_day_of_week", ["sunday", "monday"]);
export type MemberFirstDayOfWeek = (typeof memberFirstDayOfWeek.enumValues)[number];

export const memberSendCommentsOn = pgEnum("member_send_comments_on", ["enter", "mod-enter"]);
export type MemberSendCommentsOn = (typeof memberSendCommentsOn.enumValues)[number];

export const memberInterfaceFontSize = pgEnum("member_interface_font_size", [
  "small",
  "default",
  "large",
]);
export type MemberInterfaceFontSize = (typeof memberInterfaceFontSize.enumValues)[number];

export const memberInterfaceTheme = pgEnum("member_interface_theme", ["system", "light", "dark"]);
export type MemberInterfaceTheme = (typeof memberInterfaceTheme.enumValues)[number];

export const memberCodeTheme = pgEnum("member_code_theme", [
  "linear-dark",
  "linear-colorblind",
  "linear-midnight",
  "andromeda",
  "atom-one-dark",
  "ayu-dark",
  "ayu-mirage",
  "catppuccin-frappe",
  "catppuccin-macchiato",
  "catppuccin-mocha",
  "cobalt2",
  "darcula",
  "dracula",
  "edge-dark",
  "everforest-dark",
  "github-dark",
  "github-dark-dimmed",
  "gruvbox-dark",
  "halcyon",
  "houston",
  "iceberg-dark",
  "modern-dark",
  "night-owl",
  "nord",
  "one-dark-pro",
  "one-monokai",
  "palenight",
  "rose-pine",
  "rose-pine-moon",
  "shades-of-purple",
  "solarized-dark",
  "sonokai",
  "synthwave-84",
  "tokyo-night",
  "vitesse-dark",
]);
export type MemberCodeTheme = (typeof memberCodeTheme.enumValues)[number];

export const memberCodeFontSize = pgEnum("member_code_font_size", [
  "smaller",
  "small",
  "default",
  "large",
  "larger",
]);
export type MemberCodeFontSize = (typeof memberCodeFontSize.enumValues)[number];

export const memberCodeLineHeight = pgEnum("member_code_line_height", [
  "compact",
  "regular",
  "relaxed",
]);
export type MemberCodeLineHeight = (typeof memberCodeLineHeight.enumValues)[number];

export const notificationEmailFormat = pgEnum("notification_email_format", ["digest", "immediate"]);
export type NotificationEmailFormat = (typeof notificationEmailFormat.enumValues)[number];

export const githubMergeStrategy = pgEnum("github_merge_strategy", ["merge", "squash", "rebase"]);
export type GithubMergeStrategy = (typeof githubMergeStrategy.enumValues)[number];

export const githubPullRequestState = pgEnum("github_pull_request_state", [
  "draft",
  "open",
  "merged",
  "closed",
]);
export type GithubPullRequestState = (typeof githubPullRequestState.enumValues)[number];

export const githubChecksStatus = pgEnum("github_checks_status", ["pending", "success", "failure"]);
export type GithubChecksStatus = (typeof githubChecksStatus.enumValues)[number];

export const githubReviewDecision = pgEnum("github_review_decision", [
  "approved",
  "changes_requested",
  "review_required",
]);
export type GithubReviewDecision = (typeof githubReviewDecision.enumValues)[number];

export const githubInstallationStatus = pgEnum("github_installation_status", [
  "active",
  "suspended",
  "deleted",
]);
export type GithubInstallationStatus = (typeof githubInstallationStatus.enumValues)[number];

export const notificationPreferenceChannel = pgEnum("notification_preference_channel", [
  "priority",
  "desktop",
  "mobile",
  "email",
  "slack",
]);
export type NotificationPreferenceChannel =
  (typeof notificationPreferenceChannel.enumValues)[number];

export const notificationPreferenceType = pgEnum("notification_preference_type", [
  "assignments",
  "status-changes",
  "comments-and-replies",
  "mentions",
  "reactions",
  "subscriptions",
  "document-changes",
  "updates",
  "reminders-and-deadlines",
  "loops",
  "apps-and-integrations",
  "billing",
  "reviews",
  "triage",
]);
export type NotificationPreferenceType = (typeof notificationPreferenceType.enumValues)[number];

export const memberSidebarPreference = pgTable(
  "member_sidebar_preference",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    badgeStyle: sidebarBadgeStyle("badge_style").notNull().default("count"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("member_sidebar_preference_member_workspace_unique").on(
      table.memberId,
      table.workspaceId,
    ),
    foreignKey({
      name: "member_sidebar_preference_member_workspace_fk",
      columns: [table.memberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
  ],
);

export const sidebarItemPreference = pgTable(
  "sidebar_item_preference",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    itemKey: sidebarItemKey("item_key").notNull(),
    visibility: sidebarItemVisibility("visibility").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("sidebar_item_preference_sort_order_check", sql`${table.sortOrder} >= 0`),
    uniqueIndex("sidebar_item_preference_member_item_unique").on(table.memberId, table.itemKey),
    foreignKey({
      name: "sidebar_item_preference_member_workspace_fk",
      columns: [table.memberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
  ],
);

export const memberPreference = pgTable(
  "member_preference",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    defaultHomeView: memberDefaultHomeView("default_home_view").notNull().default("agent"),
    displayNameFormat: memberDisplayNameFormat("display_name_format").notNull().default("full"),
    firstDayOfWeek: memberFirstDayOfWeek("first_day_of_week").notNull().default("sunday"),
    convertEmoticons: boolean("convert_emoticons").notNull().default(true),
    sendCommentsOn: memberSendCommentsOn("send_comments_on").notNull().default("enter"),
    interfaceFontSize: memberInterfaceFontSize("interface_font_size").notNull().default("default"),
    usePointerCursors: boolean("use_pointer_cursors").notNull().default(false),
    underlineLinks: boolean("underline_links").notNull().default(false),
    disableAnimatedImages: boolean("disable_animated_images").notNull().default(false),
    interfaceTheme: memberInterfaceTheme("interface_theme").notNull().default("system"),
    codeTheme: memberCodeTheme("code_theme").notNull().default("linear-dark"),
    codeFontSize: memberCodeFontSize("code_font_size").notNull().default("default"),
    codeLineHeight: memberCodeLineHeight("code_line_height").notNull().default("regular"),
    codeFontFamily: text("code_font_family").notNull().default(""),
    openInDesktopApp: boolean("open_in_desktop_app").notNull().default(false),
    autoAssignToSelf: boolean("auto_assign_to_self").notNull().default(false),
    autoAssignOnMoveToStarted: boolean("auto_assign_on_move_to_started").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("member_preference_member_unique").on(table.memberId),
    foreignKey({
      name: "member_preference_member_workspace_fk",
      columns: [table.memberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
  ],
);

export const notificationPreference = pgTable(
  "notification_preference",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    priorityInboxEnabled: boolean("priority_inbox_enabled").notNull().default(false),
    emailEnabled: boolean("email_enabled").notNull().default(true),
    emailFormat: notificationEmailFormat("email_format").notNull().default("digest"),
    emailDigestDelayLowPriority: boolean("email_digest_delay_low_priority").notNull().default(true),
    emailDigestUrgentImmediate: boolean("email_digest_urgent_immediate").notNull().default(true),
    showChangelogInSidebar: boolean("show_changelog_in_sidebar").notNull().default(true),
    changelogNewsletter: boolean("changelog_newsletter").notNull().default(false),
    marketingAndOnboarding: boolean("marketing_and_onboarding").notNull().default(true),
    inviteAccepted: boolean("invite_accepted").notNull().default(true),
    privacyAndLegalUpdates: boolean("privacy_and_legal_updates").notNull().default(true),
    dataProcessingAgreement: boolean("data_processing_agreement").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_preference_member_unique").on(table.memberId),
    foreignKey({
      name: "notification_preference_member_workspace_fk",
      columns: [table.memberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
  ],
);

export const notificationTypePreference = pgTable(
  "notification_type_preference",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    channel: notificationPreferenceChannel("channel").notNull(),
    type: notificationPreferenceType("type").notNull(),
    enabled: boolean("enabled").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("notification_type_preference_member_channel_type_unique").on(
      table.memberId,
      table.channel,
      table.type,
    ),
    foreignKey({
      name: "notification_type_preference_member_workspace_fk",
      columns: [table.memberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
  ],
);

export const codeReviewSettings = pgTable(
  "code_review_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    autoConvertDraftPullRequests: boolean("auto_convert_draft_pull_requests")
      .notNull()
      .default(false),
    mergeStrategy: githubMergeStrategy("merge_strategy").notNull().default("merge"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("code_review_settings_workspace_unique").on(table.workspaceId)],
);

export const githubConnection = pgTable(
  "github_connection",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").notNull(),
    githubUserId: text("github_user_id").notNull(),
    githubLogin: text("github_login").notNull(),
    githubAvatarUrl: text("github_avatar_url"),
    connectedAt: timestamp("connected_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("github_connection_member_unique").on(table.memberId),
    foreignKey({
      name: "github_connection_member_workspace_fk",
      columns: [table.memberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
  ],
);

export const apiKey = pgTable(
  "api_key",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenPrefix: text("token_prefix").notNull(),
    tokenHash: text("token_hash").notNull(),
    permissions: jsonb("permissions").$type<ApiKeyPermissions>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("api_key_token_hash_unique").on(table.tokenHash)],
);

export const githubInstallation = pgTable(
  "github_installation",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    installationId: text("installation_id").notNull(),
    accountId: text("account_id").notNull(),
    accountLogin: text("account_login").notNull(),
    accountType: text("account_type").notNull(),
    installedByMemberId: uuid("installed_by_member_id").references(() => member.id, {
      onDelete: "set null",
    }),
    status: githubInstallationStatus("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("github_installation_id_unique").on(table.installationId)],
);

type TeamIconValue = WorkspaceIconValue;

export const teamEstimation = pgEnum("team_estimation", [
  "none",
  "exponential",
  "fibonacci",
  "linear",
  "tshirt",
]);

export const team = pgTable(
  "team",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    key: text("key").notNull(),
    icon: jsonb("icon").$type<TeamIconValue>().notNull(),
    description: text("description"),
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    estimation: teamEstimation("estimation").notNull().default("none"),
    detailedIssueHistory: boolean("detailed_issue_history").notNull().default(false),
    issueEmailEnabled: boolean("issue_email_enabled").notNull().default(false),
    issueEmailAddress: text("issue_email_address")
      .notNull()
      .default(
        sql`('team-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12) || '@intake.zynox.app.br')`,
      ),
    defaultStatusId: uuid("default_status_id").references((): AnyPgColumn => workflowStatus.id, {
      onDelete: "set null",
    }),
    issueCounter: integer("issue_counter").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("team_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("team_workspace_slug_unique").on(table.workspaceId, table.slug),
    uniqueIndex("team_workspace_key_unique").on(table.workspaceId, table.key),
    uniqueIndex("team_issue_email_address_unique").on(table.issueEmailAddress),
  ],
);

export type WorkflowStatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled"
  | "duplicate";

export type WorkflowStatusColor =
  | "grey"
  | "slate"
  | "purple"
  | "cyan"
  | "green"
  | "amber"
  | "orange"
  | "pink"
  | "red";

export type LabelColor = WorkflowStatusColor;

export const workflowStatus = pgTable(
  "workflow_status",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references((): AnyPgColumn => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").$type<WorkflowStatusCategory>().notNull(),
    color: text("color").$type<WorkflowStatusColor>().notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "workflow_status_category_check",
      sql`${table.category} in ('triage', 'backlog', 'unstarted', 'started', 'completed', 'canceled', 'duplicate')`,
    ),
    check(
      "workflow_status_color_check",
      sql`${table.color} in ('grey', 'slate', 'purple', 'cyan', 'green', 'amber', 'orange', 'pink', 'red')`,
    ),
    check("workflow_status_position_check", sql`${table.position} >= 0`),
    // Linear has same-name statuses in separate categories (e.g. Zynox's Ready in Unstarted and Started).
    uniqueIndex("workflow_status_team_category_name_unique").on(
      table.teamId,
      table.category,
      table.name,
    ),
    uniqueIndex("workflow_status_team_duplicate_unique")
      .on(table.teamId)
      .where(sql`${table.category} = 'duplicate'`),
  ],
);

export const projectStatus = pgEnum("project_status", [
  "backlog",
  "planned",
  "started",
  "completed",
  "canceled",
]);

export const projectHealth = pgEnum("project_health", ["on-track", "at-risk", "off-track", "none"]);

export const projectPriority = pgEnum("project_priority", [
  "none",
  "urgent",
  "high",
  "medium",
  "low",
]);

export const project = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: jsonb("icon").$type<TeamIconValue>().notNull(),
    status: projectStatus("status").notNull(),
    health: projectHealth("health").notNull(),
    healthNote: text("health_note"),
    priority: projectPriority("priority"),
    leadMemberId: uuid("lead_member_id"),
    targetDate: date("target_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("project_id_workspace_unique").on(table.id, table.workspaceId),
    foreignKey({
      name: "project_lead_member_workspace_fk",
      columns: [table.leadMemberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    })
      // The migration targets only lead_member_id so workspace_id remains non-null.
      .onDelete("set null"),
    index("project_workspace_created_index").on(table.workspaceId, table.createdAt, table.id),
  ],
);

export const projectTeam = pgTable(
  "project_team",
  {
    projectId: uuid("project_id").notNull(),
    teamId: uuid("team_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.teamId] }),
    foreignKey({
      name: "project_team_project_workspace_fk",
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [project.id, project.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "project_team_team_workspace_fk",
      columns: [table.teamId, table.workspaceId],
      foreignColumns: [team.id, team.workspaceId],
    }).onDelete("restrict"),
    index("project_team_workspace_team_index").on(table.workspaceId, table.teamId),
  ],
);

export const teamMember = pgTable(
  "team_member",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.memberId] })],
);

export const customerSettings = pgTable(
  "customer_settings",
  {
    workspaceId: uuid("workspace_id")
      .primaryKey()
      .references(() => workspace.id, { onDelete: "cascade" }),
    enabled: boolean("enabled").notNull().default(false),
    defaultTeamId: uuid("default_team_id").references(() => team.id, { onDelete: "set null" }),
    revenuePeriod: text("revenue_period").$type<"annual" | "monthly">().notNull().default("annual"),
    revenueCurrency: text("revenue_currency").notNull().default("USD"),
    attributesDataSource: text("attributes_data_source"),
    manualEditsEnabled: boolean("manual_edits_enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "customer_settings_revenue_period_check",
      sql`${table.revenuePeriod} in ('annual', 'monthly')`,
    ),
    check("customer_settings_revenue_currency_check", sql`${table.revenueCurrency} ~ '^[A-Z]{3}$'`),
  ],
);

export const customerStatus = pgTable(
  "customer_status",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_status_workspace_name_unique").on(
      table.workspaceId,
      sql`lower(${table.name})`,
    ),
    check("customer_status_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("customer_status_position_nonnegative", sql`${table.position} >= 0`),
  ],
);

export const customerTier = pgTable(
  "customer_tier",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_tier_workspace_name_unique").on(
      table.workspaceId,
      sql`lower(${table.name})`,
    ),
    check("customer_tier_name_not_empty", sql`length(trim(${table.name})) > 0`),
    check("customer_tier_position_nonnegative", sql`${table.position} >= 0`),
  ],
);

export const customerDomainRule = pgTable(
  "customer_domain_rule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    kind: text("kind").$type<"excluded" | "generic">().notNull(),
    value: text("value").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("customer_domain_rule_workspace_kind_value_unique").on(
      table.workspaceId,
      table.kind,
      table.value,
    ),
    check("customer_domain_rule_kind_check", sql`${table.kind} in ('excluded', 'generic')`),
    check(
      "customer_domain_rule_value_normalized",
      sql`${table.value} = lower(${table.value}) and length(trim(${table.value})) > 0`,
    ),
  ],
);

export const label = pgTable(
  "label",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => team.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => label.id, {
      onDelete: "cascade",
    }),
    isGroup: boolean("is_group").notNull().default(false),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").$type<LabelColor>().notNull().default("grey"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "label_color_check",
      sql`${table.color} in ('grey', 'slate', 'purple', 'cyan', 'green', 'amber', 'orange', 'pink', 'red')`,
    ),
    check(
      "label_not_own_parent_check",
      sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`,
    ),
    uniqueIndex("label_workspace_name_unique")
      .on(table.workspaceId, sql`lower(${table.name})`)
      .where(sql`${table.teamId} is null`),
    uniqueIndex("label_team_name_unique")
      .on(table.teamId, sql`lower(${table.name})`)
      .where(sql`${table.teamId} is not null`),
    index("label_parent_index").on(table.parentId),
    index("label_workspace_team_index").on(table.workspaceId, table.teamId),
  ],
);

export type IssuePriority = 0 | 1 | 2 | 3 | 4;

export type IssueRelationType = "blocks" | "related" | "duplicate";

export type IssueEventType =
  | "created"
  | "status"
  | "priority"
  | "assignee"
  | "title"
  | "description"
  | "due_date"
  | "label_added"
  | "label_removed"
  | "team"
  | "relation_added"
  | "relation_removed";

export type IssueEventPayload = Record<string, unknown>;

export type NotificationType = "assigned" | "unassigned";

export const issue = pgTable(
  "issue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    statusId: uuid("status_id")
      .notNull()
      .references(() => workflowStatus.id, { onDelete: "restrict" }),
    priority: integer("priority").$type<IssuePriority>().notNull().default(0),
    assigneeId: uuid("assignee_id").references(() => member.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id").references(() => member.id, { onDelete: "set null" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => issue.id, { onDelete: "set null" }),
    dueDate: date("due_date", { mode: "string" }),
    sortOrder: integer("sort_order").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("issue_number_check", sql`${table.number} > 0`),
    check("issue_priority_check", sql`${table.priority} between 0 and 4`),
    check("issue_sort_order_check", sql`${table.sortOrder} >= 0`),
    uniqueIndex("issue_team_number_unique").on(table.teamId, table.number),
    index("issue_workspace_team_index").on(table.workspaceId, table.teamId),
    index("issue_team_status_index").on(table.teamId, table.statusId),
    index("issue_parent_index").on(table.parentId),
  ],
);

export const pullRequest = pgTable(
  "pull_request",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    installationId: uuid("installation_id")
      .notNull()
      .references(() => githubInstallation.id, { onDelete: "cascade" }),
    issueId: uuid("issue_id").references(() => issue.id, { onDelete: "set null" }),
    repoFullName: text("repo_full_name").notNull(),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    authorGithubLogin: text("author_github_login").notNull(),
    url: text("url").notNull(),
    state: githubPullRequestState("state").notNull(),
    headBranch: text("head_branch").notNull(),
    checksStatus: githubChecksStatus("checks_status"),
    reviewDecision: githubReviewDecision("review_decision"),
    githubUpdatedAt: timestamp("github_updated_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("pull_request_number_check", sql`${table.number} > 0`),
    uniqueIndex("pull_request_installation_repo_number_unique").on(
      table.installationId,
      table.repoFullName,
      table.number,
    ),
    index("pull_request_workspace_issue_index").on(table.workspaceId, table.issueId),
  ],
);

export const issueEvent = pgTable(
  "issue_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => member.id, { onDelete: "set null" }),
    type: text("type").$type<IssueEventType>().notNull(),
    payload: jsonb("payload").$type<IssueEventPayload>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "issue_event_type_check",
      sql`${table.type} in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'label_added', 'label_removed', 'team', 'relation_added', 'relation_removed')`,
    ),
    index("issue_event_workspace_issue_created_index").on(
      table.workspaceId,
      table.issueId,
      table.createdAt,
    ),
  ],
);

export const issueDraft = pgTable(
  "issue_draft",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    creatorId: uuid("creator_id").notNull(),
    // The API verifies the Team's Workspace; deleting a Team only clears this nullable reference.
    teamId: uuid("team_id").references(() => team.id, { onDelete: "set null" }),
    title: text("title").notNull().default(""),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "issue_draft_creator_workspace_fk",
      columns: [table.creatorId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    }).onDelete("cascade"),
    index("issue_draft_creator_updated_index").on(
      table.workspaceId,
      table.creatorId,
      table.updatedAt,
      table.id,
    ),
  ],
);

export const issueRelation = pgTable(
  "issue_relation",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    relatedIssueId: uuid("related_issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    type: text("type").$type<IssueRelationType>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("issue_relation_type_check", sql`${table.type} in ('blocks', 'related', 'duplicate')`),
    check("issue_relation_not_self_check", sql`${table.issueId} <> ${table.relatedIssueId}`),
    primaryKey({ columns: [table.issueId, table.relatedIssueId, table.type] }),
    index("issue_relation_related_index").on(table.relatedIssueId, table.type),
  ],
);

export const issueLink = pgTable(
  "issue_link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    creatorId: uuid("creator_id").references(() => member.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "issue_link_http_url_check",
      sql`lower(${table.url}) like 'http://%' or lower(${table.url}) like 'https://%'`,
    ),
    index("issue_link_issue_created_index").on(table.issueId, table.createdAt),
  ],
);

export const issueLabel = pgTable(
  "issue_label",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => label.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.issueId, table.labelId] }),
    index("issue_label_label_index").on(table.labelId),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    actorId: uuid("actor_id").references(() => member.id, { onDelete: "set null" }),
    issueId: uuid("issue_id").references(() => issue.id, { onDelete: "cascade" }),
    // Project notifications arrive with the Project domain; the FK is added when that table lands.
    projectId: uuid("project_id"),
    issueEventId: uuid("issue_event_id").references(() => issueEvent.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("notification_type_check", sql`${table.type} in ('assigned', 'unassigned')`),
    check(
      "notification_target_check",
      sql`(${table.issueId} is not null and ${table.projectId} is null) or (${table.issueId} is null and ${table.projectId} is not null)`,
    ),
    uniqueIndex("notification_recipient_issue_event_unique")
      .on(table.recipientId, table.issueEventId)
      .where(sql`${table.issueEventId} is not null`),
    index("notification_recipient_archived_created_index").on(
      table.recipientId,
      table.archivedAt,
      sql`${table.createdAt} desc`,
    ),
    index("notification_unread_recipient_index")
      .on(table.recipientId, table.createdAt)
      .where(sql`${table.readAt} is null and ${table.archivedAt} is null`),
    index("notification_issue_index").on(table.issueId),
  ],
);

export const workspaceRelations = relations(workspace, ({ many, one }) => ({
  authSessions: many(authSession),
  members: many(member),
  memberSidebarPreferences: many(memberSidebarPreference),
  sidebarItemPreferences: many(sidebarItemPreference),
  memberPreferences: many(memberPreference),
  notificationPreferences: many(notificationPreference),
  notificationTypePreferences: many(notificationTypePreference),
  codeReviewSettings: one(codeReviewSettings, {
    fields: [workspace.id],
    references: [codeReviewSettings.workspaceId],
  }),
  githubConnections: many(githubConnection),
  githubInstallations: many(githubInstallation),
  pullRequests: many(pullRequest),
  teams: many(team),
  apiKeys: many(apiKey),
  issues: many(issue),
  issueEvents: many(issueEvent),
  issueDrafts: many(issueDraft),
  labels: many(label),
  notifications: many(notification),
  projects: many(project),
  auditEvents: many(auditEvent),
  desktopIntents: many(desktopIntent),
}));

export const authUserRelations = relations(authUser, ({ many }) => ({
  sessions: many(authSession),
  accounts: many(authAccount),
  members: many(member),
}));

export const authSessionRelations = relations(authSession, ({ one }) => ({
  user: one(authUser, { fields: [authSession.userId], references: [authUser.id] }),
  activeWorkspace: one(workspace, {
    fields: [authSession.activeWorkspaceId],
    references: [workspace.id],
  }),
}));

export const authAccountRelations = relations(authAccount, ({ one }) => ({
  user: one(authUser, { fields: [authAccount.userId], references: [authUser.id] }),
}));

export const memberRelations = relations(member, ({ many, one }) => ({
  authUser: one(authUser, { fields: [member.authUserId], references: [authUser.id] }),
  workspace: one(workspace, {
    fields: [member.workspaceId],
    references: [workspace.id],
  }),
  teamMemberships: many(teamMember),
  sidebarPreferences: many(memberSidebarPreference),
  sidebarItemPreferences: many(sidebarItemPreference),
  preferences: one(memberPreference, {
    fields: [member.id],
    references: [memberPreference.memberId],
  }),
  notificationPreferences: one(notificationPreference, {
    fields: [member.id],
    references: [notificationPreference.memberId],
  }),
  notificationTypePreferences: many(notificationTypePreference),
  githubConnection: one(githubConnection, {
    fields: [member.id],
    references: [githubConnection.memberId],
  }),
  githubInstallations: many(githubInstallation),
  createdIssueDrafts: many(issueDraft),
  apiKeys: many(apiKey),
  assignedIssues: many(issue, { relationName: "issueAssignee" }),
  createdIssues: many(issue, { relationName: "issueCreator" }),
  authoredIssueEvents: many(issueEvent, { relationName: "issueEventActor" }),
  createdIssueLinks: many(issueLink),
  receivedNotifications: many(notification, { relationName: "notificationRecipient" }),
  notificationsAsActor: many(notification, { relationName: "notificationActor" }),
  projects: many(project),
  auditEvents: many(auditEvent),
  desktopIntents: many(desktopIntent),
}));

export const auditEventRelations = relations(auditEvent, ({ one }) => ({
  workspace: one(workspace, { fields: [auditEvent.workspaceId], references: [workspace.id] }),
  actorMember: one(member, { fields: [auditEvent.actorMemberId], references: [member.id] }),
}));

export const desktopIntentRelations = relations(desktopIntent, ({ one }) => ({
  workspace: one(workspace, { fields: [desktopIntent.workspaceId], references: [workspace.id] }),
  member: one(member, { fields: [desktopIntent.memberId], references: [member.id] }),
  issue: one(issue, { fields: [desktopIntent.issueId], references: [issue.id] }),
}));

export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  workspace: one(workspace, {
    fields: [apiKey.workspaceId],
    references: [workspace.id],
  }),
  member: one(member, {
    fields: [apiKey.memberId],
    references: [member.id],
  }),
}));

export const codeReviewSettingsRelations = relations(codeReviewSettings, ({ one }) => ({
  workspace: one(workspace, {
    fields: [codeReviewSettings.workspaceId],
    references: [workspace.id],
  }),
}));

export const githubConnectionRelations = relations(githubConnection, ({ one }) => ({
  workspace: one(workspace, {
    fields: [githubConnection.workspaceId],
    references: [workspace.id],
  }),
  member: one(member, {
    fields: [githubConnection.memberId, githubConnection.workspaceId],
    references: [member.id, member.workspaceId],
  }),
}));

export const githubInstallationRelations = relations(githubInstallation, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [githubInstallation.workspaceId],
    references: [workspace.id],
  }),
  installedByMember: one(member, {
    fields: [githubInstallation.installedByMemberId],
    references: [member.id],
  }),
  pullRequests: many(pullRequest),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  members: many(teamMember),
  workflowStatuses: many(workflowStatus),
  labels: many(label),
  issues: many(issue),
  issueDrafts: many(issueDraft),
  defaultStatus: one(workflowStatus, {
    fields: [team.defaultStatusId],
    references: [workflowStatus.id],
  }),
  projects: many(projectTeam),
}));

export const memberSidebarPreferenceRelations = relations(memberSidebarPreference, ({ one }) => ({
  workspace: one(workspace, {
    fields: [memberSidebarPreference.workspaceId],
    references: [workspace.id],
  }),
  member: one(member, {
    fields: [memberSidebarPreference.memberId, memberSidebarPreference.workspaceId],
    references: [member.id, member.workspaceId],
  }),
}));

export const sidebarItemPreferenceRelations = relations(sidebarItemPreference, ({ one }) => ({
  workspace: one(workspace, {
    fields: [sidebarItemPreference.workspaceId],
    references: [workspace.id],
  }),
  member: one(member, {
    fields: [sidebarItemPreference.memberId, sidebarItemPreference.workspaceId],
    references: [member.id, member.workspaceId],
  }),
}));

export const memberPreferenceRelations = relations(memberPreference, ({ one }) => ({
  workspace: one(workspace, {
    fields: [memberPreference.workspaceId],
    references: [workspace.id],
  }),
  member: one(member, {
    fields: [memberPreference.memberId],
    references: [member.id],
  }),
}));

export const notificationPreferenceRelations = relations(notificationPreference, ({ one }) => ({
  workspace: one(workspace, {
    fields: [notificationPreference.workspaceId],
    references: [workspace.id],
  }),
  member: one(member, {
    fields: [notificationPreference.memberId, notificationPreference.workspaceId],
    references: [member.id, member.workspaceId],
  }),
}));

export const notificationTypePreferenceRelations = relations(
  notificationTypePreference,
  ({ one }) => ({
    workspace: one(workspace, {
      fields: [notificationTypePreference.workspaceId],
      references: [workspace.id],
    }),
    member: one(member, {
      fields: [notificationTypePreference.memberId, notificationTypePreference.workspaceId],
      references: [member.id, member.workspaceId],
    }),
  }),
);

export const workflowStatusRelations = relations(workflowStatus, ({ many, one }) => ({
  team: one(team, {
    fields: [workflowStatus.teamId],
    references: [team.id],
  }),
  issues: many(issue),
}));

export const issueRelations = relations(issue, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [issue.workspaceId],
    references: [workspace.id],
  }),
  team: one(team, {
    fields: [issue.teamId],
    references: [team.id],
  }),
  status: one(workflowStatus, {
    fields: [issue.statusId],
    references: [workflowStatus.id],
  }),
  parent: one(issue, {
    fields: [issue.parentId],
    references: [issue.id],
    relationName: "issueParent",
  }),
  subIssues: many(issue, { relationName: "issueParent" }),
  assignee: one(member, {
    fields: [issue.assigneeId],
    references: [member.id],
    relationName: "issueAssignee",
  }),
  creator: one(member, {
    fields: [issue.creatorId],
    references: [member.id],
    relationName: "issueCreator",
  }),
  events: many(issueEvent),
  labels: many(issueLabel),
  outgoingRelations: many(issueRelation, { relationName: "issueRelationSource" }),
  incomingRelations: many(issueRelation, { relationName: "issueRelationTarget" }),
  links: many(issueLink),
  notifications: many(notification),
  pullRequests: many(pullRequest),
}));

export const pullRequestRelations = relations(pullRequest, ({ one }) => ({
  workspace: one(workspace, {
    fields: [pullRequest.workspaceId],
    references: [workspace.id],
  }),
  installation: one(githubInstallation, {
    fields: [pullRequest.installationId],
    references: [githubInstallation.id],
  }),
  issue: one(issue, {
    fields: [pullRequest.issueId],
    references: [issue.id],
  }),
}));

export const labelRelations = relations(label, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [label.workspaceId],
    references: [workspace.id],
  }),
  team: one(team, {
    fields: [label.teamId],
    references: [team.id],
  }),
  parent: one(label, {
    fields: [label.parentId],
    references: [label.id],
    relationName: "labelParent",
  }),
  children: many(label, { relationName: "labelParent" }),
  issues: many(issueLabel),
}));

export const issueLabelRelations = relations(issueLabel, ({ one }) => ({
  issue: one(issue, {
    fields: [issueLabel.issueId],
    references: [issue.id],
  }),
  label: one(label, {
    fields: [issueLabel.labelId],
    references: [label.id],
  }),
}));

export const issueRelationRelations = relations(issueRelation, ({ one }) => ({
  issue: one(issue, {
    fields: [issueRelation.issueId],
    references: [issue.id],
    relationName: "issueRelationSource",
  }),
  relatedIssue: one(issue, {
    fields: [issueRelation.relatedIssueId],
    references: [issue.id],
    relationName: "issueRelationTarget",
  }),
}));

export const issueLinkRelations = relations(issueLink, ({ one }) => ({
  issue: one(issue, { fields: [issueLink.issueId], references: [issue.id] }),
  creator: one(member, { fields: [issueLink.creatorId], references: [member.id] }),
}));

export const issueEventRelations = relations(issueEvent, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [issueEvent.workspaceId],
    references: [workspace.id],
  }),
  issue: one(issue, {
    fields: [issueEvent.issueId],
    references: [issue.id],
  }),
  actor: one(member, {
    fields: [issueEvent.actorId],
    references: [member.id],
    relationName: "issueEventActor",
  }),
  notifications: many(notification),
}));

export const issueDraftRelations = relations(issueDraft, ({ one }) => ({
  workspace: one(workspace, {
    fields: [issueDraft.workspaceId],
    references: [workspace.id],
  }),
  creator: one(member, {
    fields: [issueDraft.creatorId, issueDraft.workspaceId],
    references: [member.id, member.workspaceId],
  }),
  team: one(team, {
    fields: [issueDraft.teamId, issueDraft.workspaceId],
    references: [team.id, team.workspaceId],
  }),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  workspace: one(workspace, {
    fields: [notification.workspaceId],
    references: [workspace.id],
  }),
  recipient: one(member, {
    fields: [notification.recipientId],
    references: [member.id],
    relationName: "notificationRecipient",
  }),
  actor: one(member, {
    fields: [notification.actorId],
    references: [member.id],
    relationName: "notificationActor",
  }),
  issue: one(issue, {
    fields: [notification.issueId],
    references: [issue.id],
  }),
  issueEvent: one(issueEvent, {
    fields: [notification.issueEventId],
    references: [issueEvent.id],
  }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [teamMember.memberId],
    references: [member.id],
  }),
}));

export const projectRelations = relations(project, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [project.workspaceId],
    references: [workspace.id],
  }),
  lead: one(member, {
    fields: [project.leadMemberId, project.workspaceId],
    references: [member.id, member.workspaceId],
  }),
  teams: many(projectTeam),
}));

export const projectTeamRelations = relations(projectTeam, ({ one }) => ({
  project: one(project, {
    fields: [projectTeam.projectId],
    references: [project.id],
  }),
  team: one(team, {
    fields: [projectTeam.teamId],
    references: [team.id],
  }),
}));
