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
  icon: projectIconValueSchema,
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
          icon: projectIconValueSchema.optional(),
        }),
      )
      .output(workspaceSchema),
  },
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
