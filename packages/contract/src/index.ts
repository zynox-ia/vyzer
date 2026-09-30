/** Contrato da API compartilhado entre apps/api e apps/web. Ver ADR-0004. */
import { oc, type ContractRouterClient } from "@orpc/contract";
import { z } from "zod";

/** Same persisted value shape as the design system's ProjectIconValue. */
export const projectIconValueSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("icon"),
    name: z.string().min(1),
    color: z.union([
      z.enum(["grey", "slate", "purple", "cyan", "green", "amber", "orange", "pink", "red"]),
      z.custom<`#${string}`>(
        (value): value is `#${string}` =>
          typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value),
      ),
    ]),
  }),
  z.object({ kind: z.literal("emoji"), emoji: z.string().min(1) }),
]);

export type ProjectIconValue = z.infer<typeof projectIconValueSchema>;

export const apiKeyPermissionSchema = z.enum([
  "read",
  "write",
  "issues:create",
  "comments:create",
  "admin",
]);

export const apiKeyPermissionsSchema = z.union([
  z.literal("full"),
  z
    .array(apiKeyPermissionSchema)
    .min(1)
    .refine((items) => new Set(items).size === items.length),
]);

export type ApiKeyPermission = z.infer<typeof apiKeyPermissionSchema>;
export type ApiKeyPermissions = z.infer<typeof apiKeyPermissionsSchema>;
export const apiKeyPolicySchema = z.enum(["all_members", "admins"]);
export type ApiKeyPolicy = z.infer<typeof apiKeyPolicySchema>;

const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  region: z.string(),
  logoUrl: z.string().nullable(),
  icon: projectIconValueSchema,
  apiKeyPolicy: apiKeyPolicySchema,
});

const workspaceSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const workspaceLogoUrlSchema = z
  .string()
  .regex(
    /^\/api\/workspace\/logo\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:png|jpg|webp|svg)$/,
  );

export const workspaceLogoUploadOutputSchema = z.object({ logoUrl: workspaceLogoUrlSchema });

const memberSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: z.string(),
  createdAt: z.iso.datetime(),
});

const memberListItemSchema = memberSchema.extend({ teamCount: z.number().int().nonnegative() });

const teamNameSchema = z.string().trim().min(1).max(48);
const teamKeySchema = z
  .string()
  .max(7)
  .regex(/^[A-Z][A-Z0-9]*$/);
const teamTimezoneValues = new Set(Intl.supportedValuesOf("timeZone"));
const teamTimezoneSchema = z.string().refine((timezone) => teamTimezoneValues.has(timezone), {
  message: "Use a supported IANA time zone.",
});
const teamEstimationSchema = z.enum(["none", "exponential", "fibonacci", "linear", "tshirt"]);

const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  key: z.string(),
  icon: projectIconValueSchema,
  description: z.string().nullable(),
  timezone: teamTimezoneSchema,
  estimation: teamEstimationSchema,
  detailedIssueHistory: z.boolean(),
  issueEmailEnabled: z.boolean(),
  issueEmailAddress: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const teamListItemSchema = teamSchema.extend({
  memberCount: z.number().int().nonnegative(),
  issueCount: z.number().int().nonnegative(),
});

const workflowStatusCategorySchema = z.enum([
  "triage",
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
  "duplicate",
]);

const workflowStatusColorSchema = z.enum([
  "grey",
  "slate",
  "purple",
  "cyan",
  "green",
  "amber",
  "orange",
  "pink",
  "red",
]);

const workflowStatusSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  category: workflowStatusCategorySchema,
  color: workflowStatusColorSchema,
  position: z.number().int().nonnegative(),
  isDefault: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const labelColorSchema = workflowStatusColorSchema;
