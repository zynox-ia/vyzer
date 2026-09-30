/**
 * Preferences 100% persistida (spec `preferences-persistence.md`) num Chromium real: a página lê e
 * grava pela API (em memória aqui), volta atrás com aviso se a gravação falha e aplica o tema, os
 * cursores de ponteiro e os links sublinhados no app inteiro.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ToastProvider } from "@vyzer/design-system/components";
import "@/index.css";
import type { MemberPreferences } from "@/services/member-preferences";
import { PreferencesPage } from "./preferences";
import { useApplyMemberPreferences } from "./use-apply-member-preferences";

const DEFAULTS: MemberPreferences = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  memberId: "22222222-2222-4222-8222-222222222222",
  defaultHomeView: "agent",
  displayNameFormat: "full",
  firstDayOfWeek: "sunday",
  convertEmoticons: true,
  sendCommentsOn: "enter",
  interfaceFontSize: "default",
  usePointerCursors: false,
  underlineLinks: false,
  disableAnimatedImages: false,
  interfaceTheme: "dark",
  codeTheme: "linear-dark",
  codeFontSize: "default",
  codeLineHeight: "regular",
  codeFontFamily: "",
  openInDesktopApp: false,
  autoAssignToSelf: false,
  autoAssignOnMoveToStarted: false,
};

let server: MemberPreferences;
const updates: Partial<MemberPreferences>[] = [];
const failNext = { value: false };
const failLoad = { value: false };

vi.mock("@/services/member-preferences", () => ({
  memberPreferencesQueryOptions: () =>
    queryOptions({
      queryKey: ["member-preferences"],
      queryFn: async () => {
        if (failLoad.value) throw new Error("boom");
        return structuredClone(server);
      },
    }),
  updateMemberPreferencesMutationOptions: () =>
    mutationOptions({
      mutationFn: async (patch: Partial<MemberPreferences>) => {
        updates.push(patch);
        if (failNext.value) throw new Error("boom");
        server = { ...server, ...patch };
        return structuredClone(server);
      },
    }),
}));

function Apply() {
  useApplyMemberPreferences();
  return null;
}

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <Apply />
        <main>
          <PreferencesPage />
          <a href="/somewhere" className="no-underline">
            A link
          </a>
        </main>
      </ToastProvider>
    </QueryClientProvider>
  );
}

const combo = (label: string) => page.getByRole("combobox", { name: label, exact: true }).first();

async function choose(label: string, option: string) {
  await combo(label).click();
  const item = page.getByRole("listbox").getByRole("option", { name: option, exact: true });
  await expect.element(item).toBeVisible();
  await item.click();
}

beforeEach(async () => {
  server = structuredClone(DEFAULTS);
  updates.length = 0;
  failNext.value = false;
  failLoad.value = false;
  localStorage.clear();
  await page.viewport(1280, 900);
});

afterEach(() => {
  document.documentElement.removeAttribute("data-pointer-cursors");
  document.documentElement.removeAttribute("data-underline-links");
  localStorage.clear();
});

describe("PreferencesPage", () => {
  it("mostra o carregamento e depois os valores vindos da API", async () => {
    server = { ...DEFAULTS, displayNameFormat: "first", firstDayOfWeek: "monday" };
    await render(<Harness />);
    await expect.element(page.getByText("Loading preferences.")).toBeInTheDocument();
    await expect.element(page.getByRole("heading", { name: "Preferences" })).toBeVisible();
    await expect
      .element(page.getByRole("combobox", { name: /Display names|First name/ }).first())
      .toBeVisible();
    await expect.element(page.getByText("First name")).toBeVisible();
    await expect.element(page.getByText("Monday")).toBeVisible();
  });

  it("erro de leitura mostra o Alert e o Retry recarrega", async () => {
    failLoad.value = true;
    await render(<Harness />);
    await expect.element(page.getByText("Could not load preferences")).toBeVisible();
    failLoad.value = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await expect.element(page.getByText("Default home view")).toBeVisible();
  });

  it("um seletor grava só o campo alterado e o valor sobrevive a reabrir a página", async () => {
    const first = await render(<Harness />);
    await expect.element(page.getByText("Default home view")).toBeVisible();
    await choose("First day of the week", "Monday");
    await vi.waitFor(() => expect(updates).toEqual([{ firstDayOfWeek: "monday" }]));
    await first.unmount();

    await render(<Harness />);
    await expect.element(page.getByText("Monday")).toBeVisible();
  });

  it("um interruptor grava o booleano", async () => {
    await render(<Harness />);
    await expect.element(page.getByText("Auto-assign to self")).toBeVisible();
    await page.getByRole("switch", { name: "Auto-assign to self" }).click();
    await vi.waitFor(() => expect(updates).toEqual([{ autoAssignToSelf: true }]));
  });

  it("se a gravação falha, o valor volta e um aviso aparece", async () => {
    failNext.value = true;
    await render(<Harness />);
    await expect.element(page.getByText("Auto-assign to self")).toBeVisible();
    await page.getByRole("switch", { name: "Auto-assign to self" }).click();
    await expect.element(page.getByText("Could not save preference")).toBeVisible();
    await expect
      .element(page.getByRole("switch", { name: "Auto-assign to self" }))
      .not.toBeChecked();
  });

  it("a família da fonte grava ao sair do campo, não a cada tecla", async () => {
    await render(<Harness />);
    await page.getByText("12px, Regular, Default").click();
    const input = page.getByPlaceholder("Font family name");
    await input.fill("JetBrains Mono");
    expect(updates).toEqual([]);
    await userEvent.tab();
    await vi.waitFor(() => expect(updates).toEqual([{ codeFontFamily: "JetBrains Mono" }]));
    await expect.element(page.getByText("12px, Regular, JetBrains Mono")).toBeVisible();
  });

  it("o tema de código da API muda a amostra de código", async () => {
    server = { ...DEFAULTS, codeTheme: "dracula" };
    await render(<Harness />);
    await expect.element(page.getByText("Default home view")).toBeVisible();
    const box = document.querySelector('pre[aria-label="Code sample"]')!.parentElement!;
    expect(getComputedStyle(box).backgroundColor).toBe("rgb(40, 42, 54)");
  });
});

describe("Efeitos aplicados ao app", () => {
  it("o tema da API é aplicado ao documento", async () => {
    server = { ...DEFAULTS, interfaceTheme: "light" };
    await render(<Harness />);
    await expect.poll(() => document.documentElement.dataset.theme).toBe("light");
  });

  it("trocar o tema na tela aplica na hora e grava", async () => {
    await render(<Harness />);
    await expect.element(page.getByText("Default home view")).toBeVisible();
    await choose("Interface theme", "Light");
    await expect.poll(() => document.documentElement.dataset.theme).toBe("light");
    await vi.waitFor(() => expect(updates).toEqual([{ interfaceTheme: "light" }]));
  });

  it("Use pointer cursors liga o atributo e o cursor dos elementos interativos", async () => {
    await render(<Harness />);
    await expect.element(page.getByText("Use pointer cursors", { exact: true })).toBeVisible();
    // O botão do design system usa o cursor padrão; com a preferência, vira pointer.
    const button = page.getByRole("button", { name: "Customize" }).element();
    expect(getComputedStyle(button).cursor).not.toBe("pointer");

    await page.getByRole("switch", { name: "Use pointer cursors" }).click();
    await expect
      .poll(() => document.documentElement.hasAttribute("data-pointer-cursors"))
      .toBe(true);
    expect(getComputedStyle(button).cursor).toBe("pointer");

    await page.getByRole("switch", { name: "Use pointer cursors" }).click();
    await expect
      .poll(() => document.documentElement.hasAttribute("data-pointer-cursors"))
      .toBe(false);
    expect(getComputedStyle(button).cursor).not.toBe("pointer");
  });

  it("Underline links sublinha os links de verdade", async () => {
    await render(<Harness />);
    await expect.element(page.getByText("Underline links", { exact: true })).toBeVisible();
    const link = document.querySelector("a[href='/somewhere']")!;
    expect(getComputedStyle(link).textDecorationLine).not.toBe("underline");

    await page.getByRole("switch", { name: "Underline links" }).click();
    await expect.poll(() => getComputedStyle(link).textDecorationLine).toBe("underline");
  });
});
