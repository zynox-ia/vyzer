/**
 * Janela "Customize sidebar" de Preferences num Chromium real: os seletores com as opções do Linear
 * (lidas ao vivo em 30/09), a reordenação por arrastar e por teclado, e a escolha guardada.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import axe from "axe-core";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Button, ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import { CustomizeSidebarDialog } from "./customize-sidebar";

type Key =
  | "inbox"
  | "reviews"
  | "my-issues"
  | "agent"
  | "drafts"
  | "projects"
  | "views"
  | "members"
  | "teams";
type Patch = {
  badgeStyle?: "count" | "dot";
  items?: { key: Key; visibility?: "always" | "when-badged" | "hidden"; sortOrder?: number }[];
};
type Data = {
  workspaceId: string;
  memberId: string;
  badgeStyle: "count" | "dot";
  items: { key: Key; visibility: "always" | "when-badged" | "hidden"; sortOrder: number }[];
};

const DEFAULTS: Data = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  memberId: "22222222-2222-4222-8222-222222222222",
  badgeStyle: "count",
  items: [
    { key: "inbox", visibility: "always", sortOrder: 0 },
    { key: "reviews", visibility: "always", sortOrder: 1 },
    { key: "my-issues", visibility: "always", sortOrder: 2 },
    { key: "agent", visibility: "always", sortOrder: 3 },
    { key: "drafts", visibility: "when-badged", sortOrder: 4 },
    { key: "projects", visibility: "always", sortOrder: 5 },
    { key: "views", visibility: "always", sortOrder: 6 },
    { key: "members", visibility: "hidden", sortOrder: 7 },
    { key: "teams", visibility: "hidden", sortOrder: 8 },
  ],
};

let server: Data;
const updates: Patch[] = [];
const failNext = { value: false };

/** A API em memória: aplica o patch como o backend e devolve o estado. */
vi.mock("@/services/sidebar-preferences", () => ({
  sidebarPreferencesQueryOptions: () =>
    queryOptions({
      queryKey: ["sidebar-preferences"],
      queryFn: async () => structuredClone(server),
    }),
  updateSidebarPreferencesMutationOptions: () =>
    mutationOptions({
      mutationFn: async (patch: Patch) => {
        updates.push(patch);
        if (failNext.value) throw new Error("boom");
        server = {
          ...server,
          badgeStyle: patch.badgeStyle ?? server.badgeStyle,
          items: server.items.map((item) => ({
            ...item,
            ...patch.items?.find((p) => p.key === item.key),
          })),
        };
        return structuredClone(server);
      },
    }),
}));

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <main>
          <CustomizeSidebarDialog>
            <Button type="button">Customize</Button>
          </CustomizeSidebarDialog>
        </main>
      </ToastProvider>
    </QueryClientProvider>
  );
}

async function open() {
  const screen = await render(<Harness />);
  await screen.getByRole("button", { name: "Customize" }).click();
  await expect.element(page.getByRole("dialog", { name: "Customize sidebar" })).toBeVisible();
  return screen;
}

/** O Radix Select repete o nome no select nativo escondido: o primeiro é o botão da tela. */
const combo = (name: string) => page.getByRole("combobox", { name, exact: true }).first();

const rowLabels = (group: string) =>
  Array.from(document.querySelectorAll(`[role=dialog] ul[aria-label="${group}"] > li`)).map(
    (li) => (li.querySelector("span.truncate") as HTMLElement).textContent,
  );

/** Escolhe a opção com um clique de verdade do mouse (a lista precisa estar à frente da janela). */
async function chooseOption(name: string) {
  const option = page.getByRole("listbox").getByRole("option", { name, exact: true });
  await expect.element(option).toBeVisible();
  await option.click();
}

async function optionsOf(name: string) {
  await combo(name).click();
  await expect.element(page.getByRole("listbox")).toBeVisible();
  const options = Array.from(document.querySelectorAll("[role=listbox] [role=option]")).map((o) =>
    o.textContent?.trim(),
  );
  await userEvent.keyboard("{Escape}");
  // Espera a lista fechar (animação de saída) antes da próxima leitura.
  await expect.poll(() => document.querySelectorAll("[role=listbox]").length).toBe(0);
  return options;
}