const labelSchema = z.object({
  id: z.string().uuid(),
  workspaceId: z.string().uuid(),
  teamId: z.string().uuid().nullable(),
  parentId: z.string().uuid().nullable(),
  isGroup: z.boolean(),
  name: z.string(),
  description: z.string().nullable(),
  color: labelColorSchema,
  archivedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const labelListItemSchema = labelSchema.extend({
  issueCount: z.number().int().nonnegative(),
  lastAppliedAt: z.iso.datetime().nullable(),
});
const issueLabelSchema = labelSchema.pick({
  id: true,
  teamId: true,
  parentId: true,
  isGroup: true,
  name: true,
  description: true,
  color: true,
  archivedAt: true,
});

const teamSlugSchema = z.string().trim().min(1);

const issuePrioritySchema = z.union([
  z.literal(0),
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
const issueViewSchema = z.enum(["active", "backlog", "all"]);
const issueDateRangeSchema = (dateOnly = false) => {
  const dateSchema = dateOnly ? z.iso.date() : z.iso.datetime();
  return z
    .object({
      from: dateSchema.optional(),
      to: dateSchema.optional(),
      isEmpty: z.boolean().optional(),
    })
    .refine(
      (range) => range.from !== undefined || range.to !== undefined || range.isEmpty !== undefined,
      "Choose a date range or whether the field is empty.",
    )
    .refine(
      (range) =>
        range.isEmpty === undefined || (range.from === undefined && range.to === undefined),
      "A date range cannot be combined with an empty check.",
    );
};
const issueDurationRangeSchema = z
  .object({
    minSeconds: z.number().int().nonnegative().optional(),
    maxSeconds: z.number().int().nonnegative().optional(),
  })
  .refine(
    (range) => range.minSeconds !== undefined || range.maxSeconds !== undefined,
    "Choose a minimum or maximum duration.",
  )
  .refine(
    (range) =>
      range.minSeconds === undefined ||
      range.maxSeconds === undefined ||
      range.minSeconds <= range.maxSeconds,
    "The minimum duration must not exceed the maximum duration.",
  );
const issueFiltersSchema = z.object({
  statusIds: z.array(z.string().uuid()).min(1).optional(),
  assigneeIds: z.array(z.string().uuid()).min(1).optional(),
  unassigned: z.boolean().optional(),
  creatorIds: z.array(z.string().uuid()).min(1).optional(),
  priorities: z.array(issuePrioritySchema).min(1).optional(),
  dueDate: issueDateRangeSchema(true).optional(),
  createdAt: issueDateRangeSchema().optional(),
  updatedAt: issueDateRangeSchema().optional(),
  startedAt: issueDateRangeSchema().optional(),
  completedAt: issueDateRangeSchema().optional(),
  labelIds: z.array(z.string().uuid()).min(1).optional(),
  timeInStatus: issueDurationRangeSchema.optional(),
  content: z.string().trim().min(1).max(500).optional(),
});
const issueOrderBySchema = z.enum([
  "manual",
  "title",
  "status",
  "priority",
  "assignee",
  "updated",
  "created",
  "dueDate",
  "timeInStatus",
]);
const issueGroupBySchema = z.enum(["none", "status", "assignee", "priority", "label"]);
const issueIdsSchema = z
  .array(z.string().uuid())
  .min(1)
  .refine((ids) => new Set(ids).size === ids.length, "Issue ids must be unique.");
const issueBulkFailureSchema = z.object({
  id: z.string().uuid(),
  code: z.enum(["NOT_FOUND", "BAD_REQUEST", "CONFLICT", "INTERNAL_SERVER_ERROR"]),
  message: z.string(),
});
const issueFacetCountSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  count: z.number().int().nonnegative(),
});
const issueFacetsSchema = z.object({
  status: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      category: workflowStatusCategorySchema,
      count: z.number().int().nonnegative(),
    }),
  ),
  assignees: z.array(
    z.object({
      id: z.string().uuid().nullable(),
      name: z.string().nullable(),
      count: z.number().int().nonnegative(),
    }),
  ),
  creators: z.array(issueFacetCountSchema),
  priority: z.array(
    z.object({ value: issuePrioritySchema, count: z.number().int().nonnegative() }),
  ),
  labels: z.array(
    z.object({
      id: z.string().uuid(),
      name: z.string(),
      color: labelColorSchema,
      count: z.number().int().nonnegative(),
    }),
  ),
});
const issueListInputSchema = z.object({
  team: teamSlugSchema,
  view: issueViewSchema.optional(),
  filters: issueFiltersSchema.optional(),
  orderBy: issueOrderBySchema.optional(),
  orderDirection: z.enum(["asc", "desc"]).optional(),
  groupBy: issueGroupBySchema.optional(),
  subgroupBy: issueGroupBySchema.optional(),
  orderCompletedByRecency: z.boolean().optional(),
});
const issueFacetsInputSchema = z.object({
  team: teamSlugSchema,
  view: issueViewSchema.optional(),
  filters: issueFiltersSchema.optional(),
});

const issueTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  key: teamKeySchema,
});

const issueStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: workflowStatusCategorySchema,
  color: workflowStatusColorSchema,
});

const issueMemberSchema = z.object({ id: z.string().uuid(), name: z.string() });
const issueSubIssueProgressSchema = z.object({
  completed: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});
const issueParentSummarySchema = z.object({
  id: z.string().uuid(),
  identifier: z.string(),
  title: z.string(),
});
const issueRelationTypeSchema = z.enum(["blocks", "related", "duplicate"]);
const issueRelationGroupsSchema = z.object({
  blockedBy: z.array(issueParentSummarySchema),
  blocking: z.array(issueParentSummarySchema),
  related: z.array(issueParentSummarySchema),
  duplicateOf: z.array(issueParentSummarySchema),
});
const issueLinkSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  url: z
    .url()
    .refine((value) => /^https?:\/\//i.test(value), "Only http and https links are supported."),
  title: z.string().nullable(),
  creatorId: z.string().uuid(),
  createdAt: z.iso.datetime(),
});

const issueSchema = z.object({
  id: z.string().uuid(),
  teamId: z.string().uuid(),
  number: z.number().int().positive(),
  identifier: z.string(),
  team: issueTeamSchema,
  title: z.string(),
  description: z.string().nullable(),
  statusId: z.string().uuid(),
  status: issueStatusSchema,
  priority: issuePrioritySchema,
  assigneeId: z.string().uuid().nullable(),
  assignee: issueMemberSchema.nullable(),
  creatorId: z.string().uuid(),
  creator: issueMemberSchema,
  parentId: z.string().uuid().nullable(),
  labels: z.array(issueLabelSchema),
  dueDate: z.iso.date().nullable(),
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  canceledAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const issueListItemSchema = issueSchema.extend({ subIssueProgress: issueSubIssueProgressSchema });
const issueDetailSchema = issueSchema.extend({
  parent: issueParentSummarySchema.nullable(),
  subIssueProgress: issueSubIssueProgressSchema,
  relations: issueRelationGroupsSchema,
  links: z.array(issueLinkSchema),
});

const issueEventTypeSchema = z.enum([
  "created",
  "status",
  "priority",
  "assignee",
  "title",
  "description",
  "due_date",
  "label_added",
  "label_removed",
  "team",
  "relation_added",
  "relation_removed",
]);

const issueEventSchema = z.object({
  id: z.string().uuid(),
  issueId: z.string().uuid(),
  actorId: z.string().uuid(),
  actor: issueMemberSchema,
  type: issueEventTypeSchema,
  payload: z.record(z.string(), z.unknown()),
  createdAt: z.iso.datetime(),
});

export const notificationTypeSchema = z.enum(["assigned", "unassigned"]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;

/** The contract is the single source for notification type labels and summaries. */
export const notificationTypeMetadata = {
  assigned: { category: "Assignments", summary: "assigned you" },
  unassigned: { category: "Assignments", summary: "unassigned you" },
} as const satisfies Record<NotificationType, { category: string; summary: string }>;

const notificationCursorSchema = z.object({ id: z.string().uuid(), createdAt: z.iso.datetime() });
const notificationListInputSchema = z.object({
  unreadOnly: z.boolean().optional(),
  order: z.enum(["newest", "oldest"]).optional(),
  cursor: notificationCursorSchema.optional(),
  limit: z.number().int().min(1).max(100),
});
const notificationIdsInputSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, "Notification ids must be unique."),
});
const notificationIssueSummarySchema = z.object({
  id: z.string().uuid(),
  identifier: z.string(),
  title: z.string(),
  priority: issuePrioritySchema,
  status: issueStatusSchema.nullable(),
});
const notificationItemSchema = z.object({
  id: z.string().uuid(),
  type: notificationTypeSchema,
  actor: issueMemberSchema.nullable(),
  issue: notificationIssueSummarySchema.nullable(),
  projectId: z.string().uuid().nullable(),
  payload: z.record(z.string(), z.unknown()),
  readAt: z.iso.datetime().nullable(),
  snoozedUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Team = z.infer<typeof teamSchema>;
export type TeamListItem = z.infer<typeof teamListItemSchema>;
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type Label = z.infer<typeof labelSchema>;
export type LabelListItem = z.infer<typeof labelListItemSchema>;
export type IssueLabel = z.infer<typeof issueLabelSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type IssueListItem = z.infer<typeof issueListItemSchema>;
export type IssueDetail = z.infer<typeof issueDetailSchema>;
export type IssueEvent = z.infer<typeof issueEventSchema>;
export type IssueRelationType = z.infer<typeof issueRelationTypeSchema>;
export type IssueRelationSummary = z.infer<typeof issueParentSummarySchema>;
export type IssueRelationGroups = z.infer<typeof issueRelationGroupsSchema>;
export type IssueLink = z.infer<typeof issueLinkSchema>;
export type IssueFilters = z.infer<typeof issueFiltersSchema>;
export type IssueListInput = z.infer<typeof issueListInputSchema>;
export type IssueFacetsInput = z.infer<typeof issueFacetsInputSchema>;
export type Notification = z.infer<typeof notificationItemSchema>;
export type NotificationListInput = z.input<typeof notificationListInputSchema>;

const apiKeySchema = z.object({
  id: z.string().uuid(),
  memberId: z.string().uuid(),
  memberName: z.string(),
  memberEmail: z.string().email(),
  name: z.string(),
  tokenPrefix: z.string(),
  permissions: apiKeyPermissionsSchema,
  createdAt: z.iso.datetime(),
  lastUsedAt: z.iso.datetime().nullable(),
  revokedAt: z.iso.datetime().nullable(),
});

const customerSettingsSchema = z.object({
  workspaceId: z.string().uuid(),
  enabled: z.boolean(),
  defaultTeamId: z.string().uuid().nullable(),
  revenuePeriod: z.enum(["annual", "monthly"]),
  revenueCurrency: z.string().regex(/^[A-Z]{3}$/),
  attributesDataSource: z.string().nullable(),
  manualEditsEnabled: z.boolean(),
});

const supportedRevenueCurrencies = new Set(Intl.supportedValuesOf("currency"));
const customerRevenueCurrencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/)
  .refine((currency) => supportedRevenueCurrencies.has(currency), {
    message: "Choose a supported ISO 4217 currency code.",
  });

const customerSettingsUpdateSchema = z.object({
  enabled: z.boolean().optional(),
  defaultTeamId: z.string().uuid().nullable().optional(),
  revenuePeriod: z.enum(["annual", "monthly"]).optional(),
  revenueCurrency: customerRevenueCurrencySchema.optional(),
  attributesDataSource: z.string().trim().min(1).max(100).nullable().optional(),
  manualEditsEnabled: z.boolean().optional(),
});

const customerDomainRuleKindSchema = z.enum(["excluded", "generic"]);
const customerDomainPattern =
  /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const customerDomainRuleValueSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(320)
  .refine((value) => customerDomainPattern.test(value) || z.email().safeParse(value).success, {
    message: "Enter a valid domain or email address.",
  });

const customerDomainRuleSchema = z.object({
  id: z.string().uuid(),
  kind: customerDomainRuleKindSchema,
  value: z.string(),
  createdAt: z.iso.datetime(),
});

const customerStatusSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  color: z.string(),
  position: z.number().int().nonnegative(),
});

