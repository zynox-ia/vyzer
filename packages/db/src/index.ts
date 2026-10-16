/** Acesso ao banco (Drizzle + postgres.js). Ver ADR-0005. */
import { and, asc, desc, eq, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { createTeamIssueEmailAddress } from "./team-issue-email";
import { seedTeamWorkflowStatuses } from "./workflow-status";

export * as schema from "./schema";

/** Segundos para desistir de abrir uma conexão (o padrão do postgres.js é 30). */
const CONNECT_TIMEOUT_SECONDS = 5;

export function createDb(url: string) {
  return drizzle({ client: postgres(url, { connect_timeout: CONNECT_TIMEOUT_SECONDS }), schema });
}

export type Db = ReturnType<typeof createDb>;

export type WorkspaceMemberContext = {
  workspace: typeof schema.workspace.$inferSelect;
  member: typeof schema.member.$inferSelect;
};

export type ApiKeyCreateValues = Pick<
  typeof schema.apiKey.$inferInsert,
  "name" | "tokenPrefix" | "tokenHash" | "permissions"
>;
export type ApiKeyUpdateValues = Pick<typeof schema.apiKey.$inferInsert, "name" | "permissions">;

/** Resolve a fixed workspace/member pair and ensure that the member belongs to that workspace. */
export async function resolveWorkspaceMember(
  db: Db,
  workspaceId: string,
  memberId: string,
): Promise<WorkspaceMemberContext | null> {
  const [resolvedWorkspace] = await db
    .select()
    .from(schema.workspace)
    .where(eq(schema.workspace.id, workspaceId))
    .limit(1);
  const [resolvedMember] = await db
    .select()
    .from(schema.member)
    .where(eq(schema.member.id, memberId))
    .limit(1);

  if (
    !resolvedWorkspace ||
    !resolvedMember ||
    resolvedMember.workspaceId !== resolvedWorkspace.id
  ) {
    return null;
  }

  return { workspace: resolvedWorkspace, member: resolvedMember };
}

/** Lists only the Workspace memberships belonging to one authenticated identity. */
export async function listAuthUserWorkspaceMemberships(db: Db, authUserId: string) {
  return db
    .select({ id: schema.member.id, workspaceId: schema.member.workspaceId })
    .from(schema.member)
    .where(eq(schema.member.authUserId, authUserId));
}

/** Update the editable fields of one Workspace and return the persisted row. */
export async function updateWorkspaceSettings(
  db: Db,
  workspaceId: string,
  values: Partial<
    Pick<
      typeof schema.workspace.$inferInsert,
      "name" | "slug" | "fiscalYearStartMonth" | "logoUrl" | "icon" | "apiKeyPolicy"
    >
  >,
) {
  const [updatedWorkspace] = await db
    .update(schema.workspace)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(schema.workspace.id, workspaceId))
    .returning();

  return updatedWorkspace ?? null;
}

/** Persists only the secret hash and metadata for a personal API key. */
export async function createWorkspaceApiKey(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: ApiKeyCreateValues,
) {
  const [createdKey] = await db
    .insert(schema.apiKey)
    .values({ ...values, workspaceId, memberId })
    .returning();

  return createdKey ?? null;
}

/** Finds an active key by its one-way token hash. */
export async function findActiveApiKeyByTokenHash(db: Db, tokenHash: string) {
  const [foundKey] = await db
    .select()
    .from(schema.apiKey)
    .where(and(eq(schema.apiKey.tokenHash, tokenHash), isNull(schema.apiKey.revokedAt)))
    .limit(1);

  return foundKey ?? null;
}

/** Touches last_used_at no more than once per key per minute, including concurrent requests. */
export async function touchWorkspaceApiKey(db: Db, keyId: string): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  await db
    .update(schema.apiKey)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(schema.apiKey.id, keyId),
        or(isNull(schema.apiKey.lastUsedAt), lt(schema.apiKey.lastUsedAt, oneMinuteAgo)),
      ),
    );
}

