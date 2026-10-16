# Zynox

Internal project management tool for the owner's companies, replicating Linear's domain model and behavior as Linear works today. When a term or behavior is undefined here, Linear's is the answer; deliberate deviations are recorded in `docs/adr/`.

## Language

### Organization

**Workspace**:
The top-level container for one company, isolated from other Workspaces. A person can belong to more than one Workspace and switches between them.
_Avoid_: Organization, company, account, tenant

**Member**:
A person with access to a Workspace, holding one Role.
_Avoid_: User (when meaning a Workspace participant), account

**Role**:
A Member's permission level in a Workspace: Admin, Member or Guest.
_Avoid_: Permission, access level

**Guest**:
A Member who can only see the Teams they were invited to.
_Avoid_: External user, client user

**Team**:
A group of people within a Workspace that owns Issues, a Workflow and, optionally, Cycles. In Zynox usage there is typically one Team per client, but that is a convention, not part of the model.
_Avoid_: Squad, group, department, client

**Team key**:
The short uppercase prefix that identifies a Team's Issues (e.g. `ACME` in `ACME-12`).
_Avoid_: Team code, prefix

**Customer**:
An external organization whose requests are linked to Issues. Distinct from a Team, even when a Team is dedicated to that client.
_Avoid_: Client (as an entity), account

### Work

**Issue**:
A single unit of work belonging to exactly one Team, identified by the Team key and a number.
_Avoid_: Task, ticket, card, story

**Sub-issue**:
An Issue whose parent is another Issue.
_Avoid_: Subtask, child task

**Workflow**:
A Team's ordered set of Statuses that its Issues move through.
_Avoid_: Pipeline, board columns

**Status**:
A step in a Workflow, belonging to one fixed category (Triage, Backlog, Unstarted, Started, Completed, Canceled).
_Avoid_: State, stage, column

**Label**:
A tag applied to Issues, defined for the whole Workspace or for a single Team.
_Avoid_: Tag, category

**Comment**:
A message posted on an Issue.
_Avoid_: Note, reply (for top-level messages)

**Triage**:
A Team's intake queue where incoming Issues wait to be accepted, declined or merged.
_Avoid_: Inbox (reserved for Notifications), intake

### Planning

**Project**:
A time-bound deliverable that groups Issues toward a goal and can span several Teams.
_Avoid_: Epic, initiative (a different concept)

**Milestone**:
A named stage inside a Project that a subset of its Issues belongs to.
_Avoid_: Phase, checkpoint

**Initiative**:
A group of Projects working toward a shared strategic goal.
_Avoid_: Program, roadmap, epic

**Cycle**:
A fixed-length, recurring period of work for a Team, enabled per Team; unfinished Issues roll over to the next Cycle.
_Avoid_: Sprint, iteration

### Views and attention

**View**:
A saved set of filters and display options over Issues or Projects.
_Avoid_: Filter (when meaning the saved thing), board, report

**Notification**:
A message telling a Member that something they follow changed.
_Avoid_: Alert, update

**Inbox**:
A Member's personal list of Notifications.
_Avoid_: Feed, activity
