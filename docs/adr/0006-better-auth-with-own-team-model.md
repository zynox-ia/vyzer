# Better Auth for identity and Workspaces; Teams are our own model

Authentication uses Better Auth with cookie sessions stored in Postgres (its default), not JWTs: the app is first-party on one domain and revoking a session must be immediate. Its `organization` plugin provides the Workspace, its Members, invitations and Roles (Admin, Member, Guest).

Team is **not** the plugin's team feature: it is a domain table of ours, holding the Team key, the Workflow and Team membership. Restricting a Guest to the Teams they were invited to is also enforced by our model. This keeps the Linear-specific rules in code we own, instead of bending a generic plugin to fit them.