/** Lists keys and their creator only within the resolved Workspace and optional Member scope. */
export async function listWorkspaceApiKeys(db: Db, workspaceId: string, memberId?: string) {
  const conditions = [eq(schema.apiKey.workspaceId, workspaceId)];
  if (memberId) conditions.push(eq(schema.apiKey.memberId, memberId));

  return db
    .select({
      id: schema.apiKey.id,
      workspaceId: schema.apiKey.workspaceId,
      memberId: schema.apiKey.memberId,
      memberName: schema.member.name,
      memberEmail: schema.member.email,
      name: schema.apiKey.name,
      tokenPrefix: schema.apiKey.tokenPrefix,
      permissions: schema.apiKey.permissions,
      createdAt: schema.apiKey.createdAt,
      lastUsedAt: schema.apiKey.lastUsedAt,
      revokedAt: schema.apiKey.revokedAt,
    })
    .from(schema.apiKey)
    .innerJoin(schema.member, eq(schema.member.id, schema.apiKey.memberId))
    .where(and(...conditions, eq(schema.member.workspaceId, workspaceId)))
    .orderBy(desc(schema.apiKey.createdAt), asc(schema.apiKey.id));
}

/** Reads a key only when it belongs to the resolved Workspace. */
export async function findWorkspaceApiKey(db: Db, workspaceId: string, keyId: string) {
  const [foundKey] = await db
    .select()
    .from(schema.apiKey)
    .where(and(eq(schema.apiKey.id, keyId), eq(schema.apiKey.workspaceId, workspaceId)))
    .limit(1);

  return foundKey ?? null;
}

/** Updates editable fields only on an active key within the resolved Workspace. */
export async function updateWorkspaceApiKey(
  db: Db,
  workspaceId: string,
  keyId: string,
  values: ApiKeyUpdateValues,
) {
  const [updatedKey] = await db
    .update(schema.apiKey)
    .set(values)
    .where(
      and(
        eq(schema.apiKey.id, keyId),
        eq(schema.apiKey.workspaceId, workspaceId),
        isNull(schema.apiKey.revokedAt),
      ),
    )
    .returning({
      id: schema.apiKey.id,
      workspaceId: schema.apiKey.workspaceId,
      memberId: schema.apiKey.memberId,
      name: schema.apiKey.name,
      tokenPrefix: schema.apiKey.tokenPrefix,
      permissions: schema.apiKey.permissions,
      createdAt: schema.apiKey.createdAt,
      lastUsedAt: schema.apiKey.lastUsedAt,
      revokedAt: schema.apiKey.revokedAt,
    });

  if (!updatedKey) return null;

  const [owner] = await db
    .select({
      memberName: schema.member.name,
      memberEmail: schema.member.email,
    })
    .from(schema.member)
    .where(
      and(eq(schema.member.id, updatedKey.memberId), eq(schema.member.workspaceId, workspaceId)),
    )
    .limit(1);

  return owner ? { ...updatedKey, ...owner } : null;
}

/** Marks a key revoked only inside the resolved Workspace. */
export async function revokeWorkspaceApiKey(db: Db, workspaceId: string, keyId: string) {
  const [revokedKey] = await db
    .update(schema.apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.apiKey.id, keyId), eq(schema.apiKey.workspaceId, workspaceId)))
    .returning({ id: schema.apiKey.id });

  return revokedKey ?? null;
}

/** Permanently delete a Workspace, clearing Project-Team links before dependent rows cascade. */
export async function deleteWorkspace(db: Db, workspaceId: string): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(schema.projectTeam).where(eq(schema.projectTeam.workspaceId, workspaceId));
    await tx.delete(schema.project).where(eq(schema.project.workspaceId, workspaceId));
    await tx.delete(schema.workspace).where(eq(schema.workspace.id, workspaceId));
  });
}

/** List only the Members of the resolved Workspace in name order, including their Team count. */
export async function listWorkspaceMembers(db: Db, workspaceId: string) {
  return db
    .select({
      id: schema.member.id,
      workspaceId: schema.member.workspaceId,
      name: schema.member.name,
      email: schema.member.email,
      role: schema.member.role,
      title: schema.member.title,
      username: schema.member.username,
      avatarUrl: schema.member.avatarUrl,
      createdAt: schema.member.createdAt,
      teamCount: sql<number>`count(${schema.team.id})::int`,
    })
    .from(schema.member)
    .leftJoin(schema.teamMember, eq(schema.teamMember.memberId, schema.member.id))
    .leftJoin(
      schema.team,
      and(eq(schema.team.id, schema.teamMember.teamId), eq(schema.team.workspaceId, workspaceId)),
    )
    .where(eq(schema.member.workspaceId, workspaceId))
    .groupBy(schema.member.id)
    .orderBy(asc(schema.member.name));
}

