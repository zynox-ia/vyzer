/**
 * Members de um Team (`/settings/teams/:team/members`, spec 2.2): tabela só de leitura com Name,
 * Email e Status (o Role), dos Members ligados ao Team. Sem "Add members" agora (spec): adicionar
 * e remover Members de um Team entra com o seu próprio domínio.
 */
import { useQuery } from "@tanstack/react-query";
import { Alert, Avatar, Button, Skeleton } from "@vyzer/design-system/components";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@vyzer/design-system/components";
import { teamMembersQueryOptions } from "@/services/teams";
import { TeamBreadcrumb, useTeam } from "./layout";

function formatRole(role: string) {
  return role.length === 0 ? role : `${role[0]?.toUpperCase()}${role.slice(1)}`;
}

export function TeamMembersPage() {
  const team = useTeam();
  const members = useQuery(teamMembersQueryOptions(team.id));

  return (
    <div className="flex flex-col">
      <TeamBreadcrumb team={team} page="Members" />
      <h1 className="type-heading-1 pb-6 text-primary">Members</h1>
      {members.isPending ? (
        <div aria-busy="true" className="flex flex-col gap-3">
          <span className="sr-only">Loading Members.</span>
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ) : members.isError ? (
        <Alert
          tone="danger"
          role="alert"
          title="Could not load Members"
          action={
            <Button type="button" variant="secondary" onClick={() => void members.refetch()}>
              Retry
            </Button>
          }
        >
          Check your connection and try again.
        </Alert>
      ) : (
        <Table label="Team members">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>No members in this team yet.</TableCell>
              </TableRow>
            ) : (
              members.data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="min-w-56">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={member.name} />
                      <span className="truncate text-label-md text-primary">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{formatRole(member.role)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
