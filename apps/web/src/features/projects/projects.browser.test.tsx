/**
 * Split de rotas de Projects (Fase 8, VYZ-35) e ordenação por URL, num Chromium real: o mesmo
 * padrão de `@/layouts/app-shell/app-shell.browser.test.tsx` — AppShell de verdade dentro de um
 * MemoryRouter, com o ToastProvider que `main.tsx` monta (o CreateIssueDialog do AppShell usa
 * `useToast`).
 *
 * Cobre:
 * - `/projects` (workspace, todos os times) vs. `/teams/:team/projects` (escopado): título e
 *   linhas renderizadas.
 * - `/projects/:projectId`: projeto certo, sem breadcrumb encadeado a time/workspace.
 * - Ordenação por URL (`?order=coluna` / `?order=coluna:desc`) nas colunas ordenáveis, e Lead /
 *   Issues como colunas não ordenáveis.
 * - Navegação da lista para o projeto pelo `href` do link do nome.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { useState } from "react";
import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import type { TeamListItem } from "@vyzer/contract";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShell } from "@/layouts/app-shell";
import { ProjectDetailPage, ProjectsListPage, TeamProjectsListPage } from "./index";
import { PROJECTS } from "./project-data";

function apiTeam(
  slug: string,
  name: string,
  key: string,
  icon: TeamListItem["icon"],
  id: string,
): TeamListItem {
  return {
    id,
    name,
    slug,
    key,
    icon,
    description: null,
    timezone: "America/Sao_Paulo",
    estimation: "none",
    detailedIssueHistory: false,
    issueEmailEnabled: false,
    issueEmailAddress: "x@intake.vyzer.app.br",
    createdAt: "2026-08-15T12:00:00.000Z",
    updatedAt: "2026-08-15T12:00:00.000Z",
    memberCount: 1,
    issueCount: 0,
  };
}

const API_TEAMS: TeamListItem[] = [
  apiTeam(
    "zynox",
    "Zynox",
    "ZYN",
    { kind: "icon", name: "Navigation", color: "cyan" },
    "11111111-1111-4111-8111-111111111111",
  ),
  apiTeam(
    "vyzer",
    "Vyzer",
    "VYZ",
    { kind: "icon", name: "Layers", color: "purple" },
    "22222222-2222-4222-8222-222222222222",
  ),
];

vi.mock("@/services/teams", () => ({
  teamsQueryOptions: () => queryOptions({ queryKey: ["teams"], queryFn: async () => API_TEAMS }),
}));

/**
 * MemoryRouter não sincroniza com `window.location`: para ler a URL "de fora" (o que os testes de
 * ordenação precisam) expomos o `pathname + search` atual num nó escondido, lido via
 * `currentLocation()`.
 */
function LocationProbe() {
  const location = useLocation();
  return (
    <span data-testid="location-probe" hidden>
      {location.pathname}
      {location.search}
    </span>
  );
}

function currentLocation(): string {
  return document.querySelector('[data-testid="location-probe"]')?.textContent ?? "";
}

