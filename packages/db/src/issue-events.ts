import type { Db } from "./index";
import { notifyIssueEvent } from "./notifications";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "execute" | "insert" | "select" | "update">;
type IssueEventInsert = typeof schema.issueEvent.$inferInsert;

/** Persist Issue events and run their side effects before the transaction commits. */
export async function insertWorkspaceIssueEvents(tx: DbSession, events: IssueEventInsert[]) {
  if (events.length === 0) return [];

  const insertedEvents = await tx.insert(schema.issueEvent).values(events).returning();
  for (const event of insertedEvents) await notifyIssueEvent(tx, event);

  return insertedEvents;
}

export async function insertWorkspaceIssueEvent(tx: DbSession, event: IssueEventInsert) {
  const [insertedEvent] = await insertWorkspaceIssueEvents(tx, [event]);
  return insertedEvent ?? null;
}