/** Rename one Member only if it belongs to the resolved Workspace. */
export async function updateWorkspaceMemberName(
  db: Db,
  workspaceId: string,
  memberId: string,
  name: string,
) {
  const [updatedMember] = await db
    .update(schema.member)
    .set({ name })
    .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
    .returning();

  return updatedMember ?? null;
}

/** Read the current Member's profile and whether removing it would leave a usable Workspace. */
export async function getWorkspaceMemberProfile(db: Db, workspaceId: string, memberId: string) {
  const [currentMember] = await db
    .select()
    .from(schema.member)
    .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
    .limit(1);
  if (!currentMember) return null;

  const [counts] = await db
    .select({
      memberCount: sql<number>`count(*)::int`,
      adminCount: sql<number>`count(*) filter (where ${schema.member.role} = 'admin')::int`,
    })
    .from(schema.member)
    .where(eq(schema.member.workspaceId, workspaceId));

  return {
    ...currentMember,
    canLeaveWorkspace:
      (counts?.memberCount ?? 0) > 1 &&
      (currentMember.role !== "admin" || (counts?.adminCount ?? 0) > 1),
  };
}

/** Update the current Member's own editable profile fields within the resolved Workspace. */
export async function updateWorkspaceMemberProfile(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: Partial<Pick<typeof schema.member.$inferInsert, "name" | "title" | "username">>,
) {
  if (Object.keys(values).length === 0) {
    const [currentMember] = await db
      .select()
      .from(schema.member)
      .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
      .limit(1);
    return currentMember ?? null;
  }

  const [updatedMember] = await db
    .update(schema.member)
    .set(values)
    .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
    .returning();

  return updatedMember ?? null;
}

/** Find the Workspace-owned Member avatar whose same-origin URL matches the requested file. */
export async function findWorkspaceMemberByAvatarUrl(
  db: Db,
  workspaceId: string,
  avatarUrl: string,
) {
  const [currentMember] = await db
    .select({ id: schema.member.id })
    .from(schema.member)
    .where(and(eq(schema.member.workspaceId, workspaceId), eq(schema.member.avatarUrl, avatarUrl)))
    .limit(1);

  return currentMember ?? null;
}

/** Persist the new same-origin avatar URL on one Member within the resolved Workspace. */
export async function updateWorkspaceMemberAvatar(
  db: Db,
  workspaceId: string,
  memberId: string,
  avatarUrl: string,
) {
  const [updatedMember] = await db
    .update(schema.member)
    .set({ avatarUrl })
    .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
    .returning();

  return updatedMember ?? null;
}

/** Remove the current Member while preserving issues, events, and links with null authors. */
export async function leaveWorkspaceAsMember(db: Db, workspaceId: string, memberId: string) {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: schema.workspace.id })
      .from(schema.workspace)
      .where(eq(schema.workspace.id, workspaceId))
      .for("update");

    const [currentMember] = await tx
      .select({ id: schema.member.id, role: schema.member.role })
      .from(schema.member)
      .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
      .limit(1);
    if (!currentMember) return "notFound" as const;

    const [counts] = await tx
      .select({
        memberCount: sql<number>`count(*)::int`,
        adminCount: sql<number>`count(*) filter (where ${schema.member.role} = 'admin')::int`,
      })
      .from(schema.member)
      .where(eq(schema.member.workspaceId, workspaceId));

    if ((counts?.memberCount ?? 0) <= 1) return "lastMember" as const;
    if (currentMember.role === "admin" && (counts?.adminCount ?? 0) <= 1) {
      return "lastAdmin" as const;
    }

    await tx
      .delete(schema.member)
      .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)));
    return "left" as const;
  });
}

