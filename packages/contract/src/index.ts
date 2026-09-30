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

const workspaceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  region: z.string(),
  logoUrl: z.string().nullable(),
  icon: projectIconValueSchema,
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

const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  key: z.string(),
  icon: projectIconValueSchema,
  description: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const teamKeySchema = z.string().regex(/^[A-Z][A-Z0-9]*$/);

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
const issueGroupBySchema = z.enum(["none", "status", "assignee", "priority"]);
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
  dueDate: z.iso.date().nullable(),
  startedAt: z.iso.datetime().nullable(),
  completedAt: z.iso.datetime().nullable(),
  canceledAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

const issueEventTypeSchema = z.enum([
  "created",
  "status",
  "priority",
  "assignee",
  "title",
  "description",
  "due_date",
  "team",
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

export type Team = z.infer<typeof teamSchema>;
export type TeamListItem = z.infer<typeof teamListItemSchema>;
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;
export type Issue = z.infer<typeof issueSchema>;
export type IssueEvent = z.infer<typeof issueEventSchema>;
export type IssueFilters = z.infer<typeof issueFiltersSchema>;
export type IssueListInput = z.infer<typeof issueListInputSchema>;
export type IssueFacetsInput = z.infer<typeof issueFacetsInputSchema>;

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
          name: z.string().trim().min(1),
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
          name: z.string().trim().min(1).optional(),
          key: teamKeySchema.optional(),
          icon: projectIconValueSchema.optional(),
          description: z.string().trim().nullable().optional(),
        }),
      )
      .output(teamSchema),
    /** Lista Members vinculados a um Team do Workspace resolvido. */
    members: oc.input(z.object({ id: z.string().uuid() })).output(z.array(memberSchema)),
    /** Exclui imediatamente um Team do Workspace resolvido. */
    delete: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
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
  issue: {
    /** Lista Issues de um Team, filtradas e ordenadas para a view escolhida. */
    list: oc.input(issueListInputSchema).output(z.array(issueSchema)),
    /** Contagens por filtro e grupos, incluindo opções sem Issues. */
    facets: oc.input(issueFacetsInputSchema).output(issueFacetsSchema),
    /** Busca pelo identificador derivado da Team key atual (ex.: VYZ-35). */
    get: oc.input(z.object({ identifier: z.string().trim().min(1) })).output(issueSchema),
    /** Cria uma Issue; omitir statusId usa o Status padrão do Team. */
    create: oc
      .input(
        z.object({
          team: teamSlugSchema,
          title: z.string().trim().min(1),
          description: z.string().nullable().optional(),
          statusId: z.string().uuid().optional(),
          priority: issuePrioritySchema.optional(),
          assigneeId: z.string().uuid().nullable().optional(),
          dueDate: z.iso.date().nullable().optional(),
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
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
