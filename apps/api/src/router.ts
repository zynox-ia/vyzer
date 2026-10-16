import { createHash, randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import {
  archiveAllWorkspaceNotifications,
  archiveWorkspaceLabel,
  archiveWorkspaceNotifications,
  addWorkspaceIssueLink,
  addWorkspaceIssueRelation,
  checkConnection,
  createWorkspaceApiKey,
  convertWorkspaceLabelToGroup,
  countUnreadWorkspaceNotifications,
  createWorkspaceIssue,
  createWorkspaceLabel,
  createWorkspaceTeamWorkflowStatus,
  createTeamSlug,
  createWorkspaceProject,
  createWorkspaceTeam,
  deleteWorkspaceLabel,
  deleteWorkspaceWorkflowStatus,
  deleteWorkspaceIssue,
  deleteWorkspace,
  deleteWorkspaceProject,
  deleteWorkspaceTeam,
  findWorkspaceApiKey,
  getAssignmentPriorityPreference,
  getOrCreateWorkspaceCodeReviewSettings,
  listWorkspaceIssuePullRequests,
  getWorkspaceProject,
  getWorkspaceTeamBySlug,
  listWorkspaceApiKeys,
  listWorkspaceLabels,
  listWorkspaceTeamMembers,
  listWorkspaceTeams,
  listWorkspaceTeamWorkflowStatuses,
  listWorkspaceTeamIssues,
  listWorkspaceIssueEvents,
  removeWorkspaceIssueLink,
  removeWorkspaceIssueRelation,
  listWorkspaceNotifications,
  getWorkspaceIssueByIdentifier,
  listWorkspaceProjects,
  listWorkspaceMembers,
  resetWorkspaceTeamIssueEmail,
  revokeWorkspaceApiKey,
  updateWorkspaceApiKey,
  listWorkspaceTeamIssueFacets,
  mergeWorkspaceLabels,
  moveWorkspaceLabel,
  updateWorkspaceMemberName,
  updateWorkspaceSettings,
  updateWorkspaceProject,
  updateWorkspaceTeam,
  updateWorkspaceWorkflowStatus,
  updateWorkspaceLabel,
  reorderWorkspaceWorkflowStatus,
  reorderWorkspaceIssue,
  setWorkspaceIssueLabels,
  setWorkspaceDefaultWorkflowStatus,
  setWorkspaceIssueParent,
  markWorkspaceNotificationsRead,
  markWorkspaceNotificationsUnread,
  updateWorkspaceIssue,
  IssueConflictError,
  IssueRuleError,
  IssueRelationRuleError,
  LabelRuleError,
  type IssueEventType,
  type IssuePriority,
  type LabelColor,
  WorkflowStatusRuleError,
  type WorkflowStatusCategory,
  type WorkflowStatusColor,
  WORKSPACE_REGION,
} from "@zynox/db";
import {
  adminOnly,
  base,
  createWorkspaceMiddleware,
  type WorkspaceContextResolver,
  requireAdminOnly,
  requireApiKeyPermission,
  workspaceResolved,
  writeScoped,
  workspaceScoped,
} from "./orpc";
import { createCustomerSettingsRouter } from "./customer-settings";
import { createIssueDraftRouter } from "./issue-drafts";
import { createGithubPreferencesRouter } from "./github-preferences";
import { createMemberPreferencesRouter } from "./member-preferences";
import { createNotificationPreferencesRouter } from "./notification-preferences";
import { createProfileRouter } from "./profile";
import { createSidebarPreferencesRouter } from "./sidebar-preferences";

export function createRouter(resolveContext?: WorkspaceContextResolver) {
  const middleware = resolveContext
    ? createWorkspaceMiddleware(resolveContext)
    : { workspaceResolved, workspaceScoped, writeScoped, adminOnly };

  return base.router({
    ...createCustomerSettingsRouter(middleware),
    ...createSidebarPreferencesRouter(middleware),
    ...createMemberPreferencesRouter(middleware),
    ...createNotificationPreferencesRouter(middleware),
    ...createGithubPreferencesRouter(middleware),
    ...createProfileRouter(middleware),
    ...createIssueDraftRouter(middleware),
    health: middleware.workspaceScoped.health.handler(async ({ context }) => {
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
          apiKeyPolicy: context.workspace.apiKeyPolicy,
        },
        member: {
          id: context.member.id,
          name: context.member.name,
          email: context.member.email,
          role: context.member.role,
          title: context.member.title,
          username: context.member.username,
          avatarUrl: context.member.avatarUrl,
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
          apiKeyPolicy: updatedWorkspace.apiKeyPolicy,
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
          title: currentMember.title,
          username: currentMember.username,
          avatarUrl: currentMember.avatarUrl,
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
          title: updatedMember.title,
          username: updatedMember.username,
          avatarUrl: updatedMember.avatarUrl,
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
          timezone: currentTeam.timezone,
          estimation: currentTeam.estimation,
          detailedIssueHistory: currentTeam.detailedIssueHistory,
          issueEmailEnabled: currentTeam.issueEmailEnabled,
          issueEmailAddress: currentTeam.issueEmailAddress,
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
          timezone: createdTeam.timezone,
          estimation: createdTeam.estimation,
          detailedIssueHistory: createdTeam.detailedIssueHistory,
          issueEmailEnabled: createdTeam.issueEmailEnabled,
          issueEmailAddress: createdTeam.issueEmailAddress,
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
          timezone: currentTeam.timezone,
          estimation: currentTeam.estimation,
          detailedIssueHistory: currentTeam.detailedIssueHistory,
          issueEmailEnabled: currentTeam.issueEmailEnabled,
          issueEmailAddress: currentTeam.issueEmailAddress,
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
            timezone: input.timezone,
            estimation: input.estimation,
            detailedIssueHistory: input.detailedIssueHistory,
            issueEmailEnabled: input.issueEmailEnabled,
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
          timezone: updatedTeam.timezone,
          estimation: updatedTeam.estimation,
          detailedIssueHistory: updatedTeam.detailedIssueHistory,
          issueEmailEnabled: updatedTeam.issueEmailEnabled,
          issueEmailAddress: updatedTeam.issueEmailAddress,
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
          title: currentMember.title,
          username: currentMember.username,
          avatarUrl: currentMember.avatarUrl,
          createdAt: currentMember.createdAt.toISOString(),
        }));
      }),
      resetIssueEmail: middleware.adminOnly.team.resetIssueEmail.handler(
        async ({ context, input }) => {
          const updatedTeam = await resetWorkspaceTeamIssueEmail(
            context.db,
            context.workspace.id,
            input.id,
          );
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
            timezone: updatedTeam.timezone,
            estimation: updatedTeam.estimation,
            detailedIssueHistory: updatedTeam.detailedIssueHistory,
            issueEmailEnabled: updatedTeam.issueEmailEnabled,
            issueEmailAddress: updatedTeam.issueEmailAddress,
            createdAt: updatedTeam.createdAt.toISOString(),
            updatedAt: updatedTeam.updatedAt.toISOString(),
          };
        },
      ),
      delete: middleware.adminOnly.team.delete.handler(async ({ context, input }) => {
        let deletedTeam;
        try {
          deletedTeam = await deleteWorkspaceTeam(context.db, context.workspace.id, input.id);
        } catch (error) {
          if (isForeignKeyViolation(error)) {
            throw new ORPCError("CONFLICT", {
              message: "A Team linked to a Project cannot be deleted.",
            });
          }
          throw error;
        }

        if (!deletedTeam) {
          throw new ORPCError("NOT_FOUND");
        }

        if (deletedTeam.kind === "hasProjects") {
          throw new ORPCError("CONFLICT", {
            message: "A Team linked to a Project cannot be deleted.",
          });
        }
      }),
    },
    project: {
      list: middleware.workspaceScoped.project.list.handler(async ({ context, input }) => {
        const projects = await listWorkspaceProjects(
          context.db,
          context.workspace.id,
          input.teamSlug,
        );
        if (!projects) {
          throw new ORPCError("NOT_FOUND");
        }

        return projects.map(serializeProject);
      }),
      detail: middleware.workspaceScoped.project.detail.handler(async ({ context, input }) => {
        const currentProject = await getWorkspaceProject(
          context.db,
          context.workspace.id,
          input.id,
        );
        if (!currentProject) {
          throw new ORPCError("NOT_FOUND");
        }

        return serializeProject(currentProject);
      }),
      create: middleware.workspaceScoped.project.create.handler(async ({ context, input }) => {
        const { teamIds, ...values } = input;
        const result = await createWorkspaceProject(
          context.db,
          context.workspace.id,
          values,
          teamIds,
        );
        if (result.kind === "invalidReferences") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Choose Teams and a lead Member from the current Workspace.",
          });
        }
        if (result.kind === "failed") {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The Project could not be created.",
          });
        }

        const createdProject = await getWorkspaceProject(
          context.db,
          context.workspace.id,
          result.id,
        );
        if (!createdProject) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The created Project could not be read.",
          });
        }

        return serializeProject(createdProject);
      }),
      update: middleware.workspaceScoped.project.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        const result = await updateWorkspaceProject(context.db, context.workspace.id, id, values);
        if (result.kind === "notFound") {
          throw new ORPCError("NOT_FOUND");
        }
        if (result.kind === "invalidReferences") {
          throw new ORPCError("BAD_REQUEST", {
            message: "Choose Teams and a lead Member from the current Workspace.",
          });
        }

        const updatedProject = await getWorkspaceProject(
          context.db,
          context.workspace.id,
          result.id,
        );
        if (!updatedProject) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The updated Project could not be read.",
          });
        }

        return serializeProject(updatedProject);
      }),
      delete: middleware.workspaceScoped.project.delete.handler(async ({ context, input }) => {
        const deletedProject = await deleteWorkspaceProject(
          context.db,
          context.workspace.id,
          input.id,
        );
        if (!deletedProject) {
          throw new ORPCError("NOT_FOUND");
        }
      }),
    },
    apiKey: {
      create: middleware.writeScoped.apiKey.create.handler(async ({ context, input }) => {
        if (context.workspace.apiKeyPolicy === "admins" && context.member.role !== "admin") {
          throw new ORPCError("FORBIDDEN");
        }
        if (
          context.member.role !== "admin" &&
          (input.permissions === "full" || input.permissions.includes("admin"))
        ) {
          throw new ORPCError("FORBIDDEN");
        }

        const token = `vyz_${randomBytes(32).toString("base64url")}`;
        const createdKey = await createWorkspaceApiKey(
          context.db,
          context.workspace.id,
          context.member.id,
          {
            name: input.name,
            tokenPrefix: token.slice(0, 8),
            tokenHash: createHash("sha256").update(token).digest("hex"),
            permissions: input.permissions,
          },
        );

        if (!createdKey) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The API key could not be created.",
          });
        }

        return {
          key: {
            id: createdKey.id,
            memberId: context.member.id,
            memberName: context.member.name,
            memberEmail: context.member.email,
            name: createdKey.name,
            tokenPrefix: createdKey.tokenPrefix,
            permissions: createdKey.permissions,
            createdAt: createdKey.createdAt.toISOString(),
            lastUsedAt: createdKey.lastUsedAt?.toISOString() ?? null,
            revokedAt: createdKey.revokedAt?.toISOString() ?? null,
          },
          token,
        };
      }),
      update: middleware.workspaceResolved.apiKey.update.handler(async ({ context, input }) => {
        const key = await findWorkspaceApiKey(context.db, context.workspace.id, input.id);
        if (!key || key.revokedAt) throw new ORPCError("NOT_FOUND");

        if (key.memberId === context.member.id) {
          requireApiKeyPermission(context, "write");
        } else {
          requireAdminOnly(context);
        }

        if (
          context.member.role !== "admin" &&
          (input.permissions === "full" || input.permissions.includes("admin"))
        ) {
          throw new ORPCError("FORBIDDEN");
        }

        const updatedKey = await updateWorkspaceApiKey(context.db, context.workspace.id, input.id, {
          name: input.name,
          permissions: input.permissions,
        });
        if (!updatedKey) throw new ORPCError("NOT_FOUND");

        return {
          id: updatedKey.id,
          memberId: updatedKey.memberId,
          memberName: updatedKey.memberName,
          memberEmail: updatedKey.memberEmail,
          name: updatedKey.name,
          tokenPrefix: updatedKey.tokenPrefix,
          permissions: updatedKey.permissions,
          createdAt: updatedKey.createdAt.toISOString(),
          lastUsedAt: updatedKey.lastUsedAt?.toISOString() ?? null,
          revokedAt: updatedKey.revokedAt?.toISOString() ?? null,
        };
      }),
      list: middleware.workspaceResolved.apiKey.list.handler(async ({ context, input }) => {
        if (input.scope === "workspace") {
          requireAdminOnly(context);
        } else {
          requireApiKeyPermission(context, "read");
        }

        const keys = await listWorkspaceApiKeys(
          context.db,
          context.workspace.id,
          input.scope === "mine" ? context.member.id : undefined,
        );

        return keys.map((key) => ({
          id: key.id,
          memberId: key.memberId,
          memberName: key.memberName,
          memberEmail: key.memberEmail,
          name: key.name,
          tokenPrefix: key.tokenPrefix,
          permissions: key.permissions,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
          revokedAt: key.revokedAt?.toISOString() ?? null,
        }));
      }),
      revoke: middleware.workspaceResolved.apiKey.revoke.handler(async ({ context, input }) => {
        const key = await findWorkspaceApiKey(context.db, context.workspace.id, input.id);
        if (!key) throw new ORPCError("NOT_FOUND");

        if (key.memberId === context.member.id) {
          requireApiKeyPermission(context, "write");
        } else {
          requireAdminOnly(context);
        }

        await revokeWorkspaceApiKey(context.db, context.workspace.id, input.id);
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
    label: {
      list: middleware.workspaceScoped.label.list.handler(async ({ context, input }) => {
        const labels = await listWorkspaceLabels(context.db, context.workspace.id, input.team);
        if (!labels) throw new ORPCError("NOT_FOUND");

        return labels.map(serializeLabelListItem);
      }),
      create: middleware.adminOnly.label.create.handler(async ({ context, input }) => {
        const createdLabel = await withLabelErrors(() =>
          createWorkspaceLabel(context.db, context.workspace.id, input),
        );
        if (!createdLabel) throw new ORPCError("NOT_FOUND");

        return serializeLabel(createdLabel);
      }),
      update: middleware.adminOnly.label.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        const updatedLabel = await withLabelErrors(() =>
          updateWorkspaceLabel(context.db, context.workspace.id, id, values),
        );
        if (!updatedLabel) throw new ORPCError("NOT_FOUND");

        return serializeLabel(updatedLabel);
      }),
      archive: middleware.adminOnly.label.archive.handler(async ({ context, input }) => {
        const archivedLabel = await archiveWorkspaceLabel(
          context.db,
          context.workspace.id,
          input.id,
        );
        if (!archivedLabel) throw new ORPCError("NOT_FOUND");

        return serializeLabel(archivedLabel);
      }),
      delete: middleware.adminOnly.label.delete.handler(async ({ context, input }) => {
        const result = await deleteWorkspaceLabel(
          context.db,
          context.workspace.id,
          context.member.id,
          input.id,
        );
        if (!result) throw new ORPCError("NOT_FOUND");
        return result;
      }),
      merge: middleware.adminOnly.label.merge.handler(async ({ context, input }) => {
        const mergedLabel = await withLabelErrors(() =>
          mergeWorkspaceLabels(
            context.db,
            context.workspace.id,
            context.member.id,
            input.sourceId,
            input.targetId,
          ),
        );
        if (!mergedLabel) throw new ORPCError("NOT_FOUND");

        return serializeLabel(mergedLabel);
      }),
      convertToGroup: middleware.adminOnly.label.convertToGroup.handler(
        async ({ context, input }) => {
          const converted = await withLabelErrors(() =>
            convertWorkspaceLabelToGroup(
              context.db,
              context.workspace.id,
              context.member.id,
              input.id,
              input.childName,
            ),
          );
          if (!converted) throw new ORPCError("NOT_FOUND");

          return converted.map(serializeLabel);
        },
      ),
      move: middleware.adminOnly.label.move.handler(async ({ context, input }) => {
        const movedLabels = await withLabelErrors(() =>
          moveWorkspaceLabel(context.db, context.workspace.id, input.id, input.team),
        );
        if (!movedLabels) throw new ORPCError("NOT_FOUND");

        return movedLabels.map(serializeLabel);
      }),
    },
    relation: {
      add: middleware.workspaceScoped.relation.add.handler(async ({ context, input }) => {
        const result = await withRelationErrors(() =>
          addWorkspaceIssueRelation(
            context.db,
            context.workspace.id,
            context.member.id,
            input.issueId,
            input.relatedIssueId,
            input.type,
          ),
        );
        if (result === null) throw new ORPCError("NOT_FOUND");
      }),
      remove: middleware.workspaceScoped.relation.remove.handler(async ({ context, input }) => {
        const result = await withRelationErrors(() =>
          removeWorkspaceIssueRelation(
            context.db,
            context.workspace.id,
            context.member.id,
            input.issueId,
            input.relatedIssueId,
            input.type,
          ),
        );
        if (result === null) throw new ORPCError("NOT_FOUND");
      }),
    },
    link: {
      add: middleware.workspaceScoped.link.add.handler(async ({ context, input }) => {
        const createdLink = await withRelationErrors(() =>
          addWorkspaceIssueLink(
            context.db,
            context.workspace.id,
            context.member.id,
            input.issueId,
            {
              url: input.url,
              title: input.title,
            },
          ),
        );
        if (!createdLink) throw new ORPCError("NOT_FOUND");
      }),
      remove: middleware.workspaceScoped.link.remove.handler(async ({ context, input }) => {
        const deletedLink = await removeWorkspaceIssueLink(
          context.db,
          context.workspace.id,
          input.id,
        );
        if (!deletedLink) throw new ORPCError("NOT_FOUND");
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

        const codeReviewSettings = await getOrCreateWorkspaceCodeReviewSettings(
          context.db,
          context.workspace.id,
        );
        const pullRequests =
          codeReviewSettings?.enabled === true
            ? await listWorkspaceIssuePullRequests(context.db, context.workspace.id, issue.id)
            : [];

        return {
          ...serializeIssue(issue),
          relations: issue.relations,
          links: issue.links.map((link) => ({
            ...link,
            createdAt: link.createdAt.toISOString(),
          })),
          pullRequests,
        };
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
      setLabels: middleware.workspaceScoped.issue.setLabels.handler(async ({ context, input }) => {
        const labels = await withLabelErrors(() =>
          setWorkspaceIssueLabels(
            context.db,
            context.workspace.id,
            context.member.id,
            input.id,
            input.labelIds,
          ),
        );
        if (!labels) throw new ORPCError("NOT_FOUND");

        return labels.map(serializeIssueLabel);
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
    notification: {
      list: middleware.workspaceScoped.notification.list.handler(async ({ context, input }) => {
        const priorityAssignmentsEnabled = await getAssignmentPriorityPreference(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        const page = await listWorkspaceNotifications(
          context.db,
          context.workspace.id,
          context.member.id,
          {
            unreadOnly: input.unreadOnly,
            priorityOnly: input.priorityOnly,
            otherOnly: input.otherOnly,
            priorityAssignmentsEnabled,
            order: input.order,
            cursor: input.cursor
              ? { id: input.cursor.id, createdAt: new Date(input.cursor.createdAt) }
              : undefined,
            limit: input.limit,
          },
        );

        return {
          items: page.items.map((notification) => ({
            id: notification.id,
            type: notification.type,
            isPriority: notification.isPriority,
            actor: notification.actor,
            issue: notification.issue,
            projectId: notification.projectId,
            payload: notification.payload,
            readAt: notification.readAt?.toISOString() ?? null,
            snoozedUntil: notification.snoozedUntil?.toISOString() ?? null,
            createdAt: notification.createdAt.toISOString(),
            updatedAt: notification.updatedAt.toISOString(),
          })),
          nextCursor: page.nextCursor
            ? { id: page.nextCursor.id, createdAt: page.nextCursor.createdAt.toISOString() }
            : null,
        };
      }),
      unreadCount: middleware.workspaceScoped.notification.unreadCount.handler(
        async ({ context }) =>
          countUnreadWorkspaceNotifications(context.db, context.workspace.id, context.member.id),
      ),
      markRead: middleware.workspaceScoped.notification.markRead.handler(
        async ({ context, input }) => {
          await markWorkspaceNotificationsRead(
            context.db,
            context.workspace.id,
            context.member.id,
            input.ids,
          );
        },
      ),
      markUnread: middleware.workspaceScoped.notification.markUnread.handler(
        async ({ context, input }) => {
          await markWorkspaceNotificationsUnread(
            context.db,
            context.workspace.id,
            context.member.id,
            input.ids,
          );
        },
      ),
      archive: middleware.workspaceScoped.notification.archive.handler(
        async ({ context, input }) => {
          await archiveWorkspaceNotifications(
            context.db,
            context.workspace.id,
            context.member.id,
            input.ids,
          );
        },
      ),
      archiveAll: middleware.workspaceScoped.notification.archiveAll.handler(
        async ({ context, input }) => {
          await archiveAllWorkspaceNotifications(
            context.db,
            context.workspace.id,
            context.member.id,
            input.onlyRead,
          );
        },
      ),
    },
  });
}

export const router = createRouter();

type WorkspaceProject = NonNullable<Awaited<ReturnType<typeof getWorkspaceProject>>>;

function serializeProject(currentProject: WorkspaceProject) {
  return {
    id: currentProject.id,
    name: currentProject.name,
    icon: currentProject.icon,
    status: currentProject.status,
    health: currentProject.health,
    healthNote: currentProject.healthNote,
    priority: currentProject.priority,
    lead: currentProject.lead,
    targetDate: currentProject.targetDate,
    teams: currentProject.teams,
    issues: currentProject.issues,
    progress: currentProject.progress,
    createdAt: currentProject.createdAt.toISOString(),
    updatedAt: currentProject.updatedAt.toISOString(),
  };
}

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

async function withLabelErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof LabelRuleError) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
    }
    if (isUniqueConstraintViolation(error)) {
      throw new ORPCError("CONFLICT", {
        message: "A Label with this name already exists in the selected scope.",
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

function serializeLabel<
  T extends {
    id: string;
    workspaceId: string;
    teamId: string | null;
    parentId: string | null;
    isGroup: boolean;
    name: string;
    description: string | null;
    color: LabelColor;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  },
>(label: T) {
  return {
    ...label,
    archivedAt: label.archivedAt?.toISOString() ?? null,
    createdAt: label.createdAt.toISOString(),
    updatedAt: label.updatedAt.toISOString(),
  };
}

function serializeLabelListItem<
  T extends {
    id: string;
    workspaceId: string;
    teamId: string | null;
    parentId: string | null;
    isGroup: boolean;
    name: string;
    description: string | null;
    color: LabelColor;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    issueCount: number;
    lastAppliedAt: Date | null;
  },
>(label: T) {
  return {
    ...serializeLabel(label),
    issueCount: label.issueCount,
    lastAppliedAt: label.lastAppliedAt?.toISOString() ?? null,
  };
}

function serializeIssueLabel<
  T extends {
    id: string;
    teamId: string | null;
    parentId: string | null;
    isGroup: boolean;
    name: string;
    description: string | null;
    color: LabelColor;
    archivedAt: Date | null;
  },
>(label: T) {
  return { ...label, archivedAt: label.archivedAt?.toISOString() ?? null };
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
    assignee: { id: string; name: string; avatarUrl: string | null } | null;
    creatorId: string | null;
    creator: { id: string; name: string; avatarUrl: string | null } | null;
    parentId: string | null;
    labels: Array<{
      id: string;
      teamId: string | null;
      parentId: string | null;
      isGroup: boolean;
      name: string;
      description: string | null;
      color: LabelColor;
      archivedAt: Date | null;
    }>;
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
    labels: issue.labels.map(serializeIssueLabel),
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
    actorId: string | null;
    actor: { id: string; name: string; avatarUrl: string | null } | null;
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

async function withRelationErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof IssueRelationRuleError) {
      throw new ORPCError("BAD_REQUEST", { message: error.message });
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

function isForeignKeyViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23503") return true;
  return "cause" in error && isForeignKeyViolation(error.cause);
}