/** A mesma composição de rotas de `routes/index.tsx` para a fatia de Projects. */
function ProjectsHarness({ initialEntries }: { initialEntries: string[] }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <LocationProbe />
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="projects" element={<ProjectsListPage />} />
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="teams/:team/projects" element={<TeamProjectsListPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("Split de rotas: /projects vs. /teams/:team/projects", () => {
  it("/projects lista todos os projetos do workspace, sem breadcrumb nem estrela", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);

    await expect
      .element(screen.getByRole("heading", { name: "Projects", level: 2 }))
      .toBeInTheDocument();

    // Mais de um time representado: zynox e vyzer.
    for (const project of PROJECTS) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
    expect(PROJECTS.some((p) => p.teamSlug === "zynox")).toBe(true);
    expect(PROJECTS.some((p) => p.teamSlug === "vyzer")).toBe(true);

    // Sem breadcrumb (nada de "Zynox ›"/"Vyzer ›" no título) nem botão de favorito ("estrela").
    expect(document.querySelector("h2")?.textContent).toBe("Projects");
    await expect.element(screen.getByRole("button", { name: /favorite/i })).not.toBeInTheDocument();

    // Sem terceira linha de cabeçalho / coluna "Board layout".
    await expect
      .element(screen.getByRole("columnheader", { name: "Board layout" }))
      .not.toBeInTheDocument();
  });

  it("/teams/zynox/projects lista só os projetos do time, com breadcrumb e estrela", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/teams/zynox/projects"]} />);

    // Título acessível (sr-only, sem h2 visível: a linha 1 vira breadcrumb + estrela).
    await expect
      .element(screen.getByRole("heading", { name: "Zynox › Projects", level: 1, exact: true }))
      .toBeInTheDocument();

    // Breadcrumb: "Zynox" (link para o time) › "Projects", e a estrela de favorito. Escopado ao
    // próprio `nav`: a lista também tem um projeto "Zynox OS", cujo link também bate em /Zynox/.
    const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
    // Sem separador de texto entre os itens (o "›" é um ícone decorativo, aria-hidden).
    expect(breadcrumb?.textContent?.trim()).toBe("ZynoxProjects");
    expect(breadcrumb?.querySelector("a")?.getAttribute("href")).toBe("/teams/zynox");
    await expect.element(screen.getByRole("button", { name: /favorite/i })).toBeInTheDocument();

    const zynoxProjects = PROJECTS.filter((p) => p.teamSlug === "zynox");
    const vyzerProjects = PROJECTS.filter((p) => p.teamSlug === "vyzer");
    expect(zynoxProjects.length).toBeGreaterThan(0);
    expect(vyzerProjects.length).toBeGreaterThan(0);

    for (const project of zynoxProjects) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
    for (const project of vyzerProjects) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .not.toBeInTheDocument();
    }
  });
});

describe("Team fora da API", () => {
  it("slug que a API não devolve mostra o próprio slug como nome, sem quebrar", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/teams/ghost/projects"]} />);

    await expect
      .element(screen.getByRole("heading", { name: "ghost › Projects", level: 1, exact: true }))
      .toBeInTheDocument();
    const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
    expect(breadcrumb?.textContent?.trim()).toBe("ghostProjects");
  });
});

describe("Ordenação por URL na tabela de Projects", () => {
  function orderParam(): string | null {
    const search = currentLocation().split("?")[1];
    return search ? new URLSearchParams(search).get("order") : null;
  }

  it("clicar em 'Name' ordena asc, depois desc, depois limpa; aria-sort acompanha", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    const nameButton = screen.getByRole("button", { name: "Name" });
    const nameHeader = screen.getByRole("columnheader", { name: "Name" });

    await expect.element(nameHeader).not.toHaveAttribute("aria-sort");
    expect(orderParam()).toBeNull();

    await nameButton.click();
    await expect.poll(orderParam).toBe("name");
    await expect.element(nameHeader).toHaveAttribute("aria-sort", "ascending");

    await nameButton.click();
    await expect.poll(orderParam).toBe("name:desc");
    await expect.element(nameHeader).toHaveAttribute("aria-sort", "descending");

    await nameButton.click();
    await expect.poll(orderParam).toBeNull();
    await expect.element(nameHeader).not.toHaveAttribute("aria-sort");
  });

  it("ativar 'Name' por teclado (Enter) também ordena e muda a URL", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    const nameButton = screen.getByRole("button", { name: "Name" });

    (nameButton.element() as HTMLElement).focus();
    await expect.element(nameButton).toHaveFocus();
    await userEvent.keyboard("{Enter}");

    await expect.poll(orderParam).toBe("name");
    await expect
      .element(screen.getByRole("columnheader", { name: "Name" }))
      .toHaveAttribute("aria-sort", "ascending");
  });

  it("ordena por Health, Priority, Target date e Status de forma independente", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);

    for (const [label, column] of [
      ["Health", "health"],
      ["Priority", "priority"],
      ["Target date", "targetDate"],
      ["Status", "status"],
    ] as const) {
      await screen.getByRole("button", { name: label }).click();
      await expect.poll(orderParam).toBe(column);
      await expect
        .element(screen.getByRole("columnheader", { name: label }))
        .toHaveAttribute("aria-sort", "ascending");
    }
  });

  it("Lead e Issues não são botões de ordenação e não mudam a URL", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);

    await expect
      .element(screen.getByRole("columnheader", { name: "Lead" }))
      .not.toHaveAttribute("aria-sort");
    await expect
      .element(screen.getByRole("columnheader", { name: "Issues" }))
      .not.toHaveAttribute("aria-sort");
    expect(screen.getByRole("button", { name: "Lead" }).elements().length).toBe(0);
    expect(screen.getByRole("button", { name: "Issues" }).elements().length).toBe(0);

    // Clicar diretamente no <th> (fora de qualquer botão) não deve alterar a URL.
    (screen.getByRole("columnheader", { name: "Lead" }).element() as HTMLElement).click();
    (screen.getByRole("columnheader", { name: "Issues" }).element() as HTMLElement).click();
    expect(orderParam()).toBeNull();
  });
});