/** Create a URL-safe slug from a Team name. Slug collisions are reported by the database index. */
export function createTeamSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** List only Teams in the resolved Workspace with stable creation-order sorting and counts. */
export async function listWorkspaceTeams(db: Db, workspaceId: string) {
  return db
    .select({
      id: schema.team.id,
      name: schema.team.name,
      slug: schema.team.slug,
      key: schema.team.key,
      icon: schema.team.icon,
      description: schema.team.description,
      timezone: schema.team.timezone,
      estimation: schema.team.estimation,
      detailedIssueHistory: schema.team.detailedIssueHistory,
      issueEmailEnabled: schema.team.issueEmailEnabled,
      issueEmailAddress: schema.team.issueEmailAddress,
      createdAt: schema.team.createdAt,
      updatedAt: schema.team.updatedAt,
      memberCount: sql<number>`count(distinct ${schema.member.id})::int`,
      issueCount: sql<number>`count(distinct ${schema.issue.id})::int`,
    })
    .from(schema.team)
    .leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
    .leftJoin(
      schema.member,
      and(
        eq(schema.member.id, schema.teamMember.memberId),
        eq(schema.member.workspaceId, workspaceId),
      ),
    )
    .leftJoin(
      schema.issue,
      and(eq(schema.issue.teamId, schema.team.id), eq(schema.issue.workspaceId, workspaceId)),
    )
    .where(eq(schema.team.workspaceId, workspaceId))
    .groupBy(schema.team.id)
    .orderBy(asc(schema.team.createdAt), asc(schema.team.id));
}

/** Find one Team by slug, limited to the resolved Workspace. */
export async function getWorkspaceTeamBySlug(db: Db, workspaceId: string, slug: string) {
  const [currentTeam] = await db
    .select()
    .from(schema.team)
    .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, slug)))
    .limit(1);

  return currentTeam ?? null;
}

/** Create a Team within a Workspace resolved by the API middleware. */
export async function createWorkspaceTeam(
  db: Db,
  workspaceId: string,
  values: Pick<typeof schema.team.$inferInsert, "name" | "slug" | "key" | "icon">,
) {
  return db.transaction(async (tx) => {
    const [createdTeam] = await tx
      .insert(schema.team)
      .values({
        ...values,
        workspaceId,
        issueEmailAddress: createTeamIssueEmailAddress(values.slug),
      })
      .returning();

    if (!createdTeam) return null;

    await seedTeamWorkflowStatuses(tx, createdTeam.id);
    const [teamWithDefaultStatus] = await tx
      .select()
      .from(schema.team)
      .where(eq(schema.team.id, createdTeam.id))
      .limit(1);

    return teamWithDefaultStatus ?? null;
  });
}

/** Update mutable Team settings only within the resolved Workspace; slug intentionally stays fixed. */
export async function updateWorkspaceTeam(
  db: Db,
  workspaceId: string,
  teamId: string,
  values: Partial<
    Pick<
      typeof schema.team.$inferInsert,
      | "name"
      | "key"
      | "icon"
      | "description"
      | "timezone"
      | "estimation"
      | "detailedIssueHistory"
      | "issueEmailEnabled"
    >
  >,
) {
  const [updatedTeam] = await db
    .update(schema.team)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(schema.team.id, teamId), eq(schema.team.workspaceId, workspaceId)))
    .returning();

  return updatedTeam ?? null;
}

/** Regenerate a Team's issue email address only within the resolved Workspace. */
export async function resetWorkspaceTeamIssueEmail(db: Db, workspaceId: string, teamId: string) {
  const [currentTeam] = await db
    .select({ slug: schema.team.slug })
    .from(schema.team)
    .where(and(eq(schema.team.id, teamId), eq(schema.team.workspaceId, workspaceId)))
    .limit(1);

  if (!currentTeam) return null;

  const [updatedTeam] = await db
    .update(schema.team)
    .set({
      issueEmailAddress: createTeamIssueEmailAddress(currentTeam.slug),
      updatedAt: new Date(),
    })
    .where(and(eq(schema.team.id, teamId), eq(schema.team.workspaceId, workspaceId)))
    .returning();

  return updatedTeam ?? null;
}

