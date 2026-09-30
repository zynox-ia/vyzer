import { ORPCError } from "@orpc/server";
import {
  checkConnection,
  createWorkspaceIssue,
  createWorkspaceTeamWorkflowStatus,
  createTeamSlug,
  createWorkspaceTeam,
  deleteWorkspaceWorkflowStatus,
  deleteWorkspaceIssue,
  deleteWorkspace,
  deleteWorkspaceTeam,
  getWorkspaceTeamBySlug,
  listWorkspaceTeamMembers,
  listWorkspaceTeams,
  listWorkspaceTeamWorkflowStatuses,
  listWorkspaceTeamIssues,
  listWorkspaceIssueEvents,
  getWorkspaceIssueByIdentifier,
  listWorkspaceMembers,
  listWorkspaceTeamIssueFacets,
  updateWorkspaceMemberName,
  updateWorkspaceSettings,
  updateWorkspaceTeam,
  updateWorkspaceWorkflowStatus,
  reorderWorkspaceWorkflowStatus,
  reorderWorkspaceIssue,
  setWorkspaceDefaultWorkflowStatus,
  setWorkspaceIssueParent,
  updateWorkspaceIssue,
  IssueConflictError,
  IssueRuleError,
  type IssueEventType,
  type IssuePriority,
  WorkflowStatusRuleError,
  type WorkflowStatusCategory,
  type WorkflowStatusColor,
  WORKSPACE_REGION,
} from "@vyzer/db";
import {
  adminOnly,
  base,
  createWorkspaceMiddleware,
  type WorkspaceContextResolver,
  workspaceScoped,
} from "./orpc";

