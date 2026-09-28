import axe from "axe-core";
import { CircleCheck } from "lucide-react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { render } from "vitest-browser-react";
import "../styles/index.css";
import {
  Alert,
  Button,
  Confirm,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogTrigger,
  EmptyState,
  ProgressBar,
  ProgressRing,
  Skeleton,
  Spinner,
  ToastProvider,
  useToast,
} from ".";

async function violations(root: Element) {
  await Promise.all(
    root.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => {})),
  );
  const result = await axe.run(root, { resultTypes: ["violations"] });
  return result.violations.map(
    (violation) =>
      `${violation.id}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

describe.each(["dark", "light"] as const)("overlays de feedback no tema %s", (theme) => {
  it("Dialog: abre, mantém o foco, fecha por Escape/fundo/X e passa no axe", async () => {
    document.documentElement.dataset.theme = theme;
    const screen = await render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open details</Button>
        </DialogTrigger>
        <DialogContent title="Edit team" description="Update team details">
          <DialogBody>
            <label htmlFor="team-name">Team name</label>
            <input id="team-name" defaultValue="Engineering" />
            <button type="button">Second field</button>
          </DialogBody>
          <DialogFooter>
            <button type="button">Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>,
    );
    const trigger = screen.getByRole("button", { name: "Open details" });
    await trigger.click();
    const dialog = screen.getByRole("dialog", { name: "Edit team" });
    const input = screen.getByRole("textbox", { name: "Team name" });
    await expect.element(dialog).toHaveAccessibleDescription("Update team details");
    await expect.element(input).toHaveFocus();
    expect((input.element() as HTMLInputElement).selectionStart).toBe("Engineering".length);
    expect((input.element() as HTMLInputElement).selectionEnd).toBe("Engineering".length);
    const close = screen.getByRole("button", { name: "Close" });
    expect(dialog.element().lastElementChild).toBe(close.element());
    await userEvent.keyboard("{Shift>}{Tab}{/Shift}");
    await expect.element(close).toHaveFocus();
    await userEvent.keyboard("{Tab}");
    await expect.element(input).toHaveFocus();
    expect(await violations(dialog.element())).toEqual([]);
    await userEvent.keyboard("{Escape}");
    await expect.element(dialog).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();

    await trigger.click();
    await screen.getByRole("button", { name: "Close" }).click();
    await expect.element(screen.getByRole("dialog", { name: "Edit team" })).not.toBeInTheDocument();
    await expect.element(trigger).toHaveFocus();

    await trigger.click();
    const overlay = dialog.element().parentElement;
    if (!overlay) throw new Error("Dialog overlay did not open");
    await userEvent.click(overlay, { position: { x: 2, y: 2 } });
    await expect.element(screen.getByRole("dialog", { name: "Edit team" })).not.toBeInTheDocument();
  });

  it("Dialog sem descrição desliga aria-describedby e o modo controlado devolve o foco", async () => {
    document.documentElement.dataset.theme = theme;
    function Controlled() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button
            type="button"
            onKeyDown={(event) => {
              if (event.key === "Enter") setOpen(true);
            }}
          >
            Focus origin
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent title="Preferences">
              <button type="button">Inside</button>
            </DialogContent>
          </Dialog>
        </>
      );
    }
    const screen = await render(<Controlled />);
    const origin = screen.getByRole("button", { name: "Focus origin" });
    await origin.click();
    await userEvent.keyboard("{Enter}");
    const dialog = screen.getByRole("dialog", { name: "Preferences" });
    expect(dialog.element().hasAttribute("aria-describedby")).toBe(false);
    await userEvent.keyboard("{Escape}");
    await expect.element(origin).toHaveFocus();
  });

  it("Confirm é modal, inicia em Cancel, impede dismiss pelo fundo e confirma", async () => {
    document.documentElement.dataset.theme = theme;
    const onConfirm = vi.fn();
    const screen = await render(
      <Confirm
        title="Delete project?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
      >
        <Button>Delete project</Button>
      </Confirm>,
    );
    const trigger = screen.getByRole("button", { name: "Delete project" });
    await trigger.click();
    const alertdialog = screen.getByRole("alertdialog", { name: "Delete project?" });
    await expect.element(alertdialog).toHaveAccessibleDescription("This cannot be undone.");
    await expect.element(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    expect(await violations(alertdialog.element())).toEqual([]);
    const overlay = alertdialog.element().parentElement;
    if (!overlay) throw new Error("Confirm overlay did not open");
    await userEvent.click(overlay, { position: { x: 1, y: 1 } });
    await expect.element(alertdialog).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    await expect.element(alertdialog).not.toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();
    await expect.element(trigger).toHaveFocus();
    await trigger.click();
    await screen.getByRole("button", { name: "Delete", exact: true }).click();
    expect(onConfirm).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("Toast anuncia variantes, executa ações/Undo, fecha no X e recebe foco por F8/Esc", async () => {
    document.documentElement.dataset.theme = theme;
    const action = vi.fn();
    const undo = vi.fn();
    function Controls() {
      const toast = useToast();
      return (
        <div>
          <button
            onClick={() =>
              toast({
                title: "Saved changes",
                description: "Your team is ready",
                action: { label: "View", onClick: action },
                onUndo: undo,
                duration: 10000,
              })
            }
          >
            Show toast
          </button>
          <button onClick={() => toast({ title: "Done", variant: "success", duration: 10000 })}>
            Success toast
          </button>
          <button onClick={() => toast({ title: "Failed", variant: "error", duration: 10000 })}>
            Error toast
          </button>
        </div>
      );
    }
    const screen = await render(
      <ToastProvider duration={10000}>
        <Controls />
      </ToastProvider>,
    );
    await screen.getByRole("button", { name: "Show toast" }).click();
    const getToast = () => {
      const root = screen.getByRole("button", { name: "View" }).element().closest("li");
      if (!root) throw new Error("Toast root is missing");
      return root;
    };
    await expect.element(getToast()).toHaveTextContent("Your team is ready");
    expect(await violations(getToast())).toEqual([]);
    await screen.getByRole("button", { name: "View" }).click();
    expect(action).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("button", { name: "View" })).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Show toast" }).click();
    await screen.getByRole("button", { name: "Undo" }).click();
    expect(undo).toHaveBeenCalledOnce();
    await expect.element(screen.getByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Success toast" }).click();
    const successIcon = screen.getByRole("img", { name: "Success" });
    await expect.element(successIcon).toBeVisible();
    await screen.getByRole("button", { name: "Dismiss" }).click();
    await expect.element(successIcon).not.toBeInTheDocument();
    await screen.getByRole("button", { name: "Error toast" }).click();
    const errorIcon = screen.getByRole("img", { name: "Error" });
    await expect.element(errorIcon).toBeVisible();
    await userEvent.keyboard("{F8}");
    const viewport = document.querySelector('[role="region"][aria-label="Notifications (F8)"]');
    expect(viewport).not.toBeNull();
    await expect.element(errorIcon).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await expect.element(errorIcon).not.toBeInTheDocument();
  });

  it("useToast sem provider lança erro", async () => {
    function Invalid() {
      useToast();
      return null;
    }
    await expect(render(<Invalid />)).rejects.toThrow("useToast precisa de um ToastProvider");
  });

  it("Alert tem ícones nomeados, dismiss e ação; Progress limita valor e suporta indeterminado", async () => {
    document.documentElement.dataset.theme = theme;
    const dismiss = vi.fn();
    const action = vi.fn();
    const screen = await render(
      <div>
        <Alert
          tone="info"
          title="Heads up"
          onDismiss={dismiss}
          action={<Button onClick={action}>Review</Button>}
        >
          Read this first.
        </Alert>
        <Alert tone="success" title="Saved" />
        <Alert tone="warning" title="Check" />
        <Alert tone="danger" title="Failed" role="alert" />
        <ProgressBar label="Upload progress" value={150} />
        <ProgressRing label="Ring progress" value={null} max={10} />
        <Spinner label="Loading report" />
        <Skeleton data-testid="skeleton" />
        <EmptyState icon={CircleCheck} title="Nothing here">
          Start by creating an item.
        </EmptyState>
        <EmptyState title="Empty" action={<Button>Start</Button>} />
      </div>,
    );
    for (const name of ["Info", "Success", "Warning", "Error"])
      await expect.element(screen.getByRole("img", { name })).toBeVisible();
    await expect.element(screen.getByRole("alert")).toHaveTextContent("Failed");
    await screen.getByRole("button", { name: "Review" }).click();
    await screen.getByRole("button", { name: "Dismiss" }).click();
    expect(action).toHaveBeenCalledOnce();
    expect(dismiss).toHaveBeenCalledOnce();
    const progress = screen.getByRole("progressbar", { name: "Upload progress" });
    await expect.element(progress).toHaveAttribute("aria-valuenow", "100");
    await expect.element(progress).toHaveAttribute("aria-valuemax", "100");
    await expect
      .element(screen.getByRole("progressbar", { name: "Ring progress" }))
      .not.toHaveAttribute("aria-valuenow");
    const spinner = screen.getByRole("status");
    await expect.element(spinner).toHaveTextContent("Loading report");
    await expect.element(screen.getByTestId("skeleton")).toHaveAttribute("aria-hidden", "true");
    await expect.element(screen.getByText("Nothing here")).toBeVisible();
    await expect.element(screen.getByText("Start by creating an item.")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Start" })).toBeVisible();
  });
});
