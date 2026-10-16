/**
 * Seção "Pull requests" da issue (spec `github-integration.md`): os PRs do GitHub vinculados pelo
 * nome da branch, com estado (draft/open/merged/closed), checks e revisão. Só apresentação: os
 * dados vêm de quem a usa (formato da tabela `pullRequest` da spec). Sem PR vinculado, não renderiza.
 */
import {
  CircleCheck,
  CircleDashed,
  CircleX,
  GitMerge,
  GitPullRequest,
  GitPullRequestClosed,
  GitPullRequestDraft,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeTone } from "@zynox/design-system/components";
import { Icon } from "@zynox/design-system/icons";

export type PullRequestState = "draft" | "open" | "merged" | "closed";
export type PullRequestChecks = "pending" | "success" | "failure";
export type PullRequestReview = "approved" | "changes_requested" | "review_required";

export type PullRequestItem = {
  id: string;
  title: string;
  number: number;
  repoFullName: string;
  authorLogin: string;
  url: string;
  state: PullRequestState;
  checksStatus: PullRequestChecks | null;
  reviewDecision: PullRequestReview | null;
};

const STATE: Record<PullRequestState, { label: string; icon: LucideIcon; className: string }> = {
  draft: { label: "Draft", icon: GitPullRequestDraft, className: "text-tertiary" },
  open: { label: "Open", icon: GitPullRequest, className: "text-success" },
  merged: { label: "Merged", icon: GitMerge, className: "text-purple" },
  closed: { label: "Closed", icon: GitPullRequestClosed, className: "text-danger" },
};

const CHECKS: Record<PullRequestChecks, { label: string; icon: LucideIcon; tone: BadgeTone }> = {
  pending: { label: "Checks running", icon: CircleDashed, tone: "warning" },
  success: { label: "Checks passed", icon: CircleCheck, tone: "success" },
  failure: { label: "Checks failed", icon: CircleX, tone: "danger" },
};

const REVIEW: Record<PullRequestReview, { label: string; tone: BadgeTone }> = {
  approved: { label: "Approved", tone: "success" },
  changes_requested: { label: "Changes requested", tone: "danger" },
  review_required: { label: "Review required", tone: "neutral" },
};

export function PullRequestsSection({ pullRequests }: { pullRequests: PullRequestItem[] }) {
  if (pullRequests.length === 0) return null;

  return (
    <section aria-label="Pull requests" className="flex flex-col gap-2">
      <h3 className="type-heading-3 text-primary">Pull requests</h3>
      <ul className="flex flex-col rounded-container border border-default bg-panel px-4">
        {pullRequests.map((pr) => {
          const state = STATE[pr.state];
          return (
            <li
              key={pr.id}
              className="flex items-center gap-3 border-b border-default py-3 last:border-b-0"
            >
              <Icon icon={state.icon} size="sm" className={`shrink-0 ${state.className}`} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate rounded-control text-label-md text-primary no-underline focus-ring hovered:underline"
                >
                  {pr.title}
                </a>
                <span className="text-body-sm text-secondary">
                  {pr.repoFullName}#{pr.number} · by @{pr.authorLogin}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge tone="neutral">{state.label}</Badge>
                {pr.reviewDecision && (
                  <Badge tone={REVIEW[pr.reviewDecision].tone}>
                    {REVIEW[pr.reviewDecision].label}
                  </Badge>
                )}
                {pr.checksStatus && (
                  <Badge tone={CHECKS[pr.checksStatus].tone} icon={CHECKS[pr.checksStatus].icon}>
                    {CHECKS[pr.checksStatus].label}
                  </Badge>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