/** List Members for a Team in the resolved Workspace, or null when the Team is not in it. */
export async function listWorkspaceTeamMembers(db: Db, workspaceId: string, teamId: string) {
  const [currentTeam] = await db
    .select({ id: schema.team.id })
    .from(schema.team)
    .where(and(eq(schema.team.id, teamId), eq(schema.team.workspaceId, workspaceId)))
    .limit(1);

  if (!currentTeam) return null;

  return db
    .select({
      id: schema.member.id,
      name: schema.member.name,
      email: schema.member.email,
      role: schema.member.role,
      title: schema.member.title,
      username: schema.member.username,
      avatarUrl: schema.member.avatarUrl,
      createdAt: schema.member.createdAt,
    })
    .from(schema.teamMember)
    .innerJoin(
      schema.member,
      and(
        eq(schema.member.id, schema.teamMember.memberId),
        eq(schema.member.workspaceId, workspaceId),
      ),
    )
    .where(eq(schema.teamMember.teamId, teamId))
    .orderBy(asc(schema.member.name));
}

type ProjectWrite = Pick<
  typeof schema.project.$inferInsert,
  "name" | "icon" | "status" | "health"
> &
  Partial<
    Pick<
      typeof schema.project.$inferInsert,
      "healthNote" | "priority" | "leadMemberId" | "targetDate"
    >
  >;

type ProjectSummaryTeam = Pick<
  typeof schema.team.$inferSelect,
  "id" | "name" | "slug" | "key" | "icon"
>;

async function hydrateWorkspaceProjects(
  db: Db,
  workspaceId: string,
  rows: Array<{ project: typeof schema.project.$inferSelect; leadName: string | null }>,
) {
  if (rows.length === 0) return [];

  const projectIds = rows.map(({ project: current }) => current.id);
  const relatedTeams = await db
    .select({
      projectId: schema.projectTeam.projectId,
      team: {
        id: schema.team.id,
        name: schema.team.name,
        slug: schema.team.slug,
        key: schema.team.key,
        icon: schema.team.icon,
      },
    })
    .from(schema.projectTeam)
    .innerJoin(
      schema.team,
      and(eq(schema.team.id, schema.projectTeam.teamId), eq(schema.team.workspaceId, workspaceId)),
    )
    .where(
      and(
        eq(schema.projectTeam.workspaceId, workspaceId),
        inArray(schema.projectTeam.projectId, projectIds),
      ),
    )
    .orderBy(asc(schema.team.createdAt), asc(schema.team.id));

  const teamsByProject = new Map<string, ProjectSummaryTeam[]>();
  for (const { projectId, team: currentTeam } of relatedTeams) {
    const projectTeams = teamsByProject.get(projectId) ?? [];
    projectTeams.push(currentTeam);
    teamsByProject.set(projectId, projectTeams);
  }

  return rows.map(({ project: currentProject, leadName }) => ({
    ...currentProject,
    lead:
      currentProject.leadMemberId !== null && leadName !== null
        ? { id: currentProject.leadMemberId, name: leadName }
        : null,
    teams: teamsByProject.get(currentProject.id) ?? [],
    issues: 0,
    progress: 0,
  }));
}

/** List Projects from the resolved Workspace, optionally scoped to a Team slug. */
export async function listWorkspaceProjects(db: Db, workspaceId: string, teamSlug?: string) {
  let teamId: string | undefined;
  if (teamSlug !== undefined) {
    const [resolvedTeam] = await db
      .select({ id: schema.team.id })
      .from(schema.team)
      .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
      .limit(1);

    if (!resolvedTeam) return null;
    teamId = resolvedTeam.id;
  }

  let projectIds: string[] | undefined;
  if (teamId) {
    projectIds = (
      await db
        .select({ projectId: schema.projectTeam.projectId })
        .from(schema.projectTeam)
        .where(
          and(
            eq(schema.projectTeam.workspaceId, workspaceId),
            eq(schema.projectTeam.teamId, teamId),
          ),
        )
    ).map(({ projectId }) => projectId);

    if (projectIds.length === 0) return [];
  }

  const rows = await db
    .select({ project: schema.project, leadName: schema.member.name })
    .from(schema.project)
    .leftJoin(
      schema.member,
      and(
        eq(schema.member.id, schema.project.leadMemberId),
        eq(schema.member.workspaceId, workspaceId),
      ),
    )
    .where(
      and(
        eq(schema.project.workspaceId, workspaceId),
        projectIds ? inArray(schema.project.id, projectIds) : undefined,
      ),
    )
    .orderBy(asc(schema.project.createdAt), asc(schema.project.id));

  return hydrateWorkspaceProjects(db, workspaceId, rows);
}

