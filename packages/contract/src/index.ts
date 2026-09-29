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
    list: oc.output(z.array(memberSchema)),
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
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
