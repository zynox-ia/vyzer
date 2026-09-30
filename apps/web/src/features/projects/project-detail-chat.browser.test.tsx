/**
 * Chat do agente no painel direito do projeto aberto (Fase 7 + Fase 8, VYZ-37/VYZ-35): abrir chat
 * (gatilho global "Agent" do rodapé flutuante, montado no AppShell — revisão de código item 3),
 * alternar para os detalhes do projeto no mesmo painel, Esc fechando o painel (cancelando antes se
 * a resposta está em andamento, item 4), histórico trocando de conversa de verdade (item 2) e a
 * mesma conversa sobrevivendo à navegação para /agent (item 1).
 *
 * O gatilho é global (Fase 7, reaplicada sobre a Fase 8): confirmado ao vivo no Linear que o
 * rodapé "Agent"/"Chat history" aparece em qualquer tela, não só em Projects — mas só
 * `/projects/:projectId` de fato mostra o chat no painel direito hoje.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import { useState } from "react";
import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import type { Project as ApiProject } from "@vyzer/contract";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { AppShell } from "@/layouts/app-shell";
import { AgentPage } from "@/features/agent";
import { ProjectDetailPage } from "./project-detail";

const project: ApiProject = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-000000000001",
  name: "Aname CRM",
  icon: { kind: "icon", name: "Box", color: "grey" },
  status: "started",
  health: "none",
  healthNote: null,
  priority: "medium",
  lead: null,
  targetDate: null,
  teams: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Zynox",
      slug: "zynox",
      key: "ZYN",
      icon: { kind: "icon", name: "Navigation", color: "cyan" },
    },
  ],
  issues: 106,
  progress: 4,
  createdAt: "2026-08-15T12:00:00.000Z",
  updatedAt: "2026-08-15T12:00:00.000Z",
};

vi.mock("@/services/projects", () => ({
  projectQueryOptions: (id: string) =>
    queryOptions({ queryKey: ["project", id], queryFn: async () => project }),
  projectsQueryOptions: () =>
    queryOptions({ queryKey: ["projects"], queryFn: async () => [project] }),
}));

const projectPath = `/projects/${project.id}`;

/** A mesma composição de rotas do app real: AppShell de verdade + ProjectDetailPage e AgentPage reais. */
function ProjectsHarness({ initialPath = projectPath }: { initialPath?: string }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="projects/:projectId" element={<ProjectDetailPage />} />
              <Route path="agent" element={<AgentPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  localStorage.clear();
  await page.viewport(1280, 720);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
  localStorage.clear();
});