/** Find one Project only within the resolved Workspace. */
export async function getWorkspaceProject(db: Db, workspaceId: string, projectId: string) {
  const [row] = await db
    .select({ project: schema.project, leadName: schema.member.name })
    .from(schema.project)
    .leftJoin(
      schema.member,
      and(
        eq(schema.member.id, schema.project.leadMemberId),
        eq(schema.member.workspaceId, workspaceId),
      ),
    )
    .where(and(eq(schema.project.id, projectId), eq(schema.project.workspaceId, workspaceId)))
    .limit(1);

  if (!row) return null;
  const [currentProject] = await hydrateWorkspaceProjects(db, workspaceId, [row]);
  return currentProject ?? null;
}

/** Create a Project and its Team links atomically inside the resolved Workspace. */
export async function createWorkspaceProject(
  db: Db,
  workspaceId: string,
  values: ProjectWrite,
  teamIds: string[],
) {
  return db.transaction(async (tx) => {
    const uniqueTeamIds = [...new Set(teamIds)];
    if (uniqueTeamIds.length !== teamIds.length || teamIds.length === 0) {
      return { kind: "invalidReferences" as const };
    }

    const workspaceTeams = await tx
      .select({ id: schema.team.id })
      .from(schema.team)
      .where(and(eq(schema.team.workspaceId, workspaceId), inArray(schema.team.id, teamIds)));
    if (workspaceTeams.length !== teamIds.length) {
      return { kind: "invalidReferences" as const };
    }

    if (values.leadMemberId) {
      const [workspaceLead] = await tx
        .select({ id: schema.member.id })
        .from(schema.member)
        .where(
          and(
            eq(schema.member.workspaceId, workspaceId),
            eq(schema.member.id, values.leadMemberId),
          ),
        )
        .limit(1);
      if (!workspaceLead) return { kind: "invalidReferences" as const };
    }

    const [createdProject] = await tx
      .insert(schema.project)
      .values({ ...values, workspaceId })
      .returning({ id: schema.project.id });
    if (!createdProject) return { kind: "failed" as const };

    await tx
      .insert(schema.projectTeam)
      .values(teamIds.map((teamId) => ({ projectId: createdProject.id, teamId, workspaceId })));

    return { kind: "created" as const, id: createdProject.id };
  });
}

/** Update a Project and optionally replace its Team links atomically within the Workspace. */
export async function updateWorkspaceProject(
  db: Db,
  workspaceId: string,
  projectId: string,
  values: Partial<ProjectWrite> & { teamIds?: string[] },
) {
  return db.transaction(async (tx) => {
    const [currentProject] = await tx
      .select()
      .from(schema.project)
      .where(and(eq(schema.project.id, projectId), eq(schema.project.workspaceId, workspaceId)))
      .limit(1);

    if (!currentProject) return { kind: "notFound" as const };

    const { teamIds, ...projectValues } = values;
    if (teamIds !== undefined) {
      const uniqueTeamIds = [...new Set(teamIds)];
      if (uniqueTeamIds.length !== teamIds.length || teamIds.length === 0) {
        return { kind: "invalidReferences" as const };
      }

      const workspaceTeams = await tx
        .select({ id: schema.team.id })
        .from(schema.team)
        .where(and(eq(schema.team.workspaceId, workspaceId), inArray(schema.team.id, teamIds)));
      if (workspaceTeams.length !== teamIds.length) {
        return { kind: "invalidReferences" as const };
      }
    }

    const leadMemberId =
      projectValues.leadMemberId === undefined
        ? currentProject.leadMemberId
        : projectValues.leadMemberId;
    if (leadMemberId) {
      const [workspaceLead] = await tx
        .select({ id: schema.member.id })
        .from(schema.member)
        .where(and(eq(schema.member.workspaceId, workspaceId), eq(schema.member.id, leadMemberId)))
        .limit(1);
      if (!workspaceLead) return { kind: "invalidReferences" as const };
    }

    const [updatedProject] = await tx
      .update(schema.project)
      .set({ ...projectValues, updatedAt: new Date() })
      .where(and(eq(schema.project.id, projectId), eq(schema.project.workspaceId, workspaceId)))
      .returning({ id: schema.project.id });

    if (!updatedProject) return { kind: "notFound" as const };

    if (teamIds !== undefined) {
      await tx
        .delete(schema.projectTeam)
        .where(
          and(
            eq(schema.projectTeam.projectId, projectId),
            eq(schema.projectTeam.workspaceId, workspaceId),
          ),
        );
      await tx
        .insert(schema.projectTeam)
        .values(teamIds.map((teamId) => ({ projectId, teamId, workspaceId })));
    }

    return { kind: "updated" as const, id: updatedProject.id };
  });
}