describe("Navegação: nome do projeto na lista leva a /projects/:id", () => {
  it("o link do primeiro projeto aponta para /projects/<id>", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    const first = PROJECTS[0]!;
    const link = screen.getByRole("link", { name: new RegExp(first.name) });
    await expect.element(link).toHaveAttribute("href", `/projects/${first.id}`);
  });

  it("clicar no nome do projeto navega para a página do projeto (título muda)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    const target = PROJECTS.find((p) => p.teamSlug === "zynox")!;
    await screen.getByRole("link", { name: new RegExp(target.name) }).click();

    // ProjectDetailPage não tem h2 visível (o título vira breadcrumb); o h1 sr-only carrega o
    // nome da página para leitor de tela — é ele que confirma a navegação.
    await expect
      .element(screen.getByRole("heading", { name: target.name, level: 1 }))
      .toBeInTheDocument();
  });
});

describe("/projects/:projectId: projeto aberto, sem breadcrumb encadeado", () => {
  it("renderiza o projeto certo pelo id, sem 'Time › Projects' na frente", async () => {
    document.documentElement.dataset.theme = "dark";
    const project = PROJECTS.find((p) => p.teamSlug === "zynox")!;
    const screen = await render(<ProjectsHarness initialEntries={[`/projects/${project.id}`]} />);

    await expect
      .element(screen.getByRole("heading", { name: project.name, level: 1 }))
      .toBeInTheDocument();

    // O breadcrumb do TopBar mostra só o nome do projeto: nada de "Zynox › <nome>" encadeado.
    const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
    expect(breadcrumb?.textContent?.trim()).toBe(project.name);
  });

  it("projeto inexistente mostra o EmptyState 'Project not found' com link de volta", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects/nao-existe-123"]} />);

    await expect.element(screen.getByText("Project not found")).toBeInTheDocument();
    await expect.element(screen.getByText(/could not find the page/i)).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /back to projects/i });
    await expect.element(backLink).toHaveAttribute("href", "/projects");

    // Nada da tela de projeto de verdade: sem breadcrumb, sem abas, sem painel direito.
    expect(document.querySelector('nav[aria-label="Breadcrumb"]')).toBeNull();
    expect(screen.getByRole("tablist").elements().length).toBe(0);
  });

  it("?tab= desconhecido cai em 'overview', sem quebrar", async () => {
    document.documentElement.dataset.theme = "dark";
    const project = PROJECTS.find((p) => p.teamSlug === "zynox")!;
    const screen = await render(
      <ProjectsHarness initialEntries={[`/projects/${project.id}?tab=qualquer-coisa`]} />,
    );

    await expect
      .element(screen.getByRole("heading", { name: project.name, level: 1 }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("tab", { name: "Overview", selected: true }))
      .toBeInTheDocument();
  });
});

