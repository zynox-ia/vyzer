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

export type Team = z.infer<typeof teamSchema>;
export type TeamListItem = z.infer<typeof teamListItemSchema>;
export type WorkflowStatus = z.infer<typeof workflowStatusSchema>;

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
    /** Exclui um Status; moveIssuesTo é reservado ao domínio de Issues (Etapa 3.2). */
    delete: oc
      .input(z.object({ id: z.string().uuid(), moveIssuesTo: z.string().uuid().optional() }))
      .output(z.void()),
    reorder: oc
      .input(z.object({ id: z.string().uuid(), position: z.number().int().nonnegative() }))
      .output(z.void()),
    setDefault: oc.input(z.object({ id: z.string().uuid() })).output(z.void()),
  },
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