/** Delete a Project in the resolved Workspace; its Team links cascade. */
export async function deleteWorkspaceProject(db: Db, workspaceId: string, projectId: string) {
  const [deletedProject] = await db
    .delete(schema.project)
    .where(and(eq(schema.project.id, projectId), eq(schema.project.workspaceId, workspaceId)))
    .returning({ id: schema.project.id });

  return deletedProject ?? null;
}

/** Delete one Team only if it belongs to the resolved Workspace and has no linked Projects. */
export async function deleteWorkspaceTeam(db: Db, workspaceId: string, teamId: string) {
  const [associatedProject] = await db
    .select({ id: schema.projectTeam.projectId })
    .from(schema.projectTeam)
    .where(
      and(eq(schema.projectTeam.teamId, teamId), eq(schema.projectTeam.workspaceId, workspaceId)),
    )
    .limit(1);

  if (associatedProject) return { kind: "hasProjects" as const };

  const [deletedTeam] = await db
    .delete(schema.team)
    .where(and(eq(schema.team.id, teamId), eq(schema.team.workspaceId, workspaceId)))
    .returning({ id: schema.team.id });

  return deletedTeam ? { kind: "deleted" as const, id: deletedTeam.id } : null;
}

/** Faz uma consulta trivial; lança erro se o banco não responder. */
export async function checkConnection(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

export { MEMBER_ID, WORKSPACE_ID, WORKSPACE_REGION, ZYNOX_TEAM_ID } from "./seed";
export {
  addCustomerDomainRule,
  createCustomerStatus,
  createCustomerTier,
  deleteCustomerStatus,
  deleteCustomerTier,
  defaultCustomerStatuses,
  getOrCreateCustomerSettings,
  listCustomerDomainRules,
  listCustomerStatuses,
  listCustomerTiers,
  removeCustomerDomainRule,
  reorderCustomerStatuses,
  reorderCustomerTiers,
  updateCustomerSettings,
  updateCustomerStatus,
  updateCustomerTier,
  type CustomerSettingsPatch,
  type CustomerStatusInput,
  type CustomerStatusPatch,
  type CustomerTierInput,
  type CustomerTierPatch,
  type DeleteCustomerStatusResult,
} from "./customer-settings";
export {
  DEFAULT_WORKFLOW_STATUSES,
  WorkflowStatusRuleError,
  ZYNOX_WORKFLOW_STATUSES,
  createWorkspaceTeamWorkflowStatus,
  deleteWorkspaceWorkflowStatus,
  listWorkspaceTeamWorkflowStatuses,
  reorderWorkspaceWorkflowStatus,
  setWorkspaceDefaultWorkflowStatus,
  updateWorkspaceWorkflowStatus,
} from "./workflow-status";
export {
  IssueConflictError,
  IssueRuleError,
  createWorkspaceIssue,
  deleteWorkspaceIssue,
  getWorkspaceIssueByIdentifier,
  listWorkspaceTeamIssueFacets,
  listWorkspaceIssueEvents,
  listWorkspaceTeamIssues,
  reorderWorkspaceIssue,
  setWorkspaceIssueParent,
  updateWorkspaceIssue,
} from "./issues";
export {
  IssueDraftRuleError,
  createWorkspaceIssueDraft,
  discardWorkspaceIssueDraft,
  listWorkspaceIssueDrafts,
  publishWorkspaceIssueDraft,
  updateWorkspaceIssueDraft,
} from "./issue-drafts";
export { getOrCreateSidebarPreferences, updateSidebarPreferences } from "./sidebar-preferences";
export { getOrCreateMemberPreferences, updateMemberPreferences } from "./member-preferences";
export type { MemberPreferencesPatch } from "./member-preferences";
export {
  getDefaultNotificationTypePreference,
  getAssignmentPriorityPreference,
  getOrCreateNotificationPreferences,
  getOrCreateNotificationTypePreferences,
  notificationPreferenceChannels,
  notificationPreferenceTypes,
  updateNotificationPreferences,
  updateNotificationTypePreferences,
} from "./notification-preferences";
export type {
  NotificationPreferencesPatch,
  NotificationTypePreferenceValue,
} from "./notification-preferences";
export {
  deleteWorkspaceGithubConnection,
  findGithubInstallation,
  findWorkspaceGithubConnection,
  findWorkspaceIssueIdForGithubBranch,
  getOrCreateWorkspaceCodeReviewSettings,
  githubIssueIdentifiersFromBranch,
  listWorkspaceIssuePullRequests,
  setWorkspaceGithubInstallationStatus,
  updateWorkspaceCodeReviewSettings,
  upsertWorkspaceGithubConnection,
  upsertWorkspaceGithubInstallation,
  upsertWorkspaceGithubPullRequest,
} from "./github";
export type {
  CodeReviewSettingsPatch,
  GithubInstallationValues,
  GithubPullRequestValues,
} from "./github";
export {
  LabelRuleError,
  archiveWorkspaceLabel,
  convertWorkspaceLabelToGroup,
  createWorkspaceLabel,
  deleteWorkspaceLabel,
  listWorkspaceIssueLabelSummaries,
  listWorkspaceLabels,
  mergeWorkspaceLabels,
  moveWorkspaceLabel,
  setWorkspaceIssueLabels,
  updateWorkspaceLabel,
} from "./labels";
export {
  IssueRelationRuleError,
  addWorkspaceIssueLink,
  addWorkspaceIssueRelation,
  listWorkspaceIssueRelationDetails,
  removeWorkspaceIssueLink,
  removeWorkspaceIssueRelation,
} from "./relations";
export type { IssueRelationGroups, IssueRelationSummary } from "./relations";
export {
  archiveAllWorkspaceNotifications,
  archiveWorkspaceNotifications,
  countUnreadWorkspaceNotifications,
  listWorkspaceNotifications,
  markWorkspaceNotificationsRead,
  markWorkspaceNotificationsUnread,
  notifyIssueEvent,
} from "./notifications";
export {
  auditEvent,
  authAccount,
  authSession,
  authUser,
  authVerification,
  apiKey,
  codeReviewSettings,
  customerDomainRule,
  customerSettings,
  customerStatus,
  customerTier,
  desktopIntent,
  issue,
  issueDraft,
  issueEvent,
  issueLink,
  issueLabel,
  issueRelation,
  githubConnection,
  githubInstallation,
  label,
  member,
  memberSidebarPreference,
  memberPreference,
  notificationPreference,
  notificationTypePreference,
  notification,
  project,
  projectTeam,
  pullRequest,
  team,
  teamMember,
  sidebarItemPreference,
  workflowStatus,
  workspace,
} from "./schema";
export type {
  IssueCreateValues,
  IssueFilters,
  IssueGroupBy,
  IssueListOptions,
  IssueOrderBy,
  IssueUpdateValues,
  IssueView,
} from "./issues";
export type {
  ApiKeyPermission,
  ApiKeyPermissions,
  ApiKeyPolicy,
  SidebarBadgeStyle,
  SidebarItemKey,
  SidebarItemVisibility,
  MemberCodeFontSize,
  MemberCodeLineHeight,
  MemberCodeTheme,
  MemberDefaultHomeView,
  MemberDisplayNameFormat,
  MemberFirstDayOfWeek,
  MemberInterfaceFontSize,
  MemberInterfaceTheme,
  MemberSendCommentsOn,
  NotificationEmailFormat,
  NotificationPreferenceChannel,
  NotificationPreferenceType,
  IssueEventType,
  IssueRelationType,
  GithubChecksStatus,
  GithubInstallationStatus,
  GithubMergeStrategy,
  GithubPullRequestState,
  GithubReviewDecision,
  IssuePriority,
  LabelColor,
  NotificationType,
  WorkflowStatusCategory,
  WorkflowStatusColor,
} from "./schema";
export type { IssueLabelSummary } from "./labels";
export type { NotificationIssueEvent, NotificationListOptions } from "./notifications";
