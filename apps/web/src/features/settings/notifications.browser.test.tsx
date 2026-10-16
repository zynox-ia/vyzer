/**
 * Notifications (spec `notifications-settings.md`) num Chromium real: a página principal com as
 * três seções, o resumo de cada canal, e a subpágina reutilizável dos cinco canais, com Desktop,
 * Mobile e Slack desabilitados e Email editável.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { page } from "vitest/browser";
import { render } from "vitest-browser-react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import axe from "axe-core";
import "@/index.css";
import { NotificationsView, type NotificationFlags } from "./notifications";
import { NotificationChannelView, type EmailSettings } from "./notifications-channel";
import {
  NOTIFICATION_TYPES,
  countEnabled,
  summarizeChannel,
  type ChannelMatrix,
  type NotificationChannelKey,
} from "./notifications-model";

const matrix = (enabled: (key: string) => boolean): ChannelMatrix =>
  Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [type.key, enabled(type.key)]),
  ) as ChannelMatrix;

const ALL = matrix(() => true);
const NONE = matrix(() => false);
const SOME = matrix((key) => key !== "reactions");

const FLAGS: NotificationFlags = {
  priorityInbox: false,
  showChangelogInSidebar: true,
  changelogNewsletter: false,
  marketingAndOnboarding: true,
  inviteAccepted: true,
  privacyAndLegalUpdates: true,
  dataProcessingAgreement: false,
};

const CHANNELS: Record<NotificationChannelKey, ChannelMatrix> = {
  priority: matrix((key) => key === "assignments"),
  desktop: SOME,
  mobile: SOME,
  email: ALL,
  slack: NONE,
};

const EMAIL: EmailSettings = {
  emailEnabled: true,
  emailFormat: "digest",
  emailDigestDelayLowPriority: true,
  emailDigestUrgentImmediate: true,
};

const onFlag = vi.fn();
const onToggleType = vi.fn();
const onEmailSettings = vi.fn();

function Where() {
  return <output aria-label="Current URL">{useLocation().pathname}</output>;
}

function Main() {
  return (
    <MemoryRouter initialEntries={["/settings/notifications"]}>
      <main>
        <Routes>
          <Route
            path="/settings/notifications"
            element={<NotificationsView flags={FLAGS} channels={CHANNELS} onFlag={onFlag} />}
          />
          <Route path="*" element={<Where />} />
        </Routes>
      </main>
    </MemoryRouter>
  );
}

function Channel({
  channel,
  priorityInbox,
}: {
  channel: NotificationChannelKey;
  priorityInbox?: boolean;
}) {
  return (
    <MemoryRouter initialEntries={[`/settings/notifications/${channel}`]}>
      <main>
        <Routes>
          <Route
            path="/settings/notifications/:channel"
            element={
              <NotificationChannelView
                channel={channel}
                matrix={CHANNELS[channel]}
                onToggleType={onToggleType}
                email="andre@example.com"
                emailSettings={EMAIL}
                onEmailSettings={onEmailSettings}
                priorityInbox={priorityInbox}
              />
            }
          />
          <Route path="*" element={<Where />} />
        </Routes>
      </main>
    </MemoryRouter>
  );
}

beforeEach(async () => {
  onFlag.mockReset();
  onToggleType.mockReset();
  onEmailSettings.mockReset();
  await page.viewport(1280, 1400);
});

describe("modelo", () => {
  it("resume o canal como o Linear", () => {
    expect(summarizeChannel(NONE)).toBe("Disabled");
    expect(summarizeChannel(ALL)).toBe("Enabled for all notifications");
    expect(summarizeChannel(SOME)).toBe("Enabled for assignments, status changes, 11 others");
    expect(summarizeChannel(matrix((key) => key === "assignments"))).toBe(
      "Enabled for assignments",
    );
    expect(countEnabled(CHANNELS.priority)).toBe(1);
  });
});

describe("NotificationsView", () => {
  it("mostra as três seções e as linhas do Linear", async () => {
    await render(<Main />);
    for (const heading of [
      "Inbox",
      "Push notifications",
      "Updates from Zynox",
      "Marketing",
      "Other updates",
    ]) {
      await expect.element(page.getByRole("heading", { name: heading })).toBeVisible();
    }
    for (const label of [
      "Priority inbox",
      "Show updates in sidebar",
      "Changelog newsletter",
      "Marketing and onboarding",
      "Invite accepted",
      "Privacy and legal updates",
      "Data processing agreement (DPA)",
    ]) {
      await expect.element(page.getByRole("switch", { name: label })).toBeInTheDocument();
    }
  });

  it("os switches refletem as flags e gravam só a flag alterada", async () => {
    await render(<Main />);
    await expect.element(page.getByRole("switch", { name: "Priority inbox" })).not.toBeChecked();
    await expect
      .element(page.getByRole("switch", { name: "Show updates in sidebar" }))
      .toBeChecked();
    await page.getByRole("switch", { name: "Priority inbox" }).click();
    await vi.waitFor(() => expect(onFlag).toHaveBeenCalledWith({ priorityInbox: true }));
    expect(onFlag).toHaveBeenCalledTimes(1);
  });

  it("cada canal mostra o resumo e leva à subpágina", async () => {
    await render(<Main />);
    await expect
      .element(page.getByRole("link", { name: /Desktop/ }))
      .toHaveTextContent("Enabled for assignments, status changes, 11 others");
    await expect
      .element(page.getByRole("link", { name: /Email/ }))
      .toHaveTextContent("Enabled for all notifications");
    await expect.element(page.getByRole("link", { name: /Slack/ })).toHaveTextContent("Disabled");
    await page.getByRole("link", { name: /Mobile/ }).click();
    await expect
      .element(page.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/notifications/mobile");
  });

  it("Priority notifications mostra quantos tipos e leva à subpágina", async () => {
    await render(<Main />);
    await expect
      .element(page.getByRole("link", { name: /Priority notifications/ }))
      .toHaveTextContent("1 types");
    await page.getByRole("link", { name: /Priority notifications/ }).click();
    await expect
      .element(page.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/notifications/priority");
  });

  it("não tem violações axe", async () => {
    await render(<Main />);
    await expect.element(page.getByRole("heading", { name: "Inbox" })).toBeVisible();
    const result = await axe.run(document.body, { resultTypes: ["violations"] });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});

describe("NotificationChannelView", () => {
  it("lista os 14 tipos em General e Feature notifications", async () => {
    await render(<Channel channel="priority" />);
    await expect
      .element(page.getByRole("heading", { name: "Priority notifications" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "General notifications" }))
      .toBeVisible();
    await expect
      .element(page.getByRole("heading", { name: "Feature notifications" }))
      .toBeVisible();
    for (const type of NOTIFICATION_TYPES) {
      await expect.element(page.getByRole("checkbox", { name: type.label })).toBeInTheDocument();
    }
    await expect.element(page.getByRole("checkbox", { name: "Assignments" })).toBeChecked();
    await expect.element(page.getByRole("checkbox", { name: "Mentions" })).not.toBeChecked();
  });

  it("um tipo grava o canal e o tipo", async () => {
    await render(<Channel channel="priority" />);
    await page.getByRole("checkbox", { name: "Mentions" }).click();
    await vi.waitFor(() => expect(onToggleType).toHaveBeenCalledWith("mentions", true));
  });

  it.each([
    ["desktop", "Desktop notifications require the Zynox desktop app"],
    ["mobile", "Mobile notifications require the Zynox mobile app"],
  ] as const)("%s mostra o aviso e deixa todos os tipos desabilitados", async (channel, notice) => {
    await render(<Channel channel={channel} />);
    await expect.element(page.getByText(notice)).toBeVisible();
    for (const type of NOTIFICATION_TYPES) {
      await expect.element(page.getByRole("checkbox", { name: type.label })).toBeDisabled();
    }
  });

  it("Slack mostra a conta não conectada e desabilita os tipos", async () => {
    await render(<Channel channel="slack" />);
    await expect.element(page.getByText("Personal Slack account not connected")).toBeVisible();
    await expect
      .element(page.getByRole("link", { name: "Connected accounts" }))
      .toHaveAttribute("href", "/settings/connected-accounts");
    await expect.element(page.getByRole("checkbox", { name: "Assignments" })).toBeDisabled();
  });

  it("Email é editável: o switch mestre, o formato, o digest e os tipos", async () => {
    await render(<Channel channel="email" />);
    await expect.element(page.getByText("Email notifications to andre@example.com")).toBeVisible();
    await page.getByRole("switch", { name: "Enable email notifications" }).click();
    await vi.waitFor(() => expect(onEmailSettings).toHaveBeenCalledWith({ emailEnabled: false }));

    await page
      .getByRole("switch", {
        name: "Delay low priority emails outside of work hours until next work day",
      })
      .click();
    await vi.waitFor(() =>
      expect(onEmailSettings).toHaveBeenCalledWith({ emailDigestDelayLowPriority: false }),
    );

    await expect.element(page.getByRole("checkbox", { name: "Assignments" })).toBeEnabled();
    await page.getByRole("checkbox", { name: "Reactions" }).click();
    await vi.waitFor(() => expect(onToggleType).toHaveBeenCalledWith("reactions", false));
  });

  it("Email: só entregar prioridade fica desabilitado sem a Priority inbox", async () => {
    await render(<Channel channel="email" priorityInbox={false} />);
    await expect
      .element(page.getByRole("switch", { name: "Only deliver priority notifications" }))
      .toBeDisabled();
    await expect
      .element(page.getByRole("link", { name: "priority notification settings→" }))
      .toHaveAttribute("href", "/settings/notifications/priority");
  });

  it("Email: a escolha do formato grava Immediate", async () => {
    await render(<Channel channel="email" />);
    await page.getByRole("combobox", { name: "Notification format", exact: true }).first().click();
    const option = page
      .getByRole("listbox")
      .getByRole("option", { name: "Immediate", exact: true });
    await expect.element(option).toBeVisible();
    await option.click();
    await vi.waitFor(() =>
      expect(onEmailSettings).toHaveBeenCalledWith({ emailFormat: "immediate" }),
    );
  });

  it("o link do canto volta à página principal", async () => {
    await render(<Channel channel="desktop" />);
    await page.getByRole("link", { name: "Notifications" }).click();
    await expect
      .element(page.getByLabelText("Current URL"))
      .toHaveTextContent("/settings/notifications");
  });

  it.each(["desktop", "email"] as const)("%s não tem violações axe", async (channel) => {
    await render(<Channel channel={channel} />);
    await expect
      .element(page.getByRole("heading", { name: "General notifications" }))
      .toBeVisible();
    const result = await axe.run(document.body, { resultTypes: ["violations"] });
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
    ).toEqual([]);
  });
});