describe("ProjectDetailPage: chat do agente no painel direito", () => {
  it("abre o chat pelo rodapé flutuante, troca para detalhes no mesmo painel e fecha com Esc", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    // O gatilho é o "Agent" do rodapé flutuante, global no AppShell (revisão de código, item 3).
    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    const chatPanel = screen.getByRole("complementary", { name: "Agent chat" });
    await expect.element(chatPanel).toBeVisible();
    await expect.element(screen.getByText("Get started with some examples")).toBeVisible();
    await expect
      .element(screen.getByRole("complementary", { name: "Project details" }))
      .not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Open project details" }).click();
    const detailsPanel = screen.getByRole("complementary", { name: "Project details" });
    await expect.element(detailsPanel).toBeVisible();
    await expect.element(chatPanel).not.toBeInTheDocument();

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    const reopenedChat = screen.getByRole("complementary", { name: "Agent chat" });
    await expect.element(reopenedChat).toBeVisible();
    await expect.element(detailsPanel).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await expect.element(reopenedChat).not.toBeInTheDocument();
    await expect
      .element(screen.getByRole("complementary", { name: "Project details" }))
      .not.toBeInTheDocument();
  });

  it("Esc fecha primeiro um overlay aberto dentro do chat, so depois o painel", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    const chatPanel = screen.getByRole("complementary", { name: "Agent chat" });
    await expect.element(chatPanel).toBeVisible();

    // O gatilho mostra o texto "New chat" mas o nome acessível é "Switch agent chat" (aria-label,
    // confirmado ao vivo no Linear — revisão de fidelidade, bloqueante 1).
    await screen.getByRole("button", { name: "Switch agent chat", exact: true }).click();
    const history = screen.getByRole("dialog", { name: "Chat history" });
    await expect.element(history).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(history).not.toBeInTheDocument();
    await expect.element(chatPanel).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(chatPanel).not.toBeInTheDocument();
  });

  it("Esc cancela a resposta em andamento antes de fechar o painel (revisao de codigo, item 4)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    const chatPanel = screen.getByRole("complementary", { name: "Agent chat" });
    await expect.element(chatPanel).toBeVisible();

    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("What's blocking Fase 7?");
    await userEvent.keyboard("{Enter}");

    const stop = screen.getByRole("button", { name: "Stop generating" });
    await expect.element(stop).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(stop).not.toBeInTheDocument();
    // O painel continua aberto: o primeiro Esc só cancelou a resposta.
    await expect.element(chatPanel).toBeVisible();

    await userEvent.keyboard("{Escape}");
    await expect.element(chatPanel).not.toBeInTheDocument();
  });

  it("o historico troca de verdade de conversa (revisao de codigo, bloqueante 2)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    await expect.element(screen.getByText("Get started with some examples")).toBeVisible();

    await screen.getByRole("button", { name: "Switch agent chat", exact: true }).click();
    await screen.getByRole("button", { name: /Draft update for Mv School/ }).click();

    // A conversa de exemplo já concluida (data.ts, HISTORY_SEEDS) aparece — não mais o vazio.
    await expect.element(screen.getByText("Draft a project update for Mv School")).toBeVisible();
    await expect
      .element(screen.getByText("Get started with some examples"))
      .not.toBeInTheDocument();

    // Trocar para outra conversa do historico muda o conteudo de novo.
    await screen.getByRole("button", { name: "Switch agent chat", exact: true }).click();
    await screen.getByRole("button", { name: /Research onboarding backlog/ }).click();
    await expect
      .element(screen.getByText("Research a topic across the issue backlog"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Draft a project update for Mv School"))
      .not.toBeInTheDocument();
  });

  it("a mesma conversa continua ao ir para a pagina cheia (revisao de codigo, item 1)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("Status update please");
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByText("Status update please", { exact: true })).toBeVisible();

    await screen.getByRole("button", { name: "Open full page" }).click();

    // O painel fecha ao ir para a pagina cheia (spec, decisao relatada pela revisão de fidelidade).
    await expect
      .element(screen.getByRole("complementary", { name: "Agent chat" }))
      .not.toBeInTheDocument();
    // A mesma mensagem aparece na pagina cheia — nao é uma conversa nova.
    await expect.element(screen.getByText("Status update please", { exact: true })).toBeVisible();
  });

  it("o historico tambem troca de conversa na pagina cheia, sem reverter pro param antigo", async () => {
    // Regressao: o efeito que sincroniza "?chat=" tratava a URL como fonte de verdade toda vez
    // que ela divergia da conversa ativa — inclusive logo apos o proprio switcher trocar de
    // conversa (antes do param acompanhar), revertendo a troca de volta. Corrigido: a URL só
    // manda na entrada; dali em diante, é a conversa ativa que empurra pro param.
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    await screen.getByRole("button", { name: "Open full page" }).click();
    await expect.element(screen.getByText("Get started with some examples")).toBeVisible();

    await screen.getByRole("button", { name: "Switch agent chat", exact: true }).click();
    await screen.getByRole("button", { name: /Research onboarding backlog/ }).click();

    await expect
      .element(screen.getByText("Research a topic across the issue backlog"))
      .toBeVisible();
    await expect
      .element(screen.getByText("Get started with some examples"))
      .not.toBeInTheDocument();
  });

  it("favoritar fica preso a conversa ativa, nao a tela (revisao de codigo, item 7)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Agent", exact: true }).click();
    // Escopado ao painel do chat: a TopBar do projeto tem seu proprio "Add to favorites" (do
    // projeto, sem relacao com o chat) — os dois coexistem na tela.
    const chatPanel = screen.getByRole("complementary", { name: "Agent chat" });
    const favorite = chatPanel.getByRole("button", { name: "Add to favorites" });
    await favorite.click();
    await expect
      .element(chatPanel.getByRole("button", { name: "Remove from favorites" }))
      .toBeVisible();

    // Troca para outra conversa (sem favorito ainda): o botao volta a "Add to favorites".
    await chatPanel.getByRole("button", { name: "Switch agent chat", exact: true }).click();
    await screen.getByRole("button", { name: /Draft update for Mv School/ }).click();
    await expect.element(chatPanel.getByRole("button", { name: "Add to favorites" })).toBeVisible();

    // Voltar para a primeira conversa (ainda "New chat", vazia) continua favorita — o estado é
    // por chatId, não um switch solto da tela.
    await chatPanel.getByRole("button", { name: "Switch agent chat", exact: true }).click();
    // O item do historico mostra "New chat" + a hora relativa no mesmo nome acessivel (sem
    // aria-label separado) — por isso um regex, como os outros itens deste arquivo.
    await screen.getByRole("button", { name: /^New chat/ }).click();
    await expect
      .element(chatPanel.getByRole("button", { name: "Remove from favorites" }))
      .toBeVisible();
  });

  it("recarregar no meio de uma resposta nao trava em Stop generating (revisao de codigo, menor)", async () => {
    // Simula o localStorage como ficaria se a pagina tivesse recarregado durante o thinking: os
    // timers que concluiriam a resposta so existem em memoria e nao sobrevivem a um reload de
    // verdade — aqui, montar o provider do zero com esse storage tem o mesmo efeito.
    document.documentElement.dataset.theme = "dark";
    localStorage.setItem(
      "vyzer:agent:chats",
      JSON.stringify({
        activeChatId: "stuck",
        chats: {
          stuck: {
            id: "stuck",
            title: "New chat",
            favorite: false,
            updatedAt: Date.now(),
            messages: [
              { id: "u1", role: "user", text: "Status update please" },
              { id: "a1", role: "agent", phase: "thinking" },
            ],
          },
        },
      }),
    );
    const screen = await render(<ProjectsHarness initialPath="/agent" />);

    // A mensagem do usuario continua; o placeholder pendente (sem timer que o resolva) some.
    // exact: true — sem isso bate também na live region ("You: Status update please").
    await expect.element(screen.getByText("Status update please", { exact: true })).toBeVisible();
    await expect
      .element(screen.getByRole("button", { name: "Stop generating" }))
      .not.toBeInTheDocument();
    await expect.element(screen.getByRole("textbox", { name: "Reply…" })).toBeEnabled();
  });

  it("o Popover do rodape fecha ao escolher uma conversa (revisao de codigo, menor)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness />);

    await screen.getByRole("button", { name: "Chat history" }).click();
    const popover = screen.getByRole("dialog", { name: "Chat history" });
    await expect.element(popover).toBeVisible();

    await screen.getByRole("button", { name: /Draft update for Mv School/ }).click();
    await expect.element(popover).not.toBeInTheDocument();
    // Abriu o painel com a conversa escolhida, por baixo de onde o Popover estava.
    await expect.element(screen.getByText("Draft a project update for Mv School")).toBeVisible();
  });

  it("pagina cheia: Move to toolbar e avulso, New chat mora no menu (revisao de fidelidade, rodada 2)", async () => {
    document.documentElement.dataset.theme = "dark";
    const screen = await render(<ProjectsHarness initialPath="/agent" />);

    // "Move to toolbar" e um IconButton avulso, irmao do "..." (Figma 27:7085/27:7091) — nao um
    // item dentro do menu.
    await expect.element(screen.getByRole("button", { name: "Move to toolbar" })).toBeVisible();

    await screen.getByRole("button", { name: "Chat options" }).click();
    const newChat = screen.getByRole("menuitem", { name: "New chat" });
    await expect.element(newChat).toBeVisible();
    // "Move to toolbar" nao esta dentro do menu.
    await expect
      .element(screen.getByRole("menuitem", { name: "Move to toolbar" }))
      .not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect.element(newChat).not.toBeInTheDocument();

    // "New chat" reseta a conversa ativa (mesma acao do "..." do painel compacto).
    const field = screen.getByRole("textbox", { name: "Ask Vyzer…" });
    await field.fill("Status update please");
    await userEvent.keyboard("{Enter}");
    await expect.element(screen.getByText("Status update please", { exact: true })).toBeVisible();

    await screen.getByRole("button", { name: "Chat options" }).click();
    await screen.getByRole("menuitem", { name: "New chat" }).click();
    await expect.element(screen.getByText("Get started with some examples")).toBeVisible();
    await expect
      .element(screen.getByText("Status update please", { exact: true }))
      .not.toBeInTheDocument();
  });
});
