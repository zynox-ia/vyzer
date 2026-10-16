/**
 * Tela de Profile (spec `profile-settings.md`) num Chromium real: foto, e-mail só leitura, Full
 * name/Title/Username gravando no blur ou Enter (só o campo alterado e válido) e Leave workspace
 * com confirmação.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page, userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import axe from "axe-core";
import { ToastProvider } from "@zynox/design-system/components";
import "@/index.css";
import { ProfileView, type ProfileEdit, type ProfileValues } from "./profile";

const VALUES: ProfileValues = {
  email: "andre@example.com",
  name: "André Júnio",
  title: "Dev",
  username: "andre",
  avatarUrl: null,
};

const onEdit = vi.fn<(patch: ProfileEdit) => void>();
const onUploadAvatar = vi.fn<(file: File) => void>();
const onLeave = vi.fn<() => void>();

function Harness(props: {
  values?: ProfileValues;
  canLeave?: boolean;
  leaveHint?: string;
  uploadError?: string;
  uploading?: boolean;
}) {
  return (
    <ToastProvider>
      <main>
        <ProfileView
          values={props.values ?? VALUES}
          onEdit={onEdit}
          onUploadAvatar={onUploadAvatar}
          onLeave={onLeave}
          canLeave={props.canLeave}
          leaveHint={props.leaveHint}
          uploadError={props.uploadError}
          uploading={props.uploading}
        />
      </main>
    </ToastProvider>
  );
}

beforeEach(async () => {
  onEdit.mockReset();
  onUploadAvatar.mockReset();
  onLeave.mockReset();
  await page.viewport(1280, 900);
});

describe("ProfileView", () => {
  it("mostra os valores, o e-mail só como texto e os placeholders quando vazio", async () => {
    await render(<Harness />);
    await expect.element(page.getByLabelText("Full name")).toHaveValue("André Júnio");
    await expect.element(page.getByLabelText("Title")).toHaveValue("Dev");
    await expect.element(page.getByLabelText("Username")).toHaveValue("andre");
    await expect.element(page.getByText("andre@example.com")).toBeVisible();
    await expect.element(page.getByRole("textbox", { name: "Email" })).not.toBeInTheDocument();
    // O lápis do e-mail existe, mas sem `onChangeEmail` fica desabilitado.
    await expect.element(page.getByRole("button", { name: "Change email" })).toBeDisabled();
  });

  it("o lápis do e-mail chama onChangeEmail quando existe", async () => {
    const onChangeEmail = vi.fn();
    await render(
      <ToastProvider>
        <main>
          <ProfileView
            values={VALUES}
            onEdit={onEdit}
            onUploadAvatar={onUploadAvatar}
            onLeave={onLeave}
            onChangeEmail={onChangeEmail}
          />
        </main>
      </ToastProvider>,
    );
    await page.getByRole("button", { name: "Change email" }).click();
    expect(onChangeEmail).toHaveBeenCalledTimes(1);
  });

  it("o lápis da foto aparece ao passar o mouse e ao focar", async () => {
    await render(<Harness />);
    const button = page.getByRole("button", { name: "Change profile picture" });
    const overlay = () =>
      Number(getComputedStyle(button.element().querySelector(":scope > span:last-child")!).opacity);
    // O mouse pode ter ficado de um teste anterior: sai da foto antes de medir.
    await page.getByLabelText("Full name").hover();
    await vi.waitFor(() => expect(overlay()).toBe(0));
    await button.hover();
    await vi.waitFor(() => expect(overlay()).toBe(1));
  });

  it("Title e Username vazios mostram os placeholders", async () => {
    await render(<Harness values={{ ...VALUES, title: null, username: null }} />);
    await expect.element(page.getByPlaceholder("Software engineer")).toHaveValue("");
    await expect.element(page.getByPlaceholder("username")).toHaveValue("");
  });

  it("grava ao sair do campo, só o campo alterado e com trim", async () => {
    await render(<Harness />);
    const title = page.getByLabelText("Title");
    await title.fill("  Staff engineer ");
    expect(onEdit).not.toHaveBeenCalled();
    await userEvent.tab();
    await vi.waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
    expect(onEdit).toHaveBeenCalledWith({ title: "Staff engineer" });
  });

  it("Enter grava uma única vez", async () => {
    await render(<Harness />);
    await page.getByLabelText("Full name").fill("André J.");
    await userEvent.keyboard("{Enter}");
    await vi.waitFor(() => expect(onEdit).toHaveBeenCalledTimes(1));
    expect(onEdit).toHaveBeenCalledWith({ name: "André J." });
  });

  it("sem mudança não grava", async () => {
    await render(<Harness />);
    await page.getByLabelText("Title").click();
    await userEvent.tab();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("limpar Title ou Username grava null", async () => {
    await render(<Harness />);
    await page.getByLabelText("Username").fill("");
    await userEvent.tab();
    await vi.waitFor(() => expect(onEdit).toHaveBeenCalledWith({ username: null }));
  });

  it("nome vazio mostra o erro e não grava", async () => {
    await render(<Harness />);
    await page.getByLabelText("Full name").fill("  ");
    await userEvent.tab();
    await expect.element(page.getByText("Name is required.")).toBeVisible();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("username com espaço mostra o erro e não grava", async () => {
    await render(<Harness />);
    await page.getByLabelText("Username").fill("two words");
    await userEvent.tab();
    await expect.element(page.getByText("Use one word, without spaces.")).toBeVisible();
    expect(onEdit).not.toHaveBeenCalled();
  });

  it("escolher uma imagem chama o upload", async () => {
    await render(<Harness />);
    const file = new File(["x"], "me.png", { type: "image/png" });
    await userEvent.upload(page.getByLabelText("Profile picture file"), file);
    await vi.waitFor(() => expect(onUploadAvatar).toHaveBeenCalledTimes(1));
    expect(onUploadAvatar.mock.calls[0]![0].name).toBe("me.png");
  });

  it("mostra o erro de upload na linha e desabilita a foto enquanto envia", async () => {
    await render(<Harness uploadError="Choose a PNG, JPG, WebP, or SVG image." uploading />);
    await expect.element(page.getByText("Choose a PNG, JPG, WebP, or SVG image.")).toBeVisible();
    await expect
      .element(page.getByRole("button", { name: "Change profile picture" }))
      .toBeDisabled();
  });

  it("Leave workspace pede confirmação e só então sai", async () => {
    await render(<Harness />);
    await page.getByRole("button", { name: "Leave workspace" }).click();
    const dialog = page.getByRole("alertdialog", { name: "Leave workspace?" });
    await expect.element(dialog).toBeVisible();
    expect(onLeave).not.toHaveBeenCalled();
    await dialog.getByRole("button", { name: "Leave workspace" }).click();
    await vi.waitFor(() => expect(onLeave).toHaveBeenCalledTimes(1));
  });

  it("Leave workspace fica desabilitado, com o motivo, quando a regra não permite", async () => {
    await render(<Harness canLeave={false} leaveHint="You are the only member." />);
    await expect.element(page.getByRole("button", { name: "Leave workspace" })).toBeDisabled();
    await expect.element(page.getByText("You are the only member.")).toBeVisible();
  });

  it("não tem violações axe", async () => {
    await render(<Harness />);
    await expect.element(page.getByLabelText("Full name")).toBeVisible();
    const result = await axe.run(document.body, { resultTypes: ["violations"] });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});
