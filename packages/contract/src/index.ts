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

const projectStatusSchema = z.enum(["backlog", "planned", "started", "completed", "canceled"]);
const projectHealthSchema = z.enum(["on-track", "at-risk", "off-track", "none"]);
const projectPrioritySchema = z.enum(["none", "urgent", "high", "medium", "low"]);
const projectTeamSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  key: z.string(),
  icon: projectIconValueSchema,
});
const uniqueTeamIdsSchema = z
  .array(z.string().uuid())
  .min(1)
  .refine((teamIds) => new Set(teamIds).size === teamIds.length, {
    message: "A Project must have at least one unique Team.",
  });
const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  icon: projectIconValueSchema,
  status: projectStatusSchema,
  health: projectHealthSchema,
  healthNote: z.string().nullable(),
  priority: projectPrioritySchema.nullable(),
  lead: z.object({ id: z.string().uuid(), name: z.string() }).nullable(),
  targetDate: z.iso.date().nullable(),
  teams: z.array(projectTeamSummarySchema).min(1),
  issues: z.number().int().nonnegative(),
  progress: z.number().int().min(0).max(100),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const projectNameSchema = z.string().trim().min(1);

export type Project = z.infer<typeof projectSchema>;
export type ProjectTeamSummary = z.infer<typeof projectTeamSummarySchema>;

export type Team = z.infer<typeof teamSchema>;
export type TeamListItem = z.infer<typeof teamListItemSchema>;

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
  project: {
    /** Lista Projects do Workspace, opcionalmente filtrados pelo slug de um Team. */
    list: oc
      .input(z.object({ teamSlug: z.string().trim().min(1).optional() }))
      .output(z.array(projectSchema)),
    /** Lê um Project por ID, somente dentro do Workspace resolvido. */
    detail: oc.input(z.object({ id: z.string().uuid() })).output(projectSchema),
    /** Cria um Project e seus vínculos com pelo menos um Team do Workspace atual. */
    create: oc
      .input(
        z.object({
          name: projectNameSchema,
          icon: projectIconValueSchema,
          status: projectStatusSchema,
          health: projectHealthSchema,
          healthNote: z.string().nullable().optional(),
          priority: projectPrioritySchema.nullable().optional(),
          leadMemberId: z.string().uuid().nullable().optional(),
          targetDate: z.iso.date().nullable().optional(),
          teamIds: uniqueTeamIdsSchema,
        }),
      )
      .output(projectSchema),
    /** Atualiza um Project; se os vínculos forem enviados, deve restar ao menos um Team. */
    update: oc
      .input(
        z.object({
          id: z.string().uuid(),
          name: projectNameSchema.optional(),
          icon: projectIconValueSchema.optional(),
          status: projectStatusSchema.optional(),
          health: projectHealthSchema.optional(),
          healthNote: z.string().nullable().optional(),
          priority: projectPrioritySchema.nullable().optional(),
          leadMemberId: z.string().uuid().nullable().optional(),
          targetDate: z.iso.date().nullable().optional(),
          teamIds: uniqueTeamIdsSchema.optional(),
        }),
      )
      .output(projectSchema),
    /** Exclui permanentemente um Project do Workspace resolvido. */
    delete: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