beforeEach(async () => {
  server = structuredClone(DEFAULTS);
  updates.length = 0;
  failNext.value = false;
  await page.viewport(1280, 900);
});

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe("CustomizeSidebarDialog", () => {
  it("lista os nove itens nos grupos Personal e Workspace, na ordem do Linear", async () => {
    await open();
    expect(rowLabels("Personal")).toEqual(["Inbox", "Reviews", "My issues", "Agent", "Drafts"]);
    expect(rowLabels("Workspace")).toEqual(["Projects", "Views", "Members", "Teams"]);
  });

  it("cada seletor começa no padrão do Linear", async () => {
    await open();
    const current = combo;
    await expect.element(current("Default badge style")).toHaveTextContent("1 Count");
    for (const name of ["Inbox", "Reviews", "My issues", "Agent", "Projects", "Views"]) {
      await expect.element(current(`${name} visibility`)).toHaveTextContent("Always show");
    }
    await expect.element(current("Drafts visibility")).toHaveTextContent("Show when badged");
    await expect.element(current("Members visibility")).toHaveTextContent("Don't show");
    await expect.element(current("Teams visibility")).toHaveTextContent("Don't show");
  });

  it("cada seletor oferece exatamente as opções do Linear", async () => {
    await open();
    expect(await optionsOf("Default badge style")).toEqual(["1 Count", "Dot"]);
    expect(await optionsOf("Inbox visibility")).toEqual(["Always show", "Show when badged"]);
    expect(await optionsOf("Reviews visibility")).toEqual([
      "Always show",
      "Show when badged",
      "Don't show",
    ]);
    expect(await optionsOf("Drafts visibility")).toEqual([
      "Always show",
      "Show when badged",
      "Don't show",
    ]);
    for (const name of ["My issues", "Agent", "Projects", "Views", "Members", "Teams"]) {
      expect(await optionsOf(`${name} visibility`), name).toEqual(["Always show", "Don't show"]);
    }
  });

  it("clicar numa opção troca o valor e o guarda", async () => {
    await open();
    await combo("Members visibility").click();
    await expect.element(page.getByRole("listbox")).toBeVisible();
    await chooseOption("Always show");
    await expect.element(combo("Members visibility")).toHaveTextContent("Always show");
    await vi.waitFor(() =>
      expect(updates).toEqual([{ items: [{ key: "members", visibility: "always" }] }]),
    );
  });

  it("arrastar uma linha sobre outra reordena dentro do grupo", async () => {
    await open();
    const reviews = page.getByRole("listitem").filter({ hasText: "Reviews" });
    const inbox = page.getByRole("listitem").filter({ hasText: "Inbox" });
    await userEvent.dragAndDrop(reviews, inbox);
    await expect.poll(() => rowLabels("Personal").slice(0, 2)).toEqual(["Reviews", "Inbox"]);
  });

  it("durante o arrasto o cartão segue o ponteiro e o vizinho cede o lugar", async () => {
    await open();
    const rows = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[role=dialog] ul[aria-label="Personal"] > li'),
      );
    const inbox = rows()[0]!;
    const reviews = rows()[1]!;
    const box = inbox.getBoundingClientRect();
    const x = box.x + 120;
    const y = box.y + box.height / 2;
    const height = box.height;

    inbox.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        clientX: x,
        clientY: y,
        pointerId: 1,
      }),
    );
    window.dispatchEvent(
      new PointerEvent("pointermove", { clientX: x, clientY: y + height * 1.2, pointerId: 1 }),
    );
    await expect
      .poll(() => Number.parseFloat(inbox.style.transform.replace(/[^\d.-]/g, "")))
      .toBeCloseTo(height * 1.2, 1);
    // O cartão arrastado fica por cima, sem sombra nem fundo; as outras linhas ficam apagadas.
    expect(inbox.dataset.dragging).toBe("true");
    expect(getComputedStyle(inbox).boxShadow).toBe("none");
    expect(getComputedStyle(inbox).opacity).toBe("1");
    await expect.poll(() => Number(getComputedStyle(reviews).opacity)).toBeLessThan(1);
    // Reviews sobe um lugar.
    expect(Number.parseFloat(reviews.style.transform.replace(/[^\d.-]/g, ""))).toBeCloseTo(
      -height,
      1,
    );

    window.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1 }));
    // Ao soltar, assenta no lugar e só então a ordem é gravada.
    await expect.poll(() => rowLabels("Personal").slice(0, 2)).toEqual(["Reviews", "Inbox"]);
    await expect.poll(() => rows().every((row) => row.style.transform === "")).toBe(true);
    await expect
      .poll(() => rows().every((row) => getComputedStyle(row).opacity === "1"))
      .toBe(true);
  });

  it("arrastar para fora do grupo não move o item para o outro grupo", async () => {
    await open();
    await userEvent.dragAndDrop(
      page.getByRole("listitem").filter({ hasText: "Inbox" }),
      page.getByRole("listitem").filter({ hasText: "Projects" }),
    );
    // O cartão fica preso ao próprio grupo (vai no máximo ao último lugar dele).
    expect(rowLabels("Personal")).toHaveLength(5);
    expect(rowLabels("Personal")).toContain("Inbox");
    expect(rowLabels("Workspace")).toEqual(["Projects", "Views", "Members", "Teams"]);
  });

  it("a alça reordena pelas setas do teclado e a ordem é guardada", async () => {
    await open();
    const handle = page.getByRole("button", { name: /Reorder Inbox/ });
    await expect.element(handle).toBeVisible();
    // O evento vai direto à alça: o teclado do Playwright, com várias páginas em paralelo, pode
    // entregar a tecla a mais de uma.
    handle
      .element()
      .dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true }),
      );
    await expect.poll(() => rowLabels("Personal").slice(0, 2)).toEqual(["Reviews", "Inbox"]);
    await vi.waitFor(() => expect(updates).toHaveLength(1));
    // Personal 0 a 4, na nova ordem.
    expect(updates[0]!.items).toEqual([
      { key: "reviews", sortOrder: 0 },
      { key: "inbox", sortOrder: 1 },
      { key: "my-issues", sortOrder: 2 },
      { key: "agent", sortOrder: 3 },
      { key: "drafts", sortOrder: 4 },
    ]);
  });

  it("mostra o carregamento e depois os itens vindos da API", async () => {
    await render(<Harness />);
    await page.getByRole("button", { name: "Customize" }).click();
    await expect.element(page.getByRole("dialog", { name: "Customize sidebar" })).toBeVisible();
    await expect.element(combo("Inbox visibility")).toBeVisible();
  });

  it("a ordem e a visibilidade guardadas na API aparecem ao abrir", async () => {
    server = {
      ...DEFAULTS,
      badgeStyle: "dot",
      items: DEFAULTS.items.map((item) =>
        item.key === "agent"
          ? { ...item, sortOrder: 0, visibility: "hidden" as const }
          : { ...item, sortOrder: item.key === "inbox" ? 1 : item.sortOrder },
      ),
    };
    await open();
    expect(rowLabels("Personal")[0]).toBe("Agent");
    await expect.element(combo("Agent visibility")).toHaveTextContent("Don't show");
    await expect.element(combo("Default badge style")).toHaveTextContent("Dot");
  });

  it("se a gravação falha, o valor volta e um aviso aparece", async () => {
    failNext.value = true;
    await open();
    await combo("Members visibility").click();
    await expect.element(page.getByRole("listbox")).toBeVisible();
    await chooseOption("Always show");
    await expect.element(page.getByText("Could not save sidebar settings")).toBeVisible();
    await expect.element(combo("Members visibility")).toHaveTextContent("Don't show");
  });

  it("a lista do seletor abre à frente da janela e recebe o clique do mouse", async () => {
    await open();
    await combo("Inbox visibility").click();
    await expect.element(page.getByRole("listbox")).toBeVisible();
    await new Promise((resolve) => setTimeout(resolve, 400));
    const option = document.querySelector("[role=listbox] [role=option]") as HTMLElement;
    const box = option.getBoundingClientRect();
    const top = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
    expect(option.contains(top)).toBe(true);
  });

  it("reabrir a janela mantém a escolha", async () => {
    await open();
    await combo("Default badge style").click();
    await expect.element(page.getByRole("listbox")).toBeVisible();
    await chooseOption("Dot");
    await expect.element(combo("Default badge style")).toHaveTextContent("Dot");
    await userEvent.keyboard("{Escape}");
    await page.getByRole("button", { name: "Customize" }).click();
    await expect.element(combo("Default badge style")).toHaveTextContent("Dot");
  });

  it.each(["dark", "light"] as const)("não tem violações axe no tema %s", async (theme) => {
    document.documentElement.dataset.theme = theme;
    await open();
    const dialog = document.querySelector("[role=dialog]")!;
    await Promise.all(
      dialog.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => {})),
    );
    const result = await axe.run(dialog, { resultTypes: ["violations"] });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});