export function createRouter(resolveContext?: WorkspaceContextResolver) {
  const middleware = resolveContext
    ? createWorkspaceMiddleware(resolveContext)
    : { workspaceScoped, adminOnly };

  return base.router({
    health: base.health.handler(async ({ context }) => {
      await checkConnection(context.db);
      return { status: "ok" as const, database: "ok" as const };
    }),
    workspace: {
      current: middleware.workspaceScoped.workspace.current.handler(({ context }) => ({
        workspace: {
          id: context.workspace.id,
          name: context.workspace.name,
          slug: context.workspace.slug,
          fiscalYearStartMonth: context.workspace.fiscalYearStartMonth,
          region: WORKSPACE_REGION,
          logoUrl: context.workspace.logoUrl,
          icon: context.workspace.icon,
        },
        member: {
          id: context.member.id,
          name: context.member.name,
          email: context.member.email,
          role: context.member.role,
        },
      })),
      update: middleware.adminOnly.workspace.update.handler(async ({ context, input }) => {
        const updatedWorkspace = await updateWorkspaceSettings(
          context.db,
          context.workspace.id,
          input,
        );

        if (!updatedWorkspace) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Workspace resolved by middleware could not be updated.",
          });
        }

        return {
          id: updatedWorkspace.id,
          name: updatedWorkspace.name,
          slug: updatedWorkspace.slug,
          fiscalYearStartMonth: updatedWorkspace.fiscalYearStartMonth,
          region: WORKSPACE_REGION,
          logoUrl: updatedWorkspace.logoUrl,
          icon: updatedWorkspace.icon,
        };
      }),
      delete: middleware.adminOnly.workspace.delete.handler(async ({ context }) => {
        await deleteWorkspace(context.db, context.workspace.id);
      }),
    },
    member: {
      list: middleware.workspaceScoped.member.list.handler(async ({ context }) =>
        (await listWorkspaceMembers(context.db, context.workspace.id)).map((currentMember) => ({
          id: currentMember.id,
          name: currentMember.name,
          email: currentMember.email,
          role: currentMember.role,
          createdAt: currentMember.createdAt.toISOString(),
          teamCount: currentMember.teamCount,
        })),
      ),
      update: middleware.adminOnly.member.update.handler(async ({ context, input }) => {
        const updatedMember = await updateWorkspaceMemberName(
          context.db,
          context.workspace.id,
          input.id,
          input.name,
        );

        if (!updatedMember) {
          throw new ORPCError("NOT_FOUND");
        }

        return {
          id: updatedMember.id,
          name: updatedMember.name,
          email: updatedMember.email,
          role: updatedMember.role,
          createdAt: updatedMember.createdAt.toISOString(),
        };
      }),
    },
    team: {
      list: middleware.workspaceScoped.team.list.handler(async ({ context }) =>
        (await listWorkspaceTeams(context.db, context.workspace.id)).map((currentTeam) => ({
          id: currentTeam.id,
          name: currentTeam.name,
          slug: currentTeam.slug,
          key: currentTeam.key,
          icon: currentTeam.icon,
          description: currentTeam.description,
          createdAt: currentTeam.createdAt.toISOString(),
          updatedAt: currentTeam.updatedAt.toISOString(),
          memberCount: currentTeam.memberCount,
          issueCount: currentTeam.issueCount,
        })),
      ),
      create: middleware.adminOnly.team.create.handler(async ({ context, input }) => {
        const slug = createTeamSlug(input.name);
        if (!slug) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Team name must include letters or numbers to create its URL.",
          });
        }

        let createdTeam;
        try {
          createdTeam = await createWorkspaceTeam(context.db, context.workspace.id, {
            ...input,
            slug,
          });
        } catch (error) {
          if (isUniqueConstraintViolation(error)) {
            throw new ORPCError("CONFLICT", {
              message: "A Team with this identifier or URL already exists in the Workspace.",
            });
          }
          throw error;
        }

        if (!createdTeam) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The Team could not be created.",
          });
        }

        return {
          id: createdTeam.id,
          name: createdTeam.name,
          slug: createdTeam.slug,
          key: createdTeam.key,
          icon: createdTeam.icon,
          description: createdTeam.description,
          createdAt: createdTeam.createdAt.toISOString(),
          updatedAt: createdTeam.updatedAt.toISOString(),
        };
      }),
      get: middleware.workspaceScoped.team.get.handler(async ({ context, input }) => {
        const currentTeam = await getWorkspaceTeamBySlug(
          context.db,
          context.workspace.id,
          input.team,
        );
        if (!currentTeam) {
          throw new ORPCError("NOT_FOUND");
        }

        return {
          id: currentTeam.id,
          name: currentTeam.name,
          slug: currentTeam.slug,
          key: currentTeam.key,
          icon: currentTeam.icon,
          description: currentTeam.description,
          createdAt: currentTeam.createdAt.toISOString(),
          updatedAt: currentTeam.updatedAt.toISOString(),
        };
      }),
      update: middleware.adminOnly.team.update.handler(async ({ context, input }) => {
        let updatedTeam;
        try {
          updatedTeam = await updateWorkspaceTeam(context.db, context.workspace.id, input.id, {
            name: input.name,
            key: input.key,
            icon: input.icon,
            description: input.description,
          });
        } catch (error) {
          if (isUniqueConstraintViolation(error)) {
            throw new ORPCError("CONFLICT", {
              message: "This Team identifier is already taken in the Workspace.",
            });
          }
          throw error;
        }

        if (!updatedTeam) {
          throw new ORPCError("NOT_FOUND");
        }

        return {
          id: updatedTeam.id,
          name: updatedTeam.name,
          slug: updatedTeam.slug,
          key: updatedTeam.key,
          icon: updatedTeam.icon,
          description: updatedTeam.description,
          createdAt: updatedTeam.createdAt.toISOString(),
          updatedAt: updatedTeam.updatedAt.toISOString(),
        };
      }),
      members: middleware.workspaceScoped.team.members.handler(async ({ context, input }) => {
        const teamMembers = await listWorkspaceTeamMembers(
          context.db,
          context.workspace.id,
          input.id,
        );
        if (!teamMembers) {
          throw new ORPCError("NOT_FOUND");
        }

        return teamMembers.map((currentMember) => ({
          id: currentMember.id,
          name: currentMember.name,
          email: currentMember.email,
          role: currentMember.role,
          createdAt: currentMember.createdAt.toISOString(),
        }));
      }),
      delete: middleware.adminOnly.team.delete.handler(async ({ context, input }) => {
        const deletedTeam = await deleteWorkspaceTeam(context.db, context.workspace.id, input.id);
        if (!deletedTeam) {
          throw new ORPCError("NOT_FOUND");
        }
      }),
    },
    status: {
      list: middleware.workspaceScoped.status.list.handler(async ({ context, input }) => {
        const statuses = await listWorkspaceTeamWorkflowStatuses(
          context.db,
          context.workspace.id,
          input.team,
        );
        if (!statuses) throw new ORPCError("NOT_FOUND");

        return statuses.map(serializeWorkflowStatus);
      }),
      create: middleware.adminOnly.status.create.handler(async ({ context, input }) => {
        const { team: teamSlug, ...values } = input;
        const createdStatus = await withStatusErrors(() =>
          createWorkspaceTeamWorkflowStatus(context.db, context.workspace.id, teamSlug, values),
        );
        if (!createdStatus) throw new ORPCError("NOT_FOUND");

        return serializeWorkflowStatus(createdStatus);
      }),
      update: middleware.adminOnly.status.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        const updatedStatus = await withStatusErrors(() =>
          updateWorkspaceWorkflowStatus(context.db, context.workspace.id, id, values),
        );
        if (!updatedStatus) throw new ORPCError("NOT_FOUND");

        return serializeWorkflowStatus(updatedStatus);
      }),
      delete: middleware.adminOnly.status.delete.handler(async ({ context, input }) => {
        const result = await withStatusErrors(() =>
          deleteWorkspaceWorkflowStatus(
            context.db,
            context.workspace.id,
            input.id,
            context.member.id,
            input.moveIssuesTo,
          ),
        );
        if (!result) throw new ORPCError("NOT_FOUND");
      }),
      reorder: middleware.adminOnly.status.reorder.handler(async ({ context, input }) => {
        const result = await withStatusErrors(() =>
          reorderWorkspaceWorkflowStatus(
            context.db,
            context.workspace.id,
            input.id,
            input.position,
          ),
        );
        if (result === null) throw new ORPCError("NOT_FOUND");
      }),
      setDefault: middleware.adminOnly.status.setDefault.handler(async ({ context, input }) => {
        const result = await withStatusErrors(() =>
          setWorkspaceDefaultWorkflowStatus(context.db, context.workspace.id, input.id),
        );
        if (result === null) throw new ORPCError("NOT_FOUND");
      }),
    },
    issue: {
      list: middleware.workspaceScoped.issue.list.handler(async ({ context, input }) => {
        const issues = await listWorkspaceTeamIssues(
          context.db,
          context.workspace.id,
          input.team,
          input,
        );
        if (!issues) throw new ORPCError("NOT_FOUND");

        return issues.map(serializeIssue);
      }),
      facets: middleware.workspaceScoped.issue.facets.handler(async ({ context, input }) => {
        const facets = await listWorkspaceTeamIssueFacets(
          context.db,
          context.workspace.id,
          input.team,
          input,
        );
        if (!facets) throw new ORPCError("NOT_FOUND");

        return facets;
      }),
      get: middleware.workspaceScoped.issue.get.handler(async ({ context, input }) => {
        const issue = await getWorkspaceIssueByIdentifier(
          context.db,
          context.workspace.id,
          input.identifier,
        );
        if (!issue) throw new ORPCError("NOT_FOUND");

        return serializeIssue(issue);
      }),
      create: middleware.workspaceScoped.issue.create.handler(async ({ context, input }) => {
        const { team: teamSlug, ...values } = input;
        const createdIssue = await withIssueErrors(() =>
          createWorkspaceIssue(
            context.db,
            context.workspace.id,
            context.member.id,
            teamSlug,
            values,
          ),
        );
        if (!createdIssue) throw new ORPCError("NOT_FOUND");

        return serializeIssue(createdIssue);
      }),
      update: middleware.workspaceScoped.issue.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        const updatedIssue = await withIssueErrors(() =>
          updateWorkspaceIssue(context.db, context.workspace.id, context.member.id, id, values),
        );
        if (!updatedIssue) throw new ORPCError("NOT_FOUND");

        return serializeIssue(updatedIssue);
      }),
      setParent: middleware.workspaceScoped.issue.setParent.handler(async ({ context, input }) => {
        const updatedIssue = await withIssueErrors(() =>
          setWorkspaceIssueParent(context.db, context.workspace.id, input.id, input.parentId),
        );
        if (!updatedIssue) throw new ORPCError("NOT_FOUND");

        return serializeIssue(updatedIssue);
      }),
      delete: middleware.workspaceScoped.issue.delete.handler(async ({ context, input }) => {
        const deletedIssue = await deleteWorkspaceIssue(context.db, context.workspace.id, input.id);
        if (!deletedIssue) throw new ORPCError("NOT_FOUND");
      }),
      events: middleware.workspaceScoped.issue.events.handler(async ({ context, input }) => {
        const events = await listWorkspaceIssueEvents(context.db, context.workspace.id, input.id);
        if (!events) throw new ORPCError("NOT_FOUND");

        return events.map(serializeIssueEvent);
      }),
      reorder: middleware.workspaceScoped.issue.reorder.handler(async ({ context, input }) => {
        const reorderedIssue = await withIssueErrors(() =>
          reorderWorkspaceIssue(context.db, context.workspace.id, input.id, input.position, {
            groupBy: input.groupBy,
            subgroupBy: input.subgroupBy,
          }),
        );
        if (!reorderedIssue) throw new ORPCError("NOT_FOUND");
      }),
      bulkUpdate: middleware.workspaceScoped.issue.bulkUpdate.handler(
        async ({ context, input }) => {
          const outcomes = await Promise.all(
            input.ids.map(async (id) => {
              try {
                const updatedIssue = await updateWorkspaceIssue(
                  context.db,
                  context.workspace.id,
                  context.member.id,
                  id,
                  input.changes,
                );
                return updatedIssue
                  ? { id, success: true as const }
                  : {
                      id,
                      success: false as const,
                      code: "NOT_FOUND" as const,
                      message: "Issue not found in this Workspace.",
                    };
              } catch (error) {
                return { id, success: false as const, ...issueFailureDetails(error) };
              }
            }),
          );

          return {
            updatedIds: outcomes.filter((outcome) => outcome.success).map((outcome) => outcome.id),
            failed: outcomes.flatMap((outcome) =>
              outcome.success
                ? []
                : [{ id: outcome.id, code: outcome.code, message: outcome.message }],
            ),
          };
        },
      ),
      bulkDelete: middleware.workspaceScoped.issue.bulkDelete.handler(
        async ({ context, input }) => {
          const outcomes = await Promise.all(
            input.ids.map(async (id) => {
              try {
                const deletedIssue = await deleteWorkspaceIssue(
                  context.db,
                  context.workspace.id,
                  id,
                );
                return deletedIssue
                  ? { id, success: true as const }
                  : {
                      id,
                      success: false as const,
                      code: "NOT_FOUND" as const,
                      message: "Issue not found in this Workspace.",
                    };
              } catch (error) {
                return { id, success: false as const, ...issueFailureDetails(error) };
              }
            }),
          );

          return {
            deletedIds: outcomes.filter((outcome) => outcome.success).map((outcome) => outcome.id),
            failed: outcomes.flatMap((outcome) =>
              outcome.success
                ? []
                : [{ id: outcome.id, code: outcome.code, message: outcome.message }],
            ),
          };
        },
      ),
    },
  });
}