describe("Filtros de Projects: aplicam de verdade e ficam na URL", () => {
  it("?filter.health= mostra só os projetos com aquela saúde, nas duas listas", async () => {
    document.documentElement.dataset.theme = "dark";
    const onTrack = PROJECTS.filter((p) => p.health === "on-track");
    const notOnTrack = PROJECTS.filter((p) => p.health !== "on-track");
    expect(onTrack.length).toBeGreaterThan(0);
    expect(notOnTrack.length).toBeGreaterThan(0);

    const screen = await render(
      <ProjectsHarness initialEntries={["/projects?filter.health=on-track"]} />,
    );

    for (const project of onTrack) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
    for (const project of notOnTrack) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .not.toBeInTheDocument();
    }

    // Indicador de filtro ativo no botão "Add filter" (como no Linear).
    await expect
      .element(screen.getByRole("button", { name: "Add filter" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("sem filtro, o botão 'Add filter' não fica marcado como ativo", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    await expect
      .element(screen.getByRole("button", { name: "Add filter" }))
      .toHaveAttribute("aria-pressed", "false");
  });

  it("filtro na lista do time: só os projetos do time com aquela saúde", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(
      <ProjectsHarness initialEntries={["/teams/zynox/projects?filter.health=off-track"]} />,
    );
    const offTrackZynox = PROJECTS.filter(
      (p) => p.teamSlug === "zynox" && p.health === "off-track",
    );
    expect(offTrackZynox.length).toBeGreaterThan(0);
    for (const project of offTrackZynox) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
    const restOfZynox = PROJECTS.filter((p) => p.teamSlug === "zynox" && p.health !== "off-track");
    for (const project of restOfZynox) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .not.toBeInTheDocument();
    }
  });

  it("escolher 'On track' no menu Add filter grava a URL e filtra a lista", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    const onTrackProject = PROJECTS.find((p) => p.health === "on-track")!;
    const offTrackProject = PROJECTS.find((p) => p.health !== "on-track")!;

    await screen.getByRole("button", { name: "Add filter" }).click();
    const filterMenu = screen.getByRole("menu", { name: "Filters" });
    await filterMenu.getByText("Health").click();
    await screen.getByRole("listbox", { name: "Suggestions" }).getByText("On track").click();
    // Multisseleção: o menu fica aberto depois de escolher um valor (pode marcar mais de um).
    // Enquanto aberto, o resto da página fica aria-hidden (foco preso no Radix) — fecha com Esc
    // antes de checar a tabela por trás.
    await userEvent.keyboard("{Escape}");

    await expect
      .element(screen.getByRole("link", { name: new RegExp(onTrackProject.name) }))
      .toBeInTheDocument();
    await expect
      .element(screen.getByRole("link", { name: new RegExp(offTrackProject.name) }))
      .not.toBeInTheDocument();
    expect(currentLocation()).toContain("filter.health=on-track");
  });
});

describe("Agrupamento de Projects: agrupa a lista de verdade", () => {
  it("?grouping=status mostra o cabeçalho de cada grupo com a contagem", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects?grouping=status"]} />);

    const backlogCount = PROJECTS.filter((p) => p.status === "backlog").length;
    const startedCount = PROJECTS.filter((p) => p.status === "started").length;
    expect(backlogCount).toBeGreaterThan(0);
    expect(startedCount).toBeGreaterThan(0);

    await expect
      .element(screen.getByText(new RegExp(`Backlog\\s*${backlogCount}`)))
      .toBeInTheDocument();
    await expect
      .element(screen.getByText(new RegExp(`In Progress\\s*${startedCount}`)))
      .toBeInTheDocument();

    // Todo projeto continua na lista, só reorganizado em grupos.
    for (const project of PROJECTS) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
  });

  it("sem agrupamento (padrão), não há cabeçalho de grupo", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);
    await expect.element(screen.getByText("Backlog")).not.toBeInTheDocument();
  });

  it("?grouping=inválido cai em 'sem agrupamento', sem quebrar", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(
      <ProjectsHarness initialEntries={["/projects?grouping=qualquer-coisa"]} />,
    );
    for (const project of PROJECTS) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
  });

  it("escolher 'Status' em Display Options agrupa a lista de verdade e grava a URL", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialEntries={["/projects"]} />);

    await screen.getByRole("button", { name: "Display options" }).click();
    // Nome acessível vem do <label for> ("Grouping"), não do texto visível ("No grouping").
    await screen.getByRole("combobox", { name: "Grouping" }).click();
    await screen.getByRole("option", { name: "Status" }).click();
    // O Select fecha sozinho (seleção única), mas o painel de Display Options continua aberto —
    // fecha com Esc antes de checar a tabela por trás (fica aria-hidden com o painel aberto).
    await userEvent.keyboard("{Escape}");

    expect(currentLocation()).toContain("grouping=status");
    const backlogCount = PROJECTS.filter((p) => p.status === "backlog").length;
    await expect
      .element(screen.getByText(new RegExp(`Backlog\\s*${backlogCount}`)))
      .toBeInTheDocument();
  });
});

describe("?order= inválido na lista de Projects", () => {
  it("valor desconhecido cai em 'sem ordenação', sem quebrar", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(
      <ProjectsHarness initialEntries={["/projects?order=qualquer-coisa"]} />,
    );
    for (const project of PROJECTS) {
      await expect
        .element(screen.getByRole("link", { name: new RegExp(project.name) }))
        .toBeInTheDocument();
    }
    await expect
      .element(screen.getByRole("columnheader", { name: "Name" }))
      .not.toHaveAttribute("aria-sort");
  });
});
