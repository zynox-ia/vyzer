import { ORPCError } from "@orpc/server";
import {
  IssueConflictError,
  IssueDraftRuleError,
  IssueRuleError,
  createWorkspaceIssueDraft,
  discardWorkspaceIssueDraft,
  listWorkspaceIssueDrafts,
  publishWorkspaceIssueDraft,
  updateWorkspaceIssueDraft,
} from "@vyzer/db";
import type { createWorkspaceMiddleware } from "./orpc";
import { requireApiKeyPermission } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;
type PublishedIssue = NonNullable<Awaited<ReturnType<typeof publishWorkspaceIssueDraft>>>;

function issueDraftOutput(draft: {
  id: string;
  workspaceId: string;
  creatorId: string;
  teamId: string | null;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...draft,
    createdAt: draft.createdAt.toISOString(),
    updatedAt: draft.updatedAt.toISOString(),
  };
}

function publishedIssueOutput(issue: PublishedIssue) {
  return {
    ...issue,
    labels: issue.labels.map((label) => ({
      ...label,
      archivedAt: label.archivedAt?.toISOString() ?? null,
    })),
    startedAt: issue.startedAt?.toISOString() ?? null,
    completedAt: issue.completedAt?.toISOString() ?? null,
    canceledAt: issue.canceledAt?.toISOString() ?? null,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

export function createIssueDraftRouter(middleware: Middleware) {
  return {
    issueDraft: {
      list: middleware.workspaceScoped.issueDraft.list.handler(async ({ context }) =>
        (await listWorkspaceIssueDrafts(context.db, context.workspace.id, context.member.id)).map(
          issueDraftOutput,
        ),
      ),
      create: middleware.writeScoped.issueDraft.create.handler(async ({ context, input }) => {
        const created = await createWorkspaceIssueDraft(
          context.db,
          context.workspace.id,
          context.member.id,
          input,
        );
        if (!created) throw new ORPCError("NOT_FOUND");
        return issueDraftOutput(created);
      }),
      update: middleware.writeScoped.issueDraft.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        const updated = await updateWorkspaceIssueDraft(
          context.db,
          context.workspace.id,
          context.member.id,
          id,
          values,
        );
        if (!updated) throw new ORPCError("NOT_FOUND");
        return issueDraftOutput(updated);
      }),
      publish: middleware.workspaceResolved.issueDraft.publish.handler(
        async ({ context, input }) => {
          requireApiKeyPermission(context, "issues:create");

          try {
            const published = await publishWorkspaceIssueDraft(
              context.db,
              context.workspace.id,
              context.member.id,
              input.id,
            );
            if (!published) throw new ORPCError("NOT_FOUND");
            return publishedIssueOutput(published);
          } catch (error) {
            if (error instanceof IssueDraftRuleError || error instanceof IssueRuleError) {
              throw new ORPCError("BAD_REQUEST", { message: error.message });
            }
            if (error instanceof IssueConflictError) {
              throw new ORPCError("CONFLICT", { message: error.message });
            }
            throw error;
          }
        },
      ),
      discard: middleware.writeScoped.issueDraft.discard.handler(async ({ context, input }) => {
        const discarded = await discardWorkspaceIssueDraft(
          context.db,
          context.workspace.id,
          context.member.id,
          input.id,
        );
        if (!discarded) throw new ORPCError("NOT_FOUND");
      }),
    },
  };
}
