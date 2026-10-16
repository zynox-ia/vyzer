/**
 * Views do GitHub (spec `github-integration.md`) num Chromium real: Connected accounts (Connect /
 * Connected + Disconnect com confirmação), Code & reviews (só os campos com efeito ou persistidos)
 * e a seção "Pull requests" da issue.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import axe from "axe-core";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import { CodeReviewsView, type CodeReviewsValues } from "./code-reviews";
import { ConnectedAccountsView, type GithubConnection } from "./connected-accounts";
import { PullRequestsSection, type PullRequestItem } from "./pull-requests";

const onConnect = vi.fn();
const onDisconnect = vi.fn();
const onChange = vi.fn();

beforeEach(async () => {
  onConnect.mockReset();
  onDisconnect.mockReset();
  onChange.mockReset();
  await page.viewport(1280, 900);
});

async function noViolations() {
  const result = await axe.run(document.body, { resultTypes: ["violations"] });
  expect(
    result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

function Accounts({ github, busy }: { github: GithubConnection; busy?: boolean }) {
  return (
    <ToastProvider>
      <main>
        <ConnectedAccountsView
          github={github}
          onConnectGithub={onConnect}
          onDisconnectGithub={onDisconnect}
          busy={busy}
        />
      </main>
    </ToastProvider>
  );
}

describe("ConnectedAccountsView", () => {
  it("sem conexão: Connect do GitHub chama o OAuth; as outras contas ficam desabilitadas", async () => {
    await render(<Accounts github={{ status: "disconnected" }} />);
    for (const name of ["Slack", "Google Calendar", "Notion"]) {
      await expect
        .element(page.getByRole("button", { name: `Connect ${name} (not available yet)` }))
        .toBeDisabled();
    }
    await page.getByRole("button", { name: "Connect", exact: true }).click();
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("conectado: mostra o usuário e só desconecta depois de confirmar", async () => {
    await render(<Accounts github={{ status: "connected", login: "zynox-ia", avatarUrl: null }} />);
    await expect.element(page.getByText("Connected as @zynox-ia")).toBeVisible();
    await expect.element(page.getByText("GitHub · @zynox-ia")).toBeVisible();
    await page.getByRole("button", { name: "Disconnect" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Disconnect GitHub?" });
    await expect.element(dialog).toBeVisible();
    expect(onDisconnect).not.toHaveBeenCalled();
    await dialog.getByRole("button", { name: "Disconnect" }).click();
    await vi.waitFor(() => expect(onDisconnect).toHaveBeenCalledTimes(1));
  });

  it("ocupado: o botão do GitHub fica desabilitado", async () => {
    await render(<Accounts github={{ status: "disconnected" }} busy />);
    await expect.element(page.getByRole("button", { name: "Connect", exact: true })).toBeDisabled();
  });

  it("não tem violações axe", async () => {
    await render(<Accounts github={{ status: "connected", login: "zynox-ia", avatarUrl: null }} />);
    await expect.element(page.getByRole("heading", { name: "Connected accounts" })).toBeVisible();
    await noViolations();
  });
});

const VALUES: CodeReviewsValues = {
  enabled: true,
  autoConvertDraftPullRequests: false,
  mergeStrategy: "squash",
};

function Reviews({ canEdit }: { canEdit?: boolean }) {
  return (
    <main>
      <CodeReviewsView values={VALUES} onChange={onChange} canEdit={canEdit} />
    </main>
  );
}

describe("CodeReviewsView", () => {
  it("mostra só os três campos com efeito ou persistidos", async () => {
    await render(<Reviews />);
    await expect.element(page.getByRole("switch", { name: "Enable code reviews" })).toBeChecked();
    await expect
      .element(page.getByRole("switch", { name: "Auto-convert draft pull requests" }))
      .not.toBeChecked();
    await expect
      .element(page.getByRole("combobox", { name: "Merge strategy" }))
      .toHaveTextContent("Squash and merge");
    for (const absent of ["Code theme", "Signed commits", "External tools", "Notifications"]) {
      await expect.element(page.getByText(absent, { exact: true })).not.toBeInTheDocument();
    }
  });

  it("cada controle grava só o seu campo", async () => {
    await render(<Reviews />);
    await page.getByRole("switch", { name: "Enable code reviews" }).click();
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ enabled: false }));
    await page.getByRole("switch", { name: "Auto-convert draft pull requests" }).click();
    await vi.waitFor(() =>
      expect(onChange).toHaveBeenCalledWith({ autoConvertDraftPullRequests: true }),
    );
    await page.getByRole("combobox", { name: "Merge strategy" }).click();
    await page.getByRole("option", { name: "Rebase and merge" }).click();
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith({ mergeStrategy: "rebase" }));
  });

  it("sem permissão de admin os três controles ficam desabilitados", async () => {
    await render(<Reviews canEdit={false} />);
    await expect.element(page.getByRole("switch", { name: "Enable code reviews" })).toBeDisabled();
    await expect
      .element(page.getByRole("switch", { name: "Auto-convert draft pull requests" }))
      .toBeDisabled();
    await expect.element(page.getByRole("combobox", { name: "Merge strategy" })).toBeDisabled();
  });

  it("não tem violações axe", async () => {
    await render(<Reviews />);
    await expect.element(page.getByRole("heading", { name: "Code & reviews" })).toBeVisible();
    await noViolations();
  });
});

const PRS: PullRequestItem[] = [
  {
    id: "1",
    title: "Add login form",
    number: 12,
    repoFullName: "zynox-ia/zynox",
    authorLogin: "andre",
    url: "https://github.com/zynox-ia/zynox/pull/12",
    state: "open",
    checksStatus: "success",
    reviewDecision: "approved",
  },
  {
    id: "2",
    title: "WIP: refactor sidebar",
    number: 13,
    repoFullName: "zynox-ia/zynox",
    authorLogin: "marina",
    url: "https://github.com/zynox-ia/zynox/pull/13",
    state: "draft",
    checksStatus: "pending",
    reviewDecision: null,
  },
  {
    id: "3",
    title: "Fix typo",
    number: 14,
    repoFullName: "zynox-ia/zynox",
    authorLogin: "andre",
    url: "https://github.com/zynox-ia/zynox/pull/14",
    state: "merged",
    checksStatus: "failure",
    reviewDecision: "changes_requested",
  },
  {
    id: "4",
    title: "Old idea",
    number: 15,
    repoFullName: "zynox-ia/zynox",
    authorLogin: "andre",
    url: "https://github.com/zynox-ia/zynox/pull/15",
    state: "closed",
    checksStatus: null,
    reviewDecision: null,
  },
];

describe("PullRequestsSection", () => {
  it("lista título, repositório, autor, estado, revisão e checks", async () => {
    await render(
      <main>
        <PullRequestsSection pullRequests={PRS} />
      </main>,
    );
    const first = page.getByRole("listitem").nth(0);
    await expect.element(first).toHaveTextContent("Add login form");
    await expect.element(first).toHaveTextContent("zynox-ia/zynox#12 · by @andre");
    await expect.element(first).toHaveTextContent("Open");
    await expect.element(first).toHaveTextContent("Approved");
    await expect.element(first).toHaveTextContent("Checks passed");
    await expect.element(page.getByRole("listitem").nth(1)).toHaveTextContent("Draft");
    await expect.element(page.getByRole("listitem").nth(1)).toHaveTextContent("Checks running");
    await expect.element(page.getByRole("listitem").nth(2)).toHaveTextContent("Merged");
    await expect.element(page.getByRole("listitem").nth(2)).toHaveTextContent("Changes requested");
    await expect.element(page.getByRole("listitem").nth(2)).toHaveTextContent("Checks failed");
    await expect.element(page.getByRole("listitem").nth(3)).toHaveTextContent("Closed");
  });

  it("o título abre o PR no GitHub em outra aba, com rel seguro", async () => {
    await render(
      <main>
        <PullRequestsSection pullRequests={PRS} />
      </main>,
    );
    const link = page.getByRole("link", { name: "Add login form" });
    await expect.element(link).toHaveAttribute("href", "https://github.com/zynox-ia/zynox/pull/12");
    await expect.element(link).toHaveAttribute("target", "_blank");
    await expect.element(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("sem PR vinculado não renderiza nada", async () => {
    await render(
      <main>
        <PullRequestsSection pullRequests={[]} />
      </main>,
    );
    await expect
      .element(page.getByRole("region", { name: "Pull requests" }))
      .not.toBeInTheDocument();
  });

  it("não tem violações axe", async () => {
    await render(
      <main>
        <PullRequestsSection pullRequests={PRS} />
      </main>,
    );
    await expect.element(page.getByRole("heading", { name: "Pull requests" })).toBeVisible();
    await noViolations();
  });
});
