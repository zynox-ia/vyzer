/**
 * `ProfilePage` ligada à API (em memória aqui): carrega, grava com volta e aviso se falha, mostra o
 * erro de username em uso e sai do Workspace para `/projects`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import {
  mutationOptions,
  queryOptions,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import type { Profile } from "@/services/profile";
import { ProfilePage } from "./profile-page";

const INITIAL: Profile = {
  id: "22222222-2222-4222-8222-222222222222",
  name: "André Júnio",
  email: "andre@example.com",
  role: "admin",
  title: "Dev",
  username: "andre",
  avatarUrl: null,
  canLeaveWorkspace: true,
};

let server: Profile;
const updates: unknown[] = [];
const state = { failUpdate: undefined as string | undefined, failLoad: false, left: 0 };

vi.mock("@/services/profile", () => ({
  profileQueryOptions: () =>
    queryOptions({
      queryKey: ["profile"],
      queryFn: async () => {
        if (state.failLoad) throw new Error("boom");
        return structuredClone(server);
      },
    }),
  updateProfileMutationOptions: () =>
    mutationOptions({
      mutationFn: async (patch: Partial<Profile>) => {
        updates.push(patch);
        if (state.failUpdate) throw new Error(state.failUpdate);
        server = { ...server, ...patch };
        return structuredClone(server);
      },
    }),
  leaveWorkspaceMutationOptions: () =>
    mutationOptions({
      mutationFn: async () => {
        state.left += 1;
      },
    }),
  uploadMemberAvatarMutationOptions: () => ({
    mutationFn: async (_file: File) => {
      server = { ...server, avatarUrl: "/api/member/avatar/x.png" };
      return { avatarUrl: "/api/member/avatar/x.png" };
    },
  }),
}));

function Where() {
  return <output aria-label="Current URL">{useLocation().pathname}</output>;
}

function Harness() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/settings/profile"]}>
          <Routes>
            <Route
              path="/settings/profile"
              element={
                <main>
                  <ProfilePage />
                </main>
              }
            />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}

beforeEach(async () => {
  server = structuredClone(INITIAL);
  updates.length = 0;
  state.failUpdate = undefined;
  state.failLoad = false;
  state.left = 0;
  await page.viewport(1280, 900);
});

describe("ProfilePage", () => {
  it("carrega o perfil da API", async () => {
    await render(<Harness />);
    await expect.element(page.getByLabelText("Full name")).toHaveValue("André Júnio");
    await expect.element(page.getByText("andre@example.com")).toBeVisible();
  });

  it("erro de carga mostra Retry", async () => {
    state.failLoad = true;
    await render(<Harness />);
    await expect.element(page.getByText("Could not load profile")).toBeVisible();
    state.failLoad = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await expect.element(page.getByLabelText("Full name")).toHaveValue("André Júnio");
  });

  it("grava o Title ao sair do campo", async () => {
    await render(<Harness />);
    await page.getByLabelText("Title").fill("Staff");
    await userEvent.tab();
    await vi.waitFor(() => expect(server.title).toBe("Staff"));
    expect(updates).toEqual([{ title: "Staff" }]);
  });

  it("falha ao gravar: volta ao valor salvo e avisa com a mensagem da API", async () => {
    state.failUpdate = "This username is already in use.";
    await render(<Harness />);
    await page.getByLabelText("Username").fill("taken");
    await userEvent.tab();
    await expect.element(page.getByText("Could not save profile")).toBeVisible();
    await expect.element(page.getByText("This username is already in use.")).toBeVisible();
    await expect.element(page.getByLabelText("Username")).toHaveValue("andre");
  });

  it("enviar a foto atualiza o avatar", async () => {
    await render(<Harness />);
    await userEvent.upload(
      page.getByLabelText("Profile picture file"),
      new File(["x"], "me.png", { type: "image/png" }),
    );
    await vi.waitFor(() => expect(server.avatarUrl).toBe("/api/member/avatar/x.png"));
  });

  it("Leave workspace confirma, sai e vai para /projects", async () => {
    await render(<Harness />);
    await page.getByRole("button", { name: "Leave workspace" }).click();
    await page
      .getByRole("alertdialog", { name: "Leave workspace?" })
      .getByRole("button", { name: "Leave workspace" })
      .click();
    await expect.element(page.getByLabelText("Current URL")).toHaveTextContent("/projects");
    expect(state.left).toBe(1);
  });

  it("sem permissão para sair: botão desabilitado", async () => {
    server = { ...server, canLeaveWorkspace: false };
    await render(<Harness />);
    await expect.element(page.getByRole("button", { name: "Leave workspace" })).toBeDisabled();
  });
});
