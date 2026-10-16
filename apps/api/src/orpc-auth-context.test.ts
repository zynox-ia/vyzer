import { describe, expect, it } from "vitest";
import { selectSessionMembership } from "./orpc";

describe("session Workspace scope", () => {
  const memberships = [
    { id: "member-a", workspaceId: "workspace-a" },
    { id: "member-b", workspaceId: "workspace-b" },
  ];

  it("uses only the Workspace explicitly selected in the session", () => {
    expect(selectSessionMembership(memberships, "workspace-b")).toEqual(memberships[1]);
  });

  it("does not fall back when a session names a Workspace without membership", () => {
    expect(selectSessionMembership(memberships, "workspace-foreign")).toBeUndefined();
  });

  it("allows an implicit Workspace only for a user with exactly one membership", () => {
    const [onlyMembership] = memberships;
    expect(selectSessionMembership([onlyMembership!], null)).toEqual(onlyMembership);
    expect(selectSessionMembership(memberships, null)).toBeUndefined();
    expect(selectSessionMembership([], null)).toBeUndefined();
  });
});