const customerStatusNameSchema = z.string().trim().min(1).max(64);
const customerStatusColorSchema = z.string().trim().min(1).max(64);
const customerStatusUpdateSchema = z
  .object({
    id: z.string().uuid(),
    name: customerStatusNameSchema.optional(),
    color: customerStatusColorSchema.optional(),
  })
  .refine((value) => value.name !== undefined || value.color !== undefined);

const customerTierSchema = customerStatusSchema;
const customerTierUpdateSchema = customerStatusUpdateSchema;

function orderedIdsSchema() {
  return z
    .array(z.string().uuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "The ordered list cannot contain duplicate ids.",
    });
}
export const contract = {
  /** Confirma que a API está no ar e alcança o banco. */
  health: oc.output(
    z.object({
      status: z.literal("ok"),
      database: z.literal("ok"),
    }),
  ),
  workspace: {
    /** Retorna o Workspace e o Member resolvidos pelo middleware do contexto atual. */
    current: oc.output(
      z.object({
        workspace: workspaceSchema,
        member: z.object({
          id: z.string().uuid(),
          name: z.string(),
          email: z.string().email(),
          role: z.string(),
        }),
      }),
    ),
    /** Atualiza os campos editáveis do Workspace atual. */
    update: oc
      .input(
        z.object({
          name: z.string().trim().min(1).optional(),
          slug: workspaceSlugSchema.optional(),
          fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
          logoUrl: workspaceLogoUrlSchema.nullable().optional(),
          icon: projectIconValueSchema.optional(),
          apiKeyPolicy: apiKeyPolicySchema.optional(),
        }),
      )
      .output(workspaceSchema),
    /** Deletes the current Workspace immediately; Members are removed by FK cascade. */
    delete: oc.output(z.void()),
  },
  member: {
    /** Lista Members do Workspace resolvido pelo middleware. */
    list: oc.output(z.array(memberListItemSchema)),
    /** Renomeia um Member do Workspace; exige Role admin no middleware. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().trim().min(1),
        }),
      )
      .output(memberSchema),
  },
  team: {
    /** Lista somente os Teams do Workspace resolvido, com contagens para a tabela. */
    list: oc.output(z.array(teamListItemSchema)),
    /** Cria um Team; o servidor deriva o slug do nome. */
    create: oc
      .input(
        z.object({
          name: teamNameSchema,
          key: teamKeySchema,
          icon: projectIconValueSchema,
        }),
      )
      .output(teamSchema),
    /** Lê um Team pelo slug, somente dentro do Workspace resolvido. */
    get: oc.input(z.object({ team: z.string().trim().min(1) })).output(teamSchema),
    /** Atualiza os campos editáveis do Team; o slug não muda após criação. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          name: teamNameSchema.optional(),
          key: teamKeySchema.optional(),
          icon: projectIconValueSchema.optional(),
          description: z.string().trim().nullable().optional(),
          timezone: teamTimezoneSchema.optional(),
          estimation: teamEstimationSchema.optional(),
          detailedIssueHistory: z.boolean().optional(),
          issueEmailEnabled: z.boolean().optional(),
        }),
      )
      .output(teamSchema),
    /** Regenera o endereço de email de intake do Team. */
    resetIssueEmail: oc.input(z.object({ id: z.string().uuid() })).output(teamSchema),
    /** Lista Members vinculados a um Team do Workspace resolvido. */
    members: oc.input(z.object({ id: z.string().uuid() })).output(z.array(memberSchema)),
    /** Exclui imediatamente um Team do Workspace resolvido. */
    delete: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
  customerSettings: {
    /** Reads or initializes Customer settings in the current Workspace. */
    get: oc.output(customerSettingsSchema),
    /** Updates Customer settings; the Workspace id always comes from middleware. */
    update: oc.input(customerSettingsUpdateSchema).output(customerSettingsSchema),
  },
  customerDomainRule: {
    /** Lists custom excluded or generic domains and email addresses. */
    list: oc
      .input(z.object({ kind: customerDomainRuleKindSchema }))
      .output(z.array(customerDomainRuleSchema)),
    /** Adds one normalized domain or email address. */
    add: oc
      .input(z.object({ kind: customerDomainRuleKindSchema, value: customerDomainRuleValueSchema }))
      .output(customerDomainRuleSchema),
    /** Removes one rule from the current Workspace. */
    remove: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
  customerStatus: {
    /** Lists Customer statuses in display order. */
    list: oc.output(z.array(customerStatusSchema)),
    /** Creates a Customer status at the end of the current Workspace's list. */
    create: oc
      .input(z.object({ name: customerStatusNameSchema, color: customerStatusColorSchema }))
      .output(customerStatusSchema),
    /** Updates one Customer status in the current Workspace. */
    update: oc.input(customerStatusUpdateSchema).output(customerStatusSchema),
    /** Deletes one status; moveTo is supplied when existing Customers use it. */
    delete: oc
      .input(z.object({ id: z.string().uuid(), moveTo: z.string().uuid().optional() }))
      .output(z.void()),
    /** Replaces the complete status order with the supplied ids. */
    reorder: oc.input(z.object({ ids: orderedIdsSchema() })).output(z.void()),
  },
  customerTier: {
    /** Lists Customer tiers in display order. */
    list: oc.output(z.array(customerTierSchema)),
    /** Creates a Customer tier at the end of the current Workspace's list. */
    create: oc
      .input(z.object({ name: customerStatusNameSchema, color: customerStatusColorSchema }))
      .output(customerTierSchema),
    /** Updates one Customer tier in the current Workspace. */
    update: oc.input(customerTierUpdateSchema).output(customerTierSchema),
    /** Deletes one Customer tier in the current Workspace. */
    delete: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
    /** Replaces the complete tier order with the supplied ids. */
    reorder: oc.input(z.object({ ids: orderedIdsSchema() })).output(z.void()),
  },
  apiKey: {
    /** Creates a personal API key; the raw token is returned exactly once. */
    create: oc
      .input(z.object({ name: z.string().trim().min(1), permissions: apiKeyPermissionsSchema }))
      .output(z.object({ key: apiKeySchema, token: z.string() })),
    /** Updates an active API key without exposing or changing its token. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().trim().min(1),
          permissions: apiKeyPermissionsSchema,
        }),
      )
      .output(apiKeySchema),
    /** Lists personal keys or all keys in the resolved Workspace. */
    list: oc
      .input(z.object({ scope: z.enum(["mine", "workspace"]) }))
      .output(z.array(apiKeySchema)),
    /** Revokes one key within the resolved Workspace. */
    revoke: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
  status: {
    /** Lista o Workflow ordenado pelas categorias e posições do Team. */
    list: oc.input(z.object({ team: teamSlugSchema })).output(z.array(workflowStatusSchema)),
    /** Cria um Status no Team selecionado; Duplicate e Triage são controlados pelo sistema. */
    create: oc
      .input(
        z.object({
          team: teamSlugSchema,
          category: workflowStatusCategorySchema,
          name: z.string().trim().min(1),
          description: z.string().trim().nullable().optional(),
          color: workflowStatusColorSchema.optional(),
        }),
      )
      .output(workflowStatusSchema),
    /** Edita o nome, a descrição ou a cor de um Status do Workspace atual. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().trim().min(1).optional(),
          description: z.string().trim().nullable().optional(),
          color: workflowStatusColorSchema.optional(),
        }),
      )
      .output(workflowStatusSchema),
    /** Exclui um Status e, quando preciso, move as Issues para moveIssuesTo. */
    delete: oc
      .input(z.object({ id: z.string().uuid(), moveIssuesTo: z.string().uuid().optional() }))
      .output(z.void()),
    reorder: oc
      .input(z.object({ id: z.string().uuid(), position: z.number().int().nonnegative() }))
      .output(z.void()),
    setDefault: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
  label: {
    /** Lista Labels do Workspace e, quando informado, do Team selecionado. */
    list: oc
      .input(z.object({ team: teamSlugSchema.optional() }))
      .output(z.array(labelListItemSchema)),
    /** Cria um Label ou grupo no Workspace, Team ou grupo pai informado. */
    create: oc
      .input(
        z.object({
          team: teamSlugSchema.optional(),
          parentId: z.string().uuid().optional(),
          isGroup: z.boolean().optional(),
          name: z.string().trim().min(1).max(80),
          description: z.string().trim().max(500).nullable().optional(),
          color: labelColorSchema.optional(),
        }),
      )
      .output(labelSchema),
    /** Edita os campos de apresentação de um Label. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          name: z.string().trim().min(1).max(80).optional(),
          description: z.string().trim().max(500).nullable().optional(),
          color: labelColorSchema.optional(),
        }),
      )
      .output(labelSchema),
    archive: oc.input(z.object({ id: z.string().uuid() })).output(labelSchema),
    delete: oc
      .input(z.object({ id: z.string().uuid() }))
      .output(z.object({ deletedIssueCount: z.number().int().nonnegative() })),
    merge: oc
      .input(z.object({ sourceId: z.string().uuid(), targetId: z.string().uuid() }))
      .output(labelSchema),
    /** Converte um Label em grupo e opcionalmente migra as aplicações para um novo filho. */
    convertToGroup: oc
      .input(
        z.object({ id: z.string().uuid(), childName: z.string().trim().min(1).max(80).optional() }),
      )
      .output(z.array(labelSchema)),
    /** Move o Label (e seus filhos, quando grupo) para o Workspace ou Team indicado. */
    move: oc
      .input(z.object({ id: z.string().uuid(), team: teamSlugSchema.nullable() }))
      .output(z.array(labelSchema)),
  },
  relation: {
    /** Cria uma Relação entre Issues do Workspace atual. `blocks` e `duplicate` são direcionais. */
    add: oc
      .input(
        z.object({
          issueId: z.string().uuid(),
          relatedIssueId: z.string().uuid(),
          type: issueRelationTypeSchema,
        }),
      )
      .output(z.void()),
    /** Remove uma Relação entre Issues do Workspace atual. */
    remove: oc
      .input(
        z.object({
          issueId: z.string().uuid(),
          relatedIssueId: z.string().uuid(),
          type: issueRelationTypeSchema,
        }),
      )
      .output(z.void()),
  },
  link: {
    /** Anexa um link http(s) genérico a uma Issue. */
    add: oc
      .input(
        z.object({
          issueId: z.string().uuid(),
          url: z
            .url()
            .refine(
              (value) => /^https?:\/\//i.test(value),
              "Only http and https links are supported.",
            ),
          title: z.string().trim().min(1).optional(),
        }),
      )
      .output(z.void()),
    /** Remove um link do Workspace atual. */
    remove: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
  issue: {
    /** Lista Issues de um Team, filtradas e ordenadas para a view escolhida. */
    list: oc.input(issueListInputSchema).output(z.array(issueListItemSchema)),
    /** Contagens por filtro e grupos, incluindo opções sem Issues. */
    facets: oc.input(issueFacetsInputSchema).output(issueFacetsSchema),
    /** Busca pelo identificador derivado da Team key atual (ex.: VYZ-35). */
    get: oc.input(z.object({ identifier: z.string().trim().min(1) })).output(issueDetailSchema),
    /** Cria uma Issue; com parentId, infere o Team e herda Priority do pai. */
    create: oc
      .input(
        z
          .object({
            team: teamSlugSchema.optional(),
            parentId: z.string().uuid().optional(),
            title: z.string().trim().min(1),
            description: z.string().nullable().optional(),
            statusId: z.string().uuid().optional(),
            priority: issuePrioritySchema.optional(),
            assigneeId: z.string().uuid().nullable().optional(),
            dueDate: z.iso.date().nullable().optional(),
          })
          .refine((values) => values.team !== undefined || values.parentId !== undefined, {
            message: "Choose a Team or a parent Issue.",
          }),
      )
      .output(issueSchema),
    /** Atualiza propriedades da Issue ou move-a para outro Team do Workspace. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          title: z.string().trim().min(1).optional(),
          description: z.string().nullable().optional(),
          statusId: z.string().uuid().optional(),
          priority: issuePrioritySchema.optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          dueDate: z.iso.date().nullable().optional(),
          teamId: z.string().uuid().optional(),
        }),
      )
      .output(issueSchema),
    /** Define ou remove o parent Issue; relações entre Workspaces e ciclos são rejeitados. */
    setParent: oc
      .input(z.object({ id: z.string().uuid(), parentId: z.string().uuid().nullable() }))
      .output(issueSchema),
    /** Substitui a coleção de Labels; cada grupo admite no máximo um filho por Issue. */
    setLabels: oc
      .input(
        z.object({
          id: z.string().uuid(),
          labelIds: z.array(z.string().uuid()).refine((ids) => new Set(ids).size === ids.length),
        }),
      )
      .output(z.array(issueLabelSchema)),
    /** Hard-delete da Issue e dos eventos dependentes (D4). */
    delete: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
    /** Activity persistida para uma Issue dentro do Workspace atual. */
    events: oc.input(z.object({ id: z.string().uuid() })).output(z.array(issueEventSchema)),
    /** Reordena manualmente uma Issue dentro do grupo selecionado. */
    reorder: oc
      .input(
        z.object({
          id: z.string().uuid(),
          position: z.number().int().nonnegative(),
          groupBy: issueGroupBySchema.optional(),
          subgroupBy: issueGroupBySchema.optional(),
        }),
      )
      .output(z.void()),
    /** Aplica mudanças em massa; a resposta identifica falhas por Issue. */
    bulkUpdate: oc
      .input(
        z.object({
          ids: issueIdsSchema,
          changes: z
            .object({
              statusId: z.string().uuid().optional(),
              priority: issuePrioritySchema.optional(),
              assigneeId: z.string().uuid().nullable().optional(),
            })
            .refine(
              (changes) => Object.values(changes).some((value) => value !== undefined),
              "Choose at least one Issue property to update.",
            ),
        }),
      )
      .output(
        z.object({
          updatedIds: z.array(z.string().uuid()),
          failed: z.array(issueBulkFailureSchema),
        }),
      ),
    /** Exclui várias Issues; a resposta identifica falhas por Issue. */
    bulkDelete: oc.input(z.object({ ids: issueIdsSchema })).output(
      z.object({
        deletedIds: z.array(z.string().uuid()),
        failed: z.array(issueBulkFailureSchema),
      }),
    ),
  },
  notification: {
    /** Lista as notificações ativas do Member resolvido, por padrão das mais novas. */
    list: oc.input(notificationListInputSchema).output(
      z.object({
        items: z.array(notificationItemSchema),
        nextCursor: notificationCursorSchema.nullable(),
      }),
    ),
    /** Conta as notificações não lidas do Member atual. */
    unreadCount: oc.output(z.number().int().nonnegative()),
    /** Marca como lidas somente notificações que pertencem ao Member atual. */
    markRead: oc.input(notificationIdsInputSchema).output(z.void()),
    /** Marca como não lidas somente notificações que pertencem ao Member atual. */
    markUnread: oc.input(notificationIdsInputSchema).output(z.void()),
    /** Arquiva as notificações do Inbox sem alterar as Issues. */
    archive: oc.input(notificationIdsInputSchema).output(z.void()),
    /** Arquiva todas as notificações ativas; onlyRead limita a ação às já lidas. */
    archiveAll: oc
      .input(z.object({ onlyRead: z.boolean().optional().default(false) }))
      .output(z.void()),
  },
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