export const router = createRouter();

function isUniqueConstraintViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueConstraintViolation(error.cause);
}

async function withStatusErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof WorkflowStatusRuleError) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
    if (isUniqueConstraintViolation(error)) {
      throw new ORPCError("CONFLICT", {
        message: "A Status with this name already exists in the category.",
      });
    }
    throw error;
  }
}

function serializeWorkflowStatus<
  T extends {
    id: string;
    teamId: string;
    name: string;
    description: string | null;
    category: WorkflowStatusCategory;
    color: WorkflowStatusColor;
    position: number;
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
  },
>(status: T) {
  return {
    ...status,
    createdAt: status.createdAt.toISOString(),
    updatedAt: status.updatedAt.toISOString(),
  };
}

function serializeIssue<
  T extends {
    id: string;
    teamId: string;
    number: number;
    identifier: string;
    title: string;
    description: string | null;
    statusId: string;
    status: {
      id: string;
      name: string;
      category: WorkflowStatusCategory;
      color: WorkflowStatusColor;
    };
    priority: IssuePriority;
    assigneeId: string | null;
    assignee: { id: string; name: string } | null;
    creatorId: string;
    creator: { id: string; name: string };
    parentId: string | null;
    team: { id: string; name: string; slug: string; key: string };
    dueDate: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    canceledAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
>(issue: T) {
  return {
    ...issue,
    startedAt: issue.startedAt?.toISOString() ?? null,
    completedAt: issue.completedAt?.toISOString() ?? null,
    canceledAt: issue.canceledAt?.toISOString() ?? null,
    createdAt: issue.createdAt.toISOString(),
    updatedAt: issue.updatedAt.toISOString(),
  };
}

function serializeIssueEvent<
  T extends {
    id: string;
    issueId: string;
    actorId: string;
    actor: { id: string; name: string };
    type: IssueEventType;
    payload: Record<string, unknown>;
    createdAt: Date;
  },
>(event: T) {
  return { ...event, createdAt: event.createdAt.toISOString() };
}

async function withIssueErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof IssueRuleError) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
    if (error instanceof IssueConflictError) {
      throw new ORPCError("CONFLICT", { message: error.message });
    }
    if (isUniqueConstraintViolation(error)) {
      throw new ORPCError("CONFLICT", { message: "This Issue number is already in use." });
    }
    throw error;
  }
}

function issueFailureDetails(error: unknown) {
  if (error instanceof IssueRuleError) {
    return { code: "BAD_REQUEST" as const, message: error.message };
  }
  if (error instanceof IssueConflictError) {
    return { code: "CONFLICT" as const, message: error.message };
  }
  if (isUniqueConstraintViolation(error)) {
    return { code: "CONFLICT" as const, message: "This Issue number is already in use." };
  }
  return {
    code: "INTERNAL_SERVER_ERROR" as const,
    message: "This Issue operation failed unexpectedly.",
  };
}
